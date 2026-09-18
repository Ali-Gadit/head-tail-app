import { supabase } from './supabase';
import { Room, UserAction } from './types';
import { processAction } from './gameLogic';

const BOT_UUID = '00000000-0000-0000-0000-000000000000';

async function handlePayout(updates: any, finalRoom: any) {
  if (updates.status === 'game_over') {
    if (finalRoom.bet_amount > 0) {
      const pot = finalRoom.bet_amount * finalRoom.capacity;
      const isPremium = finalRoom.bet_currency === 'premium';
      const rpcName = isPremium ? 'update_profile_premium' : 'update_profile_coins';
      
      if (finalRoom.winner === 'TIE') {
        for (const pid of [finalRoom.player1_id, finalRoom.player2_id, finalRoom.player3_id].filter(Boolean)) {
          if (pid !== BOT_UUID) {
            await supabase.rpc(rpcName, { user_id: pid, amount: finalRoom.bet_amount });
          }
        }
      } else if (finalRoom.winner && finalRoom.winner !== BOT_UUID) {
        await supabase.rpc(rpcName, { user_id: finalRoom.winner, amount: pot });
      }
    } else if (finalRoom.bet_amount === 0 && !finalRoom.is_ranked && !finalRoom.is_public) {
      // Casual matched games give 1000 for win, 500 for lose (when public room fills up, it sets is_public to false)
      // Actually finding a match starts public, but when joined it becomes false
      if (finalRoom.winner === 'TIE') {
         for (const pid of [finalRoom.player1_id, finalRoom.player2_id].filter(Boolean)) {
           if (pid !== BOT_UUID) await supabase.rpc('update_profile_coins', { user_id: pid, amount: 750 });
         }
      } else if (finalRoom.winner) {
         if (finalRoom.winner !== BOT_UUID) {
           await supabase.rpc('update_profile_coins', { user_id: finalRoom.winner, amount: 1000 });
         }
         const loser = finalRoom.winner === finalRoom.player1_id ? finalRoom.player2_id : finalRoom.player1_id;
         if (loser && loser !== BOT_UUID) {
           await supabase.rpc('update_profile_coins', { user_id: loser, amount: 500 });
         }
      }
    }
    
    // Ranked Logic
    if (finalRoom.is_ranked) {
      const p1 = finalRoom.player1_id;
      const p2 = finalRoom.player2_id;
      if (finalRoom.winner === 'TIE') {
        // Tie: +5 RP each
        if (p1 && p1 !== BOT_UUID) await supabase.rpc('update_profile_rp', { user_id: p1, amount: 5 });
        if (p2 && p2 !== BOT_UUID) await supabase.rpc('update_profile_rp', { user_id: p2, amount: 5 });
      } else if (finalRoom.winner) {
        const loser = finalRoom.winner === p1 ? p2 : p1;
        // Winner +30 RP, Loser -15 RP
        if (finalRoom.winner !== BOT_UUID) {
          await supabase.rpc('update_profile_rp', { user_id: finalRoom.winner, amount: 30 });
        }
        if (loser && loser !== BOT_UUID) {
          await supabase.rpc('update_profile_rp', { user_id: loser, amount: -15 });
        }
      }
    }
  }
}

export const api = {
  buyPrivateRoomToken: async (userId: string) => {
    const { data: profile } = await supabase.from('profiles').select('premium_currency, private_room_tokens').eq('id', userId).single();
    if (!profile || profile.premium_currency < 10) {
      throw new Error('Not enough diamonds (10💎 required)');
    }
    
    // We update manually to override the old RPC which hardcoded the price to 50
    const { error } = await supabase.from('profiles').update({
      premium_currency: profile.premium_currency - 10,
      private_room_tokens: (profile.private_room_tokens || 0) + 1
    }).eq('id', userId);

    if (error) throw error;
    return true;
  },

  exchangeDiamonds: async (userId: string, diamondsToExchange: number) => {
    if (diamondsToExchange <= 0) throw new Error('Invalid amount');
    const { data: profile } = await supabase.from('profiles').select('premium_currency, coins').eq('id', userId).single();
    if (!profile || profile.premium_currency < diamondsToExchange) {
      throw new Error(`Not enough diamonds. You have ${profile?.premium_currency || 0}💎.`);
    }
    
    // We update manually because the old RPC hardcoded 1 diamond = 100 gold instead of 1000
    const { error } = await supabase.from('profiles').update({
      premium_currency: profile.premium_currency - diamondsToExchange,
      coins: (profile.coins || 0) + (diamondsToExchange * 1000)
    }).eq('id', userId);

    if (error) throw error;
    return true;
  },

  createRoom: async ({ name, capacity, userId, betAmount = 1000, oversLimit = 2, wicketsLimit = 3, turnTimer = 7, betCurrency = 'coins', isBot = false }: any) => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const player1_id = userId || 'anonymous';

    if (userId) {
      const { data: profile } = await supabase.from('profiles').select('coins, premium_currency, private_room_tokens').eq('id', userId).single();
      
      if (!isBot) {
        if (!profile || profile.private_room_tokens < 1) {
          throw new Error('You do not have enough private room tokens to create a multiplayer room!');
        }
        await supabase.rpc('consume_private_room_token', { uid: userId });
      }
    }

    const insertData: any = {
      code,
      player1_id,
      p1_name: name || 'Player 1',
      capacity: capacity || 2,
      bet_amount: betAmount,
      bet_currency: betCurrency,
      overs_limit: oversLimit,
      wickets_limit: wicketsLimit,
      turn_timer: turnTimer,
      status: 'waiting',
      p1_score: 0,
      p2_score: 0,
      innings: 1,
    };

    if (isBot) {
      insertData.player2_id = BOT_UUID;
      insertData.p2_name = 'Computer';
      // Do NOT set status to toss_call here. Keep it 'waiting' so the Host can configure Match Settings.
    }

    const { data, error } = await supabase.from('rooms').insert([insertData]).select().single();
    if (error) throw error;
    return { room: data, playerId: player1_id };
  },

  findMatch: async (userId: string, name: string) => {
    // 1. Find an open room
    const { data: openRooms } = await supabase
      .from('rooms')
      .select('*')
      .eq('is_public', true)
      .eq('status', 'waiting')
      .is('player2_id', null)
      .neq('player1_id', userId)
      .limit(1);

    if (openRooms && openRooms.length > 0) {
      const { data: joinedRoom } = await supabase
        .from('rooms')
        .update({ player2_id: userId, p2_name: name, is_public: false }) // Close the room
        .eq('id', openRooms[0].id)
        .is('player2_id', null)
        .select()
        .single();
      if (joinedRoom) return { room: joinedRoom, isNew: false };
    }

    // 2. Create a new public room
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const { data: newRoom, error } = await supabase.from('rooms').insert({
      code,
      player1_id: userId,
      p1_name: name,
      capacity: 2,
      bet_amount: 0,
      status: 'waiting',
      p1_score: 0, p2_score: 0, innings: 1,
      is_public: true,
      is_ranked: false,
      overs_limit: 2,
      wickets_limit: 1,
      turn_timer: 5
    }).select().single();

    if (error) throw error;
    return { room: newRoom, isNew: true };
  },

  
  findRankedMatch: async (userId: string, name: string, rankTier: string, capacity: number = 2) => {
    let { data: rooms } = await supabase
      .from('rooms')
      .select('*')
      .eq('status', 'waiting')
      .eq('capacity', capacity)
      .eq('is_ranked', true)
      .eq('rank_tier', rankTier)
      .limit(1);

    if (rooms && rooms.length > 0) {
      const room = rooms[0];
      if (capacity === 2) {
        if (room.player1_id !== userId) {
          const { data: updatedRoom } = await supabase
            .from('rooms')
            .update({ player2_id: userId, p2_name: name, status: 'toss_call' })
            .eq('id', room.id).select().single();
          return { room: updatedRoom, isNew: false };
        } else return { room, isNew: true };
      } else {
        // Duo (4) or Squad (8)
        let team1 = room.team1 || [];
        let team2 = room.team2 || [];
        let team1_names = room.team1_names || [];
        let team2_names = room.team2_names || [];
        
        const teamSize = capacity / 2;
        if (team1.length < teamSize) {
          team1 = [...team1, userId];
          team1_names = [...team1_names, name];
        } else if (team2.length < teamSize) {
          team2 = [...team2, userId];
          team2_names = [...team2_names, name];
        }

        const isFull = (team1.length + team2.length) === capacity;
        const updates: any = { team1, team2, team1_names, team2_names };
        if (isFull) updates.status = 'toss_call';

        const { data: updatedRoom } = await supabase.from('rooms').update(updates).eq('id', room.id).select().single();
        return { room: updatedRoom, isNew: false }; // Don't trigger bot insertion for joiners
      }
    } else {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      let overs_limit = 2;
      if (rankTier === 'Gold' || rankTier === 'Platinum') overs_limit = 3;
      if (rankTier === 'Diamond' || rankTier === 'Master' || rankTier === 'Grandmaster') overs_limit = 5;
      
      const isSquad = capacity > 2;

      const insertData: any = {
        code,
        player1_id: isSquad ? null : userId,
        p1_name: isSquad ? null : name,
        capacity,
        bet_amount: 0,
        status: 'waiting',
        p1_score: 0,
        p2_score: 0,
        innings: 1,
        is_ranked: true,
        rank_tier: rankTier,
        overs_limit,
        wickets_limit: isSquad ? (capacity / 2) : 1
      };
      
      if (isSquad) {
        insertData.team1 = [userId];
        insertData.team1_names = [name];
        insertData.team1_captain = userId;
      }

      const { data: newRoom, error } = await supabase
        .from('rooms')
        .insert(insertData)
        .select()
        .single();
      if (error) throw error;
      return { room: newRoom, isNew: true };
    }
  },
addBotToRoom: async (roomId: string, p1Id: string, botName: string = 'Computer') => {
    const { data, error } = await supabase
      .from('rooms')
      .update({
        player2_id: BOT_UUID,
        p2_name: botName,
        is_public: false
        // Keep status as 'waiting' so host can configure Overs and Wickets
      })
      .eq('id', roomId)
      .is('player2_id', null)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  joinRoom: async ({ code, name, userId }: any) => {
    const { data: room, error: fetchError } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', code)
      .single();

    if (fetchError || !room) throw new Error('Room not found');
    if (room.status !== 'waiting') throw new Error('Room is already in progress');

    const playerId = userId || 'anonymous';

    if (room.player1_id === playerId || room.player2_id === playerId || room.player3_id === playerId) {
      return { room, playerId };
    }



    const updates: any = {};
    if (!room.player2_id) {
      updates.player2_id = playerId;
      updates.p2_name = name;
    } else if (!room.player3_id && room.capacity === 3) {
      updates.player3_id = playerId;
      updates.p3_name = name;
    } else {
      throw new Error('Room is full');
    }

    const { data, error } = await supabase.from('rooms').update(updates).eq('id', room.id).select().single();
    if (error) throw error;
    return { room: data, playerId };
  },

  takeAction: async (roomId: string, playerId: string, action: UserAction) => {
    const { data: room, error: fetchError } = await supabase.from('rooms').select('*').eq('id', roomId).single();
    if (fetchError || !room) throw new Error('Room not found');

    let updates: any = {};
    
    if ((action as any).type === 'EXIT_GAME') {
      let p1 = room.player1_id; let p2 = room.player2_id; let p3 = room.player3_id;
      let n1 = room.p1_name; let n2 = room.p2_name; let n3 = room.p3_name;
      if (playerId === p1) { p1 = null; n1 = null; }
      else if (playerId === p2) { p2 = null; n2 = null; }
      else if (playerId === p3) { p3 = null; n3 = null; }
      if (!p1) {
        if (p2) { p1 = p2; n1 = n2; p2 = null; n2 = null; }
        else if (p3) { p1 = p3; n1 = n3; p3 = null; n3 = null; }
      }
      if (!p2 && p3) { p2 = p3; n2 = n3; p3 = null; n3 = null; }
      
      const activeCount = [p1, p2, p3].filter(Boolean).length;
      
      // If the remaining players already voted to play again, reset the room!
      if (room.status === 'game_over' && activeCount > 0) {
         const votes = Object.keys(room.toss_choices || {}).filter(k => k !== playerId);
         if (votes.length === activeCount) {
           updates = { 
             player1_id: p1, p1_name: n1, player2_id: p2, p2_name: n2, player3_id: p3, p3_name: n3, 
             status: 'waiting', bet_amount: 0, toss_choices: {}, p1_score: 0, p2_score: 0, p3_score: 0,
             p1_throw: null, p2_throw: null, p3_throw: null, current_batsman: null, current_bowler: null,
             waiting_player_id: null, innings: 1, target: null, winner: null, stage: room.capacity === 2 ? null : 'round1',
             active_batsman_name: null, active_bowler_name: null
           };
         } else {
           updates = { player1_id: p1, p1_name: n1, player2_id: p2, p2_name: n2, player3_id: p3, p3_name: n3, status: 'waiting', active_batsman_name: null, active_bowler_name: null };
         }
      } else {
         updates = { player1_id: p1, p1_name: n1, player2_id: p2, p2_name: n2, player3_id: p3, p3_name: n3, status: 'waiting', active_batsman_name: null, active_bowler_name: null };
      }
    } else if (action.type === 'THROW') {
      const throwKey = playerId === room.player1_id ? 'p1_throw' : (playerId === room.player2_id ? 'p2_throw' : 'p3_throw');
      const throwUpdates: any = { [throwKey]: action.fingers };
      if (room.player2_id === BOT_UUID && playerId === room.player1_id) {
         let botThrow = Math.floor(Math.random() * 6) + 1;
         
         // If it is a casual match (bet_amount 0, turn_timer 5), make it difficult
         if (room.bet_amount === 0 && room.turn_timer === 5) {
            const isBotBatting = room.current_batsman === BOT_UUID;
            const userThrow = action.fingers;
            
            if (isBotBatting) {
               // Bot Batting: Bias towards high scores (4, 5, 6) 40% of the time to rack up runs
               if (Math.random() < 0.40) {
                  botThrow = Math.floor(Math.random() * 3) + 4; // Picks 4, 5, or 6
               }
            } else {
               // Bot Bowling: Completely fair and random so the user doesn't feel cheated.
               // At 100% random, average survival is exactly 6 balls (1 over), perfect for a 2-over game.
               botThrow = Math.floor(Math.random() * 6) + 1;
            }
         }
         
         throwUpdates.p2_throw = botThrow;
      }
      const { data: updatedRoom, error: throwError } = await supabase.from('rooms').update(throwUpdates).eq('id', roomId).select().single();
      if (throwError) throw throwError;
      
      const transitionUpdates = processAction(updatedRoom, playerId, action);
      delete transitionUpdates.p1_throw; delete transitionUpdates.p2_throw; delete transitionUpdates.p3_throw;
      
      if (Object.keys(transitionUpdates).length > 0) {
        const { data: finalRoom, error: tErr } = await supabase.from('rooms').update(transitionUpdates).eq('id', roomId).select().single();
        if (tErr) throw tErr;
        await handlePayout(transitionUpdates, finalRoom);
        return finalRoom;
      }
      return updatedRoom;
    } else if (action.type === 'TOSS_3P') {
      const currentChoices = room.toss_choices || {};
      const newChoices = { ...currentChoices, [playerId]: action.choice };
      const { data: updatedRoom, error: tossErr } = await supabase.from('rooms').update({ toss_choices: newChoices }).eq('id', roomId).select().single();
      if (tossErr) throw tossErr;
      
      const transitionUpdates = processAction(updatedRoom, playerId, action);
      delete transitionUpdates.toss_choices;
      if (Object.keys(transitionUpdates).length > 0) {
        const { data: finalRoom, error: tErr } = await supabase.from('rooms').update(transitionUpdates).eq('id', roomId).select().single();
        if (tErr) throw tErr;
        await handlePayout(transitionUpdates, finalRoom);
        return finalRoom;
      }
      return updatedRoom;
    } else if (action.type === 'START_MATCH') {
      const act = action as any;
      if (act.oversLimit !== undefined) updates.overs_limit = act.oversLimit;
      if (act.wicketsLimit !== undefined) updates.wickets_limit = act.wicketsLimit;
      if (act.turnTimer !== undefined) updates.turn_timer = act.turnTimer;
      if (act.betAmount !== undefined) updates.bet_amount = act.betAmount;
      if (act.capacity !== undefined) updates.capacity = act.capacity;
      
      const bet = updates.bet_amount !== undefined ? updates.bet_amount : (room.bet_amount || 0);
      if (bet > 0) {
        const { data: p1Profile } = await supabase.from('profiles').select('coins').eq('id', room.player1_id).single();
        if (!p1Profile || p1Profile.coins < bet) throw new Error('You do not have enough coins!');
        
        if (room.player2_id && room.player2_id !== BOT_UUID) {
          const { data: p2Profile } = await supabase.from('profiles').select('coins').eq('id', room.player2_id).single();
          if (!p2Profile || p2Profile.coins < bet) throw new Error(`${room.p2_name || 'Player 2'} does not have enough coins!`);
        }
        
        if (room.player3_id && room.player3_id !== BOT_UUID) {
          const { data: p3Profile } = await supabase.from('profiles').select('coins').eq('id', room.player3_id).single();
          if (!p3Profile || p3Profile.coins < bet) throw new Error(`${room.p3_name || 'Player 3'} does not have enough coins!`);
        }
        
        await supabase.rpc('update_profile_coins', { user_id: room.player1_id, amount: -bet });
        if (room.player2_id && room.player2_id !== BOT_UUID) await supabase.rpc('update_profile_coins', { user_id: room.player2_id, amount: -bet });
        if (room.player3_id && room.player3_id !== BOT_UUID) await supabase.rpc('update_profile_coins', { user_id: room.player3_id, amount: -bet });
      }
      const nextState = processAction({ ...room, ...updates }, playerId, action);
      updates = { ...updates, ...nextState };
    } else if (action.type === 'UPDATE_SETTINGS') {
      if (playerId !== room.player1_id) throw new Error('Only host can update settings');
      const act = action as any;
      updates = {
        overs_limit: act.oversLimit,
        wickets_limit: act.wicketsLimit,
        bet_amount: act.betAmount,
        turn_timer: act.turnTimer
      };
    } else {
      updates = processAction(room, playerId, action);
    }

    if (Object.keys(updates).length === 0) {
      if (action.type === 'CONTINUE' || action.type === 'PLAY_AGAIN') return room;
      throw new Error('Invalid action or not your turn');
    }

    const { data, error: updateError } = await supabase.from('rooms').update(updates).eq('id', roomId).select().single();
    if (updateError) throw updateError;
    await handlePayout(updates, data);
    return data;
  },

  claimDailyReward: async (userId: string, amount: number = 100, tokens: number = 0) => {
    const { data, error } = await supabase.rpc('claim_daily_reward', { user_id: userId, reward_amount: amount });
    if (error) throw error;
    if (data.error) throw new Error(data.error);

    // If there are bonus tokens, update the profile manually
    if (tokens > 0) {
      const { data: profile } = await supabase.from('profiles').select('private_room_tokens').eq('id', userId).single();
      if (profile) {
        await supabase.from('profiles').update({
          private_room_tokens: (profile.private_room_tokens || 0) + tokens
        }).eq('id', userId);
      }
    }
    return data;
  },

  processDailyLogin: async (userId: string) => {
    const { data, error } = await supabase.rpc('process_daily_login', { uid: userId });
    if (error) console.error("Error processing daily login:", error);
    return data;
  },

};

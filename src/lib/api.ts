import { supabase } from './supabase';
import { Room, UserAction } from './types';
import { processAction } from './gameLogic';

const BOT_UUID = '00000000-0000-0000-0000-000000000000';

async function handlePayout(updates: any, finalRoom: any) {
  if (updates.status === 'game_over' && finalRoom.bet_amount > 0) {
    const pot = finalRoom.bet_amount * finalRoom.capacity;
    if (finalRoom.winner === 'TIE') {
      for (const pid of [finalRoom.player1_id, finalRoom.player2_id, finalRoom.player3_id].filter(Boolean)) {
        await supabase.rpc('update_profile_coins', { user_id: pid, amount: finalRoom.bet_amount });
      }
    } else if (finalRoom.winner) {
      await supabase.rpc('update_profile_coins', { user_id: finalRoom.winner, amount: pot });
    }
  }
}

export const api = {
  createRoom: async ({ name, capacity, userId, betAmount = 0, isBot = false }: any) => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const player1_id = userId || 'anonymous';

    if (userId && betAmount > 0) {
      const { data: profile } = await supabase.from('profiles').select('coins').eq('id', userId).single();
      if (!profile || profile.coins < betAmount) {
        throw new Error('Not enough coins to place this bet!');
      }
      await supabase.rpc('update_profile_coins', { user_id: userId, amount: -betAmount });
    }

    const insertData: any = {
      code,
      player1_id,
      p1_name: name || 'Player 1',
      capacity: capacity || 2,
      bet_amount: betAmount,
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
      is_public: true
    }).select().single();

    if (error) throw error;
    return { room: newRoom, isNew: true };
  },

  addBotToRoom: async (roomId: string, p1Id: string) => {
    const { data, error } = await supabase
      .from('rooms')
      .update({
        player2_id: BOT_UUID,
        p2_name: 'Computer',
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

    if (userId && room.bet_amount > 0) {
      const { data: profile } = await supabase.from('profiles').select('coins').eq('id', userId).single();
      if (!profile || profile.coins < room.bet_amount) {
        throw new Error('Not enough coins to match the bet!');
      }
      await supabase.rpc('update_profile_coins', { user_id: userId, amount: -room.bet_amount });
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
             waiting_player_id: null, innings: 1, target: null, winner: null, stage: room.capacity === 2 ? null : 'round1'
           };
         } else {
           updates = { player1_id: p1, p1_name: n1, player2_id: p2, p2_name: n2, player3_id: p3, p3_name: n3, status: 'waiting' };
         }
      } else {
         updates = { player1_id: p1, p1_name: n1, player2_id: p2, p2_name: n2, player3_id: p3, p3_name: n3, status: 'waiting' };
      }
    } else if (action.type === 'THROW') {
      const throwKey = playerId === room.player1_id ? 'p1_throw' : (playerId === room.player2_id ? 'p2_throw' : 'p3_throw');
      const throwUpdates: any = { [throwKey]: action.fingers };
      if (room.player2_id === BOT_UUID && playerId === room.player1_id) {
         throwUpdates.p2_throw = Math.floor(Math.random() * 6) + 1;
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

  claimDailyReward: async (userId: string) => {
    const { data, error } = await supabase.rpc('claim_daily_reward', { user_id: userId });
    if (error) throw error;
    if (data.error) throw new Error(data.error);
    return data;
  }
};

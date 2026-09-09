import { Room, UserAction } from './types';

export function processAction(room: Room, playerId: string, action: UserAction): Partial<Room> {
  const isP1 = playerId === room.player1_id;
  const isP2 = playerId === room.player2_id;
  const isP3 = playerId === room.player3_id;

  if (!isP1 && !isP2 && !isP3) return {};

  switch (room.status) {
    case 'waiting':
      if (action.type === 'START_MATCH' && isP1) {
        if (room.capacity === 2 && room.player2_id) {
          return {
            status: 'toss_call',
            current_batsman: room.player1_id,
            current_bowler: room.player2_id,
            stage: null
          };
        } else if (room.capacity === 3 && room.player2_id && room.player3_id) {
          return {
            status: 'toss_3p',
            stage: 'round1'
          };
        }
      }
      break;

    // 3-Player Tournament Toss (Up/Down)
    case 'toss_3p':
      if (action.type === 'TOSS_3P') {
        const newChoices = { ...room.toss_choices, [playerId]: action.choice };
        const updates: Partial<Room> = { toss_choices: newChoices };
        if (Object.keys(newChoices).length === 3) {
          updates.status = 'toss_3p_reveal';
        }
        return updates;
      }
      break;

    case 'toss_3p_reveal':
      if (action.type === 'CONTINUE') {
        const u1 = room.toss_choices[room.player1_id];
        const u2 = room.toss_choices[room.player2_id!];
        const u3 = room.toss_choices[room.player3_id!];

        if (u1 === u2 && u1 === u3) {
          return { status: 'toss_3p', toss_choices: {} };
        } else {
          let waitingPlayer = '';
          let pA = '', pB = '';

          if (u1 !== u2 && u1 !== u3) {
            waitingPlayer = room.player1_id; pA = room.player2_id!; pB = room.player3_id!;
          } else if (u2 !== u1 && u2 !== u3) {
            waitingPlayer = room.player2_id!; pA = room.player1_id; pB = room.player3_id!;
          } else {
            waitingPlayer = room.player3_id!; pA = room.player1_id; pB = room.player2_id!;
          }

          return {
            waiting_player_id: waitingPlayer,
            current_batsman: pA, // Temporarily set to determine who calls toss
            current_bowler: pB,
            status: 'toss_call',
            stage: 'round1',
            toss_choices: {}
          };
        }
      }
      break;

    // Match Toss (1-5 fingers) - Shared for 2P and 3P Matches
    case 'toss_call':
      if (action.type === 'TOSS_CALL' && playerId === room.current_batsman) {
        return { toss_call: action.choice, status: 'toss_throw' };
      }
      break;

    case 'toss_throw':
      if (action.type === 'THROW') {
        const updates: Partial<Room> = {};
        if (isP1) updates.p1_throw = action.fingers;
        if (isP2) updates.p2_throw = action.fingers;
        if (isP3) updates.p3_throw = action.fingers;

        const t1 = playerId === room.current_batsman ? action.fingers : (room.current_batsman === room.player1_id ? room.p1_throw : (room.current_batsman === room.player2_id ? room.p2_throw : room.p3_throw));
        const t2 = playerId === room.current_bowler ? action.fingers : (room.current_bowler === room.player1_id ? room.p1_throw : (room.current_bowler === room.player2_id ? room.p2_throw : room.p3_throw));

        if (t1 !== null && t2 !== null) {
          const sum = t1 + t2;
          const isOdd = sum % 2 !== 0;
          const callerWins = room.toss_call === 'head' ? isOdd : !isOdd;
          
          const tossWinner = callerWins ? room.current_batsman : room.current_bowler;
          const tossLoser = callerWins ? room.current_bowler : room.current_batsman;

          // Source of truth: the winner is now current_batsman
          updates.current_batsman = tossWinner; 
          updates.current_bowler = tossLoser;
          updates.status = 'toss_reveal';
        }
        return updates;
      }
      break;

    case 'toss_reveal':
      if (action.type === 'CONTINUE') {
        const BOT_UUID = '00000000-0000-0000-0000-000000000000';
        if (room.player2_id === BOT_UUID && room.current_batsman === BOT_UUID) {
            const botChoosesBat = Math.random() > 0.5;
            if (botChoosesBat) {
                return { status: 'playing', p1_throw: null, p2_throw: null, p3_throw: null };
            } else {
                return { status: 'playing', current_batsman: room.current_bowler, current_bowler: room.current_batsman, p1_throw: null, p2_throw: null, p3_throw: null };
            }
        }
        return { status: 'toss_decision', p1_throw: null, p2_throw: null, p3_throw: null };
      }
      break;

    case 'toss_decision':
        if (action.type === 'TOSS_DECISION' && playerId === room.current_batsman) {
            if (action.choice === 'bowl') {
                const tossWinner = room.current_batsman;
                const tossLoser = room.current_bowler;
                return { status: 'playing', current_batsman: tossLoser, current_bowler: tossWinner };
            }
            return { status: 'playing' };
        }
        break;

    // Actual Gameplay Match
    case 'playing':
      if (action.type === 'THROW') {
        const updates: Partial<Room> = {};
        if (isP1) updates.p1_throw = action.fingers;
        if (isP2) updates.p2_throw = action.fingers;
        if (isP3) updates.p3_throw = action.fingers;

        const p1T = isP1 ? action.fingers : room.p1_throw;
        const p2T = isP2 ? action.fingers : room.p2_throw;
        const p3T = isP3 ? action.fingers : room.p3_throw;

        const bT = room.current_batsman === room.player1_id ? p1T : (room.current_batsman === room.player2_id ? p2T : p3T);
        const boT = room.current_bowler === room.player1_id ? p1T : (room.current_bowler === room.player2_id ? p2T : p3T);

        if (bT !== null && boT !== null) {
          if (bT === boT) {
            // OUT
            if (room.innings === 1) {
              const currentScore = room.current_batsman === room.player1_id ? room.p1_score : (room.current_batsman === room.player2_id ? room.p2_score : room.p3_score);
              updates.target = currentScore + 1;
              updates.innings = 2;
              const temp = room.current_batsman;
              updates.current_batsman = room.current_bowler;
              updates.current_bowler = temp;
              updates.status = 'reveal';
            } else {
              // Match End
              const bScore = room.current_batsman === room.player1_id ? room.p1_score : (room.current_batsman === room.player2_id ? room.p2_score : room.p3_score);
              
              if (bScore === (room.target || 0) - 1) {
                // IT'S A TIE
                updates.winner = 'TIE';
                updates.status = 'game_over';
              } else {
                const matchWinner = bScore >= (room.target || 0) ? room.current_batsman : room.current_bowler;
                
                if (room.capacity === 3 && room.stage === 'round1') {
                  const finalist = room.waiting_player_id; // The one who was waiting for the final
                  const loserOfRound1 = matchWinner === room.current_batsman ? room.current_bowler : room.current_batsman;
                  
                  updates.stage = 'final';
                  updates.current_batsman = matchWinner!; // Winner calls toss for Final
                  updates.current_bowler = finalist!;
                  updates.waiting_player_id = loserOfRound1; // Round 1 loser now spectates
                  updates.innings = 1; updates.target = null;
                  updates.p1_score = 0; updates.p2_score = 0; updates.p3_score = 0;
                  updates.p1_throw = null; updates.p2_throw = null; updates.p3_throw = null;
                  updates.status = 'toss_call'; 
                } else {
                  updates.winner = matchWinner;
                  updates.status = 'game_over';
                }
              }
            }
          } else {
            // Scoring
            if (room.current_batsman === room.player1_id) updates.p1_score = room.p1_score + bT;
            else if (room.current_batsman === room.player2_id) updates.p2_score = room.p2_score + bT;
            else updates.p3_score = room.p3_score + bT;

            const newScore = (room.current_batsman === room.player1_id ? updates.p1_score : (room.current_batsman === room.player2_id ? updates.p2_score : updates.p3_score)) || 0;
            
            if (room.innings === 2 && newScore >= (room.target || 0)) {
               const matchWinner = room.current_batsman;
               if (room.capacity === 3 && room.stage === 'round1') {
                  const finalist = room.waiting_player_id;
                  const loserOfRound1 = room.current_bowler; // Batsman chased successfully, so bowler lost
                  
                  updates.stage = 'final';
                  updates.current_batsman = matchWinner!;
                  updates.current_bowler = finalist!;
                  updates.waiting_player_id = loserOfRound1;
                  updates.innings = 1; updates.target = null;
                  updates.p1_score = 0; updates.p2_score = 0; updates.p3_score = 0;
                  updates.p1_throw = null; updates.p2_throw = null; updates.p3_throw = null;
                  updates.status = 'toss_call'; 
               } else {
                  updates.winner = matchWinner;
                  updates.status = 'game_over';
               }
            } else {
              updates.status = 'reveal';
            }
          }
        }
        return updates;
      }
      break;

    case 'reveal':
      if (action.type === 'CONTINUE') {
        return { status: 'playing', p1_throw: null, p2_throw: null, p3_throw: null };
      }
      break;

    case 'game_over':
      if (action.type === 'PLAY_AGAIN') {
        const is2P = room.capacity === 2;
        const BOT_UUID = '00000000-0000-0000-0000-000000000000';
        const isBot = room.player2_id === BOT_UUID;
        
        if (isBot) {
          return {
            status: 'toss_call', 
            bet_amount: 0, 
            toss_choices: {},
            p1_score: 0, p2_score: 0, p3_score: 0,
            p1_throw: null, p2_throw: null, p3_throw: null,
            current_batsman: room.player1_id,
            current_bowler: BOT_UUID,
            waiting_player_id: null,
            innings: 1, target: null, winner: null,
            stage: null
          };
        }

        const currentVotes = room.toss_choices || {};
        const newVotes = { ...currentVotes, [playerId]: 'play_again' as any };
        const activePlayers = [room.player1_id, room.player2_id, room.player3_id].filter(Boolean);
        
        if (Object.keys(newVotes).length === activePlayers.length) {
          return {
            status: 'waiting', 
            bet_amount: 0, 
            toss_choices: {},
            p1_score: 0, p2_score: 0, p3_score: 0,
            p1_throw: null, p2_throw: null, p3_throw: null,
            current_batsman: null,
            current_bowler: null,
            waiting_player_id: null,
            innings: 1, target: null, winner: null,
            stage: is2P ? null : 'round1'
          };
        }
        
        return { toss_choices: newVotes };
      }
      break;
  }

  return {};
}

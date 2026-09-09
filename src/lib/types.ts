export type GameStatus = 
  | 'waiting'        // Waiting for players
  | 'toss_3p'        // 3P: 3-way Up/Down toss
  | 'toss_3p_reveal' // 3P: Showing Up/Down result (or tie)
  | 'toss_call'      // Match: One player picking Head/Tail
  | 'toss_throw'     // Match: Both picking fingers (1-5)
  | 'toss_reveal'    // Match: Showing finger toss result
  | 'toss_decision'  // Match: Toss winner picking Bat/Bowl
  | 'playing'        // Match in progress
  | 'reveal'         // Showing last play
  | 'game_over';     // Finished

export interface Room {
  id: string;
  code: string;
  player1_id: string;
  player2_id: string | null;
  player3_id: string | null;
  p1_name: string | null;
  p2_name: string | null;
  p3_name: string | null;
  capacity: 2 | 3;
  bet_amount: number;
  status: GameStatus;
  toss_call: 'head' | 'tail' | null;
  toss_choices: Record<string, 'up' | 'down' | 'play_again'>;
  p1_throw: number | null;
  p2_throw: number | null;
  p3_throw: number | null;
  p1_score: number;
  p2_score: number;
  p3_score: number;
  current_batsman: string | null;
  current_bowler: string | null;
  waiting_player_id: string | null;
  innings: 1 | 2;
  target: number | null;
  winner: string | null;
  stage: 'round1' | 'final' | null;
  updated_at: string;
}

export type UserAction = 
  | { type: 'TOSS_CALL'; choice: 'head' | 'tail' }
  | { type: 'TOSS_3P'; choice: 'up' | 'down' }
  | { type: 'TOSS_DECISION'; choice: 'bat' | 'bowl' }
  | { type: 'THROW'; fingers: number }
  | { type: 'CONTINUE' }
  | { type: 'START_MATCH' }
  | { type: 'PLAY_AGAIN' };

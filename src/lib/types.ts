export type GameStatus = 
  | 'waiting'        // Waiting for players
  | 'team_selection' // NEW: Players selecting their squad
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
  capacity: 2 | 3 | 4 | 8;
  team1?: string[];
  team2?: string[];
  team1_names?: string[];
  team2_names?: string[];
  team1_score?: number;
  team2_score?: number;
  team1_wickets?: number;
  team2_wickets?: number;
  team1_balls_faced?: number;
  team2_balls_faced?: number;
  team1_captain?: string;
  team2_captain?: string;
  team1_throw?: number | null;
  team2_throw?: number | null;
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
    is_ranked?: boolean;
    rank_tier?: string;
  waiting_player_id: string | null;
  innings: 1 | 2;
  target: number | null;
  winner: string | null;
  stage: 'round1' | 'final' | 'team_toss' | null;
  updated_at: string;

  // New Cricket Rules fields
  overs_limit: number | null;
  wickets_limit: number;
  p1_wickets_lost: number;
  p2_wickets_lost: number;
  p3_wickets_lost: number;
  p1_balls_faced: number;
  p2_balls_faced: number;
  p3_balls_faced: number;
  p1_team: string | null;
  p2_team: string | null;
  p3_team: string | null;
  p1_players: string[];
  p2_players: string[];
  p3_players: string[];
  p1_current_player_index: number;
  p2_current_player_index: number;
  p3_current_player_index: number;
}

export type UserAction = 
  | { type: 'TOSS_CALL'; choice: 'head' | 'tail' }
  | { type: 'TOSS_3P'; choice: 'up' | 'down' }
  | { type: 'TOSS_DECISION'; choice: 'bat' | 'bowl' }
  | { type: 'THROW'; fingers: number }
  | { type: 'CONTINUE' }
  | { type: 'START_MATCH'; oversLimit: number | null; wicketsLimit: number }
  | { type: 'SUBMIT_TEAM'; team: string; players: string[] }
  | { type: 'PLAY_AGAIN' };

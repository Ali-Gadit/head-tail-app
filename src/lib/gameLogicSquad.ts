import { Room, UserAction } from './types';

export function processSquadAction(room: Room, playerId: string, action: UserAction): Partial<Room> {
  if (room.status === 'party_lobby' && action.type === 'START_MATCHMAKING') {
    if (playerId === room.team1_captain) {
      return { status: 'searching' };
    }
  }
  const isTeam1 = room.team1?.includes(playerId);
  const isTeam2 = room.team2?.includes(playerId);
  if (!isTeam1 && !isTeam2) return {};

  const updates: Partial<Room> = {};

  if (room.status === 'waiting' && action.type === 'START_MATCH') {
    // Only Team 1 Captain can start
    if (room.team1_captain === playerId && room.team1?.length === room.capacity / 2 && room.team2?.length === room.capacity / 2) {
      return { status: 'toss_call', current_batsman: room.team1_captain, current_bowler: room.team2_captain };
    }
  }

  if (room.status === 'toss_call' && action.type === 'TOSS_CALL') {
    if (playerId === room.current_bowler) {
      const isHeads = Math.random() > 0.5;
      const won = (isHeads && action.choice === 'head') || (!isHeads && action.choice === 'tail');
      updates.status = 'toss_decision';
      updates.toss_winner = won ? room.current_bowler : room.current_batsman;
    }
    return updates;
  }

  if (room.status === 'toss_decision' && action.type === 'TOSS_DECISION') {
    if (playerId === room.toss_winner) {
      if (action.choice === 'bat') {
        updates.current_batsman = room.toss_winner;
        updates.current_bowler = room.toss_winner === room.team1_captain ? room.team2_captain! : room.team1_captain!;
      } else {
        updates.current_bowler = room.toss_winner;
        updates.current_batsman = room.toss_winner === room.team1_captain ? room.team2_captain! : room.team1_captain!;
      }
      updates.status = 'toss_reveal';
    }
    return updates;
  }

  if (room.status === 'toss_reveal' && action.type === 'CONTINUE') {
    return { status: 'playing', team1_throw: null, team2_throw: null };
  }

  if (room.status === 'playing' && action.type === 'THROW') {
    const isBatsman = playerId === room.current_batsman;
    const isBowler = playerId === room.current_bowler;
    if (!isBatsman && !isBowler) return {};

    const batsmanTeamIs1 = room.team1?.includes(room.current_batsman || '');
    
    if (isBatsman) {
      if (batsmanTeamIs1) updates.team1_throw = action.fingers;
      else updates.team2_throw = action.fingers;
    } else {
      if (batsmanTeamIs1) updates.team2_throw = action.fingers;
      else updates.team1_throw = action.fingers;
    }

    const t1T = updates.team1_throw !== undefined ? updates.team1_throw : room.team1_throw;
    const t2T = updates.team2_throw !== undefined ? updates.team2_throw : room.team2_throw;

    if (t1T !== null && t2T !== null) {
      const bT = batsmanTeamIs1 ? t1T : t2T;
      const boT = batsmanTeamIs1 ? t2T : t1T;
      
      const ballsFaced = (batsmanTeamIs1 ? room.team1_balls_faced : room.team2_balls_faced) || 0;
      if (batsmanTeamIs1) updates.team1_balls_faced = ballsFaced + 1;
      else updates.team2_balls_faced = ballsFaced + 1;

      if (bT === boT && bT !== 0) {
        // OUT
        const w = (batsmanTeamIs1 ? room.team1_wickets : room.team2_wickets) || 0;
        if (batsmanTeamIs1) updates.team1_wickets = w + 1;
        else updates.team2_wickets = w + 1;
        
        const isAllOut = (w + 1) >= (room.wickets_limit || 1);
        
        if (isAllOut || (room.overs_limit && Math.floor((ballsFaced + 1) / 6) >= (room.overs_limit || 0))) {
          // INNINGS END
          if (room.innings === 1) {
            updates.target = (batsmanTeamIs1 ? (room.team1_score || 0) : (room.team2_score || 0)) + 1;
            updates.innings = 2;
            updates.status = 'reveal';
            updates.current_batsman = batsmanTeamIs1 ? room.team2_captain! : room.team1_captain!;
            updates.current_bowler = batsmanTeamIs1 ? room.team1_captain! : room.team2_captain!;
          } else {
            // GAME OVER
            const s1 = (batsmanTeamIs1 ? room.team1_score : room.team2_score) || 0;
            if (s1 === (room.target || 0) - 1) updates.winner = 'TIE';
            else updates.winner = s1 >= (room.target || 0) ? room.current_batsman : room.current_bowler;
            updates.status = 'game_over';
          }
        } else {
          // Not all out! Captain must choose next batsman!
          updates.status = 'captain_choosing_batsman';
        }
      } else {
        // RUNS
        if (batsmanTeamIs1) updates.team1_score = (room.team1_score || 0) + (bT || 0);
        else updates.team2_score = (room.team2_score || 0) + (bT || 0);
        
        const newScore = (batsmanTeamIs1 ? updates.team1_score : updates.team2_score) || 0;
        if (room.innings === 2 && newScore >= (room.target || 0)) {
           updates.winner = room.current_batsman;
           updates.status = 'game_over';
        } else if (room.overs_limit && (ballsFaced + 1) >= room.overs_limit * 6) {
           // Overs finished!
           if (room.innings === 1) {
             updates.target = newScore + 1;
             updates.innings = 2;
             updates.status = 'reveal';
             updates.current_batsman = batsmanTeamIs1 ? room.team2_captain! : room.team1_captain!;
             updates.current_bowler = batsmanTeamIs1 ? room.team1_captain! : room.team2_captain!;
           } else {
             updates.winner = room.current_bowler;
             updates.status = 'game_over';
           }
        } else {
           updates.status = 'reveal';
        }
      }
    }
    return updates;
  }

  if (room.status === 'captain_choosing_batsman' && action.type === 'SELECT_PLAYER') {
    // Only the captain of the batting team can select
    const batsmanTeamIs1 = room.team1?.includes(room.current_batsman || '');
    const captainId = batsmanTeamIs1 ? room.team1_captain : room.team2_captain;
    if (playerId === captainId) {
      return { current_batsman: action.targetId, status: 'reveal' };
    }
  }

  if (room.status === 'reveal' && action.type === 'CONTINUE') {
    return { status: 'playing', team1_throw: null, team2_throw: null };
  }

  return updates;
}

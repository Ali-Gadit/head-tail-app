import React from 'react';
import { View, Text } from 'react-native';
import { Room } from '../lib/types';

interface ScoreboardProps {
  room: Room;
  playerId: string;
}

export default function Scoreboard({ room, playerId }: ScoreboardProps) {
  const players = [
    { id: room.player1_id, score: room.p1_score, label: room.p1_name || 'P1' },
    { id: room.player2_id, score: room.p2_score, label: room.p2_name || 'P2' },
    { id: room.player3_id, score: room.p3_score, label: room.p3_name || 'P3' },
  ].slice(0, room.capacity);

  if (room.status === 'waiting' || room.status === 'team_selection' || room.status === 'toss_3p') {
    return (
      <View className="flex flex-col gap-2 pt-2">
        {room.bet_amount > 0 && (
          <View className="self-center flex-row items-center gap-1 opacity-60">
            <Text className="text-green-400 text-[9px] font-medium uppercase tracking-[0.2em]">🪙 {room.bet_amount * room.capacity} POT</Text>
          </View>
        )}
        <View className="flex-row justify-center items-center py-2 w-full gap-4">
          {players.map((p, i) => (
            <React.Fragment key={i}>
              <View className="flex-col items-center flex-1 px-2">
                <Text className="text-[10px] text-white uppercase font-light tracking-widest opacity-60 mb-0.5">Player {i + 1}</Text>
                <Text 
                  className={`font-black text-lg text-center tracking-widest ${p.id ? (p.id === playerId ? 'text-blue-400' : 'text-red-400') : 'text-white/20 italic'}`}
                  numberOfLines={1}
                >
                  {p.label === 'Exited' ? 'LEFT' : (p.id ? p.label : 'Waiting...')}
                </Text>
              </View>
              {i === 0 && players.length <= 2 && (
                <View className="items-center justify-center mt-2 px-2">
                  <Text className="text-white/80 font-black text-xl italic tracking-widest">VS</Text>
                </View>
              )}
            </React.Fragment>
          ))}
        </View>
      </View>
    );
  }

  const getWickets = (id: string | null) => {
    if (id === room.player1_id) return room.p1_wickets_lost || 0;
    if (id === room.player2_id) return room.p2_wickets_lost || 0;
    return room.p3_wickets_lost || 0;
  };

  const getBalls = (id: string | null) => {
    if (id === room.player1_id) return room.p1_balls_faced || 0;
    if (id === room.player2_id) return room.p2_balls_faced || 0;
    return room.p3_balls_faced || 0;
  };
  const formatOvers = (balls: number) => `${Math.floor(balls / 6)}.${balls % 6}`;

  const getSquadName = (id: string | null) => {
    if (id === room.player1_id && room.p1_players?.length > 0) return room.p1_players[room.p1_current_player_index || 0];
    if (id === room.player2_id && room.p2_players?.length > 0) return room.p2_players[room.p2_current_player_index || 0];
    if (id === room.player3_id && room.p3_players?.length > 0) return room.p3_players[room.p3_current_player_index || 0];
    return null;
  };

  return (
    <View className="pt-2 px-6">
      {/* Top Header: Match Stage & Pot */}
      <View className="flex-row items-center justify-between mb-4">
         <View className="flex-row items-center gap-4">
            <Text className="text-yellow-400/80 text-[9px] font-medium uppercase tracking-[0.3em]">
              {room.stage === 'round1' ? 'Round 1' : (room.stage === 'final' ? 'The Final' : 'Match')}
            </Text>
            {room.bet_amount > 0 && (
              <Text className="text-green-400/80 text-[9px] font-medium uppercase tracking-[0.3em]">🪙 {room.bet_amount * room.capacity} POT</Text>
            )}
         </View>
         {room.target !== null && (
           <View className="flex-row items-center gap-2">
             <Text className="text-[9px] text-white/50 font-medium uppercase tracking-[0.2em]">Target</Text>
             <Text className="text-lg font-light text-yellow-400 tracking-wider">{room.target}</Text>
           </View>
         )}
      </View>

      {/* Clean Active Match Scoreboard */}
      <View className="flex-row justify-between items-center relative">
        {players.filter(p => p.id === room.current_batsman || p.id === room.current_bowler).map((p, index) => {
            const isMe = p.id === playerId;
            const isBat = p.id === room.current_batsman;
            const showRole = room.status === 'playing' || room.status === 'reveal';
            const matchStarted = showRole || room.status === 'game_over';
            const baseName = p.label === 'Exited' ? 'LEFT' : p.label;
            const squadName = getSquadName(p.id);
            const wickets = getWickets(p.id);
            const balls = getBalls(p.id);
            const isRightSide = index === 1;
            
            return (
                <React.Fragment key={p.id}>
                  <View className={`flex-col justify-center flex-1 ${isRightSide ? 'items-end' : 'items-start'}`}>
                      {/* Name & Role */}
                      <View className="flex-row items-center gap-2 mb-1">
                          {!isRightSide && isBat && showRole && <View className="w-2 h-2 bg-green-400 rounded-full shadow-[0_0_8px_rgba(74,222,128,0.8)]" />}
                          <Text className={`text-base uppercase font-black tracking-widest ${isMe ? 'text-blue-400' : 'text-red-400'}`} numberOfLines={1}>
                              {baseName} {showRole ? (isBat ? '• BAT' : '• BOWL') : ''}
                          </Text>
                          {isRightSide && isBat && showRole && <View className="w-2 h-2 bg-green-400 rounded-full shadow-[0_0_8px_rgba(74,222,128,0.8)]" />}
                      </View>
                      
                      {/* Squad Player Name */}
                      {squadName && (
                        <Text className="text-sm text-yellow-400/80 font-medium tracking-wider mb-1" numberOfLines={1}>{squadName}</Text>
                      )}

                      {/* Score (Only show if match has started) */}
                      {matchStarted && (
                        <Text className={`text-4xl font-light tracking-widest mt-1 ${isMe ? 'text-blue-50' : 'text-red-50'}`}>
                            {p.score}{isBat && room.wickets_limit > 1 ? <Text className="text-2xl opacity-40 font-light">/{wickets}</Text> : ''}
                        </Text>
                      )}
                      
                      {/* Overs */}
                      {(showRole || room.status === 'game_over') && isBat && (room.overs_limit || room.wickets_limit > 1) && (
                        <Text className="text-[9px] text-white/40 font-medium mt-1 tracking-[0.1em]">
                          {formatOvers(balls)} OVERS
                        </Text>
                      )}
                  </View>

                  {/* Inline VS Divider */}
                  {index === 0 && (!['playing', 'reveal', 'game_over'].includes(room.status)) && (
                    <View className="items-center justify-center px-4 mt-2">
                       <Text className="text-white/80 font-black text-2xl italic tracking-widest">VS</Text>
                    </View>
                  )}
                </React.Fragment>
            )
        })}

        {/* Spectator display if applicable */}
        {players.filter(p => p.id === room.waiting_player_id).map((p, i) => (
             <View key={`spec-${i}`} className="absolute top-full left-0 right-0 items-center mt-4 opacity-50">
                <Text className="text-[8px] text-white font-light tracking-[0.3em] uppercase mb-0.5">Spectating</Text>
                <Text className="text-xs text-white font-medium tracking-widest" numberOfLines={1}>{p.id === playerId ? 'YOU' : p.label}</Text>
             </View>
        ))}
      </View>
    </View>
  );
}

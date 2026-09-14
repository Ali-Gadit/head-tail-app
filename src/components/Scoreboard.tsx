import React from 'react';
import { View, Text } from 'react-native';
import { Room } from '../lib/types';

interface ScoreboardProps {
  room: Room;
  playerId: string;
}

export default function Scoreboard({ room, playerId }: ScoreboardProps) {
  const isSquad = room.capacity >= 4;
  let players: any[] = [];
  
  if (isSquad) {
    players = [
      { id: 'team1', score: room.team1_score || 0, label: 'Team 1 (Blue)' },
      { id: 'team2', score: room.team2_score || 0, label: 'Team 2 (Red)' }
    ];
  } else {
    players = [
      { id: room.player1_id, score: room.p1_score, label: room.p1_name || 'P1' },
      { id: room.player2_id, score: room.p2_score, label: room.p2_name || 'P2' },
      { id: room.player3_id, score: room.p3_score, label: room.p3_name || 'P3' },
    ].slice(0, room.capacity);
  }

  if (room.status === 'waiting' || room.status === 'team_selection' || room.status === 'toss_3p') {
    return (
      <View className="flex flex-col gap-3">
        {room.bet_amount > 0 && (
          <View className="mx-auto bg-green-500 px-4 py-1 rounded-full shadow-lg flex-row items-center gap-1 self-center">
            <Text className="text-white text-[10px] font-black uppercase tracking-widest">dY' {room.bet_amount * room.capacity} POT</Text>
          </View>
        )}
        <View className="flex-row justify-around items-center p-4 bg-white/10 rounded-2xl border border-white/20">
          {players.map((p, i) => (
            <View key={i} className="flex-col items-center flex-1 px-2">
              <Text className="text-[10px] text-white uppercase font-bold opacity-50 mb-1">Player {i + 1}</Text>
              <Text 
                className={`font-black text-xs text-center ${p.id ? 'text-white' : 'text-white opacity-30 italic'}`}
                numberOfLines={1}
              >
                {p.id === playerId ? 'YOU' : (p.label === 'Exited' ? 'LEFT' : (p.id ? p.label : 'Waiting...'))}
              </Text>
            </View>
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
    <View className="space-y-4">
      <View className="flex-row items-center justify-between px-2">
         <View className="flex-row gap-2">
            <View className="bg-yellow-400 px-4 py-1 rounded-full shadow-lg justify-center">
              <Text className="text-indigo-900 text-[10px] font-black uppercase tracking-widest">
                {room.stage === 'round1' ? 'Round 1' : (room.stage === 'final' ? 'The Final' : 'Match')}
              </Text>
            </View>
            {room.bet_amount > 0 && (
              <View className="bg-green-500 px-4 py-1 rounded-full shadow-lg flex-row items-center gap-1">
                <Text className="text-white text-[10px] font-black uppercase tracking-widest">dY' {room.bet_amount * room.capacity} POT</Text>
              </View>
            )}
         </View>
         {room.target !== null && (
           <View className="flex-row items-center gap-2">
             <Text className="text-[10px] text-white font-black opacity-60 uppercase">Target</Text>
             <Text className="text-xl font-black text-yellow-300">{room.target}</Text>
           </View>
         )}
      </View>

      <View className="flex-row justify-between items-stretch gap-4">
        {/* Active Match */}
        {players.filter(p => p.id === room.current_batsman || p.id === room.current_bowler).map((p, i) => {
            const isMe = p.id === playerId;
            const isBat = p.id === room.current_batsman;
            const showRole = room.status === 'playing' || room.status === 'reveal';
            const baseName = p.id === playerId ? 'YOU' : (p.label === 'Exited' ? 'LEFT' : p.label);
            const squadName = getSquadName(p.id);
            const wickets = getWickets(p.id);
            const balls = getBalls(p.id);
            
            return (
                <View key={i} className={`flex-1 p-4 rounded-3xl border flex-col items-center justify-center relative ${isMe ? 'bg-white/20 border-white/30' : 'bg-white/5 border-white/10'}`}>
                    {(isBat && showRole) && <View className="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full" />}
                    <Text className="text-[10px] text-white uppercase font-black tracking-widest opacity-60 mb-1 text-center" numberOfLines={1}>
                        {baseName} {showRole ? (isBat ? '(BAT)' : '(BOWL)') : ''}
                    </Text>
                    
                    {squadName && (
                      <Text className="text-[10px] text-yellow-400 font-bold mb-1" numberOfLines={1}>{squadName}</Text>
                    )}

                    <Text className="text-4xl text-white font-black">
                        {p.score}{isBat && room.wickets_limit > 1 ? <Text className="text-2xl opacity-70">/{wickets}</Text> : ''}
                    </Text>
                    
                    {isBat && (room.overs_limit || room.wickets_limit > 1) && (
                      <Text className="text-[10px] text-white/50 font-bold mt-1">
                        {formatOvers(balls)} overs
                      </Text>
                    )}
                </View>
            )
        })}

        {/* Spectator/Waiting */}
        {players.filter(p => p.id === room.waiting_player_id).map((p, i) => (
             <View key={i} className="bg-indigo-900/40 p-4 rounded-2xl border border-indigo-400/20 flex-col items-center justify-center opacity-60">
                <Text className="text-[10px] text-white font-black opacity-50 uppercase">Spectating</Text>
                <Text className="text-xl text-white font-black text-center" numberOfLines={1}>{p.id === playerId ? 'YOU' : p.label}</Text>
             </View>
        ))}
      </View>
    </View>
  );
}

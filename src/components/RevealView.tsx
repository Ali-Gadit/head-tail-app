import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Room } from '../lib/types';

interface RevealViewProps {
  room: Room;
  playerId: string;
  type: 'toss' | 'play';
  onContinue: () => void;
}

export default function RevealView({ room, playerId, type, onContinue }: RevealViewProps) {
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowResult(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const getEmoji = (num: number | null) => {
    if (num === null) return '❓';
    const map: Record<number, string> = { 1: '☝️', 2: '✌️', 3: '🤟', 4: '🖖', 5: '🖐️', 6: '👍' };
    return map[num] || num.toString();
  };

  const p1T = room.p1_throw;
  const p2T = room.p2_throw;
  const p3T = room.p3_throw;

  const bT = room.current_batsman === room.player1_id ? p1T : (room.current_batsman === room.player2_id ? p2T : p3T);
  const boT = room.current_bowler === room.player1_id ? p1T : (room.current_bowler === room.player2_id ? p2T : p3T);

  const batName = room.current_batsman === room.player1_id ? room.p1_name : (room.current_batsman === room.player2_id ? room.p2_name : room.p3_name);
  const bowlName = room.current_bowler === room.player1_id ? room.p1_name : (room.current_bowler === room.player2_id ? room.p2_name : room.p3_name);

  const isBat = playerId === room.current_batsman;

  const isDeadBall = type === 'play' && bT === 0 && boT === 0;
  const isNoBall = type === 'play' && boT === 0 && bT !== null && bT > 0;
  
  const isOut = type === 'play' && bT !== null && boT !== null && bT === boT && !isDeadBall;
  const runsScored = type === 'play' && bT !== null && boT !== null && bT !== boT ? (isNoBall ? bT + 1 : bT) : 0;

  return (
    <View className="items-center justify-center space-y-8 flex-1">
      <View className="flex-row items-center justify-center gap-8 w-full max-w-sm">
        
        {/* Batsman */}
        <View className={`flex-1 items-center space-y-4 ${isBat ? 'scale-110' : 'opacity-80'}`}>
          <Text className="text-[10px] uppercase font-black tracking-widest text-white/70 bg-white/10 px-3 py-1 rounded-full">
            BAT • {batName === room.p1_name && playerId === room.player1_id ? 'YOU' : batName}
          </Text>
          <View className="w-28 h-32 bg-white rounded-[2rem] items-center justify-center shadow-2xl border-b-4 border-gray-300">
            <Text className="text-6xl">{getEmoji(bT)}</Text>
          </View>
        </View>

        <Text className="text-3xl font-black text-white/50">VS</Text>

        {/* Bowler */}
        <View className={`flex-1 items-center space-y-4 ${!isBat ? 'scale-110' : 'opacity-80'}`}>
          <Text className="text-[10px] uppercase font-black tracking-widest text-white/70 bg-white/10 px-3 py-1 rounded-full">
            BOWL • {bowlName === room.p1_name && playerId === room.player1_id ? 'YOU' : bowlName}
          </Text>
          <View className="w-28 h-32 bg-white rounded-[2rem] items-center justify-center shadow-2xl border-b-4 border-gray-300">
            <Text className="text-6xl">{getEmoji(boT)}</Text>
          </View>
        </View>

      </View>

      <View className="h-24 justify-center items-center mt-8 w-full">
        {showResult ? (
          <View className="items-center justify-center">
            {type === 'toss' ? (
              <View className="items-center justify-center">
                <Text className="text-4xl font-black uppercase text-yellow-300 shadow-xl mb-4 text-center">
                  Toss Complete!
                </Text>
                <TouchableOpacity
                  onPress={onContinue}
                  className="bg-yellow-400 px-8 py-3 rounded-full shadow-lg active:scale-95"
                >
                  <Text className="text-indigo-900 font-black text-lg uppercase">Continue</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="items-center justify-center">
                {isDeadBall ? (
                  <Text className="text-5xl font-black uppercase text-gray-400 shadow-xl mb-4 text-center">
                    DEAD BALL
                  </Text>
                ) : isOut ? (
                  <Text className="text-6xl font-black uppercase text-red-500 shadow-xl mb-4 text-center">
                    OUT! 💥
                  </Text>
                ) : (
                  <View className="items-center">
                    {isNoBall && <Text className="text-red-400 font-bold text-xl uppercase mb-1">NO BALL!</Text>}
                    <Text className="text-6xl font-black uppercase text-green-400 shadow-xl mb-4 text-center">
                      +{runsScored} RUNS!
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  onPress={onContinue}
                  className="bg-yellow-400 px-8 py-3 rounded-full shadow-lg active:scale-95"
                >
                  <Text className="text-indigo-900 font-black text-lg uppercase">Next Ball</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <Text className="text-xl font-bold opacity-60 animate-pulse text-white">Calculating...</Text>
        )}
      </View>
    </View>
  );
}

import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Vibration } from 'react-native';
import { createAudioPlayer } from 'expo-audio';
import { Room } from '../lib/types';

interface RevealViewProps {
  room: Room;
  playerId: string;
  type: 'toss' | 'play';
  onContinue: () => void;
}

export default function RevealView({ room, playerId, type, onContinue }: RevealViewProps) {
  const [showResult, setShowResult] = useState(false);
  
  const flipAnim = useRef(new Animated.Value(0)).current;
  const heightAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (type === 'toss') {
      const playSound = () => {
        try {
          const player = createAudioPlayer('https://cdn.pixabay.com/download/audio/2021/08/04/audio_3d1e1f1484.mp3');
          player.play();
        } catch (e) {
          console.log('Audio play failed', e);
        }
      };
      

      Animated.sequence([
        Animated.parallel([
          Animated.timing(heightAnim, {
            toValue: -250,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(flipAnim, {
            toValue: 3, // 3 full flips
            duration: 800,
            useNativeDriver: true,
          })
        ]),
        Animated.parallel([
          Animated.timing(heightAnim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(flipAnim, {
            toValue: 6, // 6 total flips
            duration: 600,
            useNativeDriver: true,
          })
        ])
      ]).start(() => {
                Vibration.vibrate(100);
        setShowResult(true);
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      });
    } else {
      const timer = setTimeout(() => setShowResult(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [type]);

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

  if (type === 'toss') {
    const sum = (bT || 0) + (boT || 0);
    const isOdd = sum % 2 !== 0;
    
    // Caller is always the one who initiated toss_call
    // But since the database sets current_batsman to the winner, we don't know who called what exactly.
    // However, the caller's call is in room.toss_call ('head' or 'tail').
    // Let's just figure out the final face of the coin.
    // If the winner chose 'head', it landed on 'head'.
    const winningFace = room.toss_call === 'head' ? (isOdd ? 'H' : 'T') : (isOdd ? 'T' : 'H');
    
    const spin = flipAnim.interpolate({
      inputRange: [0, 6],
      outputRange: ['0deg', '2160deg'] // 6 full rotations on X axis
    });

    return (
      <View className="items-center justify-center flex-1 w-full px-6">
        <Animated.View style={{ transform: [{ translateY: heightAnim }, { rotateX: spin }] }} className="w-48 h-48 rounded-full items-center justify-center border-[10px] border-yellow-600 bg-yellow-400 mb-8 shadow-[0_20px_50px_rgba(202,138,4,0.5)]">
           <Text className="text-8xl font-black text-yellow-800">
             {showResult ? winningFace : '?'}
           </Text>
           {showResult && <Text className="text-sm font-black text-yellow-800 uppercase tracking-widest mt-2">{winningFace === 'H' ? 'HEADS' : 'TAILS'}</Text>}
        </Animated.View>
        
        {showResult ? (
          <Animated.View style={{ opacity: opacityAnim }} className="items-center w-full">
            
            {/* What both players threw */}
            <View className="bg-indigo-900/60 w-full p-4 rounded-3xl border border-indigo-500 mb-6 flex-row justify-between items-center shadow-lg">
              <View className="items-center flex-1">
                 <Text className="text-white/60 font-black text-[10px] uppercase tracking-widest mb-1" numberOfLines={1}>{batName}</Text>
                 <Text className="text-white font-black text-3xl">{bT}</Text>
              </View>
              <View className="items-center px-4">
                 <Text className="text-cyan-400 font-black text-xl">+</Text>
                 <Text className="text-yellow-400 font-black text-xl mt-1">=</Text>
              </View>
              <View className="items-center flex-1">
                 <Text className="text-white/60 font-black text-[10px] uppercase tracking-widest mb-1" numberOfLines={1}>{bowlName}</Text>
                 <Text className="text-white font-black text-3xl">{boT}</Text>
              </View>
              <View className="items-center px-4">
                 <Text className="text-indigo-900 font-black text-xl">→</Text>
              </View>
              <View className="items-center flex-1 bg-white/10 py-2 rounded-xl border border-white/20">
                 <Text className="text-yellow-400 font-black text-2xl">{sum}</Text>
                 <Text className="text-white/70 font-black text-[10px] uppercase tracking-widest mt-1">{isOdd ? 'ODD' : 'EVEN'}</Text>
              </View>
            </View>

            {/* Smexy Winner Banner */}
            <View className="bg-gradient-to-r from-yellow-500 to-yellow-300 w-full py-6 rounded-3xl items-center border-4 border-yellow-200 mb-8 shadow-[0_10px_30px_rgba(253,224,71,0.4)]">
              <Text className="text-yellow-900 font-black text-3xl uppercase tracking-widest text-center px-4">
                {batName}
              </Text>
              <Text className="text-yellow-800 font-bold text-sm uppercase tracking-[0.3em] mt-1">
                Won The Toss
              </Text>
            </View>

            <TouchableOpacity onPress={onContinue} className="bg-white/10 px-10 py-4 rounded-full active:scale-95 border-2 border-white/30">
              <Text className="text-white font-black text-xl uppercase tracking-widest">Continue</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <Text className="text-yellow-400/80 font-bold text-xl animate-pulse uppercase tracking-[0.3em] mt-10">Tossing...</Text>
        )}
      </View>
    );
  }

  // GAMEPLAY REVEAL (Code remains same)
  const isBat = playerId === room.current_batsman;
  const isDeadBall = type === 'play' && bT === 0 && boT === 0;
  const isNoBall = type === 'play' && boT === 0 && bT !== null && bT > 0;
  const isOut = type === 'play' && bT !== null && boT !== null && bT === boT && !isDeadBall;
  const runsScored = type === 'play' && bT !== null && boT !== null && bT !== boT ? (isNoBall ? bT + 1 : bT) : 0;

  return (
    <View className="items-center justify-center space-y-8 flex-1">
      <View className="flex-row items-center justify-center gap-8 w-full max-w-sm">
        <View className={`flex-1 items-center space-y-4 ${isBat ? 'scale-110' : 'opacity-80'}`}>
          <Text className="text-[10px] uppercase font-black tracking-widest text-white/70 bg-white/10 px-3 py-1 rounded-full">
            BAT • {batName === room.p1_name && playerId === room.player1_id ? 'YOU' : batName}
          </Text>
          <View className="w-28 h-32 bg-white rounded-[2rem] items-center justify-center shadow-2xl border-b-4 border-gray-300">
            <Text className="text-6xl">{getEmoji(bT)}</Text>
          </View>
        </View>

        <Text className="text-3xl font-black text-white/50">VS</Text>

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
            {isDeadBall ? (
              <Text className="text-5xl font-black uppercase text-gray-400 shadow-xl mb-4 text-center">DEAD BALL</Text>
            ) : isOut ? (
              <Text className="text-6xl font-black uppercase text-red-500 shadow-xl mb-4 text-center">OUT! 💥</Text>
            ) : (
              <View className="items-center">
                {isNoBall && <Text className="text-red-400 font-bold text-xl uppercase mb-1">NO BALL!</Text>}
                <Text className="text-6xl font-black uppercase text-green-400 shadow-xl mb-4 text-center">+{runsScored} RUNS!</Text>
              </View>
            )}
            <TouchableOpacity onPress={onContinue} className="bg-yellow-400 px-8 py-3 rounded-full shadow-lg active:scale-95">
              <Text className="text-indigo-900 font-black text-lg uppercase">Next Ball</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text className="text-xl font-bold opacity-60 animate-pulse text-white">Calculating...</Text>
        )}
      </View>
    </View>
  );
}

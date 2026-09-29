import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Vibration, Image } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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

      Animated.sequence([
        Animated.parallel([
          Animated.timing(heightAnim, {
            toValue: -60,
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
        }).start(() => {
          setTimeout(() => onContinue(), 2500);
        });
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
    // If the winner chose 'head', it landed on 'head'.
    const winningFace = room.toss_call === 'head' ? (isOdd ? 'H' : 'T') : (isOdd ? 'T' : 'H');
    
    const p1Name = room.p1_name;
    const p2Name = room.p2_name || 'OPPONENT';
    const p1Choice = room.toss_call === 'head' ? 'HEADS' : 'TAILS';
    const p2Choice = room.toss_call === 'head' ? 'TAILS' : 'HEADS';
    const winnerName = batName;

    const spin = flipAnim.interpolate({
      inputRange: [0, 6],
      outputRange: ['0deg', '2160deg'] // 6 full rotations on X axis
    });

    return (
      <View className="flex-1 w-full px-2 justify-center items-center">
        
        {/* Animated Coin */}
        <Animated.View style={{ 
          width: 96, 
          height: 96, 
          borderRadius: 48, 
          borderWidth: 6, 
          borderColor: '#ca8a04', 
          backgroundColor: '#facc15', 
          alignItems: 'center', 
          justifyContent: 'center', 
          transform: [{ translateY: heightAnim }, { rotateX: spin }], 
          zIndex: 20,
          marginBottom: 12,
          shadowColor: '#ca8a04',
          shadowOpacity: 0.6,
          shadowRadius: 15,
          elevation: 10
        }}>
           <Text className="text-5xl font-black text-yellow-900">
             {showResult ? winningFace : '?'}
           </Text>
           {showResult && <Text className="text-[10px] font-black text-yellow-900 uppercase tracking-widest mt-0.5">{winningFace === 'H' ? 'HEADS' : 'TAILS'}</Text>}
        </Animated.View>
        
        {showResult ? (
          <Animated.View style={{ opacity: opacityAnim, width: '100%', alignItems: 'center' }}>
            
            {/* TOSS RESULT BANNER */}
            <View style={{ 
              width: '90%', 
              backgroundColor: 'rgba(2, 17, 36, 0.95)', 
              borderRadius: 20, 
              borderWidth: 2, 
              borderColor: '#005580', 
              paddingVertical: 8, 
              flexDirection: 'row', 
              alignItems: 'stretch',
              marginBottom: 12,
              shadowColor: '#0090FF',
              shadowOpacity: 0.2,
              shadowRadius: 10,
              elevation: 5
            }}>
              
              {/* Left Side (Player 1) */}
              <View style={{ flex: 1.2, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0, 0, 0, 0.5)', borderWidth: 1.5, borderColor: '#005580', alignItems: 'center', justifyContent: 'center', marginBottom: 2 }}>
                  <FontAwesome5 name={winnerName === p1Name ? "crown" : "user-alt"} size={16} color="#A8B6CC" />
                </View>
                
                <Text style={{ color: '#F5F7FF', fontWeight: '800', fontSize: 11, letterSpacing: 1, marginBottom: 2 }} numberOfLines={1}>{p1Name}</Text>
                
                <View style={{ height: 18, backgroundColor: 'rgba(0, 0, 0, 0.5)', borderWidth: 1, borderColor: '#003366', borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', paddingHorizontal: 12 }}>
                  <Text style={{ color: '#A8B6CC', fontSize: 8, fontWeight: '800', letterSpacing: 1, marginRight: 2 }}>CHOSE:</Text>
                  <Text style={{ color: '#00D9FF', fontSize: 9, fontWeight: '900', letterSpacing: 1 }}>{p1Choice}</Text>
                </View>
              </View>

              {/* Left Vertical Divider */}
              <View style={{ width: 1, height: '70%', backgroundColor: 'rgba(0, 217, 255, 0.3)', alignSelf: 'center' }} />

              {/* Center Side (Winner) */}
              <View style={{ flex: 1.4, alignItems: 'center', justifyContent: 'center', paddingVertical: 4 }}>
                 <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'center', marginBottom: 2 }}>
                    <LinearGradient colors={['rgba(0, 217, 255, 0)', '#00D9FF']} start={{x:0, y:0}} end={{x:1, y:0}} style={{ height: 2, width: 48, marginRight: 8 }} />
                    <View style={{ backgroundColor: 'rgba(19, 53, 89, 0.8)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16 }}>
                       <Text style={{ color: '#A8B6CC', fontSize: 9, fontWeight: '900', letterSpacing: 2 }}>TOSS RESULT</Text>
                    </View>
                    <LinearGradient colors={['#00D9FF', 'rgba(0, 217, 255, 0)']} start={{x:0, y:0}} end={{x:1, y:0}} style={{ height: 2, width: 48, marginLeft: 8 }} />
                 </View>
                 
                 <Text style={{ color: '#F5F7FF', fontSize: 28, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center', textShadowColor: 'rgba(0, 217, 255, 0.6)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 }} numberOfLines={1}>{winnerName}</Text>
                 <Text style={{ color: '#00D9FF', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, marginTop: -2 }}>WON THE TOSS</Text>
              </View>

              {/* Right Vertical Divider */}
              <View style={{ width: 1, height: '70%', backgroundColor: 'rgba(0, 217, 255, 0.3)', alignSelf: 'center' }} />

              {/* Right Side (Player 2) */}
              <View style={{ flex: 1.2, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0, 0, 0, 0.5)', borderWidth: 1.5, borderColor: '#005580', alignItems: 'center', justifyContent: 'center', marginBottom: 2 }}>
                  <FontAwesome5 name={winnerName === p2Name ? "crown" : "user"} size={16} color="#A8B6CC" />
                </View>
                
                <Text style={{ color: '#F5F7FF', fontWeight: '800', fontSize: 11, letterSpacing: 1, marginBottom: 2 }} numberOfLines={1}>{p2Name}</Text>
                
                <View style={{ height: 18, backgroundColor: 'rgba(0, 0, 0, 0.5)', borderWidth: 1, borderColor: '#003366', borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', paddingHorizontal: 12 }}>
                  <Text style={{ color: '#A8B6CC', fontSize: 8, fontWeight: '800', letterSpacing: 1, marginRight: 2 }}>CHOSE:</Text>
                  <Text style={{ color: '#00D9FF', fontSize: 9, fontWeight: '900', letterSpacing: 1 }}>{p2Choice}</Text>
                </View>
              </View>

            </View>

            {/* PLAYER CHOICES BANNER */}
            <View style={{ 
              width: '60%', 
              backgroundColor: 'rgba(2, 17, 36, 0.95)', 
              borderRadius: 16, 
              borderWidth: 2, 
              borderColor: '#005580', 
              paddingTop: 12, 
              paddingBottom: 12, 
              paddingHorizontal: 8, 
              marginTop: 2,
              shadowColor: '#0090FF',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.4,
              shadowRadius: 12,
              elevation: 8
            }}>
              {/* Title Inside the Box */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12, paddingHorizontal: 16 }}>
                 <LinearGradient colors={['rgba(0, 217, 255, 0)', '#00D9FF']} start={{x:0, y:0}} end={{x:1, y:0}} style={{ height: 2, width: 48, marginRight: 12 }} />
                 <Text style={{ color: '#F5F7FF', fontSize: 10, fontWeight: '900', letterSpacing: 2 }}>PLAYER CHOICES</Text>
                 <LinearGradient colors={['#00D9FF', 'rgba(0, 217, 255, 0)']} start={{x:0, y:0}} end={{x:1, y:0}} style={{ height: 2, width: 48, marginLeft: 12 }} />
              </View>

              {/* Row for Choice Boxes */}
              <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                 {/* P1 Choice Box */}
                 <View style={{ width: '42%', paddingVertical: 12, paddingHorizontal: 6, backgroundColor: 'rgba(0, 0, 0, 0.4)', borderRadius: 12, borderWidth: 1, borderColor: '#005580', flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, borderColor: '#005580', alignItems: 'center', justifyContent: 'center', marginRight: 6 }}>
                       <Text style={{ fontSize: 16 }}>{getEmoji(p1T)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                       <Text style={{ color: '#F5F7FF', fontSize: 9, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' }} numberOfLines={1}>{p1Name}</Text>
                       <Text style={{ color: '#00D9FF', fontSize: 14, fontWeight: '900', letterSpacing: 1, marginTop: 1 }}>{p1T || '?'}</Text>
                    </View>
                 </View>

                 {/* P2 Choice Box */}
                 <View style={{ width: '42%', paddingVertical: 12, paddingHorizontal: 6, backgroundColor: 'rgba(0, 0, 0, 0.4)', borderRadius: 12, borderWidth: 1, borderColor: '#005580', flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, borderColor: '#005580', alignItems: 'center', justifyContent: 'center', marginRight: 6 }}>
                       <Text style={{ fontSize: 16 }}>{getEmoji(p2T)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                       <Text style={{ color: '#F5F7FF', fontSize: 9, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' }} numberOfLines={1}>{p2Name}</Text>
                       <Text style={{ color: '#00D9FF', fontSize: 14, fontWeight: '900', letterSpacing: 1, marginTop: 1 }}>{p2T || '?'}</Text>
                    </View>
                 </View>
              </View>
            </View>

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

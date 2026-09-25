import React, { useRef, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, Animated } from 'react-native';

interface GuideModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function GuideModal({ visible, onClose }: GuideModalProps) {
  const scrollY = useRef(new Animated.Value(0)).current;
  const [contentHeight, setContentHeight] = useState(1);
  const [scrollViewHeight, setScrollViewHeight] = useState(1);

  // Calculate indicator height and position for the custom scrollbar
  const scrollIndicatorHeight = Math.max((scrollViewHeight / contentHeight) * scrollViewHeight, 40);
  const scrollRange = contentHeight - scrollViewHeight;
  const maxIndicatorY = scrollViewHeight - scrollIndicatorHeight;
  
  const indicatorTranslateY = scrollY.interpolate({
    inputRange: [0, Math.max(scrollRange, 1)],
    outputRange: [0, Math.max(maxIndicatorY, 0)],
    extrapolate: 'clamp',
  });

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/95 justify-center items-center p-4">
        
        {/* Modal Container */}
        <View className="w-full h-[95%] bg-indigo-950 border border-cyan-500/40 rounded-3xl overflow-hidden shadow-[0_0_25px_rgba(34,211,238,0.15)] flex-col">
          
          {/* Header */}
          <View className="bg-cyan-500/10 px-4 py-3 border-b border-cyan-500/30 flex-row justify-between items-center">
            <View className="flex-row items-center gap-2">
              <Text className="text-xl">📖</Text>
              <Text className="text-base font-black text-cyan-400 uppercase tracking-widest">How to Play</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="w-7 h-7 bg-black/40 rounded-full items-center justify-center border border-cyan-500/30 active:scale-95">
              <Text className="text-cyan-400 font-black text-[10px]">✕</Text>
            </TouchableOpacity>
          </View>

          {/* Body */}
          <View className="flex-1 flex-row relative overflow-hidden">
            
            {/* Scrollable Content */}
            <Animated.ScrollView 
              className="flex-1 pl-5 pr-4 pt-5" 
              showsVerticalScrollIndicator={false} 
              contentContainerStyle={{ paddingBottom: 20 }}
              onContentSizeChange={(_, h) => setContentHeight(h)}
              onLayout={e => setScrollViewHeight(e.nativeEvent.layout.height)}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: true }
              )}
              scrollEventThrottle={16}
            >
              
              {/* 1. Creating & Joining */}
              <View className="mb-6">
                <View className="flex-row items-center gap-2 mb-2 border-b border-yellow-500/20 pb-2">
                  <View className="w-5 h-5 bg-yellow-500/20 rounded-md items-center justify-center border border-yellow-500/40">
                    <Text className="text-yellow-400 font-black text-[10px]">1</Text>
                  </View>
                  <Text className="text-yellow-400 font-black text-sm uppercase tracking-widest">Starting a Match</Text>
                </View>
                <Text className="text-indigo-100/90 font-bold leading-5 text-xs mt-1">
                  Create a room or join a ranked match. You will set a <Text className="text-yellow-400">Bet Amount</Text>, Overs Limit, and Wickets Limit. 
                  {"\n\n"}
                  <Text className="text-yellow-400 font-black">Winning the Pot:</Text> This is a winner-takes-all game! When you win a match, you receive <Text className="text-yellow-400 font-black">2x your Gold</Text> (you win back your bet plus your opponent's bet).
                </Text>
              </View>

              {/* 2. Team Selection */}
              <View className="mb-6">
                <View className="flex-row items-center gap-2 mb-2 border-b border-purple-500/20 pb-2">
                  <View className="w-5 h-5 bg-purple-500/20 rounded-md items-center justify-center border border-purple-500/40">
                    <Text className="text-purple-400 font-black text-[10px]">2</Text>
                  </View>
                  <Text className="text-purple-400 font-black text-sm uppercase tracking-widest">Team Selection</Text>
                </View>
                <Text className="text-indigo-100/90 font-bold leading-5 text-xs mt-1 mb-2">
                  Before stepping onto the pitch, both players must draft their team.
                  {"\n\n"}
                  • <Text className="text-purple-300 font-black">Select Country:</Text> First, pick your team's country.
                  {"\n"}
                  • <Text className="text-purple-300 font-black">Select Players:</Text> The number of players you draft <Text className="text-white font-black">depends entirely on the Wickets Limit</Text> set for the room.
                  {"\n"}
                  • <Text className="text-purple-300 font-black">Assign Captain:</Text> You must designate one of your selected players to be the Captain (labeled with a 'C') to lead your squad to victory!
                </Text>
              </View>

              {/* 3. Game Speed & Timers */}
              <View className="mb-6">
                <View className="flex-row items-center gap-2 mb-2 border-b border-cyan-500/20 pb-2">
                  <View className="w-5 h-5 bg-cyan-500/20 rounded-md items-center justify-center border border-cyan-500/40">
                    <Text className="text-cyan-400 font-black text-[10px]">3</Text>
                  </View>
                  <Text className="text-cyan-400 font-black text-sm uppercase tracking-widest">Game Speed Timers</Text>
                </View>
                <Text className="text-indigo-100/90 font-bold leading-5 text-xs mt-1 mb-3">
                  The room creator selects the Game Speed, which determines the turn timer for BOTH the Batsman and the Bowler:
                </Text>
                
                <View className="gap-2 pl-1">
                  <View className="flex-row items-start gap-3 bg-black/20 p-2 rounded-lg border border-white/5">
                    <View className="w-6 h-6 rounded-full bg-red-500/20 items-center justify-center border border-red-500/50 mt-0.5">
                      <Text className="text-red-400 text-[10px] font-black">F</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-red-400 font-black text-xs uppercase tracking-wider mb-0.5">Fast Mode</Text>
                      <Text className="text-indigo-200/70 text-[11px] font-bold leading-4">Very short timer. You must make split-second decisions! Perfect for intense matches.</Text>
                    </View>
                  </View>
                  
                  <View className="flex-row items-start gap-3 bg-black/20 p-2 rounded-lg border border-white/5">
                    <View className="w-6 h-6 rounded-full bg-yellow-500/20 items-center justify-center border border-yellow-500/50 mt-0.5">
                      <Text className="text-yellow-400 text-[10px] font-black">M</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-yellow-400 font-black text-xs uppercase tracking-wider mb-0.5">Medium Mode</Text>
                      <Text className="text-indigo-200/70 text-[11px] font-bold leading-4">A balanced timer. Gives you a few moments to think about your next move.</Text>
                    </View>
                  </View>

                  <View className="flex-row items-start gap-3 bg-black/20 p-2 rounded-lg border border-white/5">
                    <View className="w-6 h-6 rounded-full bg-cyan-500/20 items-center justify-center border border-cyan-500/50 mt-0.5">
                      <Text className="text-cyan-400 text-[10px] font-black">S</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-cyan-400 font-black text-xs uppercase tracking-wider mb-0.5">Slow Mode</Text>
                      <Text className="text-indigo-200/70 text-[11px] font-bold leading-4">A generous timer. Ideal for relaxed play where you want to carefully strategize.</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* 4. Timeouts & No Balls */}
              <View className="mb-6">
                <View className="flex-row items-center gap-2 mb-2 border-b border-red-500/20 pb-2">
                  <View className="w-5 h-5 bg-red-500/20 rounded-md items-center justify-center border border-red-500/40">
                    <Text className="text-red-400 font-black text-[10px]">4</Text>
                  </View>
                  <Text className="text-red-400 font-black text-sm uppercase tracking-widest">Timeouts & Penalties</Text>
                </View>
                <Text className="text-indigo-100/90 font-bold leading-5 text-xs mt-1">
                  Both players must select their number before the timer runs out! If either player fails to select:
                  {"\n\n"}
                  <Text className="text-red-400 font-black">Bowler Timeout (No Ball):</Text> If the bowler doesn't select a number, it is a <Text className="text-red-400 font-bold">No Ball</Text>. The batsman gets the runs they selected <Text className="text-green-400 font-bold">PLUS 1 extra run</Text>, and the ball is <Text className="text-white font-bold">NOT</Text> counted towards the over!
                  {"\n\n"}
                  <Text className="text-red-400 font-black">Batsman Timeout (Dot Ball):</Text> If the batsman doesn't select a number, it is automatically counted as a <Text className="text-red-400 font-bold">Dot Ball</Text>. They score 0 runs for that delivery.
                  {"\n\n"}
                  <Text className="text-red-400 font-black">Double Timeout (Wicket):</Text> If BOTH players fail to select a number in time, it results in a <Text className="text-red-500 font-black">WICKET (OUT)!</Text>
                </Text>
              </View>

              {/* Inline Footer Button */}
              <View className="items-center mt-2 mb-4">
                <TouchableOpacity onPress={onClose} className="bg-cyan-500 px-8 py-3 rounded-xl active:scale-95 shadow-[0_0_15px_rgba(34,211,238,0.4)] border-b-4 border-cyan-700 items-center justify-center">
                  <Text className="text-indigo-950 font-black text-xs uppercase tracking-widest">Got it, Let's Play!</Text>
                </TouchableOpacity>
              </View>

            </Animated.ScrollView>

            {/* Custom Scroll Indicator */}
            {contentHeight > scrollViewHeight && (
              <View className="w-1.5 bg-black/40 rounded-full my-5 mr-3 overflow-hidden border border-white/5" style={{ height: scrollViewHeight - 40 }}>
                <Animated.View 
                  className="w-full bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)]"
                  style={{ 
                    height: scrollIndicatorHeight,
                    transform: [{ translateY: indicatorTranslateY }]
                  }}
                />
              </View>
            )}

          </View>
        </View>
      </View>
    </Modal>
  );
}

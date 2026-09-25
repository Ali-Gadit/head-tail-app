import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView } from 'react-native';

interface GuideModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function GuideModal({ visible, onClose }: GuideModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/90 justify-center items-center pt-12 pb-6 px-4">
        
        {/* Modal Container */}
        <View className="w-full max-w-lg bg-indigo-950 border border-cyan-500/40 rounded-3xl overflow-hidden shadow-[0_0_25px_rgba(34,211,238,0.15)] flex-shrink">
          
          {/* Header */}
          <View className="bg-cyan-500/10 p-5 border-b border-cyan-500/30 flex-row justify-between items-center">
            <View className="flex-row items-center gap-3">
              <Text className="text-3xl">📖</Text>
              <Text className="text-xl font-black text-cyan-400 uppercase tracking-widest">How to Play</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="w-8 h-8 bg-black/40 rounded-full items-center justify-center border border-cyan-500/30 active:scale-95">
              <Text className="text-cyan-400 font-black text-xs">✕</Text>
            </TouchableOpacity>
          </View>

          {/* Scrollable Content */}
          <ScrollView className="p-6" showsVerticalScrollIndicator={false}>
            
            {/* The Basics */}
            <View className="mb-8">
              <Text className="text-yellow-400 font-black text-[15px] uppercase tracking-widest mb-2 border-b border-yellow-500/20 pb-2">🏏 The Basics</Text>
              <Text className="text-indigo-100/90 font-bold leading-5 text-sm mt-2">
                Welcome to Head Tail! Create a room, place your <Text className="text-yellow-400">Bet Amount</Text>, and challenge your friends or play against the AI in ranked matches. Secure victories to climb the leaderboards and unlock exclusive rewards.
              </Text>
            </View>

            {/* Team Selection */}
            <View className="mb-8">
              <Text className="text-purple-400 font-black text-[15px] uppercase tracking-widest mb-2 border-b border-purple-500/20 pb-2">👥 Team Selection</Text>
              <Text className="text-indigo-100/90 font-bold leading-5 text-sm mt-2 mb-3">
                Before stepping onto the pitch, you must draft your ultimate 11. Balance your squad with aggressive Batsmen, strategic Bowlers, and versatile All-rounders.
              </Text>
              <View className="bg-purple-900/30 p-3 rounded-xl border border-purple-500/20">
                <Text className="text-purple-300 font-black text-xs uppercase mb-1 tracking-wider">👑 The Captain Multiplier</Text>
                <Text className="text-indigo-200/80 font-bold text-xs leading-4">
                  Your captain acts as a score multiplier! Their performance gives you a huge boost during crucial moments. Always select your most reliable player as Captain.
                </Text>
              </View>
            </View>

            {/* Bowling Mechanics */}
            <View className="mb-8">
              <Text className="text-green-400 font-black text-[15px] uppercase tracking-widest mb-2 border-b border-green-500/20 pb-2">🎯 Bowling Mechanics</Text>
              <Text className="text-indigo-100/90 font-bold leading-5 text-sm mt-2 mb-4">
                Mastering the pace is key to outsmarting the batsman. Choose between 3 different delivery types:
              </Text>
              
              <View className="gap-3 pl-1">
                <View className="flex-row items-start gap-3 bg-black/20 p-2 rounded-lg border border-white/5">
                  <View className="w-8 h-8 rounded-full bg-red-500/20 items-center justify-center border border-red-500/50 mt-1">
                    <Text className="text-red-400 text-xs font-black">F</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-red-400 font-black uppercase tracking-wider mb-0.5">Fast</Text>
                    <Text className="text-indigo-200/70 text-xs font-bold leading-4">High risk of taking edges and forcing mistakes, but incredibly punishing if the batsman times it right.</Text>
                  </View>
                </View>
                
                <View className="flex-row items-start gap-3 bg-black/20 p-2 rounded-lg border border-white/5">
                  <View className="w-8 h-8 rounded-full bg-yellow-500/20 items-center justify-center border border-yellow-500/50 mt-1">
                    <Text className="text-yellow-400 text-xs font-black">M</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-yellow-400 font-black uppercase tracking-wider mb-0.5">Medium</Text>
                    <Text className="text-indigo-200/70 text-xs font-bold leading-4">A balanced pace. Relies heavily on line and length to restrict the flow of runs.</Text>
                  </View>
                </View>

                <View className="flex-row items-start gap-3 bg-black/20 p-2 rounded-lg border border-white/5">
                  <View className="w-8 h-8 rounded-full bg-cyan-500/20 items-center justify-center border border-cyan-500/50 mt-1">
                    <Text className="text-cyan-400 text-xs font-black">S</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-cyan-400 font-black uppercase tracking-wider mb-0.5">Slow / Spin</Text>
                    <Text className="text-indigo-200/70 text-xs font-bold leading-4">Extremely tricky to time. Great for breaking partnerships, but vulnerable to big hits if read early.</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Rules & No Balls */}
            <View className="mb-8">
              <Text className="text-red-400 font-black text-[15px] uppercase tracking-widest mb-2 border-b border-red-500/20 pb-2">⚠️ Rules & No Balls</Text>
              <Text className="text-indigo-100/90 font-bold leading-5 text-sm mt-2">
                Watch your timing! If you step over the line and bowl a <Text className="text-red-400">No Ball</Text>, you concede a run and the batsman receives a <Text className="text-green-400">Free Hit</Text>. 
                {"\n\n"}
                During a Free Hit, the batsman cannot be dismissed (except via run out) and can swing for the fences with absolute zero risk. Discipline is everything!
              </Text>
            </View>
            
            {/* Pro Tip */}
            <View className="mb-8 p-4 bg-cyan-500/10 rounded-2xl border border-cyan-500/30 shadow-inner">
              <View className="flex-row items-center justify-center gap-2 mb-2">
                <Text className="text-xl">💡</Text>
                <Text className="text-cyan-400 font-black text-sm uppercase tracking-widest">Pro Tip</Text>
              </View>
              <Text className="text-indigo-200 text-xs text-center font-bold leading-4">
                Manage your bets carefully. High stakes yield massive rewards, but going bankrupt means you'll have to rely on daily rewards or the store to buy back into the big leagues!
              </Text>
            </View>

          </ScrollView>

          {/* Footer Button */}
          <View className="p-4 bg-black/40 border-t border-cyan-500/20 pb-6">
            <TouchableOpacity onPress={onClose} className="bg-cyan-500 py-3.5 rounded-2xl active:scale-95 shadow-lg border-b-4 border-cyan-700 items-center justify-center">
              <Text className="text-indigo-950 font-black text-[15px] uppercase tracking-widest">Got it, Let's Play!</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

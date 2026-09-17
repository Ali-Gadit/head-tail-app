import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { supabase } from '../lib/supabase';

type Player = {
  id: string;
  username: string;
  coins: number;
};

export default function Leaderboard({ visible, onClose }: { visible: boolean, onClose: () => void }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;

    const fetchLeaderboard = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, coins')
        .order('coins', { ascending: false })
        .limit(50);

      if (!error && data) {
        setPlayers(data);
      }
      setLoading(false);
    };

    fetchLeaderboard();
  }, [visible]);

  return (
    <Modal
      visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <View className="flex-1 bg-black/80 justify-end">
          <View className="bg-indigo-950 rounded-t-[2rem] border-t border-white/20 h-[80%]">
            
            <View className="p-6 border-b border-white/10 flex-row justify-between items-center bg-white/5 rounded-t-[2rem]">
              <Text className="text-2xl font-black text-white uppercase tracking-wider">
                <Text className="text-yellow-400">🏆</Text> Leaderboard
              </Text>
              <TouchableOpacity 
                onPress={onClose}
                className="w-8 h-8 items-center justify-center bg-white/10 rounded-full"
              >
                <Text className="text-white font-bold">✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView className="p-4" showsVerticalScrollIndicator={false}>
              {loading ? (
                <View className="py-10 items-center">
                  <Text className="text-yellow-400 font-bold">Loading rankings...</Text>
                </View>
              ) : players.length === 0 ? (
                <View className="py-10 items-center">
                  <Text className="text-white/50 font-bold">No players found.</Text>
                </View>
              ) : (
                <View className="gap-3 pb-8">
                  {players.map((player, index) => {
                    const isGold = index === 0;
                    const isSilver = index === 1;
                    const isBronze = index === 2;
                    
                    return (
                      <View 
                        key={player.id}
                        className={`flex-row items-center p-4 rounded-2xl border ${isGold ? 'bg-yellow-400/20 border-yellow-400' : isSilver ? 'bg-gray-300/20 border-gray-300' : isBronze ? 'bg-amber-600/20 border-amber-600' : 'bg-white/5 border-white/10'}`}
                      >
                        <Text className={`w-10 text-center font-black ${isGold ? 'text-yellow-400 text-2xl' : isSilver ? 'text-gray-300 text-xl' : isBronze ? 'text-amber-600 text-xl' : 'text-white/40 text-lg'}`}>
                          #{index + 1}
                        </Text>
                        
                        <View className="flex-1 ml-4">
                          <Text className={`font-bold ${isGold || isSilver || isBronze ? 'text-white' : 'text-white/80'}`}>
                            {player.username}
                          </Text>
                        </View>
                        
                        <View className="flex-row items-center bg-black/20 px-3 py-1.5 rounded-full">
                          <Text className="text-yellow-400 font-bold text-sm">🪙 {player.coins}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </ScrollView>
            
          </View>
        </View>
      </Modal>
  );
}

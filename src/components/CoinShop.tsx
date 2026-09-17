import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Alert, ScrollView } from 'react-native';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';
import { useAuth } from './AuthProvider';

interface CoinShopProps {
  visible: boolean;
  onClose: () => void;
}

export default function CoinShop({ visible, onClose }: CoinShopProps) {
  const { user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  const buyCoins = async (diamonds: number) => {
    if (!user) return;
    setLoading(true);
    try {
      await api.exchangeDiamonds(user.id, diamonds);
      Alert.alert('Success', `Successfully bought ${diamonds}k 🪙 for ${diamonds} 💎!`);
      await refreshProfile();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  const buyToken = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await api.buyPrivateRoomToken(user.id);
      Alert.alert('Success', 'Successfully bought 1 Private Room Token 🎟️!');
      await refreshProfile();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  const cheatDiamonds = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: profile } = await supabase.from('profiles').select('premium_currency').eq('id', user.id).single();
      const current = profile?.premium_currency || 0;
      const { error } = await supabase.from('profiles').update({ premium_currency: current + 100000 }).eq('id', user.id);
      if (error) throw error;
      Alert.alert('Cheat Activated', 'You got 100k diamonds!');
      await refreshProfile();
    } catch (err: any) {
      Alert.alert('Cheat Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/80 justify-center p-4">
        <View className="bg-indigo-900 border border-indigo-400 p-6 rounded-3xl h-[85%]">
          <TouchableOpacity onLongPress={cheatDiamonds}>
             <Text className="text-3xl font-black text-white text-center mb-6">STORE</Text>
          </TouchableOpacity>
          
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            <Text className="text-white opacity-50 font-bold tracking-widest text-[10px] uppercase mb-4">Gold Packs</Text>
            
            <View className="flex-row flex-wrap justify-between mb-6">
              {[1, 10, 50, 100].map((diamonds) => (
                <TouchableOpacity 
                  key={diamonds} 
                  onPress={() => buyCoins(diamonds)} 
                  disabled={loading} 
                  className="w-[48%] bg-white/10 p-4 rounded-2xl mb-4 border border-white/20 items-center active:scale-95"
                >
                  <Text className="text-yellow-400 font-black text-xl mb-1">{diamonds}k 🪙</Text>
                  <View className="bg-cyan-500/20 px-3 py-1 rounded-full border border-cyan-500/50">
                    <Text className="text-cyan-400 font-bold text-xs">{diamonds} 💎</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="text-white opacity-50 font-bold tracking-widest text-[10px] uppercase mb-4">Tokens</Text>
            <View className="bg-white/10 p-4 rounded-2xl mb-6 border border-white/20">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-white font-bold text-lg">Private Room Token 🎟️</Text>
                <Text className="text-cyan-400 font-bold text-lg">50 💎</Text>
              </View>
              <Text className="text-white/60 text-xs mb-4">Used to create private multiplayer matches with friends.</Text>
              <TouchableOpacity onPress={buyToken} disabled={loading} className="bg-purple-500 py-3 rounded-xl active:scale-95">
                <Text className="text-white font-black text-center uppercase">Buy Token</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <TouchableOpacity onPress={onClose} disabled={loading} className="py-4 mt-4 border border-white/20 rounded-2xl active:scale-95 bg-white/5">
            <Text className="text-white text-center font-bold uppercase">Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

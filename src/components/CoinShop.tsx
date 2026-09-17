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
  const [successMsg, setSuccessMsg] = useState<{title: string, message: string} | null>(null);
  const [confirmAction, setConfirmAction] = useState<{title: string, message: string, action: () => void} | null>(null);

  const showSuccess = (title: string, message: string) => {
    setSuccessMsg({ title, message });
    setTimeout(() => {
      setSuccessMsg(null);
    }, 2500);
  };

  const requestBuyCoins = (diamonds: number) => {
    const coins = diamonds >= 1000 ? `${diamonds/1000}M` : `${diamonds}k`;
    setConfirmAction({
      title: 'CONFIRM PURCHASE',
      message: `Spend ${diamonds} 💎 to buy ${coins} 🪙?`,
      action: () => buyCoins(diamonds)
    });
  };

  const requestBuyToken = () => {
    setConfirmAction({
      title: 'CONFIRM PURCHASE',
      message: 'Spend 50 💎 to buy 1 Token 🎟️?',
      action: () => buyToken()
    });
  };

  const buyCoins = async (diamonds: number) => {
    if (!user) return;
    setLoading(true);
    try {
      await api.exchangeDiamonds(user.id, diamonds);
      const coins = diamonds >= 1000 ? `${diamonds/1000}M` : `${diamonds}k`;
      showSuccess('PURCHASE SUCCESS!', `Successfully bought ${coins} 🪙 for ${diamonds} 💎!`);
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
      showSuccess('AWESOME!', 'Successfully bought 1 Private Room Token 🎟️!');
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
      showSuccess('CHEAT ACTIVATED', 'You got 100k diamonds! 💎💎💎');
      await refreshProfile();
    } catch (err: any) {
      Alert.alert('Cheat Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/80 justify-center items-center p-2">
        <View className="flex-1 bg-indigo-950 border border-indigo-400 p-4 rounded-3xl w-full max-w-3xl max-h-[95%] shadow-2xl">
          
          <View className="flex-row justify-between items-center mb-3 px-2">
            <TouchableOpacity onLongPress={cheatDiamonds}>
               <Text className="text-2xl font-black text-white italic tracking-tighter">STORE</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} disabled={loading} className="w-8 h-8 rounded-full bg-white/10 items-center justify-center active:scale-95">
              <Text className="text-white font-bold">✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            
            {/* Tokens Section (Horizontal Banner) */}
            <View className="bg-gradient-to-r from-purple-900 to-indigo-800 p-3 rounded-2xl mb-4 border border-purple-500/50 flex-row items-center justify-between shadow-lg">
              <View className="flex-1 mr-4">
                <Text className="text-white font-black text-lg italic tracking-tight">PRIVATE ROOM TOKEN 🎟️</Text>
                <Text className="text-white/60 text-[10px] uppercase font-bold">Create private multiplayer matches.</Text>
              </View>
              <TouchableOpacity onPress={requestBuyToken} disabled={loading} className="bg-purple-500 px-4 py-2 rounded-xl active:scale-95 border border-purple-400 flex-row items-center shadow-lg">
                <Text className="text-white font-black uppercase text-xs mr-2">BUY</Text>
                <View className="bg-black/30 px-2 py-0.5 rounded-md">
                   <Text className="text-cyan-400 font-bold text-xs">50 💎</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Gold Packs Grid */}
            <Text className="text-white/50 font-black tracking-widest text-[10px] uppercase mb-2 px-1">Gold Packs</Text>
            
            <View className="flex-row flex-wrap justify-between gap-y-3">
              {[1, 10, 50, 100, 500, 1000].map((diamonds) => {
                const coins = diamonds >= 1000 ? `${diamonds/1000}M` : `${diamonds}k`;
                return (
                  <TouchableOpacity 
                    key={diamonds} 
                    onPress={() => requestBuyCoins(diamonds)} 
                    disabled={loading} 
                    className="w-[32%] bg-white/5 p-3 rounded-2xl border border-white/10 items-center active:scale-95 shadow-md"
                  >
                    <Text className="text-2xl mb-1 drop-shadow-md">🪙</Text>
                    <Text className="text-yellow-400 font-black text-lg leading-tight mb-2">{coins}</Text>
                    <View className="bg-cyan-500/20 px-3 py-1 rounded-full border border-cyan-500/50 w-full">
                      <Text className="text-cyan-400 font-bold text-xs text-center">{diamonds} 💎</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
            
            <View className="h-6" />
          </ScrollView>

          {/* Animated Confirm Overlay */}
          {confirmAction && (
            <View className="absolute inset-0 bg-indigo-950/95 justify-center items-center rounded-3xl z-50 p-6">
              <Text className="text-6xl mb-4 animate-pulse">💎</Text>
              <Text className="text-3xl font-black text-white italic mb-4 tracking-tighter text-center">
                {confirmAction.title}
              </Text>
              <Text className="text-yellow-400 text-xl text-center font-bold px-6 mb-8">
                {confirmAction.message}
              </Text>
              <View className="flex-row gap-4">
                <TouchableOpacity onPress={() => setConfirmAction(null)} disabled={loading} className="bg-gray-600 px-8 py-3 rounded-2xl active:scale-95 border border-gray-400">
                  <Text className="text-white font-black uppercase text-lg">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {
                  confirmAction.action();
                  setConfirmAction(null);
                }} disabled={loading} className="bg-green-500 px-8 py-3 rounded-2xl active:scale-95 shadow-[0_0_15px_rgba(34,197,94,0.5)] border border-green-300">
                  <Text className="text-white font-black uppercase text-lg">Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Animated Success Overlay */}
          {successMsg && (
            <View className="absolute inset-0 bg-indigo-950/95 justify-center items-center rounded-3xl z-50">
              <Text className="text-6xl mb-4 animate-bounce">🎉</Text>
              <Text className="text-4xl font-black text-yellow-400 italic mb-2 tracking-tighter text-center">
                {successMsg.title}
              </Text>
              <Text className="text-white text-lg text-center font-bold px-6">
                {successMsg.message}
              </Text>
            </View>
          )}

        </View>
      </View>
    </Modal>
  );
}

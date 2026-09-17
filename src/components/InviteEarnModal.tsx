import React from 'react';
import { View, Text, TouchableOpacity, Modal, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from './AuthProvider';

export default function InviteEarnModal({ visible, onClose }: { visible: boolean, onClose: () => void }) {
  const { profile } = useAuth();
  
  if (!profile) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <View className="flex-1 bg-black/80 justify-center items-center p-4">
        <View className="bg-gradient-to-br from-purple-600 to-indigo-600 w-full max-w-lg rounded-3xl border border-white/20 shadow-2xl p-6">
          
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row">
              <Text className="text-white font-black text-2xl italic tracking-tighter">INVITE & </Text>
              <Text className="text-yellow-400 font-black text-2xl italic tracking-tighter">EARN</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="bg-black/20 w-8 h-8 rounded-full items-center justify-center active:scale-95">
              <Text className="text-white font-black text-lg leading-none mt-[-2px]">✕</Text>
            </TouchableOpacity>
          </View>

          <Text className="text-white/90 text-sm mb-6 leading-tight font-bold">
            Share this code with a friend! Tell them to enter it as their referral code during sign up. They'll get an instant <Text className="text-yellow-400">5k 🪙</Text> bonus, and you'll receive <Text className="text-yellow-400">10k 🪙</Text> the moment they join!
          </Text>

          <View className="bg-black/30 p-5 rounded-2xl flex-row justify-between items-center border border-white/10">
            <Text className="text-white font-mono text-3xl tracking-[0.2em] font-black">
              {String(profile.friend_id || 0).padStart(7, '0')}
            </Text>
            
            <TouchableOpacity 
              onPress={() => { 
                Clipboard.setStringAsync(String(profile.friend_id || 0).padStart(7, '0')); 
                Alert.alert('Copied!', 'Referral code copied to clipboard!'); 
              }} 
              className="bg-white/20 px-4 py-3 rounded-xl active:scale-95"
            >
              <Text className="text-white font-bold text-xs uppercase tracking-widest">Copy</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

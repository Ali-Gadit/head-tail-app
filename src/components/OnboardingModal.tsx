import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Modal, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthProvider';

export default function OnboardingModal({ visible, onComplete }: { visible: boolean, onComplete: () => void }) {
  const { user, profile, refreshProfile } = useAuth();
  const [username, setUsername] = useState(profile?.username || '');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSave = async () => {
    setErrorMessage('');
    if (!username.trim()) {
      setErrorMessage('Please enter a username');
      return;
    }
    if (!user) {
      setErrorMessage('Session error. Please restart the app.');
      return;
    }

    setLoading(true);
    try {
      const cleanUsername = username.trim();
      
      // Update the profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ username: cleanUsername })
        .eq('id', user.id);
        
      if (profileError) throw profileError;

      // Handle referral code if provided
      if (referralCode.trim()) {
        try {
          const rawRef = referralCode.trim();
          const possibleValues = [rawRef];
          const num = parseInt(rawRef, 10);
          if (!isNaN(num)) {
            possibleValues.push(num.toString());
            possibleValues.push(num.toString().padStart(7, '0'));
          }
          
          const { data: referrers } = await supabase.from('profiles').select('id').in('friend_id', possibleValues).limit(1);
          
          if (referrers && referrers.length > 0) {
            await supabase.rpc('update_profile_coins', { user_id: referrers[0].id, amount: 10000 });
            await supabase.rpc('update_profile_coins', { user_id: user.id, amount: 5000 });
          }
        } catch(e) {
          console.log("Referral error:", e);
        }
      }

      // Mark as onboarded in Auth metadata so it doesn't show again, and save the username
      await supabase.auth.updateUser({ data: { onboarded: true, username: cleanUsername } });
      
      await refreshProfile();
      onComplete();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        className="flex-1 justify-center items-center bg-black/70 p-4"
      >
        <View className="w-full max-w-[400px] bg-black/80 px-6 py-5 rounded-[2rem] border border-cyan-500/30 shadow-[0_0_30px_rgba(34,211,238,0.2)]">
          
          {/* Header */}
          <View className="items-center mb-5">
            <View className="w-12 h-12 bg-cyan-500/10 rounded-2xl border border-cyan-500/30 items-center justify-center mb-3 shadow-[0_0_15px_rgba(34,211,238,0.4)]">
               <Text className="text-2xl">🏆</Text>
            </View>
            <Text 
              className="text-2xl font-black text-white tracking-widest uppercase text-center"
              style={{ textShadowColor: 'rgba(34,211,238,0.9)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 15 }}
            >
              PROFILE SETUP
            </Text>
            <Text className="text-cyan-400/80 text-[10px] font-black uppercase tracking-[0.2em] mt-1.5 text-center">
              Claim your identity in the arena
            </Text>
          </View>
          
          {/* Error */}
          {errorMessage ? (
            <View className="mb-3 bg-red-950/80 p-1.5 rounded-lg border border-red-500/50">
              <Text className="text-red-400 font-bold text-[9px] text-center uppercase tracking-widest">{errorMessage}</Text>
            </View>
          ) : null}

          {/* Inputs */}
          <View className="gap-4 mb-6">
            
            <View className="relative">
              <Text className="text-white/60 text-[9px] font-bold uppercase tracking-widest ml-1 mb-1.5">Username</Text>
              <View className={`w-full flex-row items-center bg-black/60 border rounded-xl shadow-inner ${errorMessage && !username.trim() ? 'border-red-500/80 bg-red-950/40' : 'border-cyan-500/20'}`}>
                <View className="pl-3 pr-2">
                   <Text className="text-cyan-400/50 text-xs">👤</Text>
                </View>
                <TextInput
                  value={username}
                  onChangeText={(t) => { setUsername(t); setErrorMessage(''); }}
                  className="flex-1 py-3 pr-3 text-white text-sm font-bold"
                  placeholder="e.g. MasterBlaster"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  maxLength={15}
                />
              </View>
            </View>

            <View className="relative">
              <Text className="text-white/60 text-[9px] font-bold uppercase tracking-widest ml-1 mb-1.5">Referral Code (Optional)</Text>
              <View className="w-full flex-row items-center bg-black/60 border border-yellow-500/30 rounded-xl shadow-[0_0_10px_rgba(250,204,21,0.1)]">
                <View className="pl-3 pr-2">
                   <Text className="text-yellow-400/50 text-xs">🎁</Text>
                </View>
                <TextInput
                  value={referralCode}
                  onChangeText={setReferralCode}
                  className="flex-1 py-3 pr-3 text-white text-sm font-bold"
                  placeholder="e.g. 1234"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  keyboardType="number-pad"
                />
              </View>
              <Text className="text-yellow-400/80 text-[10px] font-bold mt-1.5 ml-1 italic tracking-wide">+5,000 Coins Bonus!</Text>
            </View>

          </View>

          <TouchableOpacity 
            onPress={handleSave} 
            disabled={loading}
            className={`w-full py-3.5 rounded-xl flex items-center justify-center border-b-4 active:scale-95 shadow-[0_0_20px_rgba(34,211,238,0.4)] ${
              loading ? 'opacity-50 border-gray-600 bg-gray-500' : 'bg-cyan-500 border-cyan-700'
            }`}
          >
            {loading ? (
              <ActivityIndicator color="#0f172a" />
            ) : (
              <Text className="font-black text-xs uppercase tracking-widest text-indigo-950">
                SAVE PROFILE
              </Text>
            )}
          </TouchableOpacity>

        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

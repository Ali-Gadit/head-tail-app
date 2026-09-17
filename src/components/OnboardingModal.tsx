import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Modal, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthProvider';

export default function OnboardingModal({ visible, onComplete }: { visible: boolean, onComplete: () => void }) {
  const { user, profile, refreshProfile } = useAuth();
  const [username, setUsername] = useState(profile?.username || '');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }
    if (!user) return;

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
      Alert.alert('Error', err.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        className="flex-1 justify-center bg-indigo-950/95 p-6"
      >
        <View className="bg-indigo-900 p-6 rounded-3xl border border-indigo-400/30 shadow-2xl">
          <Text className="text-3xl font-black text-white text-center mb-2 italic">WELCOME</Text>
          <Text className="text-white/60 text-center mb-6 font-medium px-4">Let's set up your profile before you start playing!</Text>
          
          <View className="mb-4">
            <Text className="text-white text-xs font-bold opacity-70 mb-1 ml-1 uppercase">Choose a Username</Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 text-white font-bold text-lg"
              placeholder="CoolPlayer99"
              placeholderTextColor="rgba(255,255,255,0.3)"
              maxLength={15}
            />
          </View>

          <View className="mb-8">
            <Text className="text-white text-xs font-bold opacity-70 mb-1 ml-1 uppercase">Referral Code (Optional)</Text>
            <TextInput
              value={referralCode}
              onChangeText={setReferralCode}
              className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 text-white font-bold text-lg"
              placeholder="e.g. 1234"
              placeholderTextColor="rgba(255,255,255,0.3)"
              keyboardType="number-pad"
            />
            <Text className="text-yellow-400/80 text-xs mt-2 text-center">Enter a code to receive 5,000 bonus coins!</Text>
          </View>

          <TouchableOpacity 
            onPress={handleSave} 
            disabled={loading}
            className={`w-full bg-yellow-400 py-4 rounded-2xl shadow-xl flex items-center justify-center ${loading ? 'opacity-50' : 'active:scale-95'}`}
          >
            {loading ? (
              <ActivityIndicator color="#312e81" />
            ) : (
              <Text className="text-indigo-900 font-black text-xl uppercase tracking-wider">
                Start Playing
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

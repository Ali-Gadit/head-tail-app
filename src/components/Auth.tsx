import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../lib/supabase';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password || (!isLogin && !username)) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: { data: { username } }
        });
        if (error) throw error;
        
        if (referralCode.trim() && data?.user?.id) {
          try {
            await new Promise(r => setTimeout(r, 2000));
            const refId = parseInt(referralCode.trim(), 10);
            if (!isNaN(refId)) {
              const { data: referrers } = await supabase.from('profiles').select('id').eq('friend_id', refId).limit(1);
              if (referrers && referrers.length > 0) {
                await supabase.rpc('update_profile_coins', { user_id: referrers[0].id, amount: 10000 });
                await supabase.rpc('update_profile_coins', { user_id: data.user.id, amount: 5000 });
              }
            }
          } catch(e) {
            console.log("Referral error:", e);
          }
        }

        Alert.alert('Success', 'Account created! You can now log in.');
        setIsLogin(true);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="bg-white/10 p-6 rounded-3xl border border-white/20 shadow-2xl">
      <Text className="text-3xl font-black text-white text-center mb-6">
        {isLogin ? 'WELCOME BACK' : 'JOIN THE GAME'}
      </Text>
      
      
      {!isLogin && (
        <View className="mb-4">
          <Text className="text-white text-xs font-bold opacity-70 mb-1 ml-1 uppercase">Referral Code (Optional)</Text>
          <TextInput
            value={referralCode}
            onChangeText={setReferralCode}
            className="w-full bg-white/20 border border-white/30 rounded-2xl p-4 text-white font-bold"
            placeholder="00000001"
            placeholderTextColor="rgba(255,255,255,0.4)"
            keyboardType="number-pad"
          />
        </View>
      )}

      {!isLogin && (
        <View className="mb-4">
          <Text className="text-white text-xs font-bold opacity-70 mb-1 ml-1 uppercase">Username</Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            className="w-full bg-white/20 border border-white/30 rounded-2xl p-4 text-white font-bold"
            placeholder="CoolPlayer99"
            placeholderTextColor="rgba(255,255,255,0.4)"
          />
        </View>
      )}

      <View className="mb-4">
        <Text className="text-white text-xs font-bold opacity-70 mb-1 ml-1 uppercase">Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          className="w-full bg-white/20 border border-white/30 rounded-2xl p-4 text-white font-bold"
          placeholder="player@example.com"
          placeholderTextColor="rgba(255,255,255,0.4)"
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>

      <View className="mb-6">
        <Text className="text-white text-xs font-bold opacity-70 mb-1 ml-1 uppercase">Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          className="w-full bg-white/20 border border-white/30 rounded-2xl p-4 text-white font-bold"
          placeholder="••••••••"
          placeholderTextColor="rgba(255,255,255,0.4)"
          secureTextEntry
        />
      </View>

      <TouchableOpacity 
        onPress={handleAuth} 
        disabled={loading}
        className={`w-full py-4 rounded-2xl shadow-xl flex items-center justify-center ${loading ? 'opacity-50' : 'active:scale-95'} ${isLogin ? 'bg-yellow-400' : 'bg-green-400'}`}
      >
        <Text className="text-indigo-900 font-black text-lg uppercase tracking-wider">
          {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsLogin(!isLogin)} className="mt-6">
        <Text className="text-white text-center text-sm font-medium opacity-80">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <Text className="font-bold underline text-yellow-300">
            {isLogin ? 'Sign up' : 'Log in'}
          </Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

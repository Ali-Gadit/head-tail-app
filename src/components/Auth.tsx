import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Image } from 'react-native';
import { supabase } from '../lib/supabase';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: '274890853737-3jtpgphnqqljembf1odvoav9vnapo5af.apps.googleusercontent.com', // RECOVERED FROM PREVIOUS CHAT
  scopes: ['profile', 'email'],
});

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const signInWithGoogle = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      // The latest Google Sign-in library returns a 'type' field instead of throwing an error on cancel
      if (userInfo && (userInfo as any).type === 'cancelled') {
        return; // User cancelled the login flow, silently exit
      }
      
      if (userInfo && userInfo.data && userInfo.data.idToken) {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: userInfo.data.idToken,
        });
        if (error) throw error;
      } else {
        throw new Error('Authentication was cancelled or failed.');
      }
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED || error.message?.includes('cancelled')) {
        // User cancelled login flow
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // Sign in in progress
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Google Sign-In Error', 'Play services not available');
      } else {
        // Only alert if it's a real error, not a cancellation
        if (error.message !== 'Authentication was cancelled or failed.') {
           Alert.alert('Google Sign-In Error', error.message || 'Authentication failed');
        }
      }
    }
  };

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password
        });
        if (error) throw error;
        
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

      <View className="flex-row items-center my-6">
        <View className="flex-1 h-px bg-white/20" />
        <Text className="text-white/50 font-bold px-4">OR</Text>
        <View className="flex-1 h-px bg-white/20" />
      </View>

      <TouchableOpacity 
        onPress={signInWithGoogle} 
        disabled={loading}
        className="w-full bg-white py-4 rounded-2xl shadow-xl flex-row justify-center items-center gap-3 active:scale-95"
      >
        <Text className="text-indigo-900 font-black text-xl">G</Text>
        <Text className="text-indigo-900 font-black text-lg uppercase tracking-wider">Sign in with Google</Text>
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

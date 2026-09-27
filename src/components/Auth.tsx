import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ImageBackground, Image, Keyboard } from 'react-native';
import { supabase } from '../lib/supabase';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';

GoogleSignin.configure({
  webClientId: '274890853737-3jtpgphnqqljembf1odvoav9vnapo5af.apps.googleusercontent.com',
  scopes: ['profile', 'email'],
});

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // We'll determine this on mount based on their history
  const [isLogin, setIsLogin] = useState(true); 
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // If they have never logged in before, default to Sign Up
    AsyncStorage.getItem('has_logged_in_before').then((val) => {
      if (!val) setIsLogin(false);
    });
  }, []);

  const signInWithGoogle = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      if (userInfo && (userInfo as any).type === 'cancelled') {
        return;
      }
      
      if (userInfo && userInfo.data && userInfo.data.idToken) {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: userInfo.data.idToken,
        });
        if (error) throw error;
        await AsyncStorage.setItem('has_logged_in_before', 'true');
      } else {
        throw new Error('Authentication was cancelled or failed.');
      }
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED || error.message?.includes('cancelled')) {
      } else if (error.code === statusCodes.IN_PROGRESS) {
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        setErrorMessage('Google Play services not available');
      } else {
        if (error.message !== 'Authentication was cancelled or failed.') {
           setErrorMessage(error.message || 'Authentication failed');
        }
      }
    }
  };

  const handleAuth = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    if (!email || !password || (!isLogin && !confirmPassword)) {
      setErrorMessage('Please fill in all fields');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    setLoading(true);
    
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await AsyncStorage.setItem('has_logged_in_before', 'true');
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        await AsyncStorage.setItem('has_logged_in_before', 'true');
        
        if (data.session) {
          // If auto-login is enabled in Supabase, the user is already logged in.
          // App.tsx auth listener will automatically transition them to the game.
          return; 
        } else {
          // Email confirmation is required by Supabase settings
          setSuccessMessage('Welcome! Please check your email inbox to confirm your account.');
          setIsLogin(true);
          setPassword('');
          setConfirmPassword('');
        }
      }
    } catch (err: any) {
      if (err.message.includes('Invalid login credentials')) {
         setErrorMessage('Invalid email or password');
      } else {
         setErrorMessage(err.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground 
      source={require('../../assets/cricket_hero.jpg')} 
      className="flex-1 w-full h-full"
      resizeMode="cover"
    >
      {/* Dark overlay to ensure form readability over the glowing image */}
      <View className="absolute inset-0 bg-black/60" />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-center items-center p-4">
        
        {/* Floating Form Card */}
        <View className="w-full max-w-[400px] bg-black/40 px-6 py-4 rounded-[1.5rem] border border-white/10 shadow-2xl backdrop-blur-md">
          
          {/* Header */}
          <View className="items-center mb-4">
            <Text 
              className="text-3xl font-black text-white tracking-widest uppercase"
              
            >
              {isLogin ? 'LOG IN' : 'SIGN UP'}
            </Text>
            <Text className="text-yellow-400/90 text-[9px] font-black uppercase tracking-[0.2em] mt-1">
              {isLogin ? 'Welcome back to the arena' : 'Join the ultimate clash'}
            </Text>
          </View>

          {/* Social Buttons */}
          <View className="flex-row gap-4 mb-4">
            <TouchableOpacity 
              onPress={signInWithGoogle} 
              disabled={loading}
              className="flex-1 bg-black/40 border border-white/10 py-2 rounded-xl flex-row justify-center items-center gap-3 active:scale-95 shadow-xl"
            >
              <Image source={{ uri: 'https://img.icons8.com/color/48/google-logo.png' }} className="w-4 h-4" resizeMode="contain" />
              <Text className="text-white font-bold text-[11px] tracking-wide">Google</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              disabled={loading}
              onPress={() => Alert.alert('Coming Soon', 'Facebook login will be added shortly!')}
              className="flex-1 bg-black/40 border border-white/10 py-2 rounded-xl flex-row justify-center items-center gap-3 active:scale-95 shadow-xl"
            >
              <Image source={{ uri: 'https://img.icons8.com/color/48/facebook-new.png' }} className="w-4 h-4" resizeMode="contain" />
              <Text className="text-white font-bold text-[11px] tracking-wide">Facebook</Text>
            </TouchableOpacity>
          </View>

          {/* Separator */}
          <View className="flex-row items-center mb-3">
            <View className="flex-1 h-[1px] bg-white/10" />
            <Text className="text-white/40 text-[9px] mx-3 shadow-sm">Or continue with email address</Text>
            <View className="flex-1 h-[1px] bg-white/10" />
          </View>

          {/* Success Message */}
          {successMessage ? (
            <View className="mb-2 bg-emerald-950/80 p-1.5 rounded-lg border border-emerald-500/50">
              <Text className="text-emerald-400 font-bold text-[9px] text-center uppercase tracking-widest">{successMessage}</Text>
            </View>
          ) : null}

          {/* Error Message */}
          {errorMessage ? (
            <View className="mb-2 bg-red-950/80 p-1.5 rounded-lg border border-red-500/50">
              <Text className="text-red-400 font-bold text-[9px] text-center uppercase tracking-widest">{errorMessage}</Text>
            </View>
          ) : null}

          {/* Inputs */}
          <View className="gap-3 mb-5">
            {/* Email Input */}
            <View className={`w-full flex-row items-center bg-black/40 border rounded-lg shadow-inner ${errorMessage ? 'border-red-500/80 bg-red-950/40' : (successMessage ? 'border-emerald-500/50 bg-emerald-950/20' : 'border-white/10')}`}>
              <View className="pl-3 pr-2">
                 <Text className="text-white/40 text-[10px]">✉️</Text>
              </View>
              <TextInput
                value={email}
                onChangeText={(t) => { setEmail(t); setErrorMessage(''); setSuccessMessage(''); }}
                className="flex-1 py-2.5 pr-3 text-white text-xs"
                placeholder="Email address"
                placeholderTextColor="rgba(255,255,255,0.3)"
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            {/* Password Input */}
            <View className={`w-full flex-row items-center bg-black/40 border rounded-lg shadow-inner ${errorMessage ? 'border-red-500/80 bg-red-950/40' : 'border-white/10'}`}>
              <View className="pl-3 pr-2">
                 <Text className="text-white/40 text-[10px]">🔒</Text>
              </View>
              <TextInput
                value={password}
                onChangeText={(t) => { setPassword(t); setErrorMessage(''); }}
                className="flex-1 py-2.5 text-white text-xs"
                placeholder="Password"
                placeholderTextColor="rgba(255,255,255,0.3)"
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity 
                className="px-4 py-2"
                onPress={() => {
                  Keyboard.dismiss();
                  setShowPassword(!showPassword);
                }}
              >
                <Text className="text-base opacity-80">{showPassword ? '🫣' : '🪙'}</Text>
              </TouchableOpacity>
            </View>

            {/* Confirm Password Input */}
            {!isLogin && (
              <View className={`w-full flex-row items-center bg-black/40 border rounded-lg shadow-inner ${errorMessage ? 'border-red-500/80 bg-red-950/40' : 'border-white/10'}`}>
                <View className="pl-3 pr-2">
                   <Text className="text-white/40 text-[10px]">🔒</Text>
                </View>
                <TextInput
                  value={confirmPassword}
                  onChangeText={(t) => { setConfirmPassword(t); setErrorMessage(''); }}
                  className="flex-1 py-2.5 pr-3 text-white text-xs"
                  placeholder="Confirm Password"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  secureTextEntry={!showPassword}
                />
              </View>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity 
            onPress={handleAuth} 
            disabled={loading}
            className={`w-full py-3 rounded-lg items-center justify-center active:scale-95 mb-4 shadow-xl ${loading ? 'opacity-50 bg-gray-600' : 'bg-[#4f2ce9]'}`}
          >
            <Text className="text-white font-bold text-xs tracking-wide">
              {loading ? 'Please wait...' : (isLogin ? 'Log in' : 'Sign up')}
            </Text>
          </TouchableOpacity>

          {/* Toggle Mode */}
          <View className="flex-row justify-center items-center">
            <Text className="text-white/60 text-[10px]">
              {isLogin ? "Don't have an account? " : "Already a member? "}
            </Text>
            <TouchableOpacity onPress={() => {
              setIsLogin(!isLogin);
              setErrorMessage('');
              setSuccessMessage('');
              setPassword('');
              setConfirmPassword('');
            }}>
              <Text className="text-[#6444f2] text-[10px] font-bold shadow-sm">{isLogin ? 'Sign up' : 'Log in'}</Text>
            </TouchableOpacity>
          </View>

        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

import "./global.css";
import OfflineApp from './OfflineApp';
import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, TextInput, TouchableOpacity, Alert, SafeAreaView, ScrollView } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { AuthProvider, useAuth } from './src/components/AuthProvider';
import Auth from './src/components/Auth';
import GameRoom from './src/components/GameRoom';
import Friends from './src/components/Friends';
import WorldChat from './src/components/WorldChat';
import NotificationManager from './src/components/NotificationManager';
import BackgroundMusic from './src/components/BackgroundMusic';
import Leaderboard from './src/components/Leaderboard';
import { api } from './src/lib/api';
import { supabase } from './src/lib/supabase';
import { Room } from './src/lib/types';

function Dashboard() {
  const { user, profile, signOut } = useAuth();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  
  const [code, setCode] = useState('');
  const [capacity, setCapacity] = useState<2 | 3>(2);
  const [gameMode, setGameMode] = useState<'PVP' | 'PVE'>('PVP');
  const [betAmount, setBetAmount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!roomId) return;
    const channel = supabase
      .channel(`room_${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, (payload) => {
        setRoom(payload.new as Room);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [roomId]);

  const [findingMatch, setFindingMatch] = useState(false);

  const [findingRankedMatch, setFindingRankedMatch] = useState(false);

  const startRankedMatch = async (teamCapacity: number = 2) => {
    if (!user || !profile) return;
    setFindingRankedMatch(true);
    setLoading(true);
    try {
      const result = await api.findRankedMatch(user.id, profile.username || 'Player', profile.rank_tier || 'Bronze', teamCapacity);
      setRoom(result.room);
      setRoomId(result.room.id);
      
      if (result.isNew) {
        setTimeout(async () => {
          try {
            await api.addBotToRoom(result.room.id, user.id);
          } catch(e) {}
          setFindingRankedMatch(false);
        }, 10000);
      } else {
        setFindingRankedMatch(false);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
      setFindingRankedMatch(false);
    } finally {
      setLoading(false);
    }
  };

  const findMatch = async () => {
    if (!user || !profile) return;
    setFindingMatch(true);
    setLoading(true);
    try {
      const result = await api.findMatch(user.id, profile.username);
      setRoom(result.room);
      setRoomId(result.room.id);
      
      if (result.isNew) {
        // Wait 15 seconds for someone to join, else add bot
        setTimeout(async () => {
          try {
            await api.addBotToRoom(result.room.id, user.id);
          } catch(e) {
            // Probably someone joined already and player2_id is no longer null!
          }
          setFindingMatch(false);
        }, 15000);
      } else {
        setFindingMatch(false);
      }
    } catch (err: any) {
      Alert.alert('Matchmaking Error', err.message);
      setFindingMatch(false);
    } finally {
      setLoading(false);
    }
  };

  const createRoom = async () => {
    setLoading(true);
    try {
      const result = await api.createRoom({ 
        name: profile?.username || 'Player', 
        capacity, 
        userId: user?.id, 
        betAmount, 
        isBot: gameMode === 'PVE' 
      });
      setRoom(result.room);
      setRoomId(result.room.id);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async (overrideCode?: string) => {
    const roomCode = overrideCode || code;
    if (!roomCode) return;
    setLoading(true);
    try {
      const result = await api.joinRoom({ 
        code: roomCode.toUpperCase(), 
        name: profile?.username || 'Player', 
        userId: user?.id 
      });
      setRoom(result.room);
      setRoomId(result.room.id);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const claimReward = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await api.claimDailyReward(user.id);
      Alert.alert('Success', '100 coins claimed!');
      // Refresh profile should ideally happen via real-time or context, simple reload for now:
      // Actually we should just let them re-login or trigger a refresh in context, but wait
      // Supabase realtime on profiles table handles this if we implement it, but we can just show the alert.
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  if (roomId && room && user) {
    return (
      <SafeAreaView className="flex-1 bg-indigo-950">
        <NotificationManager onJoinRoom={(c) => { setCode(c); joinRoom(c); }} />
        <View className="p-4 flex-1">
          <GameRoom room={room} playerId={user.id} onExit={() => setRoomId(null)} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-indigo-950">
      <NotificationManager onJoinRoom={(c) => { setCode(c); joinRoom(c); }} />
      <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1, justifyContent: 'center' }}>
        <View className="items-center mb-8">
          <Text className="text-4xl font-black text-white italic tracking-tighter">HEAD <Text className="text-yellow-400">TAIL</Text></Text>
          {profile && (
            <View className="items-center mt-4">
              <Text className="text-white opacity-80 text-sm">Welcome, <Text className="text-yellow-300 font-bold">{profile.username}</Text></Text>
              
              <View className="mt-1 bg-black/30 rounded-full px-3 py-1 border border-white/10">
                <Text className="text-white/60 text-xs font-mono">ID: <Text className="text-white font-bold">{String(profile?.friend_id || 0).padStart(8, '0')}</Text></Text>
              </View>

              <View className="flex-row items-center gap-2 mt-3">
                <View className="bg-black/20 rounded-full px-3 py-1">
                   <Text className="text-yellow-400 font-bold">🪙 {profile.coins}</Text>
                </View>
                <TouchableOpacity onPress={claimReward} disabled={loading} className="bg-green-500 px-3 py-1.5 rounded-full active:scale-95">
                   <Text className="text-white text-[10px] font-black tracking-widest uppercase">🎁 Claim</Text>
                </TouchableOpacity>
              </View>
              
              <View className="flex-row items-center gap-2 mt-4">
                <Leaderboard />
                <TouchableOpacity onPress={signOut} className="mt-4 bg-red-500/80 px-4 py-1.5 rounded-full active:scale-95">
                  <Text className="text-white font-bold text-xs uppercase">Sign Out</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        
          <View className="bg-gradient-to-br from-purple-600 to-indigo-600 p-6 rounded-[2rem] border border-white/20 shadow-2xl mb-6">
            <Text className="text-white font-black text-2xl mb-2">?? INVITE & EARN</Text>
            <Text className="text-white/80 text-sm mb-4 leading-tight">Share your code to get <Text className="font-bold text-yellow-400">10,000 Coins</Text> per friend! They also get 5,000 bonus Coins.</Text>
            <View className="bg-black/30 p-4 rounded-2xl flex-row justify-between items-center border border-white/10">
              <Text className="text-white font-mono text-2xl tracking-[0.2em] font-black">{String(profile?.friend_id || 0).padStart(8, '0')}</Text>
              <TouchableOpacity onPress={() => { Clipboard.setStringAsync(String(profile?.friend_id || 0).padStart(8, '0')); Alert.alert('Copied!', 'Referral code copied to clipboard!'); }} className="bg-white/20 px-4 py-2 rounded-xl">
                <Text className="text-white font-bold text-xs uppercase tracking-widest">Copy</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="bg-white/10 p-6 sm:p-8 rounded-[2rem] border border-white/20 shadow-2xl space-y-6">
          <View>
            <Text className="text-center text-[10px] text-white font-black uppercase opacity-50 tracking-widest mb-2">Game Mode</Text>
            <View className="flex-row gap-3">
              <TouchableOpacity onPress={() => setGameMode('PVP')} className={`flex-1 py-3 rounded-xl border ${gameMode === 'PVP' ? 'bg-yellow-400 border-yellow-400' : 'bg-white/10 border-white/20'}`}>
                <Text className={`text-center font-black text-xs ${gameMode === 'PVP' ? 'text-indigo-900' : 'text-white/60'}`}>MULTIPLAYER</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setGameMode('PVE')} className={`flex-1 py-3 rounded-xl border ${gameMode === 'PVE' ? 'bg-yellow-400 border-yellow-400' : 'bg-white/10 border-white/20'}`}>
                <Text className={`text-center font-black text-xs ${gameMode === 'PVE' ? 'text-indigo-900' : 'text-white/60'}`}>VS COMPUTER</Text>
              </TouchableOpacity>
            </View>
          </View>

          {gameMode === 'PVP' && (
            <View>
              <Text className="text-center text-[10px] text-white font-black uppercase opacity-50 tracking-widest mb-2 mt-4">Room Size</Text>
              <View className="flex-row gap-3">
                <TouchableOpacity onPress={() => setCapacity(2)} className={`flex-1 py-3 rounded-xl border ${capacity === 2 ? 'bg-yellow-400 border-yellow-400' : 'bg-white/10 border-white/20'}`}>
                  <Text className={`text-center font-black text-xs ${capacity === 2 ? 'text-indigo-900' : 'text-white/60'}`}>2 PLAYERS</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setCapacity(3)} className={`flex-1 py-3 rounded-xl border ${capacity === 3 ? 'bg-yellow-400 border-yellow-400' : 'bg-white/10 border-white/20'}`}>
                  <Text className={`text-center font-black text-xs ${capacity === 3 ? 'text-indigo-900' : 'text-white/60'}`}>3 PLAYERS</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View>
            <Text className="text-center text-[10px] text-white font-black uppercase opacity-50 tracking-widest mb-2 mt-4">Wager / Bet Amount</Text>
            <View className="flex-row flex-wrap justify-between gap-2">
              {[0, 10, 50, 100].map(amount => (
                <TouchableOpacity key={amount} onPress={() => setBetAmount(amount)} className={`flex-1 py-2 rounded-xl border ${betAmount === amount ? 'bg-yellow-400 border-yellow-400' : 'bg-white/10 border-white/20'}`}>
                  <Text className={`text-center font-black text-xs ${betAmount === amount ? 'text-indigo-900' : 'text-white/60'}`}>
                    {amount === 0 ? 'FREE' : `💰${amount}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity onPress={createRoom} disabled={loading || findingMatch} className="w-full bg-yellow-400 py-4 rounded-2xl shadow-xl mt-6 active:scale-95 disabled:opacity-50">
            <Text className="text-indigo-900 font-black text-center text-lg uppercase tracking-wider">{loading ? 'Creating...' : 'Create New Room'}</Text>
          </TouchableOpacity>

          {gameMode === 'PVP' && capacity === 2 && (
            <>
              <TouchableOpacity onPress={() => startRankedMatch(2)} disabled={loading || findingRankedMatch || findingMatch} className="w-full bg-blue-600 py-4 rounded-2xl shadow-xl mt-3 active:scale-95 disabled:opacity-50 border-b-4 border-blue-800">
                <Text className="text-white font-black text-center text-lg uppercase tracking-wider">{findingRankedMatch ? 'Searching...' : 'Play Ranked (Solo)'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => startRankedMatch(4)} disabled={loading || findingRankedMatch || findingMatch} className="w-full bg-blue-500 py-4 rounded-2xl shadow-xl mt-3 active:scale-95 disabled:opacity-50 border-b-4 border-blue-700">
                <Text className="text-white font-black text-center text-lg uppercase tracking-wider">{findingRankedMatch ? 'Searching...' : 'Play Ranked (Duo)'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => startRankedMatch(8)} disabled={loading || findingRankedMatch || findingMatch} className="w-full bg-blue-400 py-4 rounded-2xl shadow-xl mt-3 active:scale-95 disabled:opacity-50 border-b-4 border-blue-600">
                <Text className="text-white font-black text-center text-lg uppercase tracking-wider">{findingRankedMatch ? 'Searching...' : 'Play Ranked (Squad)'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={findMatch} disabled={loading || findingMatch || findingRankedMatch} className="w-full bg-green-500 py-4 rounded-2xl shadow-xl mt-3 active:scale-95 disabled:opacity-50 border-b-4 border-green-700">
                <Text className="text-white font-black text-center text-lg uppercase tracking-wider">{findingMatch ? 'Searching...' : 'Find Casual Match'}</Text>
              </TouchableOpacity>
            </>
          )}

          {gameMode === 'PVP' && (
            <>
              <Text className="text-center text-white/50 font-black text-xs uppercase tracking-widest my-4">OR</Text>
              
              <View className="gap-4">
                <TextInput
                  value={code}
                  onChangeText={setCode}
                  placeholder="ENTER ROOM CODE"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  className="w-full bg-white/20 border border-white/30 rounded-2xl py-4 px-6 text-center text-xl font-mono text-white focus:border-yellow-400 uppercase"
                  maxLength={6}
                  keyboardType="numeric"
                />
                <TouchableOpacity onPress={() => joinRoom()} disabled={loading || !code} className="w-full bg-white py-4 rounded-2xl shadow-xl active:scale-95 disabled:opacity-50">
                  <Text className="text-indigo-600 font-black text-center text-lg uppercase tracking-wider">{loading ? 'Joining...' : 'Join Room'}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        <Friends />
        <WorldChat />
        <View className="items-center mt-6">
          <Text className="text-white/30 text-xs font-mono">Made with ♡ for school friends</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Main() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <View className="flex-1 bg-indigo-950 items-center justify-center">
        <Text className="text-yellow-400 font-black text-2xl animate-pulse">Loading...</Text>
      </View>
    );
  }

  return user ? <Dashboard /> : (
    <SafeAreaView className="flex-1 bg-indigo-950 justify-center p-6">
       <Auth />
    </SafeAreaView>
  );
}

export default function App() {
  const [isOffline, setIsOffline] = useState(false);
  const [networkChecked, setNetworkChecked] = useState(false);

  const checkNetwork = async () => {
    try {
      const response = await fetch('https://google.com', { method: 'HEAD', cache: 'no-cache' });
      setIsOffline(!response.ok);
    } catch(e) {
      setIsOffline(true);
    }
    setNetworkChecked(true);
  };

  useEffect(() => {
    checkNetwork();
  }, []);

  if (!networkChecked) {
    return (
      <View className="flex-1 bg-indigo-950 items-center justify-center">
        <Text className="text-yellow-400 font-black text-2xl animate-pulse">Checking connection...</Text>
      </View>
    );
  }

  if (isOffline) {
    return <OfflineApp onRetry={checkNetwork} />;
  }

  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Main />
      <BackgroundMusic />
    </AuthProvider>
  );
}


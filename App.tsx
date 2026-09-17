import "./global.css";
import OfflineApp from './OfflineApp';
import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, TextInput, TouchableOpacity, Alert, SafeAreaView, ScrollView, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { NavigationBar } from 'expo-navigation-bar';
import { AuthProvider, useAuth } from './src/components/AuthProvider';
import Auth from './src/components/Auth';
import GameRoom from './src/components/GameRoom';
import Friends from './src/components/Friends';
import WorldChat from './src/components/WorldChat';
import NotificationManager from './src/components/NotificationManager';
import BackgroundMusic from './src/components/BackgroundMusic';
import Leaderboard from './src/components/Leaderboard';
import OnboardingModal from './src/components/OnboardingModal';
import DailyRewardModal from './src/components/DailyRewardModal';
import InviteEarnModal from './src/components/InviteEarnModal';
import CoinShop from './src/components/CoinShop';
import { api } from './src/lib/api';
import { supabase } from './src/lib/supabase';
import { Room } from './src/lib/types';

function Dashboard() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  useEffect(() => {
    if (user && user.user_metadata && !user.user_metadata.onboarded) {
      setShowOnboarding(true);
    }
  }, [user]);

  const [code, setCode] = useState('');
  const [gameMode, setGameMode] = useState<'PVP' | 'PVE'>('PVP');
  const [isNewRoom, setIsNewRoom] = useState(false);
  const [isCasualMode, setIsCasualMode] = useState(false);
  const [showCoinShop, setShowCoinShop] = useState(false);
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
      setIsCasualMode(false);
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
      setIsCasualMode(true);
      setRoom(result.room);
      setRoomId(result.room.id);
      
      if (result.isNew) {
        // Wait 60 seconds for someone to join, else add bot
        setTimeout(async () => {
          try {
            const englishNames = ['John', 'Michael', 'David', 'James', 'William', 'Robert', 'Joseph', 'Charles', 'Thomas', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven', 'Paul', 'Andrew', 'Joshua', 'Kenneth', 'Kevin', 'Brian', 'George', 'Edward', 'Ronald', 'Timothy', 'Jason', 'Jeffrey', 'Ryan', 'Jacob', 'Gary', 'Nicholas', 'Eric', 'Jonathan', 'Stephen', 'Larry', 'Justin', 'Scott', 'Brandon', 'Benjamin', 'Samuel'];
            const randomName = englishNames[Math.floor(Math.random() * englishNames.length)];
            await api.addBotToRoom(result.room.id, user.id, randomName);
          } catch(e) {
            // Probably someone joined already and player2_id is no longer null!
          }
          setFindingMatch(false);
        }, 60000);
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
        capacity: 2, 
        userId: user?.id, 
        betAmount: 0, 
        isBot: gameMode === 'PVE' 
      });
      setIsCasualMode(false);
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
      setIsCasualMode(false);
      setRoom(result.room);
      setRoomId(result.room.id);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const [showDailyReward, setShowDailyReward] = useState(false);
  const [showInviteEarn, setShowInviteEarn] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  if (roomId && room && user) {
    return (
      <SafeAreaView className="flex-1 bg-indigo-950">
        <OnboardingModal visible={showOnboarding} onComplete={() => setShowOnboarding(false)} />
        <NotificationManager onJoinRoom={(c) => { setCode(c); joinRoom(c); }} />
          <View className="p-4 flex-1">
          <GameRoom room={room} playerId={user.id} onExit={() => { setRoomId(null); refreshProfile(); }} initialEditMode={isNewRoom} isCasualMatch={isCasualMode} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-indigo-950">
      <OnboardingModal visible={showOnboarding} onComplete={() => setShowOnboarding(false)} />
      <CoinShop visible={showCoinShop} onClose={() => setShowCoinShop(false)} />
      <Leaderboard visible={showLeaderboard} onClose={() => setShowLeaderboard(false)} />
      <NotificationManager onJoinRoom={(c) => { setCode(c); joinRoom(c); }} />
      
      {/* Absolute HUD Layer */}
      {profile && (
        <View className="absolute top-2 left-4 right-4 z-50 flex-row justify-between items-start" pointerEvents="box-none">
          {/* Left Column: Profile, Currencies, and Menu */}
          <View className="flex-col gap-3 items-start pointer-events-auto">
            
            {/* Profile & Currencies Row */}
            <View className="flex-row gap-4 items-start">
              {/* Profile Card */}
              <View className="flex-col">
                <View className="flex-row items-center bg-black/40 rounded-full pr-4 p-1 border border-white/10">
                  <View className="w-10 h-10 bg-indigo-500 rounded-full items-center justify-center border-2 border-indigo-300">
                    <Text className="text-xl">👤</Text>
                  </View>
                  <View className="ml-3">
                    <Text className="text-white font-bold">{profile.username}</Text>
                    <Text className="text-white/50 text-[10px] font-mono">ID: {String(profile?.friend_id || 0).padStart(7, '0')}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={signOut} className="mt-2 ml-2 self-start bg-red-500/80 px-3 py-1 rounded-full active:scale-95">
                  <Text className="text-white font-bold text-[10px] uppercase">Sign Out</Text>
                </TouchableOpacity>
              </View>

              {/* Currencies */}
              <View className="flex-row items-center gap-2 mt-2">
                <View className="bg-black/40 rounded-full px-3 py-1.5 flex-row items-center border border-white/10">
                  <Text className="text-yellow-400 font-bold text-xs">🪙 {profile.coins || 0}</Text>
                </View>
                <View className="bg-black/40 rounded-full px-3 py-1.5 flex-row items-center border border-white/10">
                  <Text className="text-cyan-400 font-bold text-xs">💎 {profile.premium_currency || 0}</Text>
                </View>
                <View className="bg-black/40 rounded-full px-3 py-1.5 flex-row items-center border border-white/10">
                  <Text className="text-purple-400 font-bold text-xs">🎟️ {profile.private_room_tokens || 0}</Text>
                </View>
              </View>
            </View>

            {/* Vertical Menu */}
            <View className="flex-col gap-2 mt-3 ml-2">
              <TouchableOpacity onPress={() => setShowCoinShop(true)} className="flex-row items-center gap-2 active:opacity-50">
                <View className="bg-blue-500 w-8 h-8 rounded-full items-center justify-center shadow-md border border-blue-400">
                  <Text className="text-sm drop-shadow-md">🛒</Text>
                </View>
                <Text className="text-blue-300 font-black uppercase tracking-widest text-[10px]">Store</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => setShowDailyReward(true)} className="flex-row items-center gap-2 active:opacity-50">
                <View className="bg-green-500 w-8 h-8 rounded-full items-center justify-center shadow-md border border-green-400">
                  <Text className="text-sm drop-shadow-md">🎁</Text>
                </View>
                <Text className="text-green-300 font-black uppercase tracking-widest text-[10px]">Daily Rewards</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => setShowInviteEarn(true)} className="flex-row items-center gap-2 active:opacity-50">
                <View className="bg-purple-500 w-8 h-8 rounded-full items-center justify-center shadow-md border border-purple-400">
                  <Text className="text-sm drop-shadow-md">💌</Text>
                </View>
                <Text className="text-purple-300 font-black uppercase tracking-widest text-[10px]">Invite and Earn</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setShowLeaderboard(true)} className="flex-row items-center gap-2 active:opacity-50">
                <View className="bg-yellow-400 w-8 h-8 rounded-full items-center justify-center shadow-md border border-yellow-300">
                  <Text className="text-sm drop-shadow-md">🏆</Text>
                </View>
                <Text className="text-yellow-400 font-black uppercase tracking-widest text-[10px]">Leaderboard</Text>
              </TouchableOpacity>
            </View>
            
          </View>
        </View>
      )}

      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 100, flexGrow: 1, justifyContent: 'center' }}>
        <View className="items-center mb-8">
          <Text className="text-4xl font-black text-white italic tracking-tighter">HEAD <Text className="text-yellow-400">TAIL</Text></Text>
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

          <TouchableOpacity onPress={createRoom} disabled={loading || findingMatch} className="w-full bg-yellow-400 py-4 rounded-2xl shadow-xl mt-6 active:scale-95 disabled:opacity-50">
            <Text className="text-indigo-900 font-black text-center text-lg uppercase tracking-wider">{loading ? 'Creating...' : (gameMode === 'PVP' ? 'Create Private Room (1 🎟️)' : 'Start Match')}</Text>
          </TouchableOpacity>

          {gameMode === 'PVP' && (
            <>
              
              
              
              <TouchableOpacity onPress={findMatch} disabled={loading || findingMatch } className="w-full bg-green-500 py-4 rounded-2xl shadow-xl mt-3 active:scale-95 disabled:opacity-50 border-b-4 border-green-700">
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
      <CoinShop visible={showCoinShop} onClose={() => setShowCoinShop(false)} />
      <DailyRewardModal visible={showDailyReward} onClose={() => setShowDailyReward(false)} />
      <InviteEarnModal visible={showInviteEarn} onClose={() => setShowInviteEarn(false)} />
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
      <StatusBar hidden={true} />
      <NavigationBar hidden={true} />
      <Main />
      <BackgroundMusic />
    </AuthProvider>
  );
}


import "./global.css";
import OfflineApp from './OfflineApp';
import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, TextInput, TouchableOpacity, Alert, SafeAreaView, ScrollView, Platform, Modal, Animated } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { NavigationBar } from 'expo-navigation-bar';
import { AuthProvider, useAuth } from './src/components/AuthProvider';
import Auth from './src/components/Auth';
import GameRoom from './src/components/GameRoom';
import Friends from './src/components/Friends';
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

function DashboardFriends({ userId, onOpenSettings, onOpenFriends }: { userId: string, onOpenSettings: () => void, onOpenFriends: () => void }) {
  const [friends, setFriends] = React.useState<any[]>([]);

  React.useEffect(() => {
    fetchFriends();
    const channel = supabase
      .channel('dash_friends')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, fetchFriends)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchFriends)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const fetchFriends = async () => {
    const { data } = await supabase
      .from('friendships')
      .select(`
        sender_id,
        receiver_id,
        sender:profiles!friendships_sender_id_fkey(id, username, is_online),
        receiver:profiles!friendships_receiver_id_fkey(id, username, is_online)
      `)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .eq('status', 'accepted');
    if (data) {
      setFriends(data.map((f: any) => f.sender_id === userId ? f.receiver : f.sender));
    }
  };

  return (
    <View className="flex-col items-end gap-3 pr-2 mt-1 pointer-events-auto h-80">
      <View className="flex-row items-center gap-3">
        <TouchableOpacity onPress={onOpenFriends} className="flex-row items-center gap-2 bg-indigo-600/80 px-4 py-2 rounded-full border border-indigo-400 active:scale-95 shadow-lg">
          <Text className="text-white font-black text-xs uppercase tracking-wider">Friends</Text>
          <Text className="text-base">👥</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onOpenSettings} className="bg-gray-600/80 w-9 h-9 rounded-full items-center justify-center border border-gray-400 active:scale-95 shadow-lg">
          <Text className="text-base">⚙️</Text>
        </TouchableOpacity>
      </View>
      
      <View className="bg-indigo-900/40 border border-indigo-400/20 rounded-3xl p-5 w-44 flex-1 shadow-2xl">
        <View className="flex-row justify-between items-center mb-4 border-b border-indigo-400/20 pb-3">
          <Text className="text-indigo-200 text-xs font-black uppercase tracking-widest">Friends</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {friends.length === 0 ? (
            <Text className="text-white/30 text-sm italic text-center mt-6">No friends yet</Text>
          ) : (
            friends.map((f, i) => (
              <View key={i} className="flex-row items-center gap-3 py-2.5">
                {/* Avatar */}
                <View className="w-10 h-10 bg-indigo-500 rounded-full items-center justify-center border-2 border-indigo-300 shadow-inner">
                  <Text className="text-xl">👤</Text>
                  {/* Status Indicator */}
                  <View className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#1e1b4b] ${f.is_online ? 'bg-green-400 shadow-[0_0_5px_rgba(74,222,128,1)]' : 'bg-gray-500'}`} />
                </View>
                
                {/* Name & Status */}
                <View className="flex-1 justify-center">
                  <Text className="text-white font-bold text-sm truncate" numberOfLines={1}>{f.username}</Text>
                  <Text className={`text-[9px] font-black tracking-widest uppercase mt-0.5 ${f.is_online ? 'text-green-400' : 'text-white/30'}`}>
                    {f.is_online ? 'Online' : 'Offline'}
                  </Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );
}

function Dashboard({ soundEnabled, setSoundEnabled }: { soundEnabled: boolean, setSoundEnabled: (val: boolean) => void }) {
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
      .channel(`public:rooms:${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, (payload) => {
        const updatedRoom = payload.new as Room;
        setRoom(updatedRoom);
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

  const findCasualMatch = async () => {
    setLoading(true);
    try {
      const result = await api.findMatch(user!.id, profile?.username || 'Player');
      setIsCasualMode(true);
      setShowGameModes(false);
      setRoom(result.room);
      setRoomId(result.room.id);
    } catch (err: any) {
      setNotification({ title: 'Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const startMatch = async (isBot: boolean) => {
    setLoading(true);
    try {
      const result = await api.createRoom({ 
        name: profile?.username || 'Player', 
        capacity: 2, 
        userId: user?.id, 
        betAmount: 0, 
        isBot
      });
      setIsCasualMode(false);
      setShowGameModes(false);
      setRoom(result.room);
      setRoomId(result.room.id);
    } catch (err: any) {
      setNotification({ title: 'Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const joinPrivateRoom = async () => {
    if (!code) return;
    setLoading(true);
    try {
      const result = await api.joinRoom({ 
        code: code.toUpperCase(), 
        name: profile?.username || 'Player', 
        userId: user?.id 
      });
      setIsCasualMode(false);
      setShowGameModes(false);
      setRoom(result.room);
      setRoomId(result.room.id);
    } catch (err: any) {
      setNotification({ title: 'Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const [showDailyReward, setShowDailyReward] = useState(false);
  const [showInviteEarn, setShowInviteEarn] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showGameModes, setShowGameModes] = useState(false);
  const [notification, setNotification] = useState<{title: string, message: string} | null>(null);

  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true })
      ])
    ).start();
  }, [pulseAnim]);

  if (roomId && room && user) {
    return (
      <SafeAreaView className="flex-1 bg-indigo-950">
        <OnboardingModal visible={showOnboarding} onComplete={() => setShowOnboarding(false)} />
        <NotificationManager onJoinRoom={(c) => { setCode(c); joinPrivateRoom(); }} />
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
      <Friends visible={showFriends} onClose={() => setShowFriends(false)} />
      <DailyRewardModal visible={showDailyReward} onClose={() => setShowDailyReward(false)} />
      <InviteEarnModal visible={showInviteEarn} onClose={() => setShowInviteEarn(false)} />
      <NotificationManager onJoinRoom={(c) => { setCode(c); joinPrivateRoom(); }} />
      
      {/* Settings Modal */}
      <Modal visible={showSettings} animationType="fade" transparent onRequestClose={() => setShowSettings(false)}>
        <View className="flex-1 bg-black/80 justify-center items-center p-2">
          <View className="bg-indigo-950 rounded-3xl p-6 border border-white/20 w-64 shadow-2xl items-center">
            <Text className="text-white font-black text-xl tracking-widest uppercase mb-6">Settings</Text>
            <View className="flex-row gap-4 mb-6 w-full h-12">
              <TouchableOpacity onPress={() => setSoundEnabled(!soundEnabled)} className="w-12 h-12 rounded-full items-center justify-center bg-purple-600 border-2 border-purple-400 shadow-lg active:scale-95">
                <Text className="text-xl">{soundEnabled ? '🎵' : '🔇'}</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={async () => {
                  setLoading(true);
                  await signOut();
                }} 
                disabled={loading}
                className={`flex-1 bg-red-500/80 rounded-full items-center justify-center border-2 border-red-400 ${loading ? 'opacity-50' : 'active:scale-95'}`}
              >
                <Text className="text-white font-black uppercase tracking-wider">{loading ? 'Signing Out...' : 'Sign Out'}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => setShowSettings(false)} className="bg-white/20 px-6 py-2 rounded-full active:scale-95">
              <Text className="text-white font-bold">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Global Notification Modal */}
      <Modal visible={!!notification} animationType="fade" transparent onRequestClose={() => setNotification(null)}>
        <View className="flex-1 bg-black/80 justify-center items-center p-2">
          <View className="bg-indigo-900 border border-white/20 p-6 rounded-3xl w-[80%] max-w-sm items-center shadow-2xl">
            <Text className="text-4xl mb-4">⚠️</Text>
            <Text className="text-white font-black text-xl mb-2 text-center">{notification?.title}</Text>
            <Text className="text-white/80 font-bold text-center mb-6">{notification?.message}</Text>
            <TouchableOpacity 
              onPress={() => setNotification(null)}
              className="bg-red-500 px-8 py-3 rounded-xl shadow-lg active:scale-95"
            >
              <Text className="text-white font-black uppercase tracking-wider">OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
            <View className="flex-col gap-6 mt-8 ml-2">
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

          {/* Top Right: Live Friends Widget */}
          <DashboardFriends 
            userId={user.id} 
            onOpenFriends={() => setShowFriends(true)} 
            onOpenSettings={() => setShowSettings(true)} 
          />
        </View>
      )}

      <View className="flex-1 justify-center pt-4">
        <View className="items-center mb-4">
          <Text className="text-4xl font-black text-white italic tracking-tighter shadow-xl">HEAD <Text className="text-yellow-400">TAIL</Text></Text>
        </View>

        <View className="items-center mt-2">
          <TouchableOpacity onPress={() => setShowGameModes(true)} className="items-center active:scale-95">
            {/* Ambient Outer Aura */}
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }} className="w-48 h-48 rounded-full bg-yellow-500/10 items-center justify-center border border-yellow-400/20">
              {/* Inner Glowing Aura */}
              <View className="w-40 h-40 rounded-full bg-yellow-500/20 items-center justify-center border border-yellow-400/30">
                {/* The 3D Golden Coin */}
                <View className="w-32 h-32 rounded-full bg-yellow-400 items-center justify-center border-b-8 border-yellow-600 shadow-2xl relative overflow-hidden border-t-2 border-l-2 border-r-2 border-yellow-200">
                  {/* Glossy Top Shine */}
                  <View className="absolute top-0 left-0 right-0 h-1/2 bg-white/30 rounded-t-full" />
                  
                  {/* Coin Face Design */}
                  <View className="items-center justify-center border-2 border-yellow-500/30 rounded-full w-24 h-24 flex-row">
                    <Text className="text-5xl font-black text-yellow-700 italic tracking-tighter shadow-sm">H</Text>
                    <Text className="text-5xl font-black text-yellow-100 italic tracking-tighter shadow-sm">T</Text>
                  </View>
                </View>
              </View>
            </Animated.View>
            
            {/* Cinematic Tap to Play */}
            <View className="mt-10 items-center justify-center animate-pulse">
              <View className="flex-row items-center gap-4">
                <View className="h-[2px] w-8 bg-yellow-400/30 rounded-full" />
                <Text className="text-yellow-400 font-black text-lg tracking-[0.3em] uppercase" style={{ textShadowColor: 'rgba(250,204,21,0.6)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 12 }}>
                  Tap to Play
                </Text>
                <View className="h-[2px] w-8 bg-yellow-400/30 rounded-full" />
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Game Modes Modal */}
      <Modal visible={showGameModes} animationType="fade" transparent onRequestClose={() => setShowGameModes(false)}>
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className="w-full max-w-5xl">
            <View className="flex-row justify-between items-center mb-8 px-4">
              <Text className="text-3xl font-black text-white uppercase tracking-widest">Game Modes</Text>
              <TouchableOpacity onPress={() => setShowGameModes(false)} className="w-10 h-10 bg-white/10 rounded-full items-center justify-center active:scale-95">
                <Text className="text-white font-bold text-lg">✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }} className="w-full">
              
              {/* Card 1: Random Match */}
              <TouchableOpacity onPress={findCasualMatch} disabled={loading} className="w-56 h-72 bg-green-500 rounded-[2rem] p-6 shadow-2xl justify-between border-b-8 border-green-700 active:scale-95">
                <View>
                  <Text className="text-4xl mb-4">🌍</Text>
                  <Text className="text-xl font-black text-white tracking-widest uppercase">Random Match</Text>
                  <Text className="text-green-100 font-bold mt-2 text-sm leading-tight">Play instantly against someone online.</Text>
                </View>
                <View className="bg-black/20 rounded-xl py-3 items-center">
                  <Text className="text-white font-black uppercase tracking-wider text-sm">{loading ? 'Searching...' : 'Play Now'}</Text>
                </View>
              </TouchableOpacity>

              {/* Card 2: VS Computer */}
              <TouchableOpacity onPress={() => startMatch(true)} disabled={loading} className="w-56 h-72 bg-blue-500 rounded-[2rem] p-6 shadow-2xl justify-between border-b-8 border-blue-700 active:scale-95">
                <View>
                  <Text className="text-4xl mb-4">🤖</Text>
                  <Text className="text-xl font-black text-white tracking-widest uppercase">VS Computer</Text>
                  <Text className="text-blue-100 font-bold mt-2 text-sm leading-tight">Practice offline against the AI.</Text>
                </View>
                <View className="bg-black/20 rounded-xl py-3 items-center">
                  <Text className="text-white font-black uppercase tracking-wider text-sm">{loading ? 'Creating...' : 'Play Bot'}</Text>
                </View>
              </TouchableOpacity>

              {/* Card 3: Create Private Room */}
              <TouchableOpacity onPress={() => startMatch(false)} disabled={loading} className="w-56 h-72 bg-yellow-400 rounded-[2rem] p-6 shadow-2xl justify-between border-b-8 border-yellow-600 active:scale-95">
                <View>
                  <Text className="text-4xl mb-4">🎟️</Text>
                  <Text className="text-xl font-black text-indigo-900 tracking-widest uppercase">Private Room</Text>
                  <Text className="text-indigo-900/70 font-bold mt-2 text-sm leading-tight">Host a match for a friend.</Text>
                </View>
                <View className="bg-black/10 rounded-xl py-3 items-center">
                  <Text className="text-indigo-900 font-black uppercase tracking-wider text-sm">{loading ? 'Creating...' : 'Host Room'}</Text>
                </View>
              </TouchableOpacity>

              {/* Card 4: Join Private Room */}
              <View className="w-56 h-72 bg-purple-500 rounded-[2rem] p-6 shadow-2xl justify-between border-b-8 border-purple-700">
                <View>
                  <Text className="text-4xl mb-4">🔑</Text>
                  <Text className="text-xl font-black text-white tracking-widest uppercase">Private Room</Text>
                  <Text className="text-purple-100 font-bold mt-2 text-sm leading-tight">Enter a room code to play.</Text>
                </View>
                <View className="gap-2">
                  <TextInput
                    value={code}
                    onChangeText={setCode}
                    placeholder="000000"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    className="w-full bg-black/20 rounded-xl py-3 px-2 text-center text-xl font-black font-mono text-white tracking-[0.2em]"
                    maxLength={6}
                    keyboardType="numeric"
                  />
                  <TouchableOpacity onPress={joinPrivateRoom} disabled={loading || !code} className="bg-white rounded-xl py-3 items-center active:scale-95 disabled:opacity-50">
                    <Text className="text-purple-700 font-black uppercase tracking-wider text-sm">{loading ? 'Joining...' : 'Join'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Main({ soundEnabled, setSoundEnabled }: { soundEnabled: boolean, setSoundEnabled: (val: boolean) => void }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <View className="flex-1 bg-indigo-950 items-center justify-center">
        <Text className="text-yellow-400 font-black text-2xl animate-pulse">Loading...</Text>
      </View>
    );
  }

  return user ? <Dashboard soundEnabled={soundEnabled} setSoundEnabled={setSoundEnabled} /> : (
    <SafeAreaView className="flex-1 bg-indigo-950 justify-center p-6">
       <Auth />
    </SafeAreaView>
  );
}

export default function App() {
  const [isOffline, setIsOffline] = useState(false);
  const [networkChecked, setNetworkChecked] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

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
      <Main soundEnabled={soundEnabled} setSoundEnabled={setSoundEnabled} />
      <BackgroundMusic enabled={soundEnabled} />
    </AuthProvider>
  );
}

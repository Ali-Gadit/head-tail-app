import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../lib/api';
import { useAuth } from './AuthProvider';

export default function DailyRewardModal({ visible, onClose }: { visible: boolean, onClose: () => void }) {
  const { user, profile, refreshProfile } = useAuth();
  const [currentDay, setCurrentDay] = useState(1);
  const [loading, setLoading] = useState(false);
  const [canClaim, setCanClaim] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');

  const [timeLeftStr, setTimeLeftStr] = useState('');

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (visible && user) {
      checkStatus().then((nextUnlockTime) => {
        if (nextUnlockTime) {
          interval = setInterval(() => {
            const now = new Date().getTime();
            const diff = nextUnlockTime - now;
            
            if (diff <= 0) {
              clearInterval(interval);
              setTimeLeftStr('');
              setCanClaim(true);
            } else {
              const h = Math.floor(diff / (1000 * 60 * 60));
              const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
              const s = Math.floor((diff % (1000 * 60)) / 1000);
              setTimeLeftStr(`${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`);
            }
          }, 1000);
        }
      });
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [visible, user, profile]);

  const checkStatus = async () => {
    if (!user || !profile) return null;
    
    try {
      const streakStr = await AsyncStorage.getItem(`login_streak_${user.id}`);
      let streak = streakStr ? parseInt(streakStr, 10) : 1;
      
      let canClaimToday = true;
      let nextUnlockTime: number | null = null;

      if (profile.last_daily_reward) {
        const lastClaim = new Date(profile.last_daily_reward);
        const now = new Date();
        
        const lastClaimMidnight = new Date(lastClaim.getFullYear(), lastClaim.getMonth(), lastClaim.getDate());
        const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        const daysDiff = Math.floor((todayMidnight.getTime() - lastClaimMidnight.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff === 0) {
          // Claimed today! Must wait until tomorrow 00:00:00
          canClaimToday = false;
          nextUnlockTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
        } else if (daysDiff >= 2) {
          // Missed a day! Reset streak to 1
          streak = 1;
          await AsyncStorage.setItem(`login_streak_${user.id}`, '1');
        }
      }

      if (streak > 7) {
        streak = 1;
        await AsyncStorage.setItem(`login_streak_${user.id}`, '1');
      }

      setCurrentDay(streak);
      setCanClaim(canClaimToday);
      
      return nextUnlockTime;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const days = [1, 2, 3, 4, 5, 6, 7];
  const REWARDS = [100, 300, 500, 1000, 2000, 5000, 10000];

  const handleClaim = async (day: number) => {
    if (day !== currentDay) return;
    if (!canClaim) {
      Alert.alert('Not Yet', timeLeftStr ? `Come back in ${timeLeftStr}` : 'Come again tomorrow for next reward unlock');
      return;
    }
    if (!user) return;

    setLoading(true);
    try {
      const amount = REWARDS[day - 1];
      await api.claimDailyReward(user.id, amount);
      
      // Update streak
      const nextDay = currentDay + 1;
      await AsyncStorage.setItem(`login_streak_${user.id}`, nextDay.toString());
      
      setCanClaim(false);
      setCurrentDay(nextDay > 7 ? 7 : nextDay); // keep it at 7 for display after claiming day 7
      setTimeRemaining('Come again tomorrow for next reward unlock (24h remaining)');
      
      Alert.alert('Success', `${amount} Daily reward claimed!`);
      await refreshProfile();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <View className="flex-1 bg-black/80 justify-center items-center p-2">
        <View className="bg-indigo-900 w-full max-w-2xl rounded-3xl border border-indigo-400/30 shadow-2xl p-4">
          
          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-row">
              <Text className="text-xl font-black text-white italic tracking-tighter">DAILY </Text>
              <Text className="text-xl font-black text-yellow-400 italic tracking-tighter">REWARDS</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="bg-white/10 w-8 h-8 rounded-full items-center justify-center active:scale-95">
              <Text className="text-white font-black text-lg leading-none mt-[-2px]">✕</Text>
            </TouchableOpacity>
          </View>

          <Text className="text-white/80 text-center mb-4 text-xs font-bold">
            Login for 7 consecutive days to claim awesome rewards!
          </Text>

          <View className="flex-row justify-between gap-1 mb-4">
            {days.map((day) => {
              const isPast = day < currentDay || (!canClaim && day === currentDay);
              const isCurrent = day === currentDay && canClaim;
              const isFuture = day > currentDay;
              const amount = REWARDS[day - 1];

              return (
                <TouchableOpacity
                  key={day}
                  onPress={() => handleClaim(day)}
                  disabled={!isCurrent || loading}
                  className={`flex-1 py-3 px-1 rounded-xl items-center justify-center border-2 overflow-hidden
                    ${isPast ? 'bg-gray-800 border-gray-600 opacity-50' 
                    : isCurrent ? 'bg-yellow-400 border-white shadow-xl animate-pulse scale-105 z-10' 
                    : 'bg-white/10 border-white/10 opacity-70'}`}
                >
                  <Text className={`font-black text-[10px] mb-1 ${isCurrent ? 'text-indigo-900' : 'text-white/60'}`}>
                    DAY {day}
                  </Text>
                  <Text className={isCurrent ? 'text-xl' : 'text-lg grayscale'}>
                    🎁
                  </Text>
                  <Text className={`font-bold mt-1 text-[9px] ${isCurrent ? 'text-indigo-900' : 'text-yellow-400'}`}>
                    {amount >= 1000 ? `${amount/1000}k` : amount} 🪙
                  </Text>
                  
                  {isPast && (
                    <View className="absolute inset-0 bg-black/40 rounded-xl items-center justify-center">
                      <Text className="text-green-400 font-black text-lg">✓</Text>
                    </View>
                  )}
                  {isFuture && (
                    <View className="absolute inset-0 bg-black/60 rounded-xl items-center justify-center">
                      <Text className="text-lg">🔒</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {!canClaim && timeLeftStr ? (
            <View className="bg-black/30 py-3 px-4 rounded-xl items-center border border-white/5">
              <Text className="text-white/60 font-bold text-center text-xs">
                Next reward unlocks in: <Text className="text-yellow-400 font-mono">{timeLeftStr}</Text>
              </Text>
            </View>
          ) : !canClaim && !timeLeftStr ? (
            <View className="bg-black/30 py-3 px-4 rounded-xl items-center border border-white/5">
              <Text className="text-white/60 font-bold text-center text-xs">
                Come again tomorrow for next reward unlock
              </Text>
            </View>
          ) : null}

          {loading && (
            <View className="absolute inset-0 bg-indigo-900/50 justify-center items-center rounded-3xl">
              <ActivityIndicator size="large" color="#facc15" />
            </View>
          )}

        </View>
      </View>
    </Modal>
  );
}

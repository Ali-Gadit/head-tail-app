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
  const [notification, setNotification] = useState<{title: string, message: string} | null>(null);

  const [timeLeftStr, setTimeLeftStr] = useState('');

  useEffect(() => {
    console.log("DailyRewardModal: useEffect triggered. visible=", visible);
    let interval: ReturnType<typeof setInterval>;

    if (visible && user) {
      console.log("DailyRewardModal: calling checkStatus");
      checkStatus().then((nextUnlockTime) => {
        console.log("DailyRewardModal: checkStatus resolved with", nextUnlockTime);
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
      }).catch(err => {
        console.log("DailyRewardModal: checkStatus ERROR:", err);
      });
    }

    return () => {
      console.log("DailyRewardModal: cleaning up interval");
      if (interval) clearInterval(interval);
    };
  }, [visible, user, profile]);

  const checkStatus = async () => {
    console.log("DailyRewardModal: inside checkStatus");
    if (!user || !profile) return null;
    
    try {
      const streakStr = await AsyncStorage.getItem(`login_streak_${user.id}`);
      let streak = streakStr ? parseInt(streakStr, 10) : 1;
      
      let canClaimToday = true;
      let nextUnlockTime: number | null = null;

      if (profile.last_daily_reward) {
        // Fix Android date parsing for Postgres timestamps by ensuring standard ISO format
        const safeDateString = profile.last_daily_reward.replace(' ', 'T').split('+')[0] + 'Z';
        const lastClaim = new Date(safeDateString);
        const now = new Date();
        
        const lastClaimMidnight = new Date(lastClaim.getFullYear(), lastClaim.getMonth(), lastClaim.getDate());
        const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        const daysDiff = Math.floor((todayMidnight.getTime() - lastClaimMidnight.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff === 0) {
          // Claimed today! Must wait until tomorrow 00:00:00
          canClaimToday = false;
          nextUnlockTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
        } else if (daysDiff >= 2 || isNaN(daysDiff)) {
          // Missed a day (or invalid)! Reset streak to 1
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
  const TOKENS = [0, 0, 1, 0, 1, 0, 2];

  const handleClaim = async (day: number) => {
    if (day !== currentDay) return;
    if (!canClaim) {
      setNotification({ title: 'Not Yet', message: timeLeftStr ? `Come back in ${timeLeftStr}` : 'Come again tomorrow for next reward unlock' });
      return;
    }
    if (!user) return;

    setLoading(true);
    try {
      const amount = REWARDS[day - 1];
      const tokens = TOKENS[day - 1];
      await api.claimDailyReward(user.id, amount, tokens);
      
      // Update streak
      const nextDay = currentDay + 1;
      await AsyncStorage.setItem(`login_streak_${user.id}`, nextDay.toString());
      
      setCanClaim(false);
      setCurrentDay(nextDay > 7 ? 7 : nextDay); // keep it at 7 for display after claiming day 7
      setTimeRemaining('Come again tomorrow for next reward unlock (24h remaining)');
      
      const tokenMsg = tokens > 0 ? ` and ${tokens} 🎟️ Token${tokens > 1 ? 's' : ''}` : '';
      setNotification({ title: 'Success', message: `Claimed ${amount} 🪙${tokenMsg}!` });
      await refreshProfile();
    } catch (err: any) {
      setNotification({ title: 'Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <View className="flex-1 bg-black/80 justify-center items-center p-2">
        <TouchableOpacity 
          activeOpacity={1} 
          className="absolute inset-0" 
          onPress={onClose} 
        />
        <View className="bg-indigo-900 w-full max-w-2xl rounded-3xl border border-indigo-400/30 p-4">
          
          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-row">
              <Text className="text-xl font-black text-white italic tracking-tighter">DAILY </Text>
              <Text className="text-xl font-black text-yellow-400 italic tracking-tighter">REWARDS</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="bg-white/10 w-8 h-8 rounded-full items-center justify-center">
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
              const tokens = TOKENS[day - 1];

              return (
                <TouchableOpacity
                  key={day}
                  onPress={() => handleClaim(day)}
                  disabled={!isCurrent || loading}
                  className={`flex-1 py-3 px-1 rounded-xl items-center justify-center border-2 overflow-hidden
                    ${isPast ? 'bg-gray-800 border-gray-600 opacity-50' 
                    : isCurrent ? 'bg-yellow-400 border-white' 
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
                  
                  {tokens > 0 && (
                    <Text className={`font-bold mt-0.5 text-[9px] ${isCurrent ? 'text-purple-700' : 'text-purple-400'}`}>
                      +{tokens} 🎟️
                    </Text>
                  )}
                  
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
            <View className="bg-black/30 py-3 px-4 rounded-xl items-center justify-center border border-white/5 flex-row">
              <Text className="text-white/60 font-bold text-xs mr-1">
                Next reward unlocks in:
              </Text>
              <Text className="text-yellow-400 font-mono text-xs font-bold">{timeLeftStr}</Text>
            </View>
          ) : !canClaim && !timeLeftStr ? (
            <View className="bg-black/30 py-3 px-4 rounded-xl items-center border border-white/5">
              <Text className="text-white/60 font-bold text-center text-xs">
                Come again tomorrow for next reward unlock
              </Text>
            </View>
          ) : null}

          {loading && (
            <View className="absolute inset-0 bg-indigo-900/50 justify-center items-center rounded-3xl z-50">
              <ActivityIndicator size="large" color="#facc15" />
            </View>
          )}

          {notification && (
            <View className="absolute inset-0 bg-black/80 justify-center items-center rounded-3xl z-50 p-4">
              <View className="bg-indigo-950 border border-white/20 p-6 rounded-3xl w-full items-center">
                <Text className="text-4xl mb-4">{notification.title === 'Success' ? '🎉' : '⚠️'}</Text>
                <Text className="text-white font-black text-xl mb-2 text-center">{notification.title}</Text>
                <Text className="text-white/80 font-bold text-center mb-6">{notification.message}</Text>
                <TouchableOpacity 
                  onPress={() => setNotification(null)}
                  className={`${notification.title === 'Success' ? 'bg-green-500' : 'bg-red-500'} px-8 py-3 rounded-xl`}
                >
                  <Text className="text-white font-black uppercase tracking-wider">OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

        </View>
      </View>
    </Modal>
  );
}

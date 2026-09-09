import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import GameRoom from './src/components/GameRoom';
import { Room, UserAction } from './src/lib/types';
import { processAction } from './src/lib/gameLogic';

export default function OfflineApp({ onRetry }: { onRetry: () => void }) {
  const [offlineRoom, setOfflineRoom] = useState<Room | null>(null);

  const startOfflineGame = () => {
    const BOT_UUID = '00000000-0000-0000-0000-000000000000';
    setOfflineRoom({
      id: 'offline',
      code: 'OFFLINE',
      player1_id: 'guest',
      player2_id: BOT_UUID,
      player3_id: null,
      p1_name: 'Guest',
      p2_name: 'Computer',
      p3_name: null,
      capacity: 2,
      bet_amount: 0,
      status: 'waiting',
      toss_call: null,
      toss_choices: {},
      p1_throw: null,
      p2_throw: null,
      p3_throw: null,
      p1_score: 0,
      p2_score: 0,
      p3_score: 0,
      current_batsman: 'guest',
      current_bowler: BOT_UUID,
      waiting_player_id: null,
      innings: 1,
      target: null,
      winner: null,
      stage: null,
      updated_at: new Date().toISOString(),
      overs_limit: null,
      wickets_limit: 1,
      p1_wickets_lost: 0,
      p2_wickets_lost: 0,
      p3_wickets_lost: 0,
      p1_balls_faced: 0,
      p2_balls_faced: 0,
      p3_balls_faced: 0,
      p1_team: null,
      p2_team: null,
      p3_team: null,
      p1_players: [],
      p2_players: [],
      p3_players: [],
      p1_current_player_index: 0,
      p2_current_player_index: 0,
      p3_current_player_index: 0
    });
  };

  const handleAction = async (action: any) => {
    if (!offlineRoom) return;
    
    if (action.type === 'EXIT_GAME') {
      setOfflineRoom(null);
      return;
    }

    let updates: any = {};
    if (action.type === 'THROW') {
      updates.p1_throw = action.fingers;
      if (offlineRoom.player2_id === '00000000-0000-0000-0000-000000000000') {
        updates.p2_throw = Math.floor(Math.random() * 6) + 1;
      }
      
      const newRoom = { ...offlineRoom, ...updates };
      const transition = processAction(newRoom, 'guest', action);
      
      if (Object.keys(transition).length > 0) {
        delete (transition as any).p1_throw; delete (transition as any).p2_throw;
        updates = { ...updates, ...transition };
      }
    } else {
      updates = processAction(offlineRoom, 'guest', action);
    }

    if (Object.keys(updates).length > 0) {
      setOfflineRoom(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  if (offlineRoom) {
    return (
      <SafeAreaView className="flex-1 bg-indigo-950">
        <View className="p-4 flex-1">
          <GameRoom room={offlineRoom} playerId="guest" onExit={() => setOfflineRoom(null)} onAction={handleAction} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-indigo-950 justify-center p-6 items-center">
      <Text className="text-4xl font-black text-white italic tracking-tighter mb-4">HEAD <Text className="text-yellow-400">TAIL</Text></Text>
      <Text className="text-red-400 font-bold mb-8 uppercase tracking-widest">You are offline</Text>
      
      <TouchableOpacity onPress={startOfflineGame} className="w-full bg-yellow-400 py-4 rounded-2xl active:scale-95 mb-4">
        <Text className="text-indigo-900 font-black text-xl text-center uppercase tracking-wider">Play as Guest</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={onRetry} className="w-full bg-white/10 py-4 rounded-2xl active:scale-95">
        <Text className="text-white font-black text-xl text-center uppercase tracking-wider">Connect WiFi & Retry</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

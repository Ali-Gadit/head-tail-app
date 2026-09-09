import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthProvider';

type NotificationManagerProps = {
  onJoinRoom?: (code: string) => void;
};

export default function NotificationManager({ onJoinRoom }: NotificationManagerProps) {
  const { profile } = useAuth();
  const [invites, setInvites] = useState<any[]>([]);

  useEffect(() => {
    if (!profile?.id) return;

    const fetchInvites = async () => {
      const { data, error } = await supabase
        .from('invites')
        .select(`
          id,
          room_id,
          sender:profiles!invites_sender_id_fkey(username),
          room:rooms!invites_room_id_fkey(code)
        `)
        .eq('receiver_id', profile.id)
        .eq('status', 'pending');
        
      if (!error && data) {
        setInvites(data);
      }
    };

    fetchInvites();

    const channel = supabase
      .channel('invites_updates')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'invites',
        filter: `receiver_id=eq.${profile.id}`
      }, () => {
        fetchInvites();
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'invites',
        filter: `receiver_id=eq.${profile.id}`
      }, () => {
        fetchInvites();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  const acceptInvite = async (inviteId: string, roomCode: string) => {
    await supabase.from('invites').update({ status: 'accepted' }).eq('id', inviteId);
    
    if (onJoinRoom) {
      onJoinRoom(roomCode);
    }
    
    setInvites(invites.filter(i => i.id !== inviteId));
  };

  const declineInvite = async (inviteId: string) => {
    await supabase.from('invites').update({ status: 'declined' }).eq('id', inviteId);
    setInvites(invites.filter(i => i.id !== inviteId));
  };

  if (invites.length === 0) return null;

  return (
    <View className="absolute top-4 left-4 right-4 z-50 gap-2">
      {invites.map(invite => (
        <View key={invite.id} className="bg-indigo-900 border border-yellow-400 p-4 rounded-2xl shadow-xl">
          <Text className="text-white font-bold mb-3">
            <Text className="text-yellow-400">{invite.sender?.username}</Text> invited you to a game!
          </Text>
          <View className="flex-row gap-2">
            <TouchableOpacity 
              onPress={() => acceptInvite(invite.id, invite.room?.code)}
              className="flex-1 bg-yellow-400 items-center py-2.5 rounded-xl active:bg-yellow-300"
            >
              <Text className="text-indigo-900 font-bold text-sm">Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => declineInvite(invite.id)}
              className="flex-1 bg-white/10 items-center py-2.5 rounded-xl active:bg-white/20"
            >
              <Text className="text-white font-bold text-sm">Decline</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
}

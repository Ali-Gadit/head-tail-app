import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthProvider';

type InviteFriendsProps = {
  roomId: string;
};

export default function InviteFriends({ roomId }: InviteFriendsProps) {
  const { profile } = useAuth();
  const [friends, setFriends] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!profile?.id || !isOpen) return;

    const fetchFriends = async () => {
      const { data, error } = await supabase
        .from('friendships')
        .select(`
          sender_id,
          receiver_id,
          sender:profiles!friendships_sender_id_fkey(id, username, is_online),
          receiver:profiles!friendships_receiver_id_fkey(id, username, is_online)
        `)
        .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
        .eq('status', 'accepted');

      if (!error && data) {
        const friendsList = data.map((f: any) => 
          f.sender_id === profile.id ? f.receiver : f.sender
        ).filter(f => f.is_online);
        setFriends(friendsList);
      }
    };

    fetchFriends();
  }, [profile?.id, isOpen]);

  const sendInvite = async (friendId: string) => {
    if (!profile?.id) return;
    const { error } = await supabase
      .from('invites')
      .insert({
        sender_id: profile.id,
        receiver_id: friendId,
        room_id: roomId
      });
      
    if (error) Alert.alert('Error', error.message);
    else Alert.alert('Success', 'Invite sent!');
  };

  if (!isOpen) {
    return (
      <TouchableOpacity 
        onPress={() => setIsOpen(true)}
        className="w-full bg-indigo-600/50 border border-indigo-400 py-3 rounded-xl shadow-lg mt-4 items-center active:bg-indigo-600"
      >
        <Text className="text-white font-bold text-sm">+ Invite Online Friends</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View className="w-full bg-white/10 border border-white/20 rounded-xl p-4 mt-4">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="font-bold text-xs uppercase tracking-widest text-white/80">Online Friends</Text>
        <TouchableOpacity onPress={() => setIsOpen(false)}>
          <Text className="text-[10px] text-white/50 uppercase">Close</Text>
        </TouchableOpacity>
      </View>
      
      {friends.length === 0 ? (
        <Text className="text-xs text-white/50 text-center py-2">No friends online right now.</Text>
      ) : (
        <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled className="gap-2">
          {friends.map(friend => (
            <View key={friend.id} className="flex-row justify-between items-center bg-white/10 p-2 rounded-lg mb-2">
              <View className="flex-row items-center gap-2">
                <View className="w-2 h-2 rounded-full bg-green-400" style={{ shadowColor: '#4ade80', shadowOpacity: 0.8, shadowRadius: 5, elevation: 3 }} />
                <Text className="font-bold text-sm text-white">{friend.username}</Text>
              </View>
              <TouchableOpacity 
                onPress={() => sendInvite(friend.id)}
                className="bg-yellow-400 px-3 py-1.5 rounded-md active:bg-yellow-300"
              >
                <Text className="text-indigo-900 text-xs font-bold">Invite</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

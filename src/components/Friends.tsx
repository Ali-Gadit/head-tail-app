import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthProvider';

type FriendProfile = {
  id: string;
  username: string;
  friend_id: string;
  is_online: boolean;
};

export default function Friends() {
  const { profile } = useAuth();
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<FriendProfile | null>(null);
  const [searchError, setSearchError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!profile?.id) return;
    fetchFriends();
    fetchRequests();

    const channel = supabase
      .channel('friends_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, () => {
        fetchFriends();
        fetchRequests();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchFriends();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  const fetchFriends = async () => {
    if (!profile?.id) return;
    
    const { data, error } = await supabase
      .from('friendships')
      .select(`
        sender_id,
        receiver_id,
        sender:profiles!friendships_sender_id_fkey(id, username, friend_id, is_online),
        receiver:profiles!friendships_receiver_id_fkey(id, username, friend_id, is_online)
      `)
      .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
      .eq('status', 'accepted');
      
    if (error) {
      console.error('Error fetching friends:', error);
      return;
    }

    const friendsList = data.map((f: any) => 
      f.sender_id === profile.id ? f.receiver : f.sender
    );
    setFriends(friendsList);
  };

  const fetchRequests = async () => {
    if (!profile?.id) return;
    
    const { data, error } = await supabase
      .from('friendships')
      .select(`
        id,
        sender:profiles!friendships_sender_id_fkey(id, username, friend_id)
      `)
      .eq('receiver_id', profile.id)
      .eq('status', 'pending');
      
    if (error) {
      console.error('Error fetching requests:', error);
      return;
    }
    setRequests(data);
  };

  const handleSearch = async () => {
    if (!searchQuery) return;
    setLoading(true);
    setSearchError('');
    setSearchResult(null);

    try {
      const rawQuery = searchQuery.trim().toUpperCase();
      const possibleValues = [rawQuery];
      const num = parseInt(rawQuery, 10);
      if (!isNaN(num)) {
        possibleValues.push(num.toString());
        possibleValues.push(num.toString().padStart(7, '0'));
      }

      if (possibleValues.includes(String(profile?.friend_id))) {
        throw new Error("You can't search for yourself!");
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('friend_id', possibleValues)
        .limit(1)
        .single();

      if (error || !data) {
        throw new Error('User not found');
      }

      setSearchResult(data);
    } catch (err: any) {
      setSearchError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sendRequest = async (receiverId: string) => {
    if (!profile?.id) return;
    const { error } = await supabase
      .from('friendships')
      .insert({ sender_id: profile.id, receiver_id: receiverId });
      
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Friend request sent!');
      setSearchResult(null);
      setSearchQuery('');
    }
  };

  const acceptRequest = async (requestId: string) => {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', requestId);
    if (error) Alert.alert('Error', error.message);
  };

  const declineRequest = async (requestId: string) => {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', requestId);
    if (error) Alert.alert('Error', error.message);
  };

  return (
    <View className="bg-white/10 rounded-[2rem] p-6 border border-white/20 mt-6 w-full">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-2xl font-black text-white tracking-widest">FRIENDS</Text>
        <View className="bg-yellow-400 px-3 py-1 rounded-full">
          <Text className="text-indigo-900 font-bold text-xs">{friends.length}</Text>
        </View>
      </View>

      {requests.length > 0 && (
        <View className="mb-6">
          <Text className="text-xs font-bold text-white/70 mb-2 uppercase tracking-widest">Pending Requests</Text>
          <View className="gap-2">
            {requests.map(req => (
              <View key={req.id} className="flex-row justify-between items-center bg-white/5 rounded-xl p-3 border border-white/10">
                <Text className="font-bold text-white">{req.sender?.username || 'Unknown'}</Text>
                <View className="flex-row gap-2">
                  <TouchableOpacity onPress={() => acceptRequest(req.id)} className="bg-green-500 px-3 py-1.5 rounded-lg shadow-lg active:scale-95">
                    <Text className="text-white font-bold text-xs">✓</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => declineRequest(req.id)} className="bg-red-500 px-3 py-1.5 rounded-lg shadow-lg active:scale-95">
                    <Text className="text-white font-bold text-xs">✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      <View className="mb-6">
        <View className="flex-row gap-2">
          <TextInput
            placeholder="Search ID (e.g. 0000001)"
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="characters"
            className="flex-1 bg-white/20 border border-white/30 rounded-xl py-3 px-4 font-bold text-white uppercase text-sm"
          />
          <TouchableOpacity 
            onPress={handleSearch} 
            disabled={loading || !searchQuery} 
            className="bg-yellow-400 px-5 rounded-xl items-center justify-center active:scale-95 disabled:opacity-50"
          >
            <Text className="text-indigo-900 font-black text-lg">🔍</Text>
          </TouchableOpacity>
        </View>
        {!!searchError && <Text className="text-red-300 text-xs mt-2 ml-1">{searchError}</Text>}
      </View>

      {searchResult && (
        <View className="bg-white/20 border border-white/40 rounded-xl p-4 mb-6 flex-row justify-between items-center">
              <View>
                <Text className="text-white font-bold text-lg">{searchResult.username}</Text>
                <Text className="text-xs text-white/70 font-mono">{String(searchResult.friend_id).padStart(7, '0')}</Text>
              </View>
          <TouchableOpacity onPress={() => sendRequest(searchResult.id)} className="bg-indigo-600 px-4 py-2 rounded-lg shadow-lg active:scale-95">
            <Text className="text-white font-bold text-sm">Add Friend</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text className="text-xs font-bold text-white/70 mb-2 uppercase tracking-widest">My Friends</Text>
      {friends.length === 0 ? (
        <View className="py-6 border border-white/10 rounded-xl border-dashed">
          <Text className="text-sm text-white/50 text-center">No friends yet. Add some!</Text>
        </View>
      ) : (
        <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled className="gap-2">
          {friends.map(friend => (
            <View key={friend.id} className="flex-row justify-between items-center bg-white/5 rounded-xl p-3 border border-white/10 mb-2">
              <View className="flex-row items-center gap-3">
                <View className={`w-3 h-3 rounded-full ${friend.is_online ? 'bg-green-400' : 'bg-gray-400/50'}`} style={friend.is_online ? { shadowColor: '#4ade80', shadowOpacity: 0.8, shadowRadius: 8, elevation: 4 } : undefined} />
                <View>
                  <Text className="font-bold text-white leading-tight">{friend.username}</Text>
                  <Text className="text-[10px] text-white/60 font-mono">{String(friend.friend_id).padStart(7, '0')}</Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

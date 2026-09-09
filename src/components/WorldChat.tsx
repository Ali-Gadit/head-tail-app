import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthProvider';

type ChatMessage = {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  profile?: {
    username: string;
  };
};

export default function WorldChat() {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel('world_chat_updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'world_chat' }, (payload) => {
        const newMessage = payload.new as ChatMessage;
        // Fetch the profile for the new message since realtime doesn't join tables
        fetchProfileForMessage(newMessage);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('world_chat')
      .select(`
        id,
        user_id,
        message,
        created_at,
        profiles(username)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching chat:', error);
      Alert.alert('Chat Error', error.message);
    } else if (data) {
      // Map 'profiles' to 'profile' for our component logic
      const formattedData = data.map((msg: any) => ({
        ...msg,
        profile: msg.profiles || { username: 'Unknown' }
      }));
      setMessages(formattedData.reverse() as any);
    }
  };

  const fetchProfileForMessage = async (msg: ChatMessage) => {
    const { data } = await supabase.from('profiles').select('username').eq('id', msg.user_id).single();
    const completeMsg = { ...msg, profile: data || { username: 'Unknown' } };
    setMessages(prev => [...prev, completeMsg]);
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !profile?.id) return;
    
    setLoading(true);
    const text = inputText.trim();
    setInputText('');
    
    const { error } = await supabase
      .from('world_chat')
      .insert({
        user_id: profile.id,
        message: text
      });

    if (error) {
      Alert.alert('Error', error.message);
      setInputText(text); // Restore text on error
    }
    setLoading(false);
  };

  return (
    <View className="bg-white/10 rounded-[2rem] p-4 border border-white/20 mt-6 w-full h-80">
      <View className="flex-row justify-between items-center mb-4 px-2">
        <Text className="text-xl font-black text-white tracking-widest uppercase">World Chat</Text>
        <View className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)] animate-pulse" />
      </View>

      <ScrollView 
        ref={scrollViewRef}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        className="flex-1 mb-4 px-2"
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        {messages.length === 0 ? (
          <Text className="text-white/40 text-center text-xs py-4">No messages yet. Be the first to say hi!</Text>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.user_id === profile?.id;
            return (
              <View key={msg.id || index.toString()} className={`mb-3 max-w-[85%] ${isMe ? 'self-end' : 'self-start'}`}>
                {!isMe && (
                  <Text className="text-[10px] text-white/50 mb-1 ml-1 font-bold">{msg.profile?.username || 'Player'}</Text>
                )}
                <View className={`px-4 py-2.5 rounded-2xl ${isMe ? 'bg-yellow-400 rounded-tr-sm' : 'bg-white/15 rounded-tl-sm border border-white/10'}`}>
                  <Text className={`text-sm ${isMe ? 'text-indigo-900 font-bold' : 'text-white'}`}>
                    {msg.message}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <View className="flex-row gap-2 items-center">
        <TextInput
          placeholder="Type a message..."
          placeholderTextColor="rgba(255,255,255,0.4)"
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={sendMessage}
          returnKeyType="send"
          className="flex-1 bg-white/10 border border-white/20 rounded-full py-3 px-5 text-white text-sm"
        />
        <TouchableOpacity 
          onPress={sendMessage} 
          disabled={loading || !inputText.trim()} 
          className="bg-indigo-600 w-12 h-12 rounded-full items-center justify-center active:scale-95 disabled:opacity-50"
        >
          <Text className="text-white font-bold text-lg">›</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

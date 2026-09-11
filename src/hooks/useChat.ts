import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface ChatMessage {
  id: string;
  senderName: string;
  senderId: string;
  text: string;
  timestamp: number;
  messageType?: 'text' | 'quick_chat' | 'emote';
  metaId?: string;
}

export function useChat(roomId: string, playerId: string, playerName: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [channel, setChannel] = useState<any>(null);
  
  // To handle the latest special message (emote/voice) for the UI to consume
  const [latestSpecialMessage, setLatestSpecialMessage] = useState<ChatMessage | null>(null);

  useEffect(() => {
    const ch = supabase.channel(`room:${roomId}:chat`);
    ch.on('broadcast', { event: 'message' }, ({ payload }) => {
      setMessages(prev => [...prev, payload]);
      if (payload.messageType === 'quick_chat' || payload.messageType === 'emote') {
        setLatestSpecialMessage(payload);
      }
    }).subscribe();
    setChannel(ch);

    return () => {
      supabase.removeChannel(ch);
    };
  }, [roomId]);

  const sendMessage = (text: string, messageType: 'text' | 'quick_chat' | 'emote' = 'text', metaId?: string) => {
    if (!channel) return;
    const msg: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      senderName: playerName,
      senderId: playerId,
      text,
      timestamp: Date.now(),
      messageType,
      metaId
    };
    channel.send({
      type: 'broadcast',
      event: 'message',
      payload: msg,
    });
    setMessages(prev => [...prev, msg]);
    if (messageType === 'quick_chat' || messageType === 'emote') {
      setLatestSpecialMessage(msg);
    }
  };

  return { messages, sendMessage, latestSpecialMessage };
}


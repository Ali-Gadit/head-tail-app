import { useState, useEffect, useRef } from 'react';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { RTCPeerConnection, RTCIceCandidate, RTCSessionDescription, mediaDevices, MediaStream } from 'react-native-webrtc';
import InCallManager from 'react-native-incall-manager';

export function useWebRTC(roomId: string, playerId: string) {
  const [micEnabled, setMicEnabled] = useState(false);
  const [speakerEnabled, setSpeakerEnabled] = useState(true);
  
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    InCallManager.start({ media: 'audio' });
    InCallManager.setForceSpeakerphoneOn(true);
    InCallManager.setSpeakerphoneOn(true);

    return () => {
      InCallManager.stop();
    };
  }, []);

  useEffect(() => {
    let pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    pcRef.current = pc;

    pc.ontrack = (event: any) => {
      if (event.streams && event.streams[0]) {
        remoteStreamRef.current = event.streams[0];
        remoteStreamRef.current?.getAudioTracks().forEach((track: any) => {
          track.enabled = speakerEnabled;
        });
      }
    };

    const channel = supabase.channel(`room:${roomId}:voice`);
    channelRef.current = channel;

    pc.onicecandidate = (event: any) => {
      if (event.candidate) {
        channel.send({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: { candidate: event.candidate, sender: playerId }
        });
      }
    };

    pc.onnegotiationneeded = async () => {
      try {
        const offer = await pc.createOffer({});
        await pc.setLocalDescription(offer);
        channel.send({
          type: 'broadcast',
          event: 'offer',
          payload: { sdp: pc.localDescription, sender: playerId }
        });
      } catch (err) {
        console.log('Error negotiating:', err);
      }
    };

    channel
      .on('broadcast', { event: 'offer' }, async ({ payload }) => {
        if (payload.sender === playerId) return;
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          channel.send({
            type: 'broadcast',
            event: 'answer',
            payload: { sdp: pc.localDescription, sender: playerId }
          });
        } catch (err) {
           console.log(err);
        }
      })
      .on('broadcast', { event: 'answer' }, async ({ payload }) => {
        if (payload.sender === playerId) return;
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        } catch (err) {
           console.log(err);
        }
      })
      .on('broadcast', { event: 'ice-candidate' }, async ({ payload }) => {
        if (payload.sender === playerId) return;
        try {
          await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
        } catch (err) {
           console.log(err);
        }
      })
      .subscribe();

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
      pc.close();
      supabase.removeChannel(channel);
    };
  }, [roomId, playerId]);

  useEffect(() => {
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = speakerEnabled;
      });
    }
  }, [speakerEnabled]);

  const toggleMic = async () => {
    try {
      if (!micEnabled) {
        if (Platform.OS === 'android') {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            {
              title: 'Microphone Permission',
              message: 'This app needs access to your microphone so you can talk to your friends.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            console.log('Microphone permission denied');
            Alert.alert('Permission Denied', 'Please enable microphone permissions in settings to use voice chat.');
            return;
          }
        }
        
        const stream = await mediaDevices.getUserMedia({ audio: true, video: false });
        localStreamRef.current = stream;
        if (pcRef.current) {
          stream.getTracks().forEach(track => {
            pcRef.current?.addTrack(track, stream);
          });
        }
        setMicEnabled(true);
      } else {
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(track => {
            track.stop();
            if (pcRef.current) {
              const sender = pcRef.current.getSenders().find(s => s.track === track);
              if (sender) pcRef.current.removeTrack(sender);
            }
          });
          localStreamRef.current = null;
        }
        setMicEnabled(false);
      }
    } catch (error) {
      console.log('Error toggling mic:', error);
    }
  };

  const toggleSpeaker = () => {
    setSpeakerEnabled(prev => !prev);
  };

  return { micEnabled, speakerEnabled, toggleMic, toggleSpeaker };
}

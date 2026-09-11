import React, { useEffect, useState } from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';

export default function BackgroundMusic() {
  const [muted, setMuted] = useState(false);
  const player = useAudioPlayer(require('../../assets/bgm.mp3'));

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'mixWithOthers'
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (player) {
      player.loop = true;
      player.volume = 1.0;
      player.play();
    }
  }, [player]);

  const toggleMute = () => {
    if (player) {
      if (muted) {
        player.play();
        setMuted(false);
      } else {
        player.pause();
        setMuted(true);
      }
    }
  };

  return (
    <TouchableOpacity 
      onPress={toggleMute}
      className="absolute bottom-4 left-4 w-12 h-12 rounded-full items-center justify-center bg-purple-600 border-2 border-purple-400 z-50 shadow-lg opacity-80"
    >
      <Text className="text-xl">{!muted ? '🎵' : '🔇'}</Text>
    </TouchableOpacity>
  );
}

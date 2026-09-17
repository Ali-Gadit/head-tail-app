import React, { useEffect, useState } from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';

export default function BackgroundMusic({ enabled = true }: { enabled?: boolean }) {
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
      if (enabled) {
        player.volume = 1.0;
        player.play();
      } else {
        player.volume = 0.0;
        player.pause();
      }
    }
  }, [player, enabled]);

  return null;
}

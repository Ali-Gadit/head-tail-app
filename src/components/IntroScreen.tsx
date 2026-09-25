import React, { useEffect, useRef } from 'react';
import { View, Animated, Image, Easing } from 'react-native';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';

export default function IntroScreen({ onFinish }: { onFinish: () => void }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const player = useAudioPlayer(require('../../assets/intro.mp3'));

  useEffect(() => {
    // Initialize audio engine for the splash screen so it doesn't get muted
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'mixWithOthers'
    }).catch(console.error);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 1500,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        })
      ]),
      Animated.delay(2000),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      })
    ]).start(() => {
      onFinish();
    });
  }, []); // Run animation only once!

  useEffect(() => {
    if (player) {
      player.volume = 1.0;
      // Removed the 3 second skip so it plays from the beginning again!
      player.play();
    }
  }, [player]);

  return (
    <View className="flex-1 bg-black justify-center items-center">
      <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
        <Image 
          source={require('../../assets/cv_logo_final.png')} 
          className="w-64 h-64"
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

import React, { useEffect, useRef } from 'react';
import { View, Animated, Image, Easing } from 'react-native';
import { useAudioPlayer } from 'expo-audio';

export default function IntroScreen({ onFinish }: { onFinish: () => void }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const player = useAudioPlayer(require('../../assets/intro.ogg'));

  useEffect(() => {
    if (player) {
      player.play();
    }

    Animated.sequence([
      // Fade in and scale up the logo
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
      // Hold for 2 seconds
      Animated.delay(2000),
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      })
    ]).start(() => {
      onFinish();
    });
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

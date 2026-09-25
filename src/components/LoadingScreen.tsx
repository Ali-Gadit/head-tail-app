import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Animated, ImageBackground } from 'react-native';

export default function LoadingScreen({ isReady, onComplete }: { isReady: boolean, onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const isFinished = useRef(false);

  useEffect(() => {
    // Start fake loading up to 85%
    Animated.timing(progressAnim, {
      toValue: 85,
      duration: 1500, 
      useNativeDriver: false,
    }).start();

    const listenerId = progressAnim.addListener(({ value }) => {
      setProgress(Math.floor(value));
    });

    return () => {
      progressAnim.removeListener(listenerId);
    };
  }, []);

  useEffect(() => {
    if (isReady && !isFinished.current) {
      isFinished.current = true;
      // When the app signals it's ready, rapidly fill to 100%
      Animated.timing(progressAnim, {
        toValue: 100,
        duration: 400,
        useNativeDriver: false,
      }).start(() => {
        // Hold at 100% for a split second so the user registers it, then launch the game!
        setTimeout(() => {
          onComplete();
        }, 150);
      });
    }
  }, [isReady]);

  const barWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%']
  });

  return (
    <ImageBackground 
      source={require('../../assets/cricket_hero.jpg')} 
      className="flex-1 bg-black justify-center items-center"
      imageStyle={{ opacity: 0.2 }}
    >
      <View className="absolute inset-0 bg-black/70" />

      {/* Center Heading */}
      <View className="flex-1 justify-center items-center mt-8">
        <Text 
          className="text-6xl font-black tracking-widest uppercase italic"
          style={{ 
            color: '#fbbf24',
            textShadowColor: 'rgba(251,191,36,0.5)', 
            textShadowOffset: { width: 0, height: 0 }, 
            textShadowRadius: 15 
          }}
        >
          HEAD<Text className="text-cyan-400" style={{ textShadowColor: 'rgba(34,211,238,0.5)', textShadowRadius: 15 }}>TAIL</Text>
        </Text>
        <Text className="text-white/40 text-xs font-bold tracking-[0.4em] uppercase mt-1">
          The Ultimate Showdown
        </Text>
      </View>

      {/* Bottom Loading Bar */}
      <View className="w-full px-16 pb-8">
        <View className="flex-row justify-between items-end mb-2 px-1">
          <Text className="text-cyan-400/70 font-black text-[10px] uppercase tracking-widest">
            LOADING...
          </Text>
          <Text className="text-yellow-400 font-black text-xs tabular-nums">
            {progress}%
          </Text>
        </View>

        <View className="w-full h-1.5 bg-black/80 rounded-full overflow-hidden border border-cyan-900/50">
          <Animated.View 
            className="h-full bg-cyan-400 rounded-full"
            style={{ 
              width: barWidth,
              shadowColor: '#22d3ee',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 1,
              shadowRadius: 10,
              elevation: 5
            }}
          />
        </View>
      </View>
    </ImageBackground>
  );
}

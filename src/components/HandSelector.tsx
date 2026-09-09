import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface HandSelectorProps {
  maxFingers?: number;
  onSelect: (fingers: number) => void;
  disabled?: boolean;
}

export default function HandSelector({ maxFingers = 6, onSelect, disabled }: HandSelectorProps) {
  const options = Array.from({ length: maxFingers }, (_, i) => i + 1);

  // Fallback emojis in case images are not used yet
  const emojiMap: Record<number, string> = {
    1: '☝️', 2: '✌️', 3: '🤟', 4: '🖖', 5: '🖐️', 6: '👍'
  };

  return (
    <View className="flex-row flex-wrap justify-center gap-3">
      {options.map((num) => (
        <TouchableOpacity
          key={num}
          disabled={disabled}
          onPress={() => onSelect(num)}
          className={`w-20 h-24 bg-white rounded-3xl items-center justify-center shadow-xl border-b-4 border-gray-300 active:bg-gray-100 ${disabled ? 'opacity-50' : 'active:scale-95'}`}
        >
          <Text className="text-4xl">{emojiMap[num]}</Text>
          <Text className="text-xl font-black text-indigo-900 mt-1">{num}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

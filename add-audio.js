const fs = require('fs');
let code = fs.readFileSync('src/components/RevealView.tsx', 'utf8');

if (!code.includes('expo-av')) {
  code = code.replace(
    /import \{ View, Text, TouchableOpacity, Animated, Vibration \} from 'react-native';/,
    "import { View, Text, TouchableOpacity, Animated, Vibration } from 'react-native';\nimport { Audio } from 'expo-av';"
  );
}

const useEffectRegex = /(useEffect\(\(\) => \{\n    if \(type === 'toss'\) \{)(\n\s*Animated\.sequence)/;
const playSoundStr = `
      const playSound = async () => {
        try {
          const { sound } = await Audio.Sound.createAsync(
             { uri: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_3d1e1f1484.mp3' }
          );
          await sound.playAsync();
        } catch (e) {
          console.log('Audio play failed', e);
        }
      };`;

code = code.replace(useEffectRegex, `$1${playSoundStr}$2`);

code = code.replace(
  /\}\)\.start\(\(\) => \{\n\s*Vibration\.vibrate\(100\);/,
  "}).start(() => {\n        playSound();\n        Vibration.vibrate(100);"
);

fs.writeFileSync('src/components/RevealView.tsx', code);

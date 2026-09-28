const fs = require('fs');
let code = fs.readFileSync('src/components/RevealView.tsx', 'utf8');

code = code.replace("import { Audio } from 'expo-av';", "import { createAudioPlayer } from 'expo-audio';");

const oldSoundRegex = /\s*const playSound = async \(\) => \{[\s\S]*?\};/;
const playSoundStr = `
      const playSound = () => {
        try {
          const player = createAudioPlayer('https://cdn.pixabay.com/download/audio/2021/08/04/audio_3d1e1f1484.mp3');
          player.play();
        } catch (e) {
          console.log('Audio play failed', e);
        }
      };`;

code = code.replace(oldSoundRegex, playSoundStr);

fs.writeFileSync('src/components/RevealView.tsx', code);

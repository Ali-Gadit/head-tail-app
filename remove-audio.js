const fs = require('fs');
let code = fs.readFileSync('src/components/RevealView.tsx', 'utf8');

// 1. Remove import
code = code.replace("import { Audio } from 'expo-av';\n", "");

// 2. Remove playSound function
const playSoundStart = code.indexOf("const playSound = async () => {");
if (playSoundStart !== -1) {
  const playSoundEnd = code.indexOf("};", playSoundStart) + 2;
  code = code.slice(0, playSoundStart) + code.slice(playSoundEnd);
}

// 3. Remove playSound(); call
code = code.replace("playSound();\n", "");
code = code.replace("playSound();", "");

fs.writeFileSync('src/components/RevealView.tsx', code);

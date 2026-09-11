# Head & Tail (Multiplayer React Native Game) ??

Welcome to the Head & Tail codebase! This is a massive multiplayer React Native Hand Cricket game featuring Solo & Squad Ranked Modes, Real-Time WebRTC Voice Chat, Interactive Emotes, and a full Supabase backend.

## Features Built So Far:
- **Ranked Matchmaking**: Bronze to Grandmaster scaling with strict Speed Timers (7s to 3s).
- **Dynamic Bots**: Bots that adapt their difficulty based on your Rank Tier (including mind-reading!).
- **Voice Chat & Quick Chat**: Real-time WebRTC audio streams, and pre-recorded Quick Chat Voice lines.
- **Emote Engine**: Giant pop-up animated Ludo-style emojis.
- **Invite & Earn (Referrals)**: Full referral token reward system with 8-digit unique codes.

## How to Run the App Locally

### Prerequisites
1. **Node.js**: Ensure Node is installed (v18+).
2. **Android Studio**: Ensure the Android SDK and Emulator are configured.
3. **Supabase**: You need your own Supabase project (set up with `rooms` and `profiles` tables).

### Setup
```bash
# 1. Install dependencies
npm install

# 2. Setup your .env file
# (This project uses hardcoded keys in `src/lib/supabase.ts` for now, ensure they match your Supabase instance)

# 3. Compile native code & Run Android
npx expo run:android
```

*(Note: Expo Go is not supported because we use native modules like `expo-audio`, `react-native-webrtc`, and `expo-clipboard`.)*

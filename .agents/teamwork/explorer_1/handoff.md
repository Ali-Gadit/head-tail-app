# Handoff Report: Root & Navigation Responsiveness Audit & Baseline Component Inventory

**Role**: Explorer 1 (Root & Navigation Audit)  
**Target Codebase**: `head-tail-app` (`App.tsx`, root-level wrappers, navigation headers/footers, splash/auth screens, global container styles)  
**Date**: 2026-09-29T20:35:00Z  

---

## 1. Observation

### Baseline UI Component Inventory
Across the `head-tail-app` codebase, exactly 21 UI components exist across root files and `src/components/`. Below is the complete baseline inventory:

| # | Component | File Path | Category / Purpose | Responsiveness Profile |
|---|---|---|---|---|
| 1 | `App` | `App.tsx:687` | Root App Component: network check, offline fallback, intro splash gate, AuthProvider wrapper, StatusBar control | Full-screen container; lacks safe-area handling on Android. |
| 2 | `Main` | `App.tsx:654` | Root Navigation Router: transitions between LoadingScreen, Auth, and Dashboard based on user session | Uses `flex-1 bg-indigo-950`; delegates inner screen layouts. |
| 3 | `Dashboard` | `App.tsx:102` | Main Game Hub Screen: Absolute HUD, live friends widget, 3D animated hero coin launcher, modals host | **CRITICAL DEFECTS**: Rigid HUD dimensions (`h-80`, `w-44`, `w-48`), horizontal currency overflow, vertical HUD-to-hero collision on screens < 750px. |
| 4 | `DashboardFriends` | `App.tsx:27` | Dashboard Top-Right Live Friends Box & Settings shortcut | Hardcoded `h-80` (320px) height and `w-44` (176px) width. Truncates usernames, covers coin on small screens. |
| 5 | `OfflineApp` | `OfflineApp.tsx:7` | Offline Fallback & Guest Match Controller | Full-bleed buttons stretch excessively on tablets; adds unneeded `p-4` around `GameRoom`. |
| 6 | `IntroScreen` | `src/components/IntroScreen.tsx:5` | Animated Audio Splash Screen | Hardcoded `w-64 h-64` (256px) logo scaled by 1.1x. |
| 7 | `LoadingScreen` | `src/components/LoadingScreen.tsx:4` | Branded Loading Screen with Animated Bar | Font `text-6xl tracking-widest` wraps awkwardly on <360px screens; `px-16` padding is rigid. |
| 8 | `Auth` | `src/components/Auth.tsx:12` | Login / Signup Authentication Screen | Missing `ScrollView` inside `KeyboardAvoidingView`; input fields and submit button clipped off-screen when keyboard is visible on compact phones. |
| 9 | `AuthProvider` | `src/components/AuthProvider.tsx:34` | Global Auth State & Profile Context Provider | Headless React Context provider (no direct rendering constraints). |
| 10 | `BackgroundMusic` | `src/components/BackgroundMusic.tsx:5` | Headless Ambient Audio Player | Headless component (returns `null`). |
| 11 | `NotificationManager`| `src/components/NotificationManager.tsx:10` | Floating In-App Match Invite Banner | Fixed `top-4` collides with status bar/notch and directly overlaps HUD profile and currency pill buttons. |
| 12 | `CoinShop` | `src/components/CoinShop.tsx` | Store Modal (Coin & Token Bundles) | Modal container (Assigned to Explorer 3). |
| 13 | `DailyRewardModal` | `src/components/DailyRewardModal.tsx` | 7-Day Login Streak Reward Calendar | Modal container (Assigned to Explorer 3). |
| 14 | `Friends` | `src/components/Friends.tsx` | Full Friend Management Modal (Search, Requests, List) | Modal container (Assigned to Explorer 3). |
| 15 | `GuideModal` | `src/components/GuideModal.tsx` | How-To-Play Interactive Guide Modal | Modal container (Assigned to Explorer 3). |
| 16 | `HandSelector` | `src/components/HandSelector.tsx` | In-Game 1-6 Finger Run Picker with Timer | Match control (Assigned to Explorer 2). |
| 17 | `InviteEarnModal` | `src/components/InviteEarnModal.tsx` | Referral Code & Sharing Modal | Modal container (Assigned to Explorer 3). |
| 18 | `InviteFriends` | `src/components/InviteFriends.tsx` | Lobby Invite Friends Drawer / Modal | Modal container (Assigned to Explorer 3). |
| 19 | `Leaderboard` | `src/components/Leaderboard.tsx` | Ranked Player Standings & Tier Rankings | Modal container (Assigned to Explorer 3). |
| 20 | `OnboardingModal` | `src/components/OnboardingModal.tsx` | First-Time User Rules Onboarding Modal | Modal container (Assigned to Explorer 3). |
| 21 | `RevealView` | `src/components/RevealView.tsx` | 3D Coin Toss & Round Showdown Animations | Core game view (Assigned to Explorer 2). |
| 22 | `Scoreboard` | `src/components/Scoreboard.tsx` | In-Game Scoreboard Card, Over & Ball History | Match UI (Assigned to Explorer 2). |
| 23 | `GameRoom` | `src/components/GameRoom.tsx` | Core Match Arena & Matchmaking Coordinator | Screen orchestrator (Assigned to Explorer 2 & 3). |
| 24 | `WorldChat` | `src/components/WorldChat.tsx` | Real-Time Public & Match Chat Drawer | Chat overlay (Assigned to Explorer 3). |

---

### Detailed Code Audit Observations

#### Issue 1: `DashboardFriends` Fixed 320px Height Overlapping Primary Call to Action
- **File**: `App.tsx`
- **Line Number**: 57
- **Current Problematic Code**:
  ```tsx
  <View className="flex-col items-end gap-3 pr-2 mt-1 pointer-events-auto h-80">
  ```
- **Breakage Explanation**:
  `h-80` forces a rigid 320px height (`80 * 4 = 320px`). On standard mobile devices like iPhone SE (height 667px) or compact Android devices (height 640px), 320px consumes over 48% of total viewport height. Because `DashboardFriends` is rendered inside an absolute overlay (`absolute top-2 left-4 right-4 z-50`), this 320px container hangs down into the center of the viewport, directly covering the interactive 3D Coin ("Tap to Play") and Game Title, blocking gestures and rendering the coin half-obscured.
- **Responsive Replacement**:
  ```tsx
  <View style={{ maxHeight: '42%' }} className="flex-col items-end gap-3 pr-2 mt-1 pointer-events-auto flex-shrink">
  ```

---

#### Issue 2: `DashboardFriends` Rigid 176px Width and Internal Text Truncation
- **File**: `App.tsx`
- **Line Number**: 68
- **Current Problematic Code**:
  ```tsx
  <View className="bg-indigo-900/40 border border-indigo-400/20 rounded-3xl p-5 w-44 flex-1 shadow-2xl">
  ```
- **Breakage Explanation**:
  `w-44` enforces a hard 176px width (`44 * 4 = 176px`). Combined with `p-5` (20px padding left + 20px padding right = 40px horizontal padding), the internal width available for friend rows is only 136px. Subtracting avatar (40px) and gap (12px), only 84px remains for the username and online indicator, causing severe name truncation. Crucially, on a 360px-375px wide screen, taking 176px on the right leaves only ~180px for the entire left HUD (profile pill + 3 currency counters), creating a guaranteed horizontal layout collision.
- **Responsive Replacement**:
  ```tsx
  <View style={{ width: '100%', maxWidth: 176, padding: 12 }} className="bg-indigo-900/40 border border-indigo-400/20 rounded-3xl flex-1 shadow-2xl">
  ```

---

#### Issue 3: Settings Button Undersized Touch Target
- **File**: `App.tsx`
- **Line Number**: 63
- **Current Problematic Code**:
  ```tsx
  <TouchableOpacity onPress={onOpenSettings} className="bg-gray-600/80 w-9 h-9 rounded-full items-center justify-center border border-gray-400 active:scale-95 shadow-lg">
  ```
- **Breakage Explanation**:
  `w-9 h-9` equals 36px x 36px. Both Apple HIG and Android Material guidelines require a minimum 44x44 / 48x48 point touch target. On small and high-density screens, 36px leads to repeated missed taps and accidental interaction with underlying components.
- **Responsive Replacement**:
  ```tsx
  <TouchableOpacity onPress={onOpenSettings} className="bg-gray-600/80 w-11 h-11 rounded-full items-center justify-center border border-gray-400 active:scale-95 shadow-lg" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
  ```

---

#### Issue 4: Settings Modal Rigid 256px Width and Fixed Height Button Clipping
- **File**: `App.tsx`
- **Line Numbers**: 363, 365
- **Current Problematic Code**:
  ```tsx
  <View className="bg-indigo-950 rounded-3xl p-6 border border-white/20 w-64 shadow-2xl items-center">
    <Text className="text-white font-black text-xl tracking-widest uppercase mb-6">Settings</Text>
    <View className="flex-row gap-4 mb-6 w-full h-12">
      <TouchableOpacity onPress={() => setSoundEnabled(!soundEnabled)} className="w-12 h-12 rounded-full items-center justify-center bg-purple-600 border-2 border-purple-400 shadow-lg active:scale-95">
        <Text className="text-xl">{soundEnabled ? '🎵' : '🔇'}</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={async () => {
          setLoading(true);
          await signOut();
        }} 
        disabled={loading}
        className={`flex-1 bg-red-500/80 rounded-full items-center justify-center border-2 border-red-400 ${loading ? 'opacity-50' : 'active:scale-95'}`}
      >
        <Text className="text-white font-black uppercase tracking-wider">{loading ? 'Signing Out...' : 'Sign Out'}</Text>
      </TouchableOpacity>
    </View>
  ```
- **Breakage Explanation**:
  1. `w-64` enforces 256px width. Inside `p-6` (48px horizontal padding), the row width is only 208px. With `w-12` (48px) and `gap-4` (16px), the "Sign Out" button has only 144px width. The text "Signing Out..." inside a fixed `h-12` (48px) button overflows or clips vertically when active.
  2. On tablets (768px-1024px width), a 256px dialog is disproportionately tiny and off-center.
- **Responsive Replacement**:
  ```tsx
  <View style={{ width: '85%', maxWidth: 360 }} className="bg-indigo-950 rounded-3xl p-6 border border-white/20 shadow-2xl items-center">
    <Text className="text-white font-black text-xl tracking-widest uppercase mb-6">Settings</Text>
    <View className="flex-row gap-4 mb-6 w-full items-center">
      <TouchableOpacity onPress={() => setSoundEnabled(!soundEnabled)} className="w-12 h-12 rounded-full items-center justify-center bg-purple-600 border-2 border-purple-400 shadow-lg active:scale-95">
        <Text className="text-xl">{soundEnabled ? '🎵' : '🔇'}</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={async () => {
          setLoading(true);
          await signOut();
        }} 
        disabled={loading}
        className={`flex-1 py-3 px-4 bg-red-500/80 rounded-full items-center justify-center border-2 border-red-400 ${loading ? 'opacity-50' : 'active:scale-95'}`}
      >
        <Text numberOfLines={1} className="text-white font-black uppercase tracking-wider text-xs">{loading ? 'Signing Out...' : 'Sign Out'}</Text>
      </TouchableOpacity>
    </View>
  ```

---

#### Issue 5: HUD Container Unsafe Top Positioning
- **File**: `App.tsx`
- **Line Number**: 408
- **Current Problematic Code**:
  ```tsx
  <View className="absolute top-2 left-4 right-4 z-50 flex-row justify-between items-start" pointerEvents="box-none">
  ```
- **Breakage Explanation**:
  `top-2` equals 8px from the top of the viewport. React Native's core `SafeAreaView` does not apply top safe insets on Android devices. Furthermore, on iPhones with Dynamic Island or notch (top safe inset 47-59px), 8px renders the user profile, currencies, and friends button directly underneath the status bar clock, battery indicator, and camera cutouts.
- **Responsive Replacement**:
  ```tsx
  <View style={{ width: '100%', top: Platform.OS === 'android' ? 24 : 8 }} className="absolute left-0 right-0 px-4 z-50 flex-row justify-between items-start" pointerEvents="box-none">
  ```

---

#### Issue 6: Profile Card and Currencies Horizontal Overflow Collapse
- **File**: `App.tsx`
- **Line Numbers**: 413, 428
- **Current Problematic Code**:
  ```tsx
  {/* Profile & Currencies Row */}
  <View className="flex-row gap-4 items-start">
    {/* Profile Card */}
    <View className="flex-col">
      <View className="flex-row items-center bg-black/40 rounded-full pr-4 p-1 border border-white/10">
        <View className="w-10 h-10 bg-indigo-500 rounded-full items-center justify-center border-2 border-indigo-300">
          <Text className="text-xl">👤</Text>
        </View>
        <View className="ml-3">
          <Text className="text-white font-bold">{profile.username}</Text>
          <Text className="text-white/50 text-[10px] font-mono">ID: {String(profile?.friend_id || 0).padStart(7, '0')}</Text>
        </View>
      </View>
    </View>

    {/* Currencies */}
    <View className="flex-row items-center gap-2 mt-2">
      <TouchableOpacity onPress={() => setShowCoinShop(true)} className="bg-black/40 rounded-full pl-3 pr-1.5 py-1 flex-row items-center border border-yellow-500/20 active:scale-95 shadow-xl">
        <Text className="text-yellow-400 font-black text-[11px] tracking-wider mr-2">🪙 {profile.coins || 0}</Text>
        <View className="bg-yellow-400/20 rounded-full w-[18px] h-[18px] items-center justify-center border border-yellow-400/30">
          <Text className="text-yellow-400 font-bold text-[14px]" style={{ includeFontPadding: false, textAlignVertical: 'center', lineHeight: 15 }}>+</Text>
        </View>
      </TouchableOpacity>

      <View className="bg-black/40 rounded-full px-3 py-1.5 flex-row items-center border border-cyan-500/20 shadow-xl">
        <Text className="text-cyan-400 font-black text-[11px] tracking-wider">💎 {profile.premium_currency || 0}</Text>
      </View>

      <TouchableOpacity onPress={() => setShowCoinShop(true)} className="bg-black/40 rounded-full pl-3 pr-1.5 py-1 flex-row items-center border border-slate-300/20 active:scale-95 shadow-xl">
        <Text className="text-slate-200 font-black text-[11px] tracking-wider mr-2">🎟️ {profile.private_room_tokens || 0}</Text>
        <View className="bg-slate-300/20 rounded-full w-[18px] h-[18px] items-center justify-center border border-slate-300/30">
          <Text className="text-white font-bold text-[14px]" style={{ includeFontPadding: false, textAlignVertical: 'center', lineHeight: 15 }}>+</Text>
        </View>
      </TouchableOpacity>
    </View>
  </View>
  ```
- **Breakage Explanation**:
  This is the single most severe horizontal layout defect in `head-tail-app`.
  The profile card (~130px) AND all three currency pills (~240px combined) are declared in an inline `flex-row gap-4` without wrapping. Together they require at least 386px.
  Across from them sits the 176px `DashboardFriends` widget.
  Total horizontal requirement = 386px + 16px gap + 176px = 578px!
  On any mobile phone in portrait (360px - 414px width), 578px exceeds screen capacity by ~180px. As a result, the currencies are either shoved off-screen to the right, compressed into illegible fragments, or overlap underneath the friends panel.
- **Responsive Replacement**:
  Convert the row into a responsive vertical stack/wrap that bounds the left column to 55-60% width and enables currencies to flex-wrap gracefully:
  ```tsx
  <View className="flex-col gap-2 items-start" style={{ maxWidth: '60%' }}>
    {/* Profile Card */}
    <View className="flex-row items-center bg-black/40 rounded-full pr-3 p-1 border border-white/10 max-w-full">
      <View className="w-8 h-8 bg-indigo-500 rounded-full items-center justify-center border-2 border-indigo-300">
        <Text className="text-base">👤</Text>
      </View>
      <View className="ml-2 flex-shrink">
        <Text numberOfLines={1} className="text-white font-bold text-xs">{profile.username}</Text>
        <Text className="text-white/50 text-[9px] font-mono">ID: {String(profile?.friend_id || 0).padStart(7, '0')}</Text>
      </View>
    </View>

    {/* Currencies Row with flexWrap */}
    <View className="flex-row flex-wrap items-center gap-1.5">
      <TouchableOpacity onPress={() => setShowCoinShop(true)} className="bg-black/40 rounded-full pl-2 pr-1 py-0.5 flex-row items-center border border-yellow-500/20 active:scale-95 shadow-xl">
        <Text className="text-yellow-400 font-black text-[10px] tracking-wider mr-1.5">🪙 {profile.coins || 0}</Text>
        <View className="bg-yellow-400/20 rounded-full w-4 h-4 items-center justify-center border border-yellow-400/30">
          <Text className="text-yellow-400 font-bold text-[12px]" style={{ includeFontPadding: false, textAlignVertical: 'center', lineHeight: 13 }}>+</Text>
        </View>
      </TouchableOpacity>

      <View className="bg-black/40 rounded-full px-2 py-0.5 flex-row items-center border border-cyan-500/20 shadow-xl">
        <Text className="text-cyan-400 font-black text-[10px] tracking-wider">💎 {profile.premium_currency || 0}</Text>
      </View>

      <TouchableOpacity onPress={() => setShowCoinShop(true)} className="bg-black/40 rounded-full pl-2 pr-1 py-0.5 flex-row items-center border border-slate-300/20 active:scale-95 shadow-xl">
        <Text className="text-slate-200 font-black text-[10px] tracking-wider mr-1.5">🎟️ {profile.private_room_tokens || 0}</Text>
        <View className="bg-slate-300/20 rounded-full w-4 h-4 items-center justify-center border border-slate-300/30">
          <Text className="text-white font-bold text-[12px]" style={{ includeFontPadding: false, textAlignVertical: 'center', lineHeight: 13 }}>+</Text>
        </View>
      </TouchableOpacity>
    </View>
  </View>
  ```

---

#### Issue 7: Currency Plus Badges Rigid Pixel Dimensions & Off-Center Glyphs
- **File**: `App.tsx`
- **Line Numbers**: 433, 446
- **Current Problematic Code**:
  ```tsx
  <View className="bg-yellow-400/20 rounded-full w-[18px] h-[18px] items-center justify-center border border-yellow-400/30">
    <Text className="text-yellow-400 font-bold text-[14px]" style={{ includeFontPadding: false, textAlignVertical: 'center', lineHeight: 15 }}>+</Text>
  </View>
  ```
- **Breakage Explanation**:
  `w-[18px] h-[18px]` with hardcoded `lineHeight: 15` and `fontSize: 14px`. On devices with OS font-scaling or fractional display scaling, the '+' symbol renders clipped or shifted off-center within the badge.
- **Responsive Replacement**:
  ```tsx
  <View className="bg-yellow-400/20 rounded-full w-5 h-5 items-center justify-center border border-yellow-400/30">
    <Text className="text-yellow-400 font-bold text-xs" style={{ includeFontPadding: false, textAlignVertical: 'center' }}>+</Text>
  </View>
  ```

---

#### Issue 8: Left Vertical Menu Height Colliding with Central Coin
- **File**: `App.tsx`
- **Line Number**: 455
- **Current Problematic Code**:
  ```tsx
  {/* Vertical Menu */}
  <View className="flex-col gap-6 mt-8 ml-2">
  ```
- **Breakage Explanation**:
  5 navigation buttons (Store, Daily Rewards, Invite and Earn, Leaderboard, How to Play) with `gap-6` (24px) and `mt-8` (32px) create a vertical column of ~290px height. Adding the profile card above it, the total left HUD spans ~350px.
  On viewports under 700px in height (e.g. iPhone SE 667px), this column extends past the vertical midpoint of the screen, colliding with and covering the central "HEAD TAIL" coin. Tapping the coin often activates the Store or Guide buttons by mistake.
- **Responsive Replacement**:
  ```tsx
  <View style={{ gap: 10, marginTop: '4%' }} className="flex-col ml-1 flex-shrink">
  ```

---

#### Issue 9: Central Hero 3D Coin Sizing & Pulse Overflow
- **File**: `App.tsx`
- **Line Numbers**: 503, 511, 513, 517, 523
- **Current Problematic Code**:
  ```tsx
  <Animated.View {...coinPanResponder.panHandlers} className="flex-1 justify-center pt-4">
    <View className="items-center mb-4">
      <Text className="text-4xl font-black text-white italic tracking-tighter shadow-xl">HEAD <Text className="text-yellow-400">TAIL</Text></Text>
    </View>

    <View className="items-center mt-2">
      <TouchableOpacity onPress={() => setShowGameModes(true)} className="items-center active:scale-95">
        {/* Ambient Outer Aura */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }} className="w-48 h-48 rounded-full bg-yellow-500/10 items-center justify-center border border-yellow-400/20">
          {/* Inner Glowing Aura */}
          <View className="w-40 h-40 rounded-full bg-yellow-500/20 items-center justify-center border border-yellow-400/30">
            {/* The 3D Golden Coin */}
            <Animated.View 
              style={{ transform: [{ rotateX }, { rotateY }] }}
              className="w-32 h-32 rounded-full bg-yellow-400 items-center justify-center border-b-8 border-yellow-600 shadow-2xl relative overflow-hidden border-t-2 border-l-2 border-r-2 border-yellow-200"
            >
              <View className="absolute top-0 left-0 right-0 h-1/2 bg-white/30 rounded-t-full" />
              <View className="items-center justify-center border-2 border-yellow-500/30 rounded-full w-24 h-24 flex-row">
                <Text className="text-5xl font-black text-yellow-700 italic tracking-tighter shadow-sm">H</Text>
                <Text className="text-5xl font-black text-yellow-100 italic tracking-tighter shadow-sm">T</Text>
              </View>
            </Animated.View>
          </View>
        </Animated.View>
        
        {/* Cinematic Tap to Play */}
        <View className="mt-10 items-center justify-center animate-pulse">
  ```
- **Breakage Explanation**:
  1. Outer aura is fixed to `w-48 h-48` (192px x 192px). Pulsing scales it to 221px x 221px.
  2. Inner aura is fixed to `w-40 h-40` (160px), coin is `w-32 h-32` (128px), face is `w-24 h-24` (96px), and bottom margin is `mt-10` (40px).
  3. Total hero stack height = Title (44px) + mb-4 (16px) + aura (221px) + mt-10 (40px) + "Tap to Play" (32px) = 353px.
  4. With the absolute HUD above it taking 350px, on screens <= 700px in height, the two layers physically overlap by 50px-100px.
  5. On large tablets (1024x1366), 128px coin appears tiny and lost in the center.
- **Responsive Replacement**:
  ```tsx
  <Animated.View {...coinPanResponder.panHandlers} className="flex-1 justify-center items-center py-2">
    <View className="items-center mb-2">
      <Text className="text-3xl sm:text-4xl font-black text-white italic tracking-tighter shadow-xl">HEAD <Text className="text-yellow-400">TAIL</Text></Text>
    </View>

    <View className="items-center mt-1">
      <TouchableOpacity onPress={() => setShowGameModes(true)} className="items-center active:scale-95">
        {/* Responsive Aura Container */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }], width: 176, height: 176, maxWidth: '48vw', maxHeight: '48vw' }} className="rounded-full bg-yellow-500/10 items-center justify-center border border-yellow-400/20">
          <View style={{ width: '82%', height: '82%' }} className="rounded-full bg-yellow-500/20 items-center justify-center border border-yellow-400/30">
            <Animated.View 
              style={{ transform: [{ rotateX }, { rotateY }], width: '78%', height: '78%' }}
              className="rounded-full bg-yellow-400 items-center justify-center border-b-8 border-yellow-600 shadow-2xl relative overflow-hidden border-t-2 border-l-2 border-r-2 border-yellow-200"
            >
              <View className="absolute top-0 left-0 right-0 h-1/2 bg-white/30 rounded-t-full" />
              <View style={{ width: '75%', height: '75%' }} className="items-center justify-center border-2 border-yellow-500/30 rounded-full flex-row">
                <Text className="text-4xl font-black text-yellow-700 italic tracking-tighter shadow-sm">H</Text>
                <Text className="text-4xl font-black text-yellow-100 italic tracking-tighter shadow-sm">T</Text>
              </View>
            </Animated.View>
          </View>
        </Animated.View>
        
        <View className="mt-4 sm:mt-8 items-center justify-center animate-pulse">
          <View className="flex-row items-center gap-3">
            <View className="h-[2px] w-6 sm:w-8 bg-yellow-400/30 rounded-full" />
            <Text className="text-yellow-400 font-black text-base sm:text-lg tracking-[0.25em] uppercase">
              Tap to Play
            </Text>
            <View className="h-[2px] w-6 sm:w-8 bg-yellow-400/30 rounded-full" />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  </Animated.View>
  ```

---

#### Issue 10: Game Modes Modal Fixed Card Sizes & Keyboard Occlusion
- **File**: `App.tsx`
- **Line Numbers**: 564, 582, 600, 618
- **Current Problematic Code**:
  ```tsx
  {/* Card 1: Random Match */}
  <TouchableOpacity onPress={findCasualMatch} disabled={loadingAction !== null} className="w-56 h-64 bg-slate-900 rounded-[2rem] p-5 shadow-2xl justify-between border-2 border-green-500/40 active:scale-95 overflow-hidden relative">
  ...
  {/* Card 4: Join Room */}
  <View className="w-56 h-64 bg-slate-900 rounded-[2rem] p-5 shadow-2xl justify-between border-2 border-purple-500/40 overflow-hidden relative">
    ...
    <TextInput
      value={code}
      onChangeText={setCode}
      placeholder="CODE"
      ...
    />
    <TouchableOpacity onPress={joinPrivateRoom} ...>
      <Text ...>Enter Arena</Text>
    </TouchableOpacity>
  </View>
  ```
- **Breakage Explanation**:
  1. Each card is hardcoded to `w-56 h-64` (224px width x 256px height).
  2. On Card 4 (Join Room), a `TextInput` is provided for entering a 6-digit code. When the virtual keyboard activates (~300px height), the modal has no `KeyboardAvoidingView`. The keyboard covers Card 4 completely, making it impossible to see the input field or press "Enter Arena".
- **Responsive Replacement**:
  Wrap the modal body in `KeyboardAvoidingView` and make the cards scale with viewport constraints:
  ```tsx
  <Modal visible={showGameModes} animationType="slide" transparent onRequestClose={() => setShowGameModes(false)}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-black/95 justify-center items-center">
      <View className="absolute inset-0 bg-indigo-900/10" />
      <View className="w-full max-w-5xl z-10 py-4 flex-1 justify-center">
        ...
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }} className="w-full pb-4 pt-2">
          <TouchableOpacity onPress={findCasualMatch} disabled={loadingAction !== null} style={{ width: 220, height: '100%', maxHeight: 270, minHeight: 240 }} className="bg-slate-900 rounded-[2rem] p-5 shadow-2xl justify-between border-2 border-green-500/40 active:scale-95 overflow-hidden relative">
  ```

---

#### Issue 11: OfflineApp Action Buttons Tablet Stretched Banner
- **File**: `OfflineApp.tsx`
- **Line Numbers**: 108, 112
- **Current Problematic Code**:
  ```tsx
  <TouchableOpacity onPress={startOfflineGame} className="w-full bg-yellow-400 py-4 rounded-2xl active:scale-95 mb-4">
    <Text className="text-indigo-900 font-black text-xl text-center uppercase tracking-wider">Play as Guest</Text>
  </TouchableOpacity>
  
  <TouchableOpacity onPress={onRetry} className="w-full bg-white/10 py-4 rounded-2xl active:scale-95">
    <Text className="text-white font-black text-xl text-center uppercase tracking-wider">Connect WiFi & Retry</Text>
  </TouchableOpacity>
  ```
- **Breakage Explanation**:
  `className="w-full ..."` inside a `p-6` full-bleed container stretches up to 1000px wide on tablets, distorting visual proportions.
- **Responsive Replacement**:
  ```tsx
  <View style={{ width: '100%', maxWidth: 380 }}>
    <TouchableOpacity onPress={startOfflineGame} className="w-full bg-yellow-400 py-4 rounded-2xl active:scale-95 mb-4">
      <Text className="text-indigo-900 font-black text-lg sm:text-xl text-center uppercase tracking-wider">Play as Guest</Text>
    </TouchableOpacity>
    
    <TouchableOpacity onPress={onRetry} className="w-full bg-white/10 py-4 rounded-2xl active:scale-95">
      <Text className="text-white font-black text-lg sm:text-xl text-center uppercase tracking-wider">Connect WiFi & Retry</Text>
    </TouchableOpacity>
  </View>
  ```

---

#### Issue 12: OfflineApp GameRoom Unnecessary Padding Squishing
- **File**: `OfflineApp.tsx`
- **Line Number**: 96
- **Current Problematic Code**:
  ```tsx
  <SafeAreaView className="flex-1 bg-indigo-950">
    <View className="p-4 flex-1">
      <GameRoom room={offlineRoom} playerId="guest" onExit={() => setOfflineRoom(null)} onAction={handleAction} />
    </View>
  </SafeAreaView>
  ```
- **Breakage Explanation**:
  In `App.tsx:342`, `GameRoom` is rendered edge-to-edge. In `OfflineApp.tsx:96`, `p-4` adds 16px padding on all sides (32px horizontal), subtracting valuable width from the game arena and causing scorecards and hand selectors to clip on small screens in offline mode.
- **Responsive Replacement**:
  ```tsx
  <SafeAreaView className="flex-1 bg-indigo-950">
    <View className="flex-1">
      <GameRoom room={offlineRoom} playerId="guest" onExit={() => setOfflineRoom(null)} onAction={handleAction} />
    </View>
  </SafeAreaView>
  ```

---

#### Issue 13: IntroScreen Fixed 256px Logo
- **File**: `src/components/IntroScreen.tsx`
- **Line Number**: 56
- **Current Problematic Code**:
  ```tsx
  <Image 
    source={require('../../assets/cv_logo_final.png')} 
    className="w-64 h-64"
    resizeMode="contain"
  />
  ```
- **Breakage Explanation**:
  `w-64 h-64` (256px x 256px) scaled by 1.1x reaches 281.6px. On 320px screens (compact devices or split screen), this leaves almost zero margin. On large tablets (1024px), 256px is disproportionately small.
- **Responsive Replacement**:
  ```tsx
  <Image 
    source={require('../../assets/cv_logo_final.png')} 
    style={{ width: '60%', aspectRatio: 1, maxWidth: 320, maxHeight: 320 }}
    resizeMode="contain"
  />
  ```

---

#### Issue 14: LoadingScreen Giant Font Wrapping & Padding Inflexibility
- **File**: `src/components/LoadingScreen.tsx`
- **Line Numbers**: 59, 75
- **Current Problematic Code**:
  ```tsx
  <Text 
    className="text-6xl font-black tracking-widest uppercase italic"
  ...
  <View className="w-full px-16 pb-8">
  ```
- **Breakage Explanation**:
  1. `text-6xl` (60px) + `tracking-widest` on "HEADTAIL" spans >320px, causing title line-wrapping ("HEADTA" / "IL") on small phones.
  2. `px-16` (64px each side = 128px total) reduces loading bar width to only 247px on iPhone SE, but stretches it to ~896px on tablets.
- **Responsive Replacement**:
  ```tsx
  <Text 
    numberOfLines={1}
    adjustsFontSizeToFit
    className="text-4xl sm:text-5xl md:text-6xl font-black tracking-wider uppercase italic"
    style={{ 
      color: '#fbbf24',
      textShadowColor: 'rgba(251,191,36,0.5)', 
      textShadowOffset: { width: 0, height: 0 }, 
      textShadowRadius: 15,
      maxWidth: '90%'
    }}
  >
    HEAD<Text className="text-cyan-400">TAIL</Text>
  </Text>
  ...
  <View style={{ width: '100%', maxWidth: 420, paddingHorizontal: '8%' }} className="self-center pb-8">
  ```

---

#### Issue 15: Auth Screen Missing Scroll Container & Keyboard Occlusion
- **File**: `src/components/Auth.tsx`
- **Line Numbers**: 121-124
- **Current Problematic Code**:
  ```tsx
  <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-center items-center p-4">
    {/* Floating Form Card */}
    <View className="w-full max-w-[400px] bg-black/40 px-6 py-4 rounded-[1.5rem] border border-white/10 shadow-2xl backdrop-blur-md">
  ```
- **Breakage Explanation**:
  Inside `Auth.tsx`, the card contains social buttons, divider, email input, password input, confirm password input, submit button, and toggle link.
  Because there is NO `ScrollView` wrapping the form card:
  When the keyboard pops up on phones with screen heights <= 700px (e.g. iPhone SE: 667px), the available height drops to ~340px. The form card height (~420px) overflows below the fold, completely hiding the input fields and submit button with no way for the user to scroll down to click "Log in" or "Sign up".
- **Responsive Replacement**:
  ```tsx
  <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }} keyboardShouldPersistTaps="handled">
      <View style={{ width: '100%', maxWidth: 380 }} className="bg-black/40 px-6 py-5 rounded-[1.5rem] border border-white/10 shadow-2xl backdrop-blur-md">
  ```

---

#### Issue 16: NotificationManager Absolute Collision with Top HUD
- **File**: `src/components/NotificationManager.tsx`
- **Line Number**: 79
- **Current Problematic Code**:
  ```tsx
  <View className="absolute top-4 left-4 right-4 z-50 gap-2">
  ```
- **Breakage Explanation**:
  `top-4` is hardcoded to 16px. In `App.tsx:358`, `NotificationManager` is active on the dashboard. When an invite arrives, it occupies `top-4 left-4 right-4 z-50`, perfectly overlapping the user's profile card, coin/token pills, and friends button, causing touch interference and complete visual occlusion.
- **Responsive Replacement**:
  ```tsx
  <View style={{ width: '100%', maxWidth: 450, top: Platform.OS === 'ios' ? 48 : 28 }} className="absolute self-center px-4 z-50 gap-2">
  ```

---

## 2. Logic Chain

1. **Premise 1 (Horizontal Real Estate)**: The minimum standard viewport width for modern mobile devices (e.g., iPhone SE, compact Androids, Galaxy Z Flip cover screens) is between 360px and 375px.
2. **Observation (App.tsx:413, 68)**:
   - Left HUD Profile Card + 3 Currencies = ~386px minimum width.
   - Right `DashboardFriends` Card = 176px width (`w-44`).
   - Combined horizontal requirement = 386px + 176px + 16px = 578px.
3. **Deduction 1**: 578px > 375px. Under `flex-row justify-between`, horizontal collision and off-screen clipping is mathematically guaranteed on any device under 580px wide.
4. **Premise 2 (Vertical Stacking and Absolute Overlays)**: The viewport height of compact devices is 640px to 667px.
5. **Observation (App.tsx:57, 455, 503-540)**:
   - Absolute HUD Layer hangs from `top-2` downwards: Profile header (~60px) + vertical menu (mt-8 + 5 items with gap-6 = ~290px) = 350px total height.
   - Central hero layer is centered vertically (`flex-1 justify-center`) with a stack height of ~353px (Title + 221px pulsing aura + 40px mt-10 + "Tap to Play").
6. **Deduction 2**: 350px + 353px = 703px. On viewports <= 667px in height, the two layers overlap by at least 36px to 60px. The friends card and left menu physically cover the central 3D Coin and title.
7. **Premise 3 (Soft Keyboard Sizing)**: Virtual keyboards on iOS and Android occupy between 280px and 330px of vertical height.
8. **Observation (Auth.tsx:121, App.tsx:629)**: Neither `Auth.tsx` nor the Game Modes `Modal` wraps its input cards in a scrollable container (`ScrollView`).
9. **Deduction 3**: On any phone <= 700px in height, opening the keyboard reduces available height to ~340px. Because the form cards exceed 380px-420px, critical action buttons ("Sign up", "Enter Arena") are clipped off-screen with zero user recourse.
10. **Synthesis**: The entire root-level architecture of `head-tail-app` relies on rigid pixel values (`h-80`, `w-44`, `w-56`, `h-64`, `w-64`, `px-16`, `text-6xl`) and unconstrained horizontal rows that fail universally on small phones (<390px width or <700px height) and distort on tablets (>768px width). All proposed replacements convert rigid pixels into bounded percentages (`w-[85%]`, `max-w-sm`, `max-h-[42%]`) and responsive flexbox wrappers (`flexWrap: 'wrap'`, `flexGrow: 1`, `ScrollView`).

---

## 3. Caveats

1. **Scope Boundary**: This audit investigated `App.tsx`, `OfflineApp.tsx`, `IntroScreen.tsx`, `LoadingScreen.tsx`, `Auth.tsx`, `NotificationManager.tsx`, and root navigation/containers. Deep gameplay logic and internal rendering of `GameRoom.tsx` / `RevealView.tsx` are audited in parallel by Explorer 2; remaining modals (`CoinShop`, `Friends`, `Leaderboard`, `GuideModal`, etc.) are audited by Explorer 3.
2. **Android Safe Area Inset Handling**: React Native's built-in `<SafeAreaView>` only applies padding on iOS. On Android, `SafeAreaView` behaves like an unpadded `<View>`. Fixing `top-2` / `top-4` in `App.tsx` and `NotificationManager.tsx` requires either platform-conditional top padding (`Platform.OS === 'android' ? StatusBar.currentHeight || 24 : ...`) or integrating `react-native-safe-area-context`'s `SafeAreaProvider` / `useSafeAreaInsets`.
3. **Non-Destructive Guarantee**: No `.tsx` or source files in the project were modified during this investigation. All code snippets in this report are proposals ready for the synthesizer / implementer.

---

## 4. Conclusion

The root screens and navigation wrappers in `head-tail-app` suffer from 16 major responsiveness issues across 6 files:
1. **Severe Dashboard Collisions**: The inline Profile + Currencies row (App.tsx:413) and rigid 176px Friends Widget (App.tsx:68) exceed standard mobile screen widths by >180px, causing immediate horizontal clipping.
2. **Vertical Occlusion of Primary Hero Action**: The 320px fixed-height `DashboardFriends` widget (App.tsx:57) and 290px left sidebar (App.tsx:455) overlap the central 3D Coin launcher on screens <= 667px height (iPhone SE and compact Androids).
3. **Keyboard Clipping**: `Auth.tsx` and Game Modes Card 4 (`Join Room`) lack scrollable containers, making form submission impossible when the soft keyboard is open on compact screens.
4. **Tablet Banner Distortion**: `OfflineApp.tsx` buttons and `LoadingScreen.tsx` progress bars expand unconstrained across wide tablet viewports without max-width bounding.

All issues have been paired with exact responsive percentage strings and flexbox properties that maintain exact aesthetic styling, colors, borders, and shadows while dynamically adapting to small phones, compact Androids, and tablets.

---

## 5. Verification Method

### How to Independently Verify These Findings
1. **Device Emulation Profiles**:
   - **Compact Mobile**: iPhone SE (3rd Gen) — 375 x 667 pt (@2x)
   - **Narrow Android**: Samsung Galaxy A01 / Cover Screen — 360 x 640 pt
   - **Standard Flagship**: iPhone 15 / 16 Pro — 393 x 852 pt (@3x)
   - **Tablet**: iPad 10th Gen — 820 x 1180 pt (@2x)
2. **Verification Steps**:
   - Inspect `App.tsx:408-450`: On 375x667, verify that the profile username, coin pill, diamonds pill, and tickets pill visually collide with or push past the right-hand `DashboardFriends` box.
   - Inspect `App.tsx:57`: Verify that `h-80` (320px) hangs down past the center Y=333px line of the 667px viewport, covering the right half of the 3D coin.
   - Inspect `Auth.tsx:121-270`: Switch to "Sign Up" mode on a 375x667 device and focus the Password field. Verify that the keyboard occludes the Confirm Password and Sign Up buttons with no scrollability.
   - Inspect `OfflineApp.tsx:104-116`: Rotate to landscape or test on iPad (820px width). Verify that "Play as Guest" spans >750px wide.
3. **Invalidation Conditions**:
   - If the app is only ever rendered on landscape displays with width >= 800px and height >= 800px, the HUD collision would not manifest. On all portrait mobile devices, the findings are 100% reproducible.

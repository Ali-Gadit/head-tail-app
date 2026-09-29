# Head-Tail App — React Native Responsiveness Audit & Modernization Blueprint

**Document Version**: 1.0.0  
**Target Codebase**: `Ali-Gadit/head-tail-app` (`C:\MyGames\head-tail-app`)  
**Audit Scope**: Complete 21-Component Baseline Inventory across Root (`App.tsx`, `OfflineApp.tsx`) and `src/components/`  
**Evaluation Standard**: Dynamic multi-device viewport scaling (iPhone SE 375×667, Android Compact 360×640/360×800, Modern Flagships 393×852, Tablets/iPads 820×1180 / 1024×1366, Foldables 320×568, and Landscape Orientations)  
**Strict Implementation Rule**: Non-destructive audit — all recommended fixes use percentage strings (`'100%'`, `'85%'`, `'42%'`, etc.) and flexbox properties (`flex: 1`, `flexGrow: 1`, `flexShrink: 1`, `flexWrap: 'wrap'`, `aspectRatio`) without hardcoded pixel bounds.

---

## 1. Executive Summary & Cross-Device Impact Analysis

### 1.1 High-Level Audit Findings
A comprehensive, line-by-line inspection of the React Native codebase in `head-tail-app` reveals widespread reliance on hardcoded absolute pixel dimensions (`w-44`, `h-80`, `w-56`, `h-64`, `minWidth: 185`, `width: 220`, `px-16`, `text-6xl`, `top-4`). While these fixed dimensions were authored against a single standard device viewport (approximately 390×844pt in portrait or landscape simulator), they cause immediate, severe visual and functional breakage when deployed across real-world mobile ecosystems.

The failures fall into five primary categories:

```
+----------------------------------------------------------------------------------------------------+
|                                    FAILURE TAXONOMY & IMPACT MATRIX                                |
+-----------------------------------+------------------------------------+---------------------------+
| Failure Category                  | Root Structural Cause              | User Experience Breakage  |
+-----------------------------------+------------------------------------+---------------------------+
| Category A: Horizontal Collision  | Hardcoded minWidths (e.g. 185px)   | Elements overlap, text    |
|             & Out-of-Bounds       | and rigid row child widths         | truncates to 2-3 letters, |
|             Clipping              | exceeding 360-375px screen width.  | buttons push off-screen.  |
+-----------------------------------+------------------------------------+---------------------------+
| Category B: Vertical Overflow &   | Stacking heavy content sections    | Primary CTAs ("Start      |
|             CTA Loss              | in unscrollable <View> containers  | Match", "Join Room") drop |
|                                   | on screens with height < 800px.    | below viewport fold.      |
+-----------------------------------+------------------------------------+---------------------------+
| Category C: Soft Keyboard         | Input cards wrapped in             | Virtual keyboard covers   |
|             Occlusion             | KeyboardAvoidingView without a     | text fields and submit    |
|                                   | nested ScrollView container.       | buttons completely.       |
+-----------------------------------+------------------------------------+---------------------------+
| Category D: Notch & Status Bar    | Fixed 'top-2' or 'top-4' (8-16px)  | Hardware notch, camera    |
|             Collisions            | absolute positioning without Safe  | cutouts, and status bar   |
|                                   | Area inset accommodation.          | obscure interactive HUDs. |
+-----------------------------------+------------------------------------+---------------------------+
| Category E: Tablet & Large Screen | Elements stretching to 100% width  | Distorted buttons, giant  |
|             Distortion            | or staying at tiny 256px sizes on  | progress bars, tiny lost  |
|                                   | 768-1024px tablet viewports.       | central game coins.       |
+-----------------------------------+------------------------------------+---------------------------+
```

### 1.2 Target Device Profiles & Breakage Scenarios

To ensure industrial-grade mobile responsiveness, the audit benchmarked the codebase against six distinct mobile display profiles:

1. **Compact Portrait Phone (iPhone SE 2nd/3rd Gen, 375 × 667 pt / @2x)**:
   - *Failure*: Dashboard top HUD Profile + 3 Currencies require 386px width, colliding with the 176px Friends widget (total 578px > 375px). The 320px (`h-80`) Friends widget hangs down to Y=328, physically covering the interactive 3D Coin and Game Title.
   - *Failure*: Matchmaking player cards (`minWidth: 185`) + VS container (82px) + padding require 492px, crashing into each other.
   - *Failure*: GameRoom host lobby (830px height) has no `<ScrollView>`, permanently clipping the "Start Match" button off-screen.

2. **Narrow Android Phone / Cover Screen (Galaxy A01, Z Flip Cover, 360 × 640–800 pt / @2–3x)**:
   - *Failure*: Two 128px (`w-32`) Toss Call coins inside 160px padding require 416px, overflowing the 360px screen boundary.
   - *Failure*: HandSelector 3-column button grid (80px × 3 + gaps = 264px) inside 64px padding requires 328px, causing irregular 2-2-2 or 3-2-1 wrapping.
   - *Failure*: DailyRewardModal 7-day row gives only 41px width per card, clipping day numbers and coin badges.

3. **Small Sub-360px Mobile Viewports (320 × 568 pt / iPod Touch, Split View)**:
   - *Failure*: LoadingScreen `text-6xl tracking-widest` spans >320px, violently breaking the word "HEADTAIL" across two lines.
   - *Failure*: Auth card overflows vertically when the soft keyboard rises; users cannot scroll down to submit authentication.

4. **Modern Flagship with Dynamic Island / Notch (iPhone 14/15/16 Pro, 393 × 852 pt / @3x)**:
   - *Failure*: `NotificationManager.tsx` hardcodes `top-4` (16px). Dynamic Island requires 54–59px safe top inset. Incoming match invites render directly underneath the camera island.
   - *Failure*: GameRoom floating buttons (Exit, Mic, Speaker, Chat) positioned at `top-0 mt-1` (4px) collide with the notch and status bar clock.

5. **Tablets & Large Screen Devices (iPad 10th Gen 820 × 1180 pt, iPad Pro 1024 × 1366 pt)**:
   - *Failure*: `OfflineApp.tsx` buttons and `LoadingScreen.tsx` progress bars stretch across 800–1000px without max-width bounding, appearing as giant banners.
   - *Failure*: Central hero 3D coin (`w-32 h-32` = 128px) appears miniature and lost on large 1024px displays.
   - *Failure*: Settings modal (`w-64` = 256px) appears as a tiny box lost in the center of the tablet viewport.

6. **Landscape Orientation (e.g. 667 × 375 pt / 800 × 360 pt)**:
   - *Failure*: GameRoom Casual Matchmaking layout was designed around landscape, but Modals (`WorldChat.tsx` `h-80`, `CoinShop.tsx` confirm dialog) have fixed heights of 320px that exceed the 360–375px total landscape height, locking out the user.

---

## 2. Full Component Inventory & Responsiveness Risk Matrix

The `head-tail-app` codebase contains exactly 21 distinct UI and functional components. The table below provides an exhaustive architectural inventory, categorizing each component's role, risk level, primary defect types, and the required responsive layout strategy.

| # | Component Name | File Path & Declaration | Purpose / Architecture Role | Risk Level | Primary Defect Types | Responsive Strategy |
|---|---|---|---|---|---|---|
| 1 | `App` | `App.tsx:687` | Root application orchestrator, network check, offline fallback gate, and status bar controller. | **Medium** | Lacks safe area handling on Android; unconstrained global wrapper. | Wrap in responsive root container with safe-area bounds. |
| 2 | `Main` | `App.tsx:654` | Primary session-based router switching between Loading, Auth, and Dashboard. | **Low** | Pure flex-1 wrapper; delegates layout to children. | Retain `flex-1`; propagate safe area constraints. |
| 3 | `Dashboard` | `App.tsx:102` | Main Game Hub Screen: Absolute HUD, live friends widget, 3D animated hero coin launcher, modals host. | **CRITICAL** | Horizontal currency collision, vertical HUD-to-hero overlap, rigid widget sizes. | Flex-wrap currency pills, percentage max-height on friends, fluid coin sizing. |
| 4 | `DashboardFriends` | `App.tsx:27` | Dashboard top-right live friends widget and Settings trigger. | **CRITICAL** | Fixed `h-80` (320px) height and `w-44` (176px) width; covers central hero coin. | Constrain with `maxHeight: '42%'`, `width: '45%'`, fluid padding. |
| 5 | `OfflineApp` | `OfflineApp.tsx:7` | Offline fallback screen and guest match coordinator. | **High** | Full-bleed buttons stretch excessively on tablets; adds unneeded `p-4` around GameRoom. | Constrain button container with `maxWidth: '85%'`; remove GameRoom outer padding. |
| 6 | `IntroScreen` | `src/components/IntroScreen.tsx:5` | Branded audio splash screen with animated scale pulse. | **Medium** | Hardcoded `w-64 h-64` (256px) logo scaled by 1.1x clips on small heights. | Replace with `width: '60%'`, `aspectRatio: 1`. |
| 7 | `LoadingScreen` | `src/components/LoadingScreen.tsx:4` | Animated splash/loading screen with progress bar. | **Medium** | `text-6xl tracking-widest` wraps awkwardly on <360px screens; `px-16` padding is rigid. | Use `adjustsFontSizeToFit`, `numberOfLines={1}`, and `paddingHorizontal: '8%'`. |
| 8 | `Auth` | `src/components/Auth.tsx:12` | Login / Signup screen with social logins and email inputs. | **High** | Missing `ScrollView` inside `KeyboardAvoidingView`; inputs clipped when keyboard opens. | Add `ScrollView contentContainerStyle={{ flexGrow: 1 }}` and `width: '90%'`. |
| 9 | `AuthProvider` | `src/components/AuthProvider.tsx:34` | Headless authentication context provider. | **Safe** | Headless logic (no rendering constraints). | No layout modifications required. |
| 10 | `BackgroundMusic` | `src/components/BackgroundMusic.tsx:5` | Headless ambient audio player. | **Safe** | Headless audio runner (returns `null`). | No layout modifications required. |
| 11 | `NotificationManager` | `src/components/NotificationManager.tsx:10` | Floating in-app match invite and challenge banner. | **High** | Fixed `top-4` collides with status bar/notch and directly overlaps HUD profile and currency pill buttons. | Wrap in `SafeAreaView` with `width: '92%'`, `top: '2%'`. |
| 12 | `CoinShop` | `src/components/CoinShop.tsx:12` | In-app store modal for Gold packs and Private Room Tokens. | **High** | Confirmation and success overlays have fixed vertical heights and oversized buttons. | Wrap overlays in `ScrollView` with fluid button widths (`width: '45%'`). |
| 13 | `DailyRewardModal` | `src/components/DailyRewardModal.tsx:13` | 7-day login streak reward calendar modal. | **High** | 7-column inline row compresses to <41px width on compact screens, truncating reward text. | Convert to horizontal `ScrollView` or fluid flexbox wrap (`width: '13%'`). |
| 14 | `Friends` | `src/components/Friends.tsx:13` | Full friend management modal (search, pending requests, friend list). | **Medium** | Missing `KeyboardAvoidingView` on friend ID search; unconstrained tablet stretch. | Add `KeyboardAvoidingView` and constrain container with `maxWidth: '92%'`. |
| 15 | `GuideModal` | `src/components/GuideModal.tsx:9` | Multi-section "How to Play" tutorial and rules modal. | **Medium** | Hardcoded `h-[95%]` lacks tablet width bounding; scrollbar math fragile. | Constrain container with `maxWidth: '92%'`, `height: '90%'`. |
| 16 | `HandSelector` | `src/components/HandSelector.tsx:14` | In-game 1–6 finger run selector with timer. | **CRITICAL** | Fixed `w-20 h-24` (80×96px) buttons break 3-column grid inside padded containers. | Replace with `width: '29%'`, `aspectRatio: 4/5`, `gap: '3%'`. |
| 17 | `InviteEarnModal` | `src/components/InviteEarnModal.tsx:9` | Referral code and friend invitation sharing modal. | **Medium** | 7-digit monospace code with `0.2em` letter tracking overflows row, clipping Copy button. | Add `flex-1`, `adjustsFontSizeToFit`, and `flexShrink: 0` on Copy button. |
| 18 | `InviteFriends` | `src/components/InviteFriends.tsx:11` | In-lobby friend invite drawer widget. | **Low** | Arbitrary fixed `maxHeight: 150` on internal friend list. | Replace with `maxHeight: '35%'` or fluid flexbox constraints. |
| 19 | `Leaderboard` | `src/components/Leaderboard.tsx:11` | Ranked global player standings and coin tier rankings. | **Medium** | Full-width bottom sheet stretches unnaturally on tablets without max-width bounds. | Constrain bottom sheet with `maxWidth: '90%'`, `alignSelf: 'center'`. |
| 20 | `OnboardingModal` | `src/components/OnboardingModal.tsx:13` | First-time user profile setup and username modal. | **High** | `KeyboardAvoidingView` lacks nested `ScrollView`; submit button hidden by keyboard. | Add `ScrollView contentContainerStyle={{ flexGrow: 1 }}` and `width: '90%'`. |
| 21 | `RevealView` | `src/components/RevealView.tsx:46` | 3D coin toss showdown and delivery outcome reveal animations. | **CRITICAL** | Rigid 96px coin, fixed -60px translateY, rigid 48px divider lines, fixed `h-24` result container. | Fluid percentage widths (`width: '24%'`, `aspectRatio: 1`), `flex: 1` divider gradients. |
| 22 | `Scoreboard` | `src/components/Scoreboard.tsx:46` | Real-time scoreboard card, overs tracker, and target display. | **High** | Heavy padding (`px-6`), role tag text truncation, and absolute top-full spectator badge collision. | Reduce padding to `paddingHorizontal: '4%'`, bring spectator badge into normal flow. |
| 23 | `GameRoom` | `src/components/GameRoom.tsx:180` | Match arena coordinator, Matchmaking screen, and waiting lobby. | **CRITICAL** | Casual matchmaking `minWidth: 185` crashes cards; host lobby lacks scroll view; notch collision. | Fluid flex card containers (`maxWidth: '40%'`), wrap lobby in `ScrollView`, notch insets. |
| 24 | `WorldChat` | `src/components/WorldChat.tsx:14` | Global real-time public chat drawer. | **Medium** | Rigid `h-80` (320px) height locks out screen on landscape and small Android devices. | Replace with `flex: 1`, `minHeight: '35%'`, `maxHeight: '55%'`. |

---

## 3. Deep-Dive Audit: Major Top-Level Screens

### 3.1 Dashboard & Navigation Shell (`App.tsx`)

#### Issue D-1: Dashboard Friends Widget Height Overlapping Central Hero Coin
- **File**: `App.tsx`
- **Line Number**: 57
- **Current Problematic Code**:
  ```tsx
  <View className="flex-col items-end gap-3 pr-2 mt-1 pointer-events-auto h-80">
  ```
- **Breakage Explanation**:
  `h-80` enforces a fixed 320px height. On compact mobile screens such as iPhone SE (height 667px) or Galaxy A01 (height 640px), 320px occupies over 48% of total screen height. Because this widget lives inside an absolute overlay (`absolute top-2 left-4 right-4 z-50`), it hangs down into the center of the viewport, physically covering the right half of the 3D animated coin and the "HEAD TAIL" title, intercepting touch events.
- **Exact Responsive Replacement**:
  ```tsx
  <View style={{ maxHeight: '42%' }} className="flex-col items-end gap-3 pr-2 mt-1 pointer-events-auto flex-shrink">
  ```

---

#### Issue D-2: Dashboard Friends Widget Rigid Width & Horizontal HUD Crash
- **File**: `App.tsx`
- **Line Number**: 68
- **Current Problematic Code**:
  ```tsx
  <View className="bg-indigo-900/40 border border-indigo-400/20 rounded-3xl p-5 w-44 flex-1 shadow-2xl">
  ```
- **Breakage Explanation**:
  `w-44` enforces a hard 176px width. On a 360px wide screen, taking 176px on the right leaves only ~180px for the left HUD (which demands 386px for user profile, ID, and 3 currency pills). The two sides collide violently. Inside the widget, `p-5` (40px horizontal padding) leaves only 84px for the username, causing severe name truncation.
- **Exact Responsive Replacement**:
  ```tsx
  <View style={{ width: '45%', maxWidth: '50%', padding: '3%' }} className="bg-indigo-900/40 border border-indigo-400/20 rounded-3xl flex-1 shadow-2xl">
  ```

---

#### Issue D-3: Settings Button Undersized Touch Target
- **File**: `App.tsx`
- **Line Number**: 63
- **Current Problematic Code**:
  ```tsx
  <TouchableOpacity onPress={onOpenSettings} className="bg-gray-600/80 w-9 h-9 rounded-full items-center justify-center border border-gray-400 active:scale-95 shadow-lg">
  ```
- **Breakage Explanation**:
  `w-9 h-9` equals 36px × 36px, violating Apple Human Interface Guidelines and Google Material Design guidelines (minimum 44×44pt / 48×48dp). On high-density screens, taps miss the button and hit underlying components.
- **Exact Responsive Replacement**:
  ```tsx
  <TouchableOpacity onPress={onOpenSettings} style={{ width: '12%', aspectRatio: 1 }} className="bg-gray-600/80 rounded-full items-center justify-center border border-gray-400 active:scale-95 shadow-lg" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
  ```

---

#### Issue D-4: Settings Modal Rigid Width & Button Clipping
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
  `w-64` (256px) leaves only 144px width for the Sign Out button. Inside a rigid `h-12` (48px) container, the text "Signing Out..." overflows vertically or truncates. On tablets, a 256px dialog appears tiny and disproportionate.
- **Exact Responsive Replacement**:
  ```tsx
  <View style={{ width: '85%', maxWidth: '90%' }} className="bg-indigo-950 rounded-3xl p-6 border border-white/20 shadow-2xl items-center">
    <Text className="text-white font-black text-xl tracking-widest uppercase mb-6">Settings</Text>
    <View className="flex-row gap-4 mb-6 w-full items-center">
      <TouchableOpacity onPress={() => setSoundEnabled(!soundEnabled)} style={{ width: '15%', aspectRatio: 1 }} className="rounded-full items-center justify-center bg-purple-600 border-2 border-purple-400 shadow-lg active:scale-95">
        <Text className="text-xl">{soundEnabled ? '🎵' : '🔇'}</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={async () => {
          setLoading(true);
          await signOut();
        }} 
        disabled={loading}
        style={{ flex: 1 }}
        className={`py-3 px-4 bg-red-500/80 rounded-full items-center justify-center border-2 border-red-400 ${loading ? 'opacity-50' : 'active:scale-95'}`}
      >
        <Text numberOfLines={1} adjustsFontSizeToFit className="text-white font-black uppercase tracking-wider text-xs">{loading ? 'Signing Out...' : 'Sign Out'}</Text>
      </TouchableOpacity>
    </View>
  ```

---

#### Issue D-5: Top HUD Unsafe Top Inset
- **File**: `App.tsx`
- **Line Number**: 408
- **Current Problematic Code**:
  ```tsx
  <View className="absolute top-2 left-4 right-4 z-50 flex-row justify-between items-start" pointerEvents="box-none">
  ```
- **Breakage Explanation**:
  `top-2` equals 8px from the top edge. On modern iPhones (notch/Dynamic Island safe inset 47–59px) and Android devices (where `SafeAreaView` provides zero top padding), the profile card, currencies, and friends widget render behind the status bar clock, battery indicator, and camera cutouts.
- **Exact Responsive Replacement**:
  ```tsx
  <View style={{ width: '100%', top: '2%' }} className="absolute left-0 right-0 px-4 z-50 flex-row justify-between items-start" pointerEvents="box-none">
  ```

---

#### Issue D-6: Profile Card and Currencies Horizontal Overflow Collapse
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
  Declaring the profile card (~130px) and three currency pills (~240px combined) in an inline `flex-row gap-4` without wrapping requires at least 386px width. Opposite sits the 176px friends box. Total width requirement = 578px. On standard 360–393px mobile screens, the currencies are shoved off-screen or forced under the friends widget.
- **Exact Responsive Replacement**:
  ```tsx
  <View style={{ maxWidth: '52%' }} className="flex-col gap-2 items-start">
    {/* Responsive Profile Card */}
    <View className="flex-row items-center bg-black/40 rounded-full pr-3 p-1 border border-white/10 max-w-full">
      <View style={{ width: '22%', aspectRatio: 1 }} className="bg-indigo-500 rounded-full items-center justify-center border-2 border-indigo-300">
        <Text className="text-sm">👤</Text>
      </View>
      <View className="ml-2 flex-shrink">
        <Text numberOfLines={1} className="text-white font-bold text-xs">{profile.username}</Text>
        <Text className="text-white/50 text-[9px] font-mono">ID: {String(profile?.friend_id || 0).padStart(7, '0')}</Text>
      </View>
    </View>

    {/* Responsive Flex-Wrapping Currencies Row */}
    <View className="flex-row flex-wrap items-center gap-1.5">
      <TouchableOpacity onPress={() => setShowCoinShop(true)} className="bg-black/40 rounded-full pl-2 pr-1 py-0.5 flex-row items-center border border-yellow-500/20 active:scale-95 shadow-xl">
        <Text className="text-yellow-400 font-black text-[10px] tracking-wider mr-1.5">🪙 {profile.coins || 0}</Text>
        <View style={{ width: '20%', aspectRatio: 1 }} className="bg-yellow-400/20 rounded-full items-center justify-center border border-yellow-400/30">
          <Text className="text-yellow-400 font-bold text-[11px]" style={{ includeFontPadding: false, textAlignVertical: 'center' }}>+</Text>
        </View>
      </TouchableOpacity>

      <View className="bg-black/40 rounded-full px-2 py-0.5 flex-row items-center border border-cyan-500/20 shadow-xl">
        <Text className="text-cyan-400 font-black text-[10px] tracking-wider">💎 {profile.premium_currency || 0}</Text>
      </View>

      <TouchableOpacity onPress={() => setShowCoinShop(true)} className="bg-black/40 rounded-full pl-2 pr-1 py-0.5 flex-row items-center border border-slate-300/20 active:scale-95 shadow-xl">
        <Text className="text-slate-200 font-black text-[10px] tracking-wider mr-1.5">🎟️ {profile.private_room_tokens || 0}</Text>
        <View style={{ width: '20%', aspectRatio: 1 }} className="bg-slate-300/20 rounded-full items-center justify-center border border-slate-300/30">
          <Text className="text-white font-bold text-[11px]" style={{ includeFontPadding: false, textAlignVertical: 'center' }}>+</Text>
        </View>
      </TouchableOpacity>
    </View>
  </View>
  ```

---

#### Issue D-7: Left Vertical Menu Height Colliding with Central 3D Coin
- **File**: `App.tsx`
- **Line Number**: 455
- **Current Problematic Code**:
  ```tsx
  {/* Vertical Menu */}
  <View className="flex-col gap-6 mt-8 ml-2">
  ```
- **Breakage Explanation**:
  5 navigation buttons (Store, Daily Rewards, Invite, Leaderboard, How to Play) with `gap-6` (24px) and `mt-8` (32px) create a ~290px column. Together with the profile card above, the left HUD spans ~350px. On screens <700px in height, this column reaches past the vertical center, colliding with the 3D coin launcher.
- **Exact Responsive Replacement**:
  ```tsx
  <View style={{ gap: 8, marginTop: '3%' }} className="flex-col ml-1 flex-shrink">
  ```

---

#### Issue D-8: Central Hero 3D Coin Sizing & Pulse Overflow
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
  Hardcoded aura sizes (`w-48 h-48` = 192px), coin (`w-32 h-32` = 128px), and inner elements scale up to 221px during pulse animation. With `mt-10` (40px) and Title (44px), the hero stack occupies ~353px. Placed under the 350px HUD, total height demand exceeds 703px, causing overlapping on iPhone SE (667px).
- **Exact Responsive Replacement**:
  ```tsx
  <Animated.View {...coinPanResponder.panHandlers} className="flex-1 justify-center items-center py-2">
    <View className="items-center mb-2">
      <Text adjustsFontSizeToFit numberOfLines={1} className="text-3xl sm:text-4xl font-black text-white italic tracking-tighter shadow-xl">HEAD <Text className="text-yellow-400">TAIL</Text></Text>
    </View>

    <View className="items-center mt-1">
      <TouchableOpacity onPress={() => setShowGameModes(true)} className="items-center active:scale-95">
        {/* Responsive Fluid Aura Container */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }], width: '48%', aspectRatio: 1 }} className="rounded-full bg-yellow-500/10 items-center justify-center border border-yellow-400/20">
          <View style={{ width: '82%', aspectRatio: 1 }} className="rounded-full bg-yellow-500/20 items-center justify-center border border-yellow-400/30">
            <Animated.View 
              style={{ transform: [{ rotateX }, { rotateY }], width: '78%', aspectRatio: 1 }}
              className="rounded-full bg-yellow-400 items-center justify-center border-b-8 border-yellow-600 shadow-2xl relative overflow-hidden border-t-2 border-l-2 border-r-2 border-yellow-200"
            >
              <View className="absolute top-0 left-0 right-0 h-1/2 bg-white/30 rounded-t-full" />
              <View style={{ width: '75%', aspectRatio: 1 }} className="items-center justify-center border-2 border-yellow-500/30 rounded-full flex-row">
                <Text className="text-3xl sm:text-4xl font-black text-yellow-700 italic tracking-tighter shadow-sm">H</Text>
                <Text className="text-3xl sm:text-4xl font-black text-yellow-100 italic tracking-tighter shadow-sm">T</Text>
              </View>
            </Animated.View>
          </View>
        </Animated.View>
        
        <View style={{ marginTop: '4%' }} className="items-center justify-center animate-pulse">
          <View className="flex-row items-center gap-3">
            <View style={{ width: '8%' }} className="h-[2px] bg-yellow-400/30 rounded-full" />
            <Text className="text-yellow-400 font-black text-sm sm:text-base tracking-[0.25em] uppercase">
              Tap to Play
            </Text>
            <View style={{ width: '8%' }} className="h-[2px] bg-yellow-400/30 rounded-full" />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  </Animated.View>
  ```

---

#### Issue D-9: Game Modes Modal Card Sizing & Keyboard Occlusion
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
  Cards are locked to `w-56 h-64` (224×256px). On Card 4, when focusing the code `TextInput`, the modal lacks `KeyboardAvoidingView`. The virtual keyboard (~300px) covers Card 4 completely, hiding the input field and the "Enter Arena" button.
- **Exact Responsive Replacement**:
  ```tsx
  <Modal visible={showGameModes} animationType="slide" transparent onRequestClose={() => setShowGameModes(false)}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-black/95 justify-center items-center">
      <View className="absolute inset-0 bg-indigo-900/10" />
      <View style={{ width: '100%', maxWidth: '95%' }} className="z-10 py-4 flex-1 justify-center">
        ...
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: '5%', gap: 14 }} className="w-full pb-4 pt-2">
          <TouchableOpacity onPress={findCasualMatch} disabled={loadingAction !== null} style={{ width: '70%', height: '100%', maxHeight: '80%' }} className="bg-slate-900 rounded-[2rem] p-5 shadow-2xl justify-between border-2 border-green-500/40 active:scale-95 overflow-hidden relative">
  ```

---

### 3.2 Matchmaking Subsystem (`src/components/GameRoom.tsx`)

#### Issue MM-1: Player & Opponent Cards Rigid `minWidth: 185` Horizontal Crash
- **File**: `src/components/GameRoom.tsx`
- **Lines**: 440 & 602
- **Current Problematic Code**:
  ```tsx
  // Line 440 (Player Card):
  <View style={{ width: '34%', maxWidth: 245, minWidth: 185, height: 72, position: 'relative' }}>

  // Line 602 (Opponent Card):
  <View style={{ width: '34%', maxWidth: 245, minWidth: 185, height: 72, position: 'relative' }}>
  ```
- **Breakage Explanation**:
  Card 1 (185px min) + Card 2 (185px min) + VS container (80px) + 40px outer padding = 490px minimum width demand. On portrait mobile displays (360–393px width), the cards collide directly with each other and overlap the central VS emblem.
- **Exact Responsive Replacement**:
  ```tsx
  // Player Card Container (Line 440):
  <View style={{ flex: 1, minWidth: 0, maxWidth: '40%', height: '100%', position: 'relative' }}>

  // Opponent Card Container (Line 602):
  <View style={{ flex: 1, minWidth: 0, maxWidth: '40%', height: '100%', position: 'relative' }}>
  ```

---

#### Issue MM-2: Central "VS" Emblem 56px Oversizing & Negative Margin Crash
- **File**: `src/components/GameRoom.tsx`
- **Lines**: 522–599
- **Current Problematic Code**:
  ```tsx
  <View style={{ width: '22%', alignItems: 'center', justifyContent: 'center', zIndex: 20 }}>
    <Text style={{
      fontSize: 56,
      fontWeight: '900',
      color: '#00AED1',
      letterSpacing: -5,
      lineHeight: 80,
      paddingLeft: 10,
      paddingRight: 24,
      paddingTop: 15,
      paddingBottom: 5,
      zIndex: 2
    }}>
      V 
    </Text>
    <View style={{ position: 'absolute', width: 2.5, height: 85, ... }} />
    <Text style={{
      fontSize: 56,
      fontWeight: '900',
      fontStyle: 'italic',
      color: '#9126D1',
      letterSpacing: -2,
      marginLeft: -40,
      lineHeight: 80,
      ...
    }}>
      S
    </Text>
  </View>
  ```
- **Breakage Explanation**:
  Oversized 56px font with 80px line height, 85px diagonal divider, and `marginLeft: -40` crashes into the adjacent player cards on screens <400px wide.
- **Exact Responsive Replacement**:
  ```tsx
  <View style={{ width: '18%', alignItems: 'center', justifyContent: 'center', zIndex: 20 }}>
    <View style={{ alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', overflow: 'visible', position: 'relative' }}>
        <Text adjustsFontSizeToFit numberOfLines={1} style={{
          fontSize: 32,
          fontWeight: '900',
          color: '#00AED1',
          letterSpacing: -2,
          lineHeight: 38,
          paddingHorizontal: '2%',
          zIndex: 2
        }}>
          V
        </Text>
        <View style={{
          position: 'absolute',
          width: '5%',
          height: '80%',
          transform: [{ rotate: '18deg' }],
          shadowColor: '#00D9FF',
          shadowOpacity: 1,
          shadowRadius: 6,
          zIndex: 3,
          borderRadius: 9999,
          overflow: 'hidden'
        }}>
          <LinearGradient
            colors={['transparent', '#00D9FF', '#00D9FF', 'transparent']}
            locations={[0, 0.2, 0.8, 1]}
            style={{ flex: 1 }}
          />
        </View>
        <Text adjustsFontSizeToFit numberOfLines={1} style={{
          fontSize: 32,
          fontWeight: '900',
          fontStyle: 'italic',
          color: '#9126D1',
          letterSpacing: -2,
          marginLeft: '-8%',
          lineHeight: 38,
          paddingHorizontal: '2%',
          zIndex: 1
        }}>
          S
        </Text>
      </View>
    </View>
  </View>
  ```

---

#### Issue MM-3: Loading Bar and Queue Capsule Rigid Dimensions
- **File**: `src/components/GameRoom.tsx`
- **Lines**: 394 & 690
- **Current Problematic Code**:
  ```tsx
  // Loading Bar:
  <View style={{ width: 220, height: 10, ... }}>

  // Queue Capsule:
  <View style={{ width: 250, height: 46, ... }}>
  ```
- **Breakage Explanation**:
  Hardcoded 220px and 250px dimensions do not dynamically scale: they cramp small screens and appear miniature on tablets.
- **Exact Responsive Replacement**:
  ```tsx
  // Loading Bar:
  <View style={{ width: '60%', maxWidth: '75%', height: '2%', minHeight: 8, backgroundColor: '#061A3A', borderRadius: 9999, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(0, 217, 255, 0.45)' }} />

  // Queue Capsule:
  <View style={{ width: '68%', maxWidth: '80%', minHeight: 44, borderRadius: 9999, backgroundColor: 'rgba(7, 20, 38, 0.92)', borderWidth: 1.5, borderColor: 'rgba(0, 217, 255, 0.45)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: '4%' }}>
  ```

---

### 3.3 Game Room Arena & Match Orchestrator (`src/components/GameRoom.tsx`)

#### Issue GR-1: Host Waiting Lobby Missing ScrollView & Clipped CTA
- **File**: `src/components/GameRoom.tsx`
- **Lines**: 788–889
- **Current Problematic Code**:
  ```tsx
  // Normal Room Lobby
  return (
    <View className="space-y-6">
      {!isCasualMatch && (
        <View className="bg-indigo-900/50 p-6 rounded-3xl border border-indigo-400/20 text-center">
          <Text className="text-white opacity-80 font-bold uppercase tracking-widest text-xs mb-2">Room Code</Text>
          <Text className="text-5xl font-mono font-black text-yellow-400 tracking-[0.2em]">{room.code}</Text>
        </View>
      )}

      <Scoreboard room={room} playerId={playerId} />
      
      {!isCasualMatch && room.capacity > ... && (
        <InviteFriends roomId={room.id} />
      )}

      {!isCasualMatch && isHost && (
        <View className="bg-white/10 p-4 rounded-3xl border border-white/20 mb-2">
          {/* Settings: Room Size, Wager, Overs, Wickets, Speed */}
        </View>
      )}

      {isHost && (
        <TouchableOpacity
          onPress={() => takeAction({ type: 'START_MATCH', ... })}
          className="w-full bg-yellow-400 disabled:opacity-50 py-4 rounded-2xl shadow-xl active:scale-95"
        >
          <Text className="text-indigo-900 font-black text-xl uppercase tracking-wider text-center">Start Match</Text>
        </TouchableOpacity>
      )}
    </View>
  );
  ```
- **Breakage Explanation**:
  The total vertical height of Room Code banner, Scoreboard, InviteFriends, 5 match setting panels, and Start Match CTA exceeds 830px. Inside an unscrollable `<View>`, the "Start Match" CTA is pushed off the screen on any device with viewport height <850px, completely preventing match initiation.
- **Exact Responsive Replacement**:
  ```tsx
  return (
    <ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={{ paddingBottom: '8%', flexGrow: 1 }} showsVerticalScrollIndicator={false}>
      <View className="space-y-4">
        {!isCasualMatch && (
          <View className="bg-indigo-900/50 p-4 rounded-3xl border border-indigo-400/20 text-center">
            <Text className="text-white opacity-80 font-bold uppercase tracking-widest text-xs mb-1">Room Code</Text>
            <Text adjustsFontSizeToFit numberOfLines={1} className="text-4xl font-mono font-black text-yellow-400 tracking-[0.15em]">{room.code}</Text>
          </View>
        )}

        <Scoreboard room={room} playerId={playerId} />
        
        {!isCasualMatch && room.capacity > [room.player1_id, room.player2_id, room.player3_id].filter(Boolean).length && (
          <InviteFriends roomId={room.id} />
        )}

        {!isCasualMatch && isHost && (
          <View className="bg-white/10 p-3 rounded-3xl border border-white/20 mb-2">
            <Text className="text-center text-[10px] text-white font-black uppercase opacity-50 tracking-widest mb-2">Match Settings</Text>

            {!isBotMatch && (
              <>
                <Text className="text-white opacity-80 font-bold uppercase text-xs mb-2 mt-2">Room Size</Text>
                <View className="flex-row flex-wrap justify-between gap-2 mb-4">
                  {[2, 3].map(size => (
                    <TouchableOpacity key={size} onPress={() => setCapacity(size)} className={`flex-1 py-2 rounded-xl border ${capacity === size ? 'bg-yellow-400 border-yellow-400' : 'bg-white/10 border-white/20'}`}>
                      <Text className={`text-center font-black text-xs ${capacity === size ? 'text-indigo-900' : 'text-white/60'}`}>
                        {size} PLAYERS
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
            
            <Text className="text-white opacity-80 font-bold uppercase text-xs mb-2 mt-2">Wager / Bet Amount</Text>
            <View className="flex-row flex-wrap justify-between gap-1.5 mb-4">
              {[0, 1000, 5000, 10000, 50000, 100000, 250000, 500000, 2000000].map(amount => (
                <TouchableOpacity key={amount} onPress={() => setBetAmount(amount)} style={{ width: '31%' }} className={`py-2 rounded-xl border ${betAmount === amount ? 'bg-yellow-400 border-yellow-400' : 'bg-white/10 border-white/20'}`}>
                  <Text adjustsFontSizeToFit numberOfLines={1} className={`text-center font-black text-[10px] ${betAmount === amount ? 'text-indigo-900' : 'text-white/60'}`}>
                    {amount === 0 ? 'FREE' : amount >= 1000000 ? `🪙${amount/1000000}M` : `🪙${amount/1000}k`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="text-white opacity-80 font-bold uppercase text-xs mb-2 mt-2">Overs</Text>
            <View className="flex-row flex-wrap justify-between gap-1 mb-4">
              {[2, 5, 10, 20, null].map(o => (
                <TouchableOpacity 
                  key={o ?? 'unlimited'} 
                  onPress={() => setOversLimit(o)} 
                  style={{ width: '18%' }}
                  className={`py-2 rounded-xl border ${oversLimit === o ? 'bg-yellow-400 border-yellow-400' : 'bg-white/10 border-white/20'}`}
                >
                  <Text adjustsFontSizeToFit numberOfLines={1} className={`text-center font-black text-xs ${oversLimit === o ? 'text-indigo-900' : 'text-white/60'}`}>
                    {o === null ? '∞ ALL' : o}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="text-white opacity-80 font-bold uppercase text-xs mb-2">Wickets</Text>
            <View className="flex-row flex-wrap justify-between gap-1">
              {[1, 2, 3, 5, 10].map(w => (
                <TouchableOpacity 
                  key={w} 
                  onPress={() => setWicketsLimit(w)} 
                  style={{ width: '18%' }}
                  className={`py-2 rounded-xl border ${wicketsLimit === w ? 'bg-yellow-400 border-yellow-400' : 'bg-white/10 border-white/20'}`}
                >
                  <Text className={`text-center font-black text-xs ${wicketsLimit === w ? 'text-indigo-900' : 'text-white/60'}`}>{w}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {isHost && (
          <TouchableOpacity
            onPress={() => takeAction({ type: 'START_MATCH', oversLimit, wicketsLimit, turnTimer, betAmount, capacity } as any)}
            disabled={loading || (is2P ? !room.player2_id : (!room.player2_id || !room.player3_id))}
            style={{ width: '100%' }}
            className="bg-yellow-400 disabled:opacity-50 py-3.5 rounded-2xl shadow-xl active:scale-95"
          >
            <Text adjustsFontSizeToFit numberOfLines={1} className="text-indigo-900 font-black text-lg uppercase tracking-wider text-center">
              {loading ? 'Starting...' : (isCasualMatch && !room.player2_id ? 'Searching for Opponent...' : 'Start Match')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
  ```

---

#### Issue GR-2: Toss Call Scoreboard Collision & 128px Hardcoded Circles
- **File**: `src/components/GameRoom.tsx`
- **Lines**: 1113–1152
- **Current Problematic Code**:
  ```tsx
  <View className="flex-1">
    <View className="absolute top-0 w-full z-20" pointerEvents="box-none">
      <Scoreboard room={room} playerId={playerId} />
    </View>

    <View className="flex-1 items-center justify-center z-10 w-full px-12 mt-20" pointerEvents="box-none">
      <Text className="text-4xl font-black uppercase italic tracking-widest mb-2 text-yellow-400">
        {room.stage === 'team_toss' ? 'Team Selection Toss' : 'Match Toss'}
      </Text>
      <Text className="text-white text-lg font-bold uppercase tracking-widest mb-12 opacity-80">
        {isCaller ? 'Call the Coin' : 'Opponent is Calling...'}
      </Text>

      {isCaller ? (
        <View className="flex-row justify-between w-full max-w-sm px-8">
          <TouchableOpacity className="w-32 h-32 rounded-full bg-yellow-500 ...">
            <Text className="text-5xl font-black text-white">H</Text>
            <Text className="text-sm font-black text-white mt-1">HEADS</Text>
          </TouchableOpacity>
          <TouchableOpacity className="w-32 h-32 rounded-full bg-slate-200 ...">
            <Text className="text-5xl font-black text-slate-700">T</Text>
            <Text className="text-sm font-black text-slate-700 mt-1">TAILS</Text>
          </TouchableOpacity>
        </View>
      ) : ( ... )}
    </View>
  </View>
  ```
- **Breakage Explanation**:
  1. Scoreboard sits at `absolute top-0` while the content container has a static `mt-20` (80px), causing the 100–140px scoreboard to overlap the toss title.
  2. Two 128px (`w-32`) coins inside 160px combined padding require 416px, overflowing the viewport on all standard mobile devices (<400px wide).
- **Exact Responsive Replacement**:
  ```tsx
  <View className="flex-1 justify-between pb-6">
    {/* In-Flow Scoreboard Container */}
    <View style={{ width: '100%' }} className="z-20" pointerEvents="box-none">
      <Scoreboard room={room} playerId={playerId} />
    </View>

    <View style={{ width: '100%', paddingHorizontal: '4%' }} className="flex-1 items-center justify-center z-10" pointerEvents="box-none">
      <Text adjustsFontSizeToFit numberOfLines={1} className="text-2xl sm:text-3xl font-black uppercase italic tracking-widest mb-2 text-yellow-400 text-center">
        {room.stage === 'team_toss' ? 'Team Selection Toss' : 'Match Toss'}
      </Text>
      <Text className="text-white text-sm sm:text-base font-bold uppercase tracking-widest mb-6 opacity-80 text-center">
        {isCaller ? 'Call the Coin' : 'Opponent is Calling...'}
      </Text>

      {isCaller ? (
        <View style={{ width: '100%', maxWidth: '85%' }} className="flex-row justify-around items-center px-2">
          <TouchableOpacity 
            disabled={loading} 
            onPress={() => takeAction({ type: 'TOSS_CALL', choice: 'head' })} 
            style={{ width: '44%', aspectRatio: 1 }}
            className={`rounded-full bg-yellow-500 items-center justify-center border-4 border-yellow-600 shadow-xl ${loading ? 'opacity-50' : 'active:scale-95'}`}
          >
            <Text className="text-4xl sm:text-5xl font-black text-white">H</Text>
            <Text className="text-xs sm:text-sm font-black text-white mt-1">HEADS</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            disabled={loading} 
            onPress={() => takeAction({ type: 'TOSS_CALL', choice: 'tail' })} 
            style={{ width: '44%', aspectRatio: 1 }}
            className={`rounded-full bg-slate-200 items-center justify-center border-4 border-slate-300 shadow-xl ${loading ? 'opacity-50' : 'active:scale-95'}`}
          >
            <Text className="text-4xl sm:text-5xl font-black text-slate-700">T</Text>
            <Text className="text-xs sm:text-sm font-black text-slate-700 mt-1">TAILS</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View className="items-center mt-2">
          <View style={{ width: '30%', aspectRatio: 1 }} className="rounded-full bg-slate-700 items-center justify-center border-4 border-slate-600 animate-pulse">
            <Text className="text-4xl sm:text-5xl font-black text-slate-500">?</Text>
          </View>
          <Text className="text-white/50 font-black text-xs sm:text-sm uppercase tracking-widest animate-pulse mt-3">Awaiting Call...</Text>
        </View>
      )}
    </View>
  </View>
  ```

---

#### Issue GR-3: Squad Selection Role Picker Missing ScrollView
- **File**: `src/components/GameRoom.tsx`
- **Lines**: 1246–1274
- **Current Problematic Code**:
  ```tsx
  <View className="space-y-6 flex-1 items-center justify-center">
    <Scoreboard room={room} playerId={playerId} />
    <View className="bg-white/10 p-6 rounded-3xl w-full max-w-sm items-center">
      {needsToSelect ? (
        <>
          <Text className="text-2xl font-black text-white uppercase text-center mb-6">
            Select Your {roleType}
          </Text>
          <View className="flex-row flex-wrap justify-center gap-3 w-full">
            {myPlayers?.map((pName) => (
              <TouchableOpacity
                key={pName}
                disabled={loading}
                onPress={() => takeAction({ type: 'SELECT_ROLE', role: roleType!, playerName: pName })}
                className="bg-indigo-500 py-3 px-4 rounded-xl active:scale-95 w-full"
              >
                <Text className="text-white font-black text-center">{pName}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      ) : ( ... )}
    </View>
  </View>
  ```
- **Breakage Explanation**:
  In matches with 5 or 10 wickets, squads contain 6 to 11 players. Eleven buttons at ~50px each demand >550px vertical height. Without a scroll view, the buttons clip off the bottom edge, preventing selection of lower-order batsmen or bowlers.
- **Exact Responsive Replacement**:
  ```tsx
  <View className="space-y-3 flex-1 items-center justify-between pb-4 px-3">
    <Scoreboard room={room} playerId={playerId} />
    <View style={{ width: '100%', maxWidth: '92%', maxHeight: '72%' }} className="bg-white/10 p-4 rounded-3xl items-center flex-1">
      {needsToSelect ? (
        <>
          <Text adjustsFontSizeToFit numberOfLines={1} className="text-xl font-black text-white uppercase text-center mb-3">
            Select Your {roleType}
          </Text>
          <ScrollView style={{ width: '100%', flex: 1 }} contentContainerStyle={{ gap: 8, paddingBottom: 12 }} showsVerticalScrollIndicator={false}>
            {myPlayers?.map((pName) => (
              <TouchableOpacity
                key={pName}
                disabled={loading}
                onPress={() => takeAction({ type: 'SELECT_ROLE', role: roleType!, playerName: pName })}
                style={{ width: '100%' }}
                className="bg-indigo-500 py-2.5 px-4 rounded-xl active:scale-95"
              >
                <Text className="text-white font-black text-center text-sm">{pName}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      ) : (
        <Text className="text-white/50 font-bold animate-pulse text-sm text-center my-auto">
          Waiting for opponent to select their player...
        </Text>
      )}
    </View>
  </View>
  ```

---

#### Issue GR-4: Floating Game Controls SafeArea & Scoreboard Collision
- **File**: `src/components/GameRoom.tsx`
- **Lines**: 1359–1380
- **Current Problematic Code**:
  ```tsx
  <View className="absolute top-0 left-0 z-50 mt-1 ml-1">
    <TouchableOpacity onPress={handleExit} className="w-10 h-10 rounded-full items-center justify-center border-2 bg-red-500/80 border-red-400/50">
      <Text className="text-lg text-white font-bold">X</Text>
    </TouchableOpacity>
  </View>
  <View className="absolute top-0 right-0 z-50 flex-row gap-2 mt-1 mr-1">
    <TouchableOpacity onPress={toggleMic} className={`w-10 h-10 rounded-full ...`}>...</TouchableOpacity>
    <TouchableOpacity onPress={toggleSpeaker} className={`w-10 h-10 rounded-full ...`}>...</TouchableOpacity>
    <TouchableOpacity onPress={() => setChatOpen(true)} className="w-10 h-10 rounded-full ...">...</TouchableOpacity>
  </View>
  ```
- **Breakage Explanation**:
  Positioning at `top-0 mt-1` renders controls behind the status bar and notch. On the right side, the three buttons span 136px width, sitting directly on top of the Scoreboard Pot/Target display.
- **Exact Responsive Replacement**:
  ```tsx
  <View style={{ top: '1%', left: '2%' }} className="absolute z-50">
    <TouchableOpacity onPress={handleExit} style={{ width: '10%', aspectRatio: 1 }} className="rounded-full items-center justify-center border-2 bg-red-500/80 border-red-400/50 shadow-md">
      <Text className="text-sm text-white font-bold">✕</Text>
    </TouchableOpacity>
  </View>
  <View style={{ top: '1%', right: '2%' }} className="absolute z-50 flex-row gap-1.5">
    <TouchableOpacity onPress={toggleMic} style={{ width: '10%', aspectRatio: 1 }} className={`rounded-full items-center justify-center border-2 ${micEnabled ? 'bg-indigo-600 border-indigo-400' : 'bg-black/50 border-white/20'}`}>
      <Text className="text-xs">{micEnabled ? '🎙️' : '🔇'}</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={toggleSpeaker} style={{ width: '10%', aspectRatio: 1 }} className={`rounded-full items-center justify-center border-2 ${speakerEnabled ? 'bg-indigo-600 border-indigo-400' : 'bg-black/50 border-white/20'}`}>
      <Text className="text-xs">{speakerEnabled ? '🔊' : '🔈'}</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={() => setChatOpen(true)} style={{ width: '10%', aspectRatio: 1 }} className="rounded-full items-center justify-center border-2 bg-indigo-500 border-indigo-400 relative">
      <Text className="text-xs">💬</Text>
      {messages && messages.length > 0 && !chatOpen && (
        <View style={{ width: '35%', aspectRatio: 1 }} className="absolute -top-1 -right-1 bg-red-500 rounded-full items-center justify-center">
          <Text className="text-white text-[7px] font-bold">{messages.length}</Text>
        </View>
      )}
    </TouchableOpacity>
  </View>
  ```

---

#### Issue GR-5: In-Game Chat Modal Bottom Bar Button Clutter
- **File**: `src/components/GameRoom.tsx`
- **Lines**: 1474–1493
- **Current Problematic Code**:
  ```tsx
  <View className="p-3 bg-black/40 flex-row gap-2 items-center">
    <TouchableOpacity ... className={`w-12 h-12 rounded-full ... items-center justify-center`}>
      <Text className="text-white text-xl">💬</Text>
    </TouchableOpacity>
    <TouchableOpacity ... className={`w-12 h-12 rounded-full ... items-center justify-center`}>
      <Text className="text-white text-xl">🎭</Text>
    </TouchableOpacity>
    <TextInput
      className="flex-1 bg-white/10 text-white rounded-full px-5 py-3 text-sm border border-white/10"
      ...
    />
    <TouchableOpacity ... className={`w-12 h-12 rounded-full items-center justify-center ...`}>
      <Text className="text-white text-xl">➤</Text>
    </TouchableOpacity>
  </View>
  ```
- **Breakage Explanation**:
  Three `w-12 h-12` (48px) buttons plus padding require 192px width. On a 320–360px screen, the `TextInput` has only ~90px usable space, severely compressing the input text.
- **Exact Responsive Replacement**:
  ```tsx
  <View style={{ padding: '2%', width: '100%' }} className="bg-black/40 flex-row gap-1.5 items-center">
    <TouchableOpacity onPress={() => { setShowQuickChatMenu(!showQuickChatMenu); setShowEmotesMenu(false); }} style={{ width: '11%', aspectRatio: 1 }} className={`rounded-full ${showQuickChatMenu ? 'bg-indigo-500' : 'bg-white/10'} items-center justify-center`}>
      <Text className="text-white text-base">💬</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={() => { setShowEmotesMenu(!showEmotesMenu); setShowQuickChatMenu(false); }} style={{ width: '11%', aspectRatio: 1 }} className={`rounded-full ${showEmotesMenu ? 'bg-indigo-500' : 'bg-white/10'} items-center justify-center`}>
      <Text className="text-white text-base">🎭</Text>
    </TouchableOpacity>
    <TextInput
      value={chatText}
      onChangeText={setChatText}
      placeholder="Send message..."
      placeholderTextColor="rgba(255,255,255,0.3)"
      style={{ flex: 1 }}
      className="bg-white/10 text-white rounded-full px-3.5 py-2 text-xs border border-white/10"
      maxLength={100}
      onSubmitEditing={handleSendChat}
    />
    <TouchableOpacity onPress={handleSendChat} disabled={!chatText.trim()} style={{ width: '11%', aspectRatio: 1 }} className={`rounded-full items-center justify-center ${chatText.trim() ? 'bg-indigo-500' : 'bg-white/10'}`}>
      <Text className="text-white text-base">➤</Text>
    </TouchableOpacity>
  </View>
  ```

---

### 3.4 Reveal View & Coin Showdown (`src/components/RevealView.tsx`)

#### Issue RV-1: Animated 3D Coin Rigid Dimensions & Fixed TranslateY
- **File**: `src/components/RevealView.tsx`
- **Lines**: 28, 40, 106–127
- **Current Problematic Code**:
  ```tsx
  <Animated.View style={{ 
    width: 96, 
    height: 96, 
    borderRadius: 48, 
    borderWidth: 6, 
    borderColor: '#ca8a04', 
    backgroundColor: '#facc15', 
    alignItems: 'center', 
    justifyContent: 'center', 
    transform: [{ translateY: heightAnim }, { rotateX: spin }], 
    zIndex: 20,
    marginBottom: 12,
    shadowColor: '#ca8a04',
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 10
  }}>
     <Text className="text-5xl font-black text-yellow-900">
       {showResult ? winningFace : '?'}
     </Text>
  </Animated.View>
  ```
- **Breakage Explanation**:
  Hardcoded 96×96px coin with a fixed -60px vertical animation push (`toValue: -60`) causes the coin to collide with the top notch/header on compact viewports, pushing the result cards below off-screen.
- **Exact Responsive Replacement**:
  ```tsx
  <Animated.View style={{ 
    width: '24%',
    aspectRatio: 1,
    borderRadius: 9999, 
    borderWidth: 5, 
    borderColor: '#ca8a04', 
    backgroundColor: '#facc15', 
    alignItems: 'center', 
    justifyContent: 'center', 
    transform: [{ translateY: heightAnim }, { rotateX: spin }], 
    zIndex: 20,
    marginBottom: 8,
    shadowColor: '#ca8a04',
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8
  }}>
     <Text adjustsFontSizeToFit numberOfLines={1} className="text-4xl font-black text-yellow-900">
       {showResult ? winningFace : '?'}
     </Text>
     {showResult && (
       <Text className="text-[9px] font-black text-yellow-900 uppercase tracking-widest mt-0.5">
         {winningFace === 'H' ? 'HEADS' : 'TAILS'}
       </Text>
     )}
  </Animated.View>
  ```

---

#### Issue RV-2: Toss Result Banner Flanking Gradients & Text Truncation
- **File**: `src/components/RevealView.tsx`
- **Lines**: 151, 157, 169, 173, 176, 185, 191
- **Current Problematic Code**:
  ```tsx
  <View style={{ width: 44, height: 44, borderRadius: 22, ... }} />
  ...
  <LinearGradient colors={['rgba(0, 217, 255, 0)', '#00D9FF']} style={{ height: 2, width: 48, marginRight: 8 }} />
  <View style={{ backgroundColor: 'rgba(19, 53, 89, 0.8)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16 }}>
     <Text style={{ color: '#A8B6CC', fontSize: 9, fontWeight: '900', letterSpacing: 2 }}>TOSS RESULT</Text>
  </View>
  <LinearGradient colors={['#00D9FF', 'rgba(0, 217, 255, 0)']} style={{ height: 2, width: 48, marginLeft: 8 }} />
  ...
  <Text style={{ color: '#F5F7FF', fontSize: 28, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center', ... }} numberOfLines={1}>{winnerName}</Text>
  ```
- **Breakage Explanation**:
  Center column (`flex: 1.4`) has only ~120px width on a 360px screen. Two rigid 48px divider lines (96px) plus margins and text badge require 192px, overflowing horizontally. The winner name at fixed `fontSize: 28` severely truncates.
- **Exact Responsive Replacement**:
  ```tsx
  {/* Flanking Divider Gradients using flex: 1 */}
  <LinearGradient colors={['rgba(0, 217, 255, 0)', '#00D9FF']} start={{x:0, y:0}} end={{x:1, y:0}} style={{ height: 2, flex: 1, marginRight: 6 }} />
  <View style={{ backgroundColor: 'rgba(19, 53, 89, 0.8)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 16 }}>
     <Text style={{ color: '#A8B6CC', fontSize: 8.5, fontWeight: '900', letterSpacing: 1.5 }}>TOSS RESULT</Text>
  </View>
  <LinearGradient colors={['#00D9FF', 'rgba(0, 217, 255, 0)']} start={{x:0, y:0}} end={{x:1, y:0}} style={{ height: 2, flex: 1, marginLeft: 6 }} />

  {/* Winner Name with dynamic scaling */}
  <Text style={{ color: '#F5F7FF', fontSize: 22, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' }} numberOfLines={1} adjustsFontSizeToFit>{winnerName}</Text>

  {/* Responsive Player Choice Badges */}
  <View style={{ minHeight: 18, backgroundColor: 'rgba(0, 0, 0, 0.5)', borderWidth: 1, borderColor: '#003366', borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', paddingHorizontal: 6, paddingVertical: 2, maxWidth: '95%' }}>
    <Text style={{ color: '#A8B6CC', fontSize: 7.5, fontWeight: '800', letterSpacing: 0.5, marginRight: 2 }}>CHOSE:</Text>
    <Text style={{ color: '#00D9FF', fontSize: 8.5, fontWeight: '900', letterSpacing: 0.5 }}>{p1Choice}</Text>
  </View>

  {/* Avatar containers scaled proportionally */}
  <View style={{ width: '12%', aspectRatio: 1, borderRadius: 9999, backgroundColor: 'rgba(0, 0, 0, 0.5)', borderWidth: 1.5, borderColor: '#005580', alignItems: 'center', justifyContent: 'center', marginBottom: 2 }}>
    <FontAwesome5 name={winnerName === p1Name ? "crown" : "user-alt"} size={13} color="#A8B6CC" />
  </View>
  ```

---

#### Issue RV-3: Player Choices Banner Rigid Width & Card Squeeze
- **File**: `src/components/RevealView.tsx`
- **Lines**: 201, 218, 220, 226, 227, 237, 238
- **Current Problematic Code**:
  ```tsx
  <View style={{ 
    width: '60%', 
    backgroundColor: 'rgba(2, 17, 36, 0.95)', 
    borderRadius: 16, 
    ...
  }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12, paddingHorizontal: 16 }}>
       <LinearGradient ... style={{ height: 2, width: 48, marginRight: 12 }} />
       <Text style={{ color: '#F5F7FF', fontSize: 10, fontWeight: '900', letterSpacing: 2 }}>PLAYER CHOICES</Text>
       <LinearGradient ... style={{ height: 2, width: 48, marginLeft: 12 }} />
    </View>
    <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
       <View style={{ width: '42%', paddingVertical: 12, paddingHorizontal: 6, ... }}>
          <View style={{ width: 32, height: 32, ... marginRight: 6 }}>...</View>
          <View style={{ flex: 1 }}>
             <Text style={{ color: '#F5F7FF', fontSize: 9, ... }} numberOfLines={1}>{p1Name}</Text>
          </View>
       </View>
       <View style={{ width: '42%', ... }}>...</View>
    </View>
  </View>
  ```
- **Breakage Explanation**:
  `width: '60%'` creates an unnaturally narrow 216px container on a 360px mobile screen. Inside, two 48px divider lines clip the header text, and individual choice cards of `width: '42%'` (~90px) leave only ~40px for player usernames, truncating them to 2-3 letters.
- **Exact Responsive Replacement**:
  ```tsx
  <View style={{ 
    width: '92%', 
    maxWidth: '95%',
    backgroundColor: 'rgba(2, 17, 36, 0.95)', 
    borderRadius: 16, 
    borderWidth: 2, 
    borderColor: '#005580', 
    paddingTop: '3%', 
    paddingBottom: '3%', 
    paddingHorizontal: '3%', 
    marginTop: 2,
    shadowColor: '#0090FF',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8
  }}>
    {/* Responsive Title Row with flex: 1 gradients */}
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 6, paddingHorizontal: 4 }}>
       <LinearGradient colors={['rgba(0, 217, 255, 0)', '#00D9FF']} start={{x:0, y:0}} end={{x:1, y:0}} style={{ height: 2, flex: 1, marginRight: 6 }} />
       <Text style={{ color: '#F5F7FF', fontSize: 9.5, fontWeight: '900', letterSpacing: 1.5 }}>PLAYER CHOICES</Text>
       <LinearGradient colors={['#00D9FF', 'rgba(0, 217, 255, 0)']} start={{x:0, y:0}} end={{x:1, y:0}} style={{ height: 2, flex: 1, marginLeft: 6 }} />
    </View>

    {/* Responsive Choice Boxes Row using flex: 1 */}
    <View style={{ flexDirection: 'row', justifyContent: 'center', width: '100%', gap: 8 }}>
       <View style={{ flex: 1, minWidth: 0, paddingVertical: 8, paddingHorizontal: 8, backgroundColor: 'rgba(0, 0, 0, 0.4)', borderRadius: 12, borderWidth: 1, borderColor: '#005580', flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: '22%', aspectRatio: 1, borderRadius: 9999, borderWidth: 1.5, borderColor: '#005580', alignItems: 'center', justifyContent: 'center', marginRight: 6 }}>
             <Text style={{ fontSize: 13 }}>{getEmoji(p1T)}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
             <Text style={{ color: '#F5F7FF', fontSize: 9.5, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' }} numberOfLines={1}>{p1Name}</Text>
             <Text style={{ color: '#00D9FF', fontSize: 12, fontWeight: '900', letterSpacing: 1, marginTop: 1 }}>{p1T || '?'}</Text>
          </View>
       </View>

       <View style={{ flex: 1, minWidth: 0, paddingVertical: 8, paddingHorizontal: 8, backgroundColor: 'rgba(0, 0, 0, 0.4)', borderRadius: 12, borderWidth: 1, borderColor: '#005580', flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: '22%', aspectRatio: 1, borderRadius: 9999, borderWidth: 1.5, borderColor: '#005580', alignItems: 'center', justifyContent: 'center', marginRight: 6 }}>
             <Text style={{ fontSize: 13 }}>{getEmoji(p2T)}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
             <Text style={{ color: '#F5F7FF', fontSize: 9.5, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' }} numberOfLines={1}>{p2Name}</Text>
             <Text style={{ color: '#00D9FF', fontSize: 12, fontWeight: '900', letterSpacing: 1, marginTop: 1 }}>{p2T || '?'}</Text>
          </View>
       </View>
    </View>
  </View>
  ```

---

#### Issue RV-4: Gameplay Reveal Cards Rigid Dimensions & Result Container Height
- **File**: `src/components/RevealView.tsx`
- **Lines**: 266, 271, 282, 288
- **Current Problematic Code**:
  ```tsx
  <View className="flex-row items-center justify-center gap-8 w-full max-w-sm">
    <View className={`flex-1 items-center space-y-4 ${isBat ? 'scale-110' : 'opacity-80'}`}>
      <View className="w-28 h-32 bg-white rounded-[2rem] ...">
        <Text className="text-6xl">{getEmoji(bT)}</Text>
      </View>
    </View>
    ...
  </View>
  ...
  <View className="h-24 justify-center items-center mt-8 w-full">
  ```
- **Breakage Explanation**:
  `w-28 h-32` (112×128px) cards scaled by 1.1x with `gap-8` exceed 335px width, clipping on small screens. Below them, `h-24` (96px) is hardcoded on the result container, but the outcome text and "Next Ball" button require ~154px, causing vertical container breakout.
- **Exact Responsive Replacement**:
  ```tsx
  <View style={{ width: '100%', maxWidth: '92%' }} className="flex-row items-center justify-around">
    <View style={{ width: '38%' }} className={`items-center space-y-2 ${isBat ? 'scale-105' : 'opacity-80'}`}>
      <Text numberOfLines={1} className="text-[9px] uppercase font-black tracking-widest text-white/70 bg-white/10 px-2 py-0.5 rounded-full">
        BAT • {batName === room.p1_name && playerId === room.player1_id ? 'YOU' : batName}
      </Text>
      <View style={{ width: '100%', aspectRatio: 7/8 }} className="bg-white rounded-[1.75rem] items-center justify-center shadow-2xl border-b-4 border-gray-300">
        <Text className="text-5xl">{getEmoji(bT)}</Text>
      </View>
    </View>

    <Text className="text-2xl font-black text-white/50 px-1">VS</Text>

    <View style={{ width: '38%' }} className={`items-center space-y-2 ${!isBat ? 'scale-105' : 'opacity-80'}`}>
      <Text numberOfLines={1} className="text-[9px] uppercase font-black tracking-widest text-white/70 bg-white/10 px-2 py-0.5 rounded-full">
        BOWL • {bowlName === room.p1_name && playerId === room.player1_id ? 'YOU' : bowlName}
      </Text>
      <View style={{ width: '100%', aspectRatio: 7/8 }} className="bg-white rounded-[1.75rem] items-center justify-center shadow-2xl border-b-4 border-gray-300">
        <Text className="text-5xl">{getEmoji(boT)}</Text>
      </View>
    </View>
  </View>

  {/* Fluid Result Outcome Area */}
  <View style={{ minHeight: '15%', width: '100%', marginTop: '4%' }} className="justify-center items-center px-4">
    {showResult ? (
      <View className="items-center justify-center w-full">
        {isDeadBall ? (
          <Text className="text-4xl font-black uppercase text-gray-400 shadow-xl mb-2 text-center">DEAD BALL</Text>
        ) : isOut ? (
          <Text className="text-4xl font-black uppercase text-red-500 shadow-xl mb-2 text-center">OUT! 💥</Text>
        ) : (
          <View className="items-center">
            {isNoBall && <Text className="text-red-400 font-bold text-base uppercase mb-0.5">NO BALL!</Text>}
            <Text className="text-4xl font-black uppercase text-green-400 shadow-xl mb-2 text-center">+{runsScored} RUNS!</Text>
          </View>
        )}
        <TouchableOpacity onPress={onContinue} style={{ width: '50%' }} className="bg-yellow-400 py-2.5 rounded-full shadow-lg active:scale-95 mt-1 items-center">
          <Text className="text-indigo-900 font-black text-base uppercase">Next Ball</Text>
        </TouchableOpacity>
      </View>
    ) : (
      <Text className="text-base font-bold opacity-60 animate-pulse text-white">Calculating...</Text>
    )}
  </View>
  ```

---

## 4. Deep-Dive Audit: Auxiliary Modals & Game Controls

### 4.1 HandSelector (`src/components/HandSelector.tsx`)
- **File**: `src/components/HandSelector.tsx`
- **Lines**: 19, 25, 27, 28
- **Current Problematic Code**:
  ```tsx
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
  ```
- **Breakage Explanation**:
  `w-20` (80px) and `h-24` (96px) with `gap-3` (12px) require 264px across 3 buttons. Inside modal containers with `p-6` or `p-8` padding, screen width under 360px forces the 3rd button to wrap to the second line, resulting in an uneven 2-2-2 or 3-2-1 layout.
- **Exact Responsive Replacement**:
  ```tsx
  <View style={{ width: '100%', gap: 8 }} className="flex-row flex-wrap justify-center">
    {options.map((num) => (
      <TouchableOpacity
        key={num}
        disabled={disabled}
        onPress={() => onSelect(num)}
        style={{ width: '29%', aspectRatio: 4/5 }}
        className={`bg-white rounded-2xl items-center justify-center shadow-xl border-b-4 border-gray-300 active:bg-gray-100 ${disabled ? 'opacity-50' : 'active:scale-95'}`}
      >
        <Text className="text-3xl">{emojiMap[num]}</Text>
        <Text className="text-lg font-black text-indigo-900 mt-0.5">{num}</Text>
      </TouchableOpacity>
    ))}
  </View>
  ```

---

### 4.2 Scoreboard (`src/components/Scoreboard.tsx`)
- **File**: `src/components/Scoreboard.tsx`
- **Lines**: 70, 108, 121, 145–150
- **Current Problematic Code**:
  ```tsx
  <View className="pt-2 px-6">
    ...
    <Text className={`text-base uppercase font-black tracking-widest ${isMe ? 'text-blue-400' : 'text-red-400'}`} numberOfLines={1}>
        {baseName} {showRole ? (isBat ? '• BAT' : '• BOWL') : ''}
    </Text>
    ...
  {/* Spectator display if applicable */}
  {players.filter(p => p.id === room.waiting_player_id).map((p, i) => (
       <View key={`spec-${i}`} className="absolute top-full left-0 right-0 items-center mt-4 opacity-50">
          <Text className="text-[8px] text-white font-light tracking-[0.3em] uppercase mb-0.5">Spectating</Text>
          <Text className="text-xs text-white font-medium tracking-widest" numberOfLines={1}>{p.id === playerId ? 'YOU' : p.label}</Text>
       </View>
  ))}
  ```
- **Breakage Explanation**:
  1. `px-6` (48px total padding) squishes column widths to ~135px, truncating player names and role labels.
  2. The spectator badge is rendered with `absolute top-full left-0 right-0`, taking it out of document flow and floating directly on top of the in-game action buttons.
- **Exact Responsive Replacement**:
  ```tsx
  <View style={{ width: '100%', paddingHorizontal: '3%' }} className="pt-2">
    ...
    <Text adjustsFontSizeToFit numberOfLines={1} className={`text-xs uppercase font-black tracking-wider ${isMe ? 'text-blue-400' : 'text-red-400'}`}>
        {baseName} {showRole ? (isBat ? '• BAT' : '• BOWL') : ''}
    </Text>
    ...
  {/* In-Flow Spectator display */}
  {players.filter(p => p.id === room.waiting_player_id).map((p, i) => (
       <View key={`spec-${i}`} style={{ width: '100%' }} className="items-center mt-1 opacity-60">
          <Text className="text-[8px] text-white font-light tracking-[0.3em] uppercase mb-0.5">Spectating</Text>
          <Text className="text-xs text-white font-medium tracking-widest" numberOfLines={1}>{p.id === playerId ? 'YOU' : p.label}</Text>
       </View>
  ))}
  ```

---

### 4.3 DailyRewardModal (`src/components/DailyRewardModal.tsx`)
- **File**: `src/components/DailyRewardModal.tsx`
- **Lines**: 161–178
- **Current Problematic Code**:
  ```tsx
  <View className="flex-row justify-between gap-1 mb-4">
    {days.map((day) => {
      ...
      return (
        <TouchableOpacity
          key={day}
          onPress={() => handleClaim(day)}
          disabled={!isCurrent || loading}
          className={`flex-1 py-3 px-1 rounded-xl items-center justify-center border-2 overflow-hidden ...`}
        >
          <Text className={`font-black text-[10px] mb-1 ...`}>DAY {day}</Text>
          <Text className={isCurrent ? 'text-xl' : 'text-lg grayscale'}>🎁</Text>
          <Text className={`font-bold mt-1 text-[9px] ...`}>{amount >= 1000 ? `${amount/1000}k` : amount} 🪙</Text>
  ```
- **Breakage Explanation**:
  Placing 7 day cards into an unscrollable row on 320–360px screens leaves <41px width per card, causing severe text clipping, multi-line wrapping of coin amounts, and border collisions.
- **Exact Responsive Replacement**:
  ```tsx
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: '2%', gap: 6 }} className="mb-4">
    {days.map((day) => (
      <TouchableOpacity
        key={day}
        onPress={() => handleClaim(day)}
        disabled={!isCurrent || loading}
        style={{ width: '13%', minWidth: 54 }}
        className={`py-3 px-1 rounded-xl items-center justify-center border-2 overflow-hidden ${
          isPast ? 'bg-gray-800 border-gray-600 opacity-50' 
          : isCurrent ? 'bg-yellow-400 border-white' 
          : 'bg-white/10 border-white/10 opacity-70'
        }`}
      >
        <Text numberOfLines={1} className={`font-black text-[10px] mb-1 ${isCurrent ? 'text-indigo-900' : 'text-white/60'}`}>
          DAY {day}
        </Text>
        <Text className={isCurrent ? 'text-xl' : 'text-lg grayscale'}>🎁</Text>
        <Text numberOfLines={1} className={`font-bold mt-1 text-[9px] ${isCurrent ? 'text-indigo-900' : 'text-yellow-400'}`}>
          {amount >= 1000 ? `${amount/1000}k` : amount} 🪙
        </Text>
        {tokens > 0 && (
          <Text numberOfLines={1} className={`font-bold mt-0.5 text-[9px] ${isCurrent ? 'text-purple-700' : 'text-purple-400'}`}>
            +{tokens} 🎟️
          </Text>
        )}
      </TouchableOpacity>
    ))}
  </ScrollView>
  ```

---

### 4.4 CoinShop Confirmation Overlay (`src/components/CoinShop.tsx`)
- **File**: `src/components/CoinShop.tsx`
- **Lines**: 145–166
- **Current Problematic Code**:
  ```tsx
  {confirmAction && (
    <View className="absolute inset-0 bg-indigo-950/95 justify-center items-center rounded-3xl z-50 p-6">
      <Text className="text-6xl mb-4 animate-pulse">💎</Text>
      <Text className="text-3xl font-black text-white italic mb-4 tracking-tighter text-center">{confirmAction.title}</Text>
      <Text className="text-yellow-400 text-xl text-center font-bold px-6 mb-8">{confirmAction.message}</Text>
      <View className="flex-row gap-4">
        <TouchableOpacity onPress={() => setConfirmAction(null)} disabled={loading} className="bg-gray-600 px-8 py-3 rounded-2xl active:scale-95 border border-gray-400">
          <Text className="text-white font-black uppercase text-lg">Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity ... className="bg-green-500 px-8 py-3 rounded-2xl active:scale-95 ...">
          <Text className="text-white font-black uppercase text-lg">Confirm</Text>
        </TouchableOpacity>
      </View>
    </View>
  )}
  ```
- **Breakage Explanation**:
  Massive font sizes (`text-6xl`, `text-3xl`, `text-xl`) and `px-8` button padding overflow vertically on compact phone screens and in landscape mode, pushing the Confirm and Cancel buttons off-screen.
- **Exact Responsive Replacement**:
  ```tsx
  {confirmAction && (
    <View style={{ width: '100%', height: '100%' }} className="absolute inset-0 bg-indigo-950/95 rounded-3xl z-50">
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: '6%' }}>
        <Text className="text-4xl mb-2 animate-pulse">💎</Text>
        <Text adjustsFontSizeToFit numberOfLines={1} className="text-2xl font-black text-white italic mb-2 tracking-tighter text-center">{confirmAction.title}</Text>
        <Text className="text-yellow-400 text-base text-center font-bold px-4 mb-6">{confirmAction.message}</Text>
        <View style={{ width: '100%', gap: 12 }} className="flex-row justify-center px-2">
          <TouchableOpacity 
            onPress={() => setConfirmAction(null)} 
            disabled={loading} 
            style={{ width: '45%' }}
            className="bg-gray-600 py-3 rounded-2xl active:scale-95 border border-gray-400 items-center"
          >
            <Text className="text-white font-black uppercase text-base">Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => {
              confirmAction.action();
              setConfirmAction(null);
            }} 
            disabled={loading} 
            style={{ width: '45%' }}
            className="bg-green-500 py-3 rounded-2xl active:scale-95 border border-green-300 items-center"
          >
            <Text className="text-white font-black uppercase text-base">Confirm</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )}
  ```

---

### 4.5 Friends Modal Keyboard Occlusion (`src/components/Friends.tsx`)
- **File**: `src/components/Friends.tsx`
- **Lines**: 162–164, 217–235
- **Current Problematic Code**:
  ```tsx
  <View className="flex-1 bg-black/80 justify-center items-center p-2">
    <View className="bg-indigo-950 rounded-[2rem] p-6 border border-white/20 w-full max-w-2xl h-[90%] shadow-2xl relative">
      ...
      <TextInput
        placeholder="Search ID (e.g. 0000001)"
        ...
        className="flex-1 bg-white/10 border border-white/20 rounded-xl py-3 px-4 font-bold text-white uppercase text-sm"
      />
  ```
- **Breakage Explanation**:
  The modal card is hardcoded to `h-[90%]`. When focusing the Search ID `TextInput`, there is no `KeyboardAvoidingView`. The virtual keyboard covers the lower half of the modal, hiding search errors and search results.
- **Exact Responsive Replacement**:
  ```tsx
  <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-black/80 justify-center items-center">
    <View style={{ width: '92%', height: '88%' }} className="bg-indigo-950 rounded-[2rem] p-5 border border-white/20 shadow-2xl relative">
  ```

---

### 4.6 GuideModal Tablet Stretch & Layout Math (`src/components/GuideModal.tsx`)
- **File**: `src/components/GuideModal.tsx`
- **Lines**: 30, 169
- **Current Problematic Code**:
  ```tsx
  <View className="w-full h-[95%] bg-indigo-950 border border-cyan-500/40 rounded-3xl overflow-hidden shadow-[0_0_25px_rgba(34,211,238,0.15)] flex-col">
  ...
  <View className="w-1.5 bg-black/40 rounded-full my-5 mr-3 overflow-hidden border border-white/5" style={{ height: scrollViewHeight - 40 }}>
  ```
- **Breakage Explanation**:
  `w-full` without max-width bounding causes the tutorial modal to stretch to 1000px on an iPad Pro, distorting line lengths. The scroll indicator math `scrollViewHeight - 40` can produce negative or NaN styles before layout measurement completes.
- **Exact Responsive Replacement**:
  ```tsx
  <View style={{ width: '92%', height: '90%' }} className="bg-indigo-950 border border-cyan-500/40 rounded-3xl overflow-hidden shadow-[0_0_25px_rgba(34,211,238,0.15)] flex-col self-center">
  ...
  <View style={{ height: Math.max(scrollViewHeight - 40, 0), width: '1.5%' }} className="bg-black/40 rounded-full my-5 mr-3 overflow-hidden border border-white/5">
  ```

---

### 4.7 InviteEarnModal Referral Code Horizontal Overflow (`src/components/InviteEarnModal.tsx`)
- **File**: `src/components/InviteEarnModal.tsx`
- **Lines**: 30–44
- **Current Problematic Code**:
  ```tsx
  <View className="bg-black/30 p-5 rounded-2xl flex-row justify-between items-center border border-white/10">
    <Text className="text-white font-mono text-3xl tracking-[0.2em] font-black">
      {String(profile.friend_id || 0).padStart(7, '0')}
    </Text>
    
    <TouchableOpacity ... className="bg-white/20 px-4 py-3 rounded-xl active:scale-95">
      <Text className="text-white font-bold text-xs uppercase tracking-widest">Copy</Text>
    </TouchableOpacity>
  </View>
  ```
- **Breakage Explanation**:
  7 wide monospace characters with `0.2em` letter tracking take ~220px width. Combined with `p-5` container padding (40px) and the Copy button (~65px), total width is 325px. Inside modal padding `p-6` (48px), the required width is 373px, which overflows 360px screens and pushes the Copy button out of the row.
- **Exact Responsive Replacement**:
  ```tsx
  <View style={{ width: '100%', padding: '4%' }} className="bg-black/30 rounded-2xl flex-row justify-between items-center border border-white/10 gap-2">
    <Text 
      adjustsFontSizeToFit 
      numberOfLines={1} 
      style={{ flex: 1 }}
      className="text-white font-mono text-2xl tracking-[0.12em] font-black"
    >
      {String(profile.friend_id || 0).padStart(7, '0')}
    </Text>
    
    <TouchableOpacity 
      onPress={() => { 
        Clipboard.setStringAsync(String(profile.friend_id || 0).padStart(7, '0')); 
        Alert.alert('Copied!', 'Referral code copied to clipboard!'); 
      }} 
      style={{ flexShrink: 0 }}
      className="bg-white/20 px-4 py-2.5 rounded-xl active:scale-95"
    >
      <Text className="text-white font-bold text-xs uppercase tracking-wider">Copy</Text>
    </TouchableOpacity>
  </View>
  ```

---

### 4.8 InviteFriends Lobby MaxHeight (`src/components/InviteFriends.tsx`)
- **File**: `src/components/InviteFriends.tsx`
- **Line**: 78
- **Current Problematic Code**:
  ```tsx
  <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled className="gap-2">
  ```
- **Breakage Explanation**:
  Hardcoded 150px maxHeight inside a constrained host waiting lobby takes away precious vertical space on smaller devices.
- **Exact Responsive Replacement**:
  ```tsx
  <ScrollView style={{ maxHeight: '35%' }} nestedScrollEnabled className="gap-2">
  ```

---

### 4.9 Leaderboard Tablet Stretch (`src/components/Leaderboard.tsx`)
- **File**: `src/components/Leaderboard.tsx`
- **Lines**: 42–44
- **Current Problematic Code**:
  ```tsx
  <View className="flex-1 bg-black/80 justify-end">
    <View className="bg-indigo-950 rounded-t-[2rem] border-t border-white/20 h-[80%]">
  ```
- **Breakage Explanation**:
  On an iPad (820px or 1024px width), the bottom sheet stretches across 100% of the screen width, making rank cards 800px wide.
- **Exact Responsive Replacement**:
  ```tsx
  <View className="flex-1 bg-black/80 justify-end items-center">
    <View style={{ width: '100%', maxWidth: '92%', height: '80%' }} className="bg-indigo-950 rounded-t-[2rem] border-t border-white/20">
  ```

---

### 4.10 OnboardingModal Keyboard Occlusion (`src/components/OnboardingModal.tsx`)
- **File**: `src/components/OnboardingModal.tsx`
- **Lines**: 72–76
- **Current Problematic Code**:
  ```tsx
  <KeyboardAvoidingView 
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
    className="flex-1 justify-center items-center bg-black/70 p-4"
  >
    <View className="w-full max-w-[400px] bg-black/80 px-6 py-5 rounded-[2rem] border border-cyan-500/30 ...">
  ```
- **Breakage Explanation**:
  Without an internal `ScrollView`, the virtual keyboard pushes form elements off-screen on compact phones, making it impossible to click "Save Profile".
- **Exact Responsive Replacement**:
  ```tsx
  <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-black/70">
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: '5%' }} keyboardShouldPersistTaps="handled">
      <View style={{ width: '90%' }} className="bg-black/80 px-6 py-5 rounded-[2rem] border border-cyan-500/30">
  ```

---

### 4.11 WorldChat Fixed Height Lock (`src/components/WorldChat.tsx`)
- **File**: `src/components/WorldChat.tsx`
- **Line**: 94
- **Current Problematic Code**:
  ```tsx
  <View className="bg-white/10 rounded-[2rem] p-4 border border-white/20 mt-6 w-full h-80">
  ```
- **Breakage Explanation**:
  `h-80` (320px) consumes the entire viewport on landscape devices (360–375px height), clipping the chat input below the screen fold.
- **Exact Responsive Replacement**:
  ```tsx
  <View style={{ width: '100%', flex: 1, minHeight: '35%', maxHeight: '55%' }} className="bg-white/10 rounded-[2rem] p-4 border border-white/20 mt-4">
  ```

---

### 4.12 NotificationManager Notch & Top HUD Collision (`src/components/NotificationManager.tsx`)
- **File**: `src/components/NotificationManager.tsx`
- **Line**: 79
- **Current Problematic Code**:
  ```tsx
  <View className="absolute top-4 left-4 right-4 z-50 gap-2">
  ```
- **Breakage Explanation**:
  `top-4` (16px) renders incoming notifications directly underneath the Dynamic Island or camera notch on iOS. Furthermore, it completely covers the profile card and currency counters in the Dashboard HUD.
- **Exact Responsive Replacement**:
  ```tsx
  <SafeAreaView style={{ width: '92%', top: '2%' }} className="absolute self-center z-50 pointer-events-box-none">
    <View className="gap-2">
  ```

---

### 4.13 Auth Screen Missing Scroll & Keyboard Lock (`src/components/Auth.tsx`)
- **File**: `src/components/Auth.tsx`
- **Lines**: 121–124
- **Current Problematic Code**:
  ```tsx
  <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-center items-center p-4">
    {/* Floating Form Card */}
    <View className="w-full max-w-[400px] bg-black/40 px-6 py-4 rounded-[1.5rem] border border-white/10 shadow-2xl backdrop-blur-md">
  ```
- **Breakage Explanation**:
  When the keyboard pops up on phones <=700px in height, the available space drops to ~340px. The 420px form card overflows below the fold, completely hiding the input fields and submit button with no scrollability.
- **Exact Responsive Replacement**:
  ```tsx
  <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: '5%' }} keyboardShouldPersistTaps="handled">
      <View style={{ width: '90%' }} className="bg-black/40 px-6 py-5 rounded-[1.5rem] border border-white/10 shadow-2xl backdrop-blur-md">
  ```

---

### 4.14 IntroScreen Logo Scaling (`src/components/IntroScreen.tsx`)
- **File**: `src/components/IntroScreen.tsx`
- **Line**: 56
- **Current Problematic Code**:
  ```tsx
  <Image 
    source={require('../../assets/cv_logo_final.png')} 
    className="w-64 h-64"
    resizeMode="contain"
  />
  ```
- **Breakage Explanation**:
  `w-64 h-64` (256×256px) scaled by 1.1x reaches 281.6px. On 320px split screen or compact phone heights, it overflows vertically.
- **Exact Responsive Replacement**:
  ```tsx
  <Image 
    source={require('../../assets/cv_logo_final.png')} 
    style={{ width: '60%', aspectRatio: 1 }}
    resizeMode="contain"
  />
  ```

---

### 4.15 LoadingScreen Giant Font & Rigid Progress Padding (`src/components/LoadingScreen.tsx`)
- **File**: `src/components/LoadingScreen.tsx`
- **Lines**: 59 & 75
- **Current Problematic Code**:
  ```tsx
  <Text className="text-6xl font-black tracking-widest uppercase italic" ...>
  ...
  <View className="w-full px-16 pb-8">
  ```
- **Breakage Explanation**:
  `text-6xl` (60px) + `tracking-widest` spans >320px, breaking "HEADTAIL" onto two lines. `px-16` (128px horizontal padding) leaves only 247px for the progress bar on iPhone SE, but stretches it to 896px on an iPad.
- **Exact Responsive Replacement**:
  ```tsx
  <Text 
    numberOfLines={1}
    adjustsFontSizeToFit
    className="text-4xl sm:text-5xl font-black tracking-wider uppercase italic"
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
  <View style={{ width: '85%', paddingHorizontal: '8%' }} className="self-center pb-8">
  ```

---

### 4.16 OfflineApp GameRoom Over-Padding & Tablet Banner Distortion (`OfflineApp.tsx`)
- **File**: `OfflineApp.tsx`
- **Lines**: 96, 108, 112
- **Current Problematic Code**:
  ```tsx
  // Line 96:
  <SafeAreaView className="flex-1 bg-indigo-950">
    <View className="p-4 flex-1">
      <GameRoom room={offlineRoom} playerId="guest" onExit={() => setOfflineRoom(null)} onAction={handleAction} />
    </View>
  </SafeAreaView>

  // Lines 108 & 112:
  <TouchableOpacity onPress={startOfflineGame} className="w-full bg-yellow-400 py-4 rounded-2xl active:scale-95 mb-4">
  ...
  <TouchableOpacity onPress={onRetry} className="w-full bg-white/10 py-4 rounded-2xl active:scale-95">
  ```
- **Breakage Explanation**:
  1. `p-4` adds 32px of unneeded horizontal padding around `GameRoom`, robbing the scorecard and hand selectors of width on small screens.
  2. `w-full` buttons in the disconnected state stretch to 1000px wide on tablets.
- **Exact Responsive Replacement**:
  ```tsx
  // Line 96 Replacement:
  <SafeAreaView className="flex-1 bg-indigo-950">
    <View className="flex-1">
      <GameRoom room={offlineRoom} playerId="guest" onExit={() => setOfflineRoom(null)} onAction={handleAction} />
    </View>
  </SafeAreaView>

  // Lines 108 & 112 Replacement:
  <View style={{ width: '85%' }} className="self-center">
    <TouchableOpacity onPress={startOfflineGame} style={{ width: '100%' }} className="bg-yellow-400 py-4 rounded-2xl active:scale-95 mb-4">
      <Text adjustsFontSizeToFit numberOfLines={1} className="text-indigo-900 font-black text-lg text-center uppercase tracking-wider">Play as Guest</Text>
    </TouchableOpacity>
    
    <TouchableOpacity onPress={onRetry} style={{ width: '100%' }} className="bg-white/10 py-4 rounded-2xl active:scale-95">
      <Text adjustsFontSizeToFit numberOfLines={1} className="text-white font-black text-lg text-center uppercase tracking-wider">Connect WiFi & Retry</Text>
    </TouchableOpacity>
  </View>
  ```

---

## 5. Systematic Best Practices & Architecture Patterns for Responsive React Native in Head-Tail-App

To prevent regressions and ensure modern responsive React Native standards throughout future development, five foundational architecture rules must be observed across `head-tail-app`:

### Rule 1: Percentage-First Sizing & Aspect-Ratio Geometry
- **Never specify fixed pixel widths or heights on interactive circular/square tokens.** Instead of `width: 96, height: 96`, use `width: '24%', aspectRatio: 1, borderRadius: 9999`.
- **Always enforce fluid bounds:** Modal overlays and cards should declare `width: '90%'` or `width: '85%'` combined with flexbox centering rather than fixed bounds like `w-64` (256px) or `w-56` (224px).

### Rule 2: Dynamic Typography with Ellipsis & Font Auto-Scaling
- In React Native, fixed large font sizes (e.g. `fontSize: 42`, `fontSize: 56`, `text-6xl`) break unpredictably across devices with OS-level font accessibility scaling.
- Every prominent heading, player username, or room code must be decorated with:
  ```tsx
  <Text numberOfLines={1} adjustsFontSizeToFit className="...">
  ```
- Horizontal rows with titles must set `flexShrink: 1` and `minWidth: 0` on the text wrapper container to permit text clipping without blowing out the flex row width.

### Rule 3: Safe Area Hygiene
- Avoid arbitrary absolute top margins like `top-2` (8px) or `top-4` (16px) on floating headers and notification managers.
- Wrap floating overlays in `<SafeAreaView>` or calculate dynamic top padding using platform detection:
  ```tsx
  style={{ top: Platform.OS === 'android' ? 24 : 8 }}
  ```
- This guarantees zero overlap with the iOS Dynamic Island, camera hole-punch displays, and translucent status bars.

### Rule 4: The Canonical Keyboard-Avoiding Form Pattern
- Any component containing a `<TextInput>` (`Auth.tsx`, `OnboardingModal.tsx`, Game Modes Join Card in `App.tsx`, `Friends.tsx`, `WorldChat.tsx`) must never place the card in a bare `<KeyboardAvoidingView>`.
- The canonical production pattern in React Native is:
  ```tsx
  <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }} keyboardShouldPersistTaps="handled">
      <View style={{ width: '90%' }}>
        {/* Form Inputs & Submit Button */}
      </View>
    </ScrollView>
  </KeyboardAvoidingView>
  ```
- This ensures that when the soft keyboard rises (~300px), the view remains fully scrollable, guaranteeing that the submit action is never locked behind the keyboard.

### Rule 5: Elimination of Absolute Sibling Collisions
- Sibling components that appear below each other on screen must remain in normal flexbox flow.
- Scoreboards must not be taken out of flow using `absolute top-0` while content below relies on static `mt-20`.
- Spectator indicators must not use `absolute top-full`, which consumes 0px of flow height.
- Retaining elements in the document flow allows React Native's Yoga layout engine to dynamically adjust spacing regardless of device height.

---

## 6. Summary of Actionable Replacements Checklist

Use this checklist to verify that all 26 identified responsiveness defects across 11 files are addressed during modernization:

```
[ ] 1. App.tsx (Line 57): DashboardFriends - replace h-80 with maxHeight: '42%', flex-shrink.
[ ] 2. App.tsx (Line 68): DashboardFriends - replace w-44 with width: '45%', maxWidth: '50%'.
[ ] 3. App.tsx (Line 63): Settings Button - replace w-9 h-9 with width: '12%', aspectRatio: 1.
[ ] 4. App.tsx (Line 363): Settings Modal - replace w-64 with width: '85%', maxWidth: '90%'.
[ ] 5. App.tsx (Line 408): Top HUD Container - replace top-2 with top: '2%'.
[ ] 6. App.tsx (Lines 413, 428): Profile & Currencies - replace inline row with maxWidth: '52%', flexWrap: 'wrap'.
[ ] 7. App.tsx (Line 455): Left Vertical Menu - replace gap-6 mt-8 with gap: 8, marginTop: '3%'.
[ ] 8. App.tsx (Lines 503-523): 3D Hero Coin - replace w-48/w-32 with width: '48%', aspectRatio: 1.
[ ] 9. App.tsx (Lines 564-629): Game Modes Modal - add KeyboardAvoidingView, replace w-56 with width: '70%'.
[ ] 10. GameRoom.tsx (Lines 440, 602): Matchmaking Cards - replace minWidth: 185 with flex: 1, maxWidth: '40%'.
[ ] 11. GameRoom.tsx (Lines 522-599): Matchmaking "VS" Emblem - replace 56px font and margin with width: '18%'.
[ ] 12. GameRoom.tsx (Lines 394, 690): Loading Bar & Queue Capsule - replace 220px/250px with width: '60%', '68%'.
[ ] 13. GameRoom.tsx (Lines 788-889): Host Waiting Lobby - wrap in ScrollView, replace overs buttons with width: '18%'.
[ ] 14. GameRoom.tsx (Lines 1113-1152): Toss Call - bring Scoreboard into flow, replace w-32 coins with width: '44%', aspectRatio: 1.
[ ] 15. GameRoom.tsx (Lines 1246-1274): Squad Selection - wrap player role buttons in ScrollView with width: '100%'.
[ ] 16. GameRoom.tsx (Lines 1359-1380): Floating Controls - replace top-0 with top: '1%', width: '10%', aspectRatio: 1.
[ ] 17. GameRoom.tsx (Lines 1474-1493): Chat Input Bar - replace w-12 buttons with width: '11%', aspectRatio: 1.
[ ] 18. RevealView.tsx (Lines 106-127): Animated Coin - replace 96x96px with width: '24%', aspectRatio: 1.
[ ] 19. RevealView.tsx (Lines 169-173): Toss Result Gradients - replace width: 48 with flex: 1.
[ ] 20. RevealView.tsx (Line 201): Player Choices Container - replace width: '60%' with width: '92%'.
[ ] 21. RevealView.tsx (Lines 266-288): Bat/Bowl Cards & Result - replace w-28 with width: '38%', minHeight: '15%'.
[ ] 22. HandSelector.tsx (Lines 19, 25): Buttons Grid - replace w-20 h-24 with width: '29%', aspectRatio: 4/5.
[ ] 23. Scoreboard.tsx (Lines 70, 145-150): Spectator Badge - remove absolute top-full, bring into normal flow.
[ ] 24. DailyRewardModal.tsx (Lines 161-178): 7 Days Row - replace flex-row with horizontal ScrollView.
[ ] 25. CoinShop.tsx (Lines 145-166): Overlays - wrap in ScrollView, replace button padding with width: '45%'.
[ ] 26. Auth.tsx (Lines 121-124): Form Card - wrap in ScrollView contentContainerStyle={{ flexGrow: 1 }}.
```

---
*End of Blueprint. Synthesized from verified Explorer static audits.*

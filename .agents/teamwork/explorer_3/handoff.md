# Handoff Report: Explorer 3 — Matchmaking & Auxiliary Components Responsiveness Audit

**Date**: 2026-09-29T20:36:00Z  
**Role**: Explorer 3 (Matchmaking & Auxiliary Components Audit)  
**Target Files**:
- Matchmaking & Lobby UI: `src/components/GameRoom.tsx` (Lines 248–1500)
- Auxiliary Modals: `src/components/CoinShop.tsx`, `src/components/DailyRewardModal.tsx`, `src/components/Friends.tsx`, `src/components/GuideModal.tsx`, `src/components/InviteEarnModal.tsx`, `src/components/Leaderboard.tsx`, `src/components/OnboardingModal.tsx`, `src/components/Auth.tsx`
- Auxiliary Game Controls & Badges: `src/components/HandSelector.tsx`, `src/components/Scoreboard.tsx`, `src/components/WorldChat.tsx`, `src/components/InviteFriends.tsx`, `src/components/NotificationManager.tsx`, `src/components/IntroScreen.tsx`, `src/components/LoadingScreen.tsx`
- Root Auxiliary Components in `App.tsx`: `DashboardFriends`, Settings Modal, Game Modes Modal, Global Notifications

---

## 1. Observation

Direct code inspections of all auxiliary components and the Matchmaking subsystem revealed hardcoded absolute dimensions (fixed pixel widths, fixed pixel heights, rigid minWidths, unconstrained paddings, and unhandled keyboard/notch bounds) across 18 distinct components/locations.

### 1.1 Matchmaking Subsystem (`src/components/GameRoom.tsx`)

#### Observation 1.1.1: Rigid Card Widths & `minWidth: 185` Collision
- **Location**: `src/components/GameRoom.tsx:440` and `src/components/GameRoom.tsx:602`
- **Verbatim Code**:
```tsx
// Line 440: Player Card Container
<View style={{ width: '34%', maxWidth: 245, minWidth: 185, height: 72, position: 'relative' }}>

// Line 602: Opponent Card Container
<View style={{ width: '34%', maxWidth: 245, minWidth: 185, height: 72, position: 'relative' }}>
```
- **Context Parent**:
```tsx
// Line 429-437:
<View style={{
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  paddingHorizontal: 20,
  marginTop: -16,
  marginBottom: 16
}} pointerEvents="box-none">
```

#### Observation 1.1.2: Hardcoded Central "VS" Emblem with 56px Font & Negative Margins
- **Location**: `src/components/GameRoom.tsx:522–599`
- **Verbatim Code**:
```tsx
// Lines 522, 539, 560-561, 579, 584:
<View style={{ width: '22%', alignItems: 'center', justifyContent: 'center', zIndex: 20 }}>
  ...
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
  <View style={{
    position: 'absolute',
    width: 2.5,
    height: 85,
    transform: [{ rotate: '18deg' }, { translateX: -1 }, { translateY: 8 }],
    shadowColor: '#00D9FF',
    shadowOpacity: 1,
    shadowRadius: 10,
    zIndex: 3,
    marginLeft: 3.4,
    borderRadius: 2,
    overflow: 'hidden'
  }}>
  ...
  <Text style={{
    fontSize: 56,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#9126D1',
    letterSpacing: -2,
    marginLeft: -40,
    lineHeight: 80,
    paddingLeft: 20,
    paddingRight: 10,
    paddingTop: 15,
    paddingBottom: 5,
    zIndex: 1
  }}>
    S
  </Text>
```

#### Observation 1.1.3: Matchmaking Loading Bar Rigid 220px Width
- **Location**: `src/components/GameRoom.tsx:394–395`
- **Verbatim Code**:
```tsx
<View style={{
  width: 220,
  height: 10,
  backgroundColor: '#061A3A',
  borderRadius: 9999,
  marginTop: 17,
  overflow: 'hidden',
  borderWidth: 1.5,
  borderColor: 'rgba(0, 217, 255, 0.45)',
  shadowColor: '#00D9FF',
  shadowOpacity: 0.6,
  shadowRadius: 8,
  elevation: 4
}}>
```

#### Observation 1.1.4: Queue Time Capsule Rigid 250px Width
- **Location**: `src/components/GameRoom.tsx:690–691`
- **Verbatim Code**:
```tsx
<View style={{
  width: 250,
  height: 46,
  borderRadius: 23,
  backgroundColor: 'rgba(7, 20, 38, 0.92)',
  borderWidth: 1.5,
  borderColor: 'rgba(0, 217, 255, 0.45)',
  shadowColor: '#00D9FF',
  shadowOpacity: 0.35,
  shadowRadius: 12,
  elevation: 6,
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 8,
  position: 'relative'
}}>
```

#### Observation 1.1.5: Matchmaking Title Hardcoded 42px Font Size
- **Location**: `src/components/GameRoom.tsx:348 & 365`
- **Verbatim Code**:
```tsx
<Text style={{
  fontSize: 42,
  fontWeight: '900',
  fontStyle: 'italic',
  letterSpacing: 2,
  textAlign: 'center',
  backgroundColor: 'transparent'
}}>
  MATCHMAKING
</Text>
```

---

### 1.2 Room Lobby & Match Setup Auxiliary Components (`src/components/GameRoom.tsx`)

#### Observation 1.2.1: Normal Room Lobby Uncontained Vertical Layout (Missing ScrollView) & Rigid Button Rows
- **Location**: `src/components/GameRoom.tsx:789–889`
- **Verbatim Code**:
```tsx
<View className="space-y-6">
  {!isCasualMatch && (
    <View className="bg-indigo-900/50 p-6 rounded-3xl border border-indigo-400/20 text-center">
      <Text className="text-white opacity-80 font-bold uppercase tracking-widest text-xs mb-2">Room Code</Text>
      <Text className="text-5xl font-mono font-black text-yellow-400 tracking-[0.2em]">{room.code}</Text>
    </View>
  )}
  ...
  <Text className="text-white opacity-80 font-bold uppercase text-xs mb-2 mt-2">Overs</Text>
  <View className="flex-row flex-wrap gap-2 mb-4">
    {[2, 5, 10, 20, null].map(o => (
      <TouchableOpacity 
        key={o ?? 'unlimited'} 
        onPress={() => setOversLimit(o)} 
        className={`flex-1 py-2 rounded-xl border ${oversLimit === o ? 'bg-yellow-400 border-yellow-400' : 'bg-white/10 border-white/20'}`}
      >
        <Text className={`text-center font-black text-xs ${oversLimit === o ? 'text-indigo-900' : 'text-white/60'}`}>{o === null ? 'UNLIMITED' : o}</Text>
      </TouchableOpacity>
    ))}
  </View>
  ...
  <TouchableOpacity
    onPress={() => takeAction(...)}
    className="w-full bg-yellow-400 disabled:opacity-50 py-4 rounded-2xl shadow-xl active:scale-95"
  >
    <Text className="text-indigo-900 font-black text-xl uppercase tracking-wider text-center">Start Match</Text>
  </TouchableOpacity>
</View>
```

#### Observation 1.2.2: Toss Call Hardcoded 128px Circle Buttons with Excessive Horizontal Padding
- **Location**: `src/components/GameRoom.tsx:1117–1143`
- **Verbatim Code**:
```tsx
<View className="flex-1 items-center justify-center z-10 w-full px-12 mt-20" pointerEvents="box-none">
  ...
  <View className="flex-row justify-between w-full max-w-sm px-8">
    <TouchableOpacity 
      disabled={loading} 
      onPress={() => takeAction({ type: 'TOSS_CALL', choice: 'head' })} 
      className={`w-32 h-32 rounded-full bg-yellow-500 items-center justify-center border-4 border-yellow-600 ${loading ? 'opacity-50' : 'active:scale-95'}`}
    >
      <Text className="text-5xl font-black text-white">H</Text>
      <Text className="text-sm font-black text-white mt-1">HEADS</Text>
    </TouchableOpacity>
    <TouchableOpacity 
      disabled={loading} 
      onPress={() => takeAction({ type: 'TOSS_CALL', choice: 'tail' })} 
      className={`w-32 h-32 rounded-full bg-slate-200 items-center justify-center border-4 border-slate-300 ${loading ? 'opacity-50' : 'active:scale-95'}`}
    >
      <Text className="text-5xl font-black text-slate-700">T</Text>
      <Text className="text-sm font-black text-slate-700 mt-1">TAILS</Text>
    </TouchableOpacity>
  </View>
```

#### Observation 1.2.3: In-Game Action Buttons Collision with Notch / Status Bar
- **Location**: `src/components/GameRoom.tsx:1359 & 1364`
- **Verbatim Code**:
```tsx
<View className="absolute top-0 left-0 z-50 mt-1 ml-1">
  <TouchableOpacity onPress={handleExit} className="w-10 h-10 rounded-full ...">
...
<View className="absolute top-0 right-0 z-50 flex-row gap-2 mt-1 mr-1">
  <TouchableOpacity onPress={toggleMic} className={`w-10 h-10 rounded-full ...`}>
```

---

### 1.3 Interactive Auxiliary Components & Controls

#### Observation 1.3.1: HandSelector Rigid 80x96px Button Grid
- **Location**: `src/components/HandSelector.tsx:19–31`
- **Verbatim Code**:
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

#### Observation 1.3.2: WorldChat Fixed 320px Height
- **Location**: `src/components/WorldChat.tsx:94`
- **Verbatim Code**:
```tsx
<View className="bg-white/10 rounded-[2rem] p-4 border border-white/20 mt-6 w-full h-80">
```

#### Observation 1.3.3: Scoreboard Spectator Badge Absolute Layout Overflow
- **Location**: `src/components/Scoreboard.tsx:145–150`
- **Verbatim Code**:
```tsx
{players.filter(p => p.id === room.waiting_player_id).map((p, i) => (
  <View key={`spec-${i}`} className="absolute top-full left-0 right-0 items-center mt-4 opacity-50">
    <Text className="text-[8px] text-white font-light tracking-[0.3em] uppercase mb-0.5">Spectating</Text>
    <Text className="text-xs text-white font-medium tracking-widest" numberOfLines={1}>{p.id === playerId ? 'YOU' : p.label}</Text>
  </View>
))}
```

#### Observation 1.3.4: InviteFriends Arbitrary MaxHeight
- **Location**: `src/components/InviteFriends.tsx:78`
- **Verbatim Code**:
```tsx
<ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled className="gap-2">
```

---

### 1.4 Auxiliary Modal Dialogs Audit

#### Observation 1.4.1: DailyRewardModal 7-Column Inline Compression
- **Location**: `src/components/DailyRewardModal.tsx:161–178`
- **Verbatim Code**:
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
        <Text className={`font-black text-[10px] mb-1 ...`}>
          DAY {day}
        </Text>
        ...
        <Text className={`font-bold mt-1 text-[9px] ...`}>
          {amount >= 1000 ? `${amount/1000}k` : amount} 🪙
        </Text>
        {tokens > 0 && (
          <Text className={`font-bold mt-0.5 text-[9px] ...`}>
            +{tokens} 🎟️
          </Text>
        )}
```

#### Observation 1.4.2: CoinShop Confirm & Success Overlays Rigid Vertical Sizing
- **Location**: `src/components/CoinShop.tsx:145–166`
- **Verbatim Code**:
```tsx
{confirmAction && (
  <View className="absolute inset-0 bg-indigo-950/95 justify-center items-center rounded-3xl z-50 p-6">
    <Text className="text-6xl mb-4 animate-pulse">💎</Text>
    <Text className="text-3xl font-black text-white italic mb-4 tracking-tighter text-center">
      {confirmAction.title}
    </Text>
    <Text className="text-yellow-400 text-xl text-center font-bold px-6 mb-8">
      {confirmAction.message}
    </Text>
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

#### Observation 1.4.3: GuideModal Rigid `h-[95%]` and Unsafe Scroll Indicator Math
- **Location**: `src/components/GuideModal.tsx:30 & 168–178`
- **Verbatim Code**:
```tsx
<View className="w-full h-[95%] bg-indigo-950 border border-cyan-500/40 rounded-3xl overflow-hidden shadow-[0_0_25px_rgba(34,211,238,0.15)] flex-col">
...
<View className="w-1.5 bg-black/40 rounded-full my-5 mr-3 overflow-hidden border border-white/5" style={{ height: scrollViewHeight - 40 }}>
```

#### Observation 1.4.4: InviteEarnModal 7-Digit Code & Copy Button Horizontal Overflow
- **Location**: `src/components/InviteEarnModal.tsx:30–44`
- **Verbatim Code**:
```tsx
<View className="bg-black/30 p-5 rounded-2xl flex-row justify-between items-center border border-white/10">
  <Text className="text-white font-mono text-3xl tracking-[0.2em] font-black">
    {String(profile.friend_id || 0).padStart(7, '0')}
  </Text>
  
  <TouchableOpacity 
    ...
    className="bg-white/20 px-4 py-3 rounded-xl active:scale-95"
  >
    <Text className="text-white font-bold text-xs uppercase tracking-widest">Copy</Text>
  </TouchableOpacity>
</View>
```

#### Observation 1.4.5: OnboardingModal KeyboardAvoidingView Without Internal ScrollView
- **Location**: `src/components/OnboardingModal.tsx:72–76`
- **Verbatim Code**:
```tsx
<KeyboardAvoidingView 
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
  className="flex-1 justify-center items-center bg-black/70 p-4"
>
  <View className="w-full max-w-[400px] bg-black/80 px-6 py-5 rounded-[2rem] border border-cyan-500/30 ...">
```

---

### 1.5 Auxiliary Root Components in `App.tsx`

#### Observation 1.5.1: `DashboardFriends` Widget Rigid 176px Width and 320px Height
- **Location**: `App.tsx:57 & 68`
- **Verbatim Code**:
```tsx
<View className="flex-col items-end gap-3 pr-2 mt-1 pointer-events-auto h-80">
...
  <View className="bg-indigo-900/40 border border-indigo-400/20 rounded-3xl p-5 w-44 flex-1 shadow-2xl">
```

#### Observation 1.5.2: Game Modes Modal Fixed 224x256px Horizontal Cards
- **Location**: `App.tsx:564, 582, 600, 618`
- **Verbatim Code**:
```tsx
<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }} className="w-full pb-4 pt-2">
  <TouchableOpacity ... className="w-56 h-64 bg-slate-900 rounded-[2rem] p-5 shadow-2xl justify-between border-2 ...">
```

#### Observation 1.5.3: NotificationManager Fixed `top-4` Absolute Positioning
- **Location**: `src/components/NotificationManager.tsx:79`
- **Verbatim Code**:
```tsx
<View className="absolute top-4 left-4 right-4 z-50 gap-2">
```

---

## 2. Logic Chain

From the direct observations above, the chain of reasoning establishing failure modes across mobile form factors is derived below:

### 2.1 Matchmaking UI Screen Breakage Analysis
1. **Mathematical Collision in Card Row**:
   - In `GameRoom.tsx:440` and `GameRoom.tsx:602`, the player card and opponent card each specify `minWidth: 185`. Together they require at least `185 + 185 = 370px`.
   - The central VS emblem container specifies `width: '22%'` (`GameRoom.tsx:522`). On a standard 375px screen (iPhone SE), 22% is `82.5px`.
   - The parent container (`GameRoom.tsx:434`) applies `paddingHorizontal: 20` (`40px` total).
   - Total horizontal space demanded: `370px + 82.5px + 40px = 492.5px`.
   - On any phone viewport narrower than 493px (including iPhone SE at 375px, iPhone 14/15 at 390px, standard Android at 360–392px), the row overflows the screen. Because `flexDirection: 'row'` is unconstrained and cards have rigid `minWidth: 185`, the cards collide directly with the central VS letters, forcing text wrapping or clipping.
2. **VS Emblem Collision**:
   - The VS emblem uses `fontSize: 56`, `letterSpacing: -5`, `lineHeight: 80`, and negative `marginLeft: -40` on the "S" letter (`GameRoom.tsx:539, 579, 584`).
   - On narrow screens, these oversized letter bounds collide with the player names inside the adjacent cards.
3. **Queue Time and Loading Bar Inflexibility**:
   - The loading bar is fixed at `width: 220` (`GameRoom.tsx:394`) and the queue time capsule is fixed at `width: 250` (`GameRoom.tsx:690`).
   - On 320px screens, a 250px container with margins leaves almost zero breathing room, whereas on an iPad or large tablet (768px–1024px), a 250px pill is disproportionately small.

### 2.2 Room Lobby & Toss Selection Breakage Analysis
1. **Lobby Scroll Trap**:
   - In `GameRoom.tsx:789–889`, the host lobby renders the Room Code banner (lines 791–794), Scoreboard (line 797), InviteFriends widget (line 800), Room Size selector (lines 809–818), 9 wager buttons (lines 823–831), 5 overs buttons (lines 834–844), 5 wickets buttons (lines 847–857), 3 speed buttons (lines 860–874), and the "Start Match" action button (lines 878–888).
   - This entire layout is rendered inside a plain `<View className="space-y-6">` without a `ScrollView`.
   - On an iPhone SE (height 667px) or in landscape orientation (height ~360–400px), the total vertical height of these stacked sections exceeds 900px.
   - Consequently, the "Start Match" button at the bottom is completely clipped off the screen, preventing the host from launching the game.
2. **Overs Row Text Wrapping**:
   - 5 buttons are forced into a single `flex-row` with `gap-2` using `flex-1` (`GameRoom.tsx:834–844`).
   - On a 320px screen: `320px - 48px (padding) - 32px (4 gaps * 8px) = 240px / 5 = 48px` width per button.
   - The text "UNLIMITED" at 12px font requires ~75px to render in a single line. In a 48px button, "UNLIMITED" wraps into two broken lines ("UNLIMI", "TED") or truncates, distorting the button's vertical alignment.
3. **Toss Call Button Collision**:
   - In `GameRoom.tsx:1126–1143`, the Heads and Tails buttons are hardcoded as `w-32 h-32` (128px x 128px circles).
   - Combined with parent `px-12` (96px horizontal padding) and inner `px-8` (64px padding): `128px + 128px + 96px + 64px = 416px`.
   - On any screen with width < 416px (which includes 90%+ of mobile phones), the circles collide with each other or clip against screen edges.

### 2.3 Auxiliary Controls & Modals Breakage Analysis
1. **HandSelector Rigid Grid**:
   - In `HandSelector.tsx:25`, options are fixed at `w-20 h-24` (80px x 96px).
   - With `gap-3` (12px), 3 buttons require `80*3 + 12*2 = 264px`. Inside modal containers that have `p-6` (48px) or `p-8` (64px) padding, the available width is less than 264px on smaller phones, causing the grid to break into irregular, ragged wrapping (e.g. 2+2+1).
2. **WorldChat Height Lock**:
   - `WorldChat.tsx:94` specifies `h-80` (320px).
   - On landscape devices (height 360–400px), a 320px container consumes the entire viewport, clipping the send input below the screen fold.
3. **DailyRewardModal 7-Day Squeeze**:
   - `DailyRewardModal.tsx:161` attempts to place 7 cards side by side in a non-scrollable flex-row on mobile screens.
   - On a 360px device: `(360px - 32px modal padding - 16px screen padding - 24px gaps) / 7 = ~41px` width per card.
   - Containing `DAY X`, `10000 🪙`, and `+2 🎟️`, 41px width causes extreme text clipping, multi-line wrapping, and overflow outside the card boundaries.
4. **InviteEarnModal Code Overlap**:
   - In `InviteEarnModal.tsx:31–43`, the 7-digit friend code has `text-3xl tracking-[0.2em] font-mono`.
   - 7 wide characters at 30px with 0.2em letter spacing take ~220px. Together with container padding `p-5` (40px) and the Copy button (~65px), total width is 325px.
   - Adding modal padding `p-6` (48px) and outer padding `p-4` (32px), the required width is 405px. On a 360px phone, the code overflows or forces the Copy button off the row.
5. **KeyboardAvoidingView Without Scroll**:
   - In `OnboardingModal.tsx` and `Auth.tsx`, inputs are wrapped in `KeyboardAvoidingView` without a nested `ScrollView`.
   - When the virtual keyboard rises on smaller screens, the remaining viewport is reduced to ~250–320px, clipping the submit buttons and preventing form submission.
6. **Notch & Status Bar Collisions**:
   - `NotificationManager.tsx:79` specifies `absolute top-4 left-4 right-4`. On modern devices with notches or Dynamic Islands (iOS Safe Area top is 47–59px), `top-4` (16px) causes notifications to be obscured by the hardware camera cutout.

---

## 3. Caveats

1. **Read-Only Investigation**: In compliance with the Non-Destructive constraint, no source code or `.tsx` files have been altered.
2. **Core In-Game Gameplay Elements**: Reveal coin animations, 3D flip physics, and round result animations are audited primarily by Explorer 2. They were examined here strictly in the context of auxiliary overlays, headers, and score indicators.
3. **Platform Differences**: Safe area dimensions vary dynamically between iOS (notches, islands, home indicator bars) and Android (translucent navigation bars, punch holes). Responsive replacements utilize React Native `flex`, `percentage` strings, and standard `SafeAreaView`/safe-area insets.
4. **Third-Party Styling Engine**: NativeWind / Tailwind CSS is utilized in parts of the app alongside inline React Native StyleSheet objects. Proposed fixes are provided in pure React Native inline style or NativeWind classes matching each component's local convention.

---

## 4. Conclusion & Actionable Replacements

Every identified issue is documented below with its exact file path, line numbers, current problematic code, and exact responsive replacement code utilizing flexbox, percentage strings, and dynamic scaling.

### Component 1: Matchmaking Player & Opponent Cards (`src/components/GameRoom.tsx`)
- **File**: `src/components/GameRoom.tsx`
- **Lines**: 440 & 602
- **Problematic Code**:
```tsx
// Line 440 (Player Card):
<View style={{ width: '34%', maxWidth: 245, minWidth: 185, height: 72, position: 'relative' }}>

// Line 602 (Opponent Card):
<View style={{ width: '34%', maxWidth: 245, minWidth: 185, height: 72, position: 'relative' }}>
```
- **Why It Breaks**: Hardcoded `minWidth: 185` causes the two cards (370px) plus the VS container (80px) and padding (40px) to demand 490px, causing severe horizontal overflow and overlapping on standard 360–390px phones.
- **Responsive Replacement**:
```tsx
// Player Card Container (Line 440):
<View style={{ flex: 1, minWidth: 0, maxWidth: '40%', height: 72, position: 'relative' }}>

// Opponent Card Container (Line 602):
<View style={{ flex: 1, minWidth: 0, maxWidth: '40%', height: 72, position: 'relative' }}>
```

---

### Component 2: Matchmaking Central "VS" Emblem (`src/components/GameRoom.tsx`)
- **File**: `src/components/GameRoom.tsx`
- **Lines**: 522–599
- **Problematic Code**:
```tsx
<View style={{ width: '22%', alignItems: 'center', justifyContent: 'center', zIndex: 20 }}>
  <View style={{ alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', overflow: 'visible', position: 'relative' }}>
      <Text style={{
        fontSize: 56,
        fontWeight: '900',
        fontStyle: '',
        color: '#00AED1',
        letterSpacing: -5,
        textShadowColor: 'rgba(0, 174, 209, 0.3)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 2,
        lineHeight: 80,
        paddingLeft: 10,
        paddingRight: 24,
        paddingTop: 15,
        paddingBottom: 5,
        zIndex: 2
      }}>
        V 
      </Text>
      <View style={{
        position: 'absolute',
        width: 2.5,
        height: 85,
        transform: [{ rotate: '18deg' }, { translateX: -1 }, { translateY: 8 }],
        shadowColor: '#00D9FF',
        shadowOpacity: 1,
        shadowRadius: 10,
        zIndex: 3,
        marginLeft: 3.4,
        borderRadius: 2,
        overflow: 'hidden'
      }}>
        <LinearGradient
          colors={['transparent', '#00D9FF', '#00D9FF', 'transparent']}
          locations={[0, 0.2, 0.8, 1]}
          style={{ flex: 1 }}
        />
      </View>
      <Text style={{
        fontSize: 56,
        fontWeight: '900',
        fontStyle: 'italic',
        color: '#9126D1',
        letterSpacing: -2,
        marginLeft: -40,
        textShadowColor: 'rgba(145, 38, 209, 0.3)',
        textShadowOffset: { width: 1, height: -1 },
        textShadowRadius: 2,
        lineHeight: 80,
        paddingLeft: 20,
        paddingRight: 10,
        paddingTop: 15,
        paddingBottom: 5,
        zIndex: 1
      }}>
        S
      </Text>
    </View>
  </View>
</View>
```
- **Why It Breaks**: Huge 56px font, `lineHeight: 80`, 85px line height, and negative `marginLeft: -40` collide with adjacent player cards on small screens.
- **Responsive Replacement**:
```tsx
<View style={{ width: '18%', minWidth: 44, alignItems: 'center', justifyContent: 'center', zIndex: 20 }}>
  <View style={{ alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', overflow: 'visible', position: 'relative' }}>
      <Text style={{
        fontSize: 34,
        fontWeight: '900',
        color: '#00AED1',
        letterSpacing: -2,
        textShadowColor: 'rgba(0, 174, 209, 0.3)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 2,
        lineHeight: 42,
        paddingHorizontal: 4,
        zIndex: 2
      }}>
        V
      </Text>
      <View style={{
        position: 'absolute',
        width: 2,
        height: 50,
        transform: [{ rotate: '18deg' }],
        shadowColor: '#00D9FF',
        shadowOpacity: 1,
        shadowRadius: 6,
        zIndex: 3,
        borderRadius: 1,
        overflow: 'hidden'
      }}>
        <LinearGradient
          colors={['transparent', '#00D9FF', '#00D9FF', 'transparent']}
          locations={[0, 0.2, 0.8, 1]}
          style={{ flex: 1 }}
        />
      </View>
      <Text style={{
        fontSize: 34,
        fontWeight: '900',
        fontStyle: 'italic',
        color: '#9126D1',
        letterSpacing: -2,
        marginLeft: -10,
        textShadowColor: 'rgba(145, 38, 209, 0.3)',
        textShadowOffset: { width: 1, height: -1 },
        textShadowRadius: 2,
        lineHeight: 42,
        paddingHorizontal: 4,
        zIndex: 1
      }}>
        S
      </Text>
    </View>
  </View>
</View>
```

---

### Component 3: Matchmaking Loading Bar & Queue Capsule (`src/components/GameRoom.tsx`)
- **File**: `src/components/GameRoom.tsx`
- **Lines**: 394–395 (Loading Bar) and 690–691 (Queue Capsule)
- **Problematic Code**:
```tsx
// Line 394 (Loading Bar):
<View style={{
  width: 220,
  height: 10,
  backgroundColor: '#061A3A',
  ...
}}>

// Line 690 (Queue Capsule):
<View style={{
  width: 250,
  height: 46,
  borderRadius: 23,
  ...
}}>
```
- **Why It Breaks**: Rigid 220px and 250px dimensions do not scale across phone widths and tablets.
- **Responsive Replacement**:
```tsx
// Loading Bar Replacement:
<View style={{
  width: '60%',
  maxWidth: 240,
  minWidth: 160,
  height: 10,
  backgroundColor: '#061A3A',
  borderRadius: 9999,
  marginTop: 14,
  overflow: 'hidden',
  borderWidth: 1.5,
  borderColor: 'rgba(0, 217, 255, 0.45)',
  shadowColor: '#00D9FF',
  shadowOpacity: 0.6,
  shadowRadius: 8,
  elevation: 4
}}>

// Queue Capsule Replacement:
<View style={{
  width: '68%',
  maxWidth: 260,
  minWidth: 190,
  height: 46,
  borderRadius: 23,
  backgroundColor: 'rgba(7, 20, 38, 0.92)',
  borderWidth: 1.5,
  borderColor: 'rgba(0, 217, 255, 0.45)',
  shadowColor: '#00D9FF',
  shadowOpacity: 0.35,
  shadowRadius: 12,
  elevation: 6,
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 8,
  position: 'relative'
}}>
```

---

### Component 4: Matchmaking Gradient Title (`src/components/GameRoom.tsx`)
- **File**: `src/components/GameRoom.tsx`
- **Lines**: 347–375
- **Problematic Code**:
```tsx
<Text style={{
  fontSize: 42,
  fontWeight: '900',
  fontStyle: 'italic',
  letterSpacing: 2,
  textAlign: 'center',
  backgroundColor: 'transparent'
}}>
  MATCHMAKING
</Text>
```
- **Why It Breaks**: 42px font with 2px letter spacing exceeds screen width on 320px devices and wraps or clips.
- **Responsive Replacement**:
```tsx
<Text 
  style={{
    fontSize: 32,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 1.5,
    textAlign: 'center',
    backgroundColor: 'transparent'
  }}
  numberOfLines={1}
  adjustsFontSizeToFit
>
  MATCHMAKING
</Text>
```

---

### Component 5: Normal Room Lobby Layout & Overs Selector (`src/components/GameRoom.tsx`)
- **File**: `src/components/GameRoom.tsx`
- **Lines**: 789–890
- **Problematic Code**:
```tsx
<View className="space-y-6">
  {!isCasualMatch && (
    <View className="bg-indigo-900/50 p-6 rounded-3xl border border-indigo-400/20 text-center">
      <Text className="text-white opacity-80 font-bold uppercase tracking-widest text-xs mb-2">Room Code</Text>
      <Text className="text-5xl font-mono font-black text-yellow-400 tracking-[0.2em]">{room.code}</Text>
    </View>
  )}
  ...
  <Text className="text-white opacity-80 font-bold uppercase text-xs mb-2 mt-2">Overs</Text>
  <View className="flex-row flex-wrap gap-2 mb-4">
    {[2, 5, 10, 20, null].map(o => (
      <TouchableOpacity 
        key={o ?? 'unlimited'} 
        onPress={() => setOversLimit(o)} 
        className={`flex-1 py-2 rounded-xl border ${oversLimit === o ? 'bg-yellow-400 border-yellow-400' : 'bg-white/10 border-white/20'}`}
      >
        <Text className={`text-center font-black text-xs ${oversLimit === o ? 'text-indigo-900' : 'text-white/60'}`}>{o === null ? 'UNLIMITED' : o}</Text>
      </TouchableOpacity>
    ))}
  </View>
```
- **Why It Breaks**: Missing `ScrollView` pushes the Start Match button off-screen on short phones and landscape orientation. 5 buttons in one row force "UNLIMITED" to wrap or clip.
- **Responsive Replacement**:
```tsx
<ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
  <View className="space-y-5">
    {!isCasualMatch && (
      <View className="bg-indigo-900/50 p-4 rounded-3xl border border-indigo-400/20 text-center">
        <Text className="text-white opacity-80 font-bold uppercase tracking-widest text-xs mb-1">Room Code</Text>
        <Text className="text-4xl font-mono font-black text-yellow-400 tracking-[0.15em]" numberOfLines={1} adjustsFontSizeToFit>{room.code}</Text>
      </View>
    )}
    ...
    <Text className="text-white opacity-80 font-bold uppercase text-xs mb-2 mt-2">Overs</Text>
    <View className="flex-row flex-wrap justify-between gap-1.5 mb-4">
      {[2, 5, 10, 20, null].map(o => (
        <TouchableOpacity 
          key={o ?? 'unlimited'} 
          onPress={() => setOversLimit(o)} 
          className={`w-[18%] py-2 rounded-xl border ${oversLimit === o ? 'bg-yellow-400 border-yellow-400' : 'bg-white/10 border-white/20'}`}
        >
          <Text className={`text-center font-black text-[11px] ${oversLimit === o ? 'text-indigo-900' : 'text-white/60'}`} numberOfLines={1} adjustsFontSizeToFit>
            {o === null ? 'UNLTD' : o}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
</ScrollView>
```

---

### Component 6: Toss Call Coin Buttons (`src/components/GameRoom.tsx`)
- **File**: `src/components/GameRoom.tsx`
- **Lines**: 1126–1143
- **Problematic Code**:
```tsx
<View className="flex-row justify-between w-full max-w-sm px-8">
  <TouchableOpacity 
    disabled={loading} 
    onPress={() => takeAction({ type: 'TOSS_CALL', choice: 'head' })} 
    className={`w-32 h-32 rounded-full bg-yellow-500 items-center justify-center border-4 border-yellow-600 ${loading ? 'opacity-50' : 'active:scale-95'}`}
  >
    <Text className="text-5xl font-black text-white">H</Text>
    <Text className="text-sm font-black text-white mt-1">HEADS</Text>
  </TouchableOpacity>
  <TouchableOpacity 
    disabled={loading} 
    onPress={() => takeAction({ type: 'TOSS_CALL', choice: 'tail' })} 
    className={`w-32 h-32 rounded-full bg-slate-200 items-center justify-center border-4 border-slate-300 ${loading ? 'opacity-50' : 'active:scale-95'}`}
  >
    <Text className="text-5xl font-black text-slate-700">T</Text>
    <Text className="text-sm font-black text-slate-700 mt-1">TAILS</Text>
  </TouchableOpacity>
</View>
```
- **Why It Breaks**: Two 128px circles with 160px combined padding require 416px, colliding and overflowing screen edges on all mobile devices with width < 416px.
- **Responsive Replacement**:
```tsx
<View className="flex-row justify-around w-full max-w-sm px-4">
  <TouchableOpacity 
    disabled={loading} 
    onPress={() => takeAction({ type: 'TOSS_CALL', choice: 'head' })} 
    className={`w-[42%] max-w-[120px] aspect-square rounded-full bg-yellow-500 items-center justify-center border-4 border-yellow-600 ${loading ? 'opacity-50' : 'active:scale-95'}`}
  >
    <Text className="text-4xl font-black text-white">H</Text>
    <Text className="text-xs font-black text-white mt-1">HEADS</Text>
  </TouchableOpacity>
  <TouchableOpacity 
    disabled={loading} 
    onPress={() => takeAction({ type: 'TOSS_CALL', choice: 'tail' })} 
    className={`w-[42%] max-w-[120px] aspect-square rounded-full bg-slate-200 items-center justify-center border-4 border-slate-300 ${loading ? 'opacity-50' : 'active:scale-95'}`}
  >
    <Text className="text-4xl font-black text-slate-700">T</Text>
    <Text className="text-xs font-black text-slate-700 mt-1">TAILS</Text>
  </TouchableOpacity>
</View>
```

---

### Component 7: HandSelector (`src/components/HandSelector.tsx`)
- **File**: `src/components/HandSelector.tsx`
- **Lines**: 19–31
- **Problematic Code**:
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
- **Why It Breaks**: Rigid 80px x 96px (`w-20 h-24`) buttons cannot scale down for smaller screen widths or container paddings, causing uneven wrapping.
- **Responsive Replacement**:
```tsx
<View className="flex-row flex-wrap justify-center gap-2.5 w-full">
  {options.map((num) => (
    <TouchableOpacity
      key={num}
      disabled={disabled}
      onPress={() => onSelect(num)}
      className={`w-[29%] max-w-[80px] aspect-[4/5] bg-white rounded-2xl items-center justify-center shadow-xl border-b-4 border-gray-300 active:bg-gray-100 ${disabled ? 'opacity-50' : 'active:scale-95'}`}
    >
      <Text className="text-3xl">{emojiMap[num]}</Text>
      <Text className="text-lg font-black text-indigo-900 mt-0.5">{num}</Text>
    </TouchableOpacity>
  ))}
</View>
```

---

### Component 8: WorldChat (`src/components/WorldChat.tsx`)
- **File**: `src/components/WorldChat.tsx`
- **Line**: 94
- **Problematic Code**:
```tsx
<View className="bg-white/10 rounded-[2rem] p-4 border border-white/20 mt-6 w-full h-80">
```
- **Why It Breaks**: Hardcoded `h-80` (320px) overflows screens with short vertical heights (landscape, small Androids).
- **Responsive Replacement**:
```tsx
<View className="bg-white/10 rounded-[2rem] p-4 border border-white/20 mt-4 w-full flex-1 min-h-[220px] max-h-[380px]">
```

---

### Component 9: DailyRewardModal (`src/components/DailyRewardModal.tsx`)
- **File**: `src/components/DailyRewardModal.tsx`
- **Lines**: 161–178
- **Problematic Code**:
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
        <Text className={`font-black text-[10px] mb-1 ...`}>
          DAY {day}
        </Text>
        <Text className={isCurrent ? 'text-xl' : 'text-lg grayscale'}>
          🎁
        </Text>
        <Text className={`font-bold mt-1 text-[9px] ...`}>
          {amount >= 1000 ? `${amount/1000}k` : amount} 🪙
        </Text>
        {tokens > 0 && (
          <Text className={`font-bold mt-0.5 text-[9px] ...`}>
            +{tokens} 🎟️
          </Text>
        )}
```
- **Why It Breaks**: Cramming 7 items into a single row on 320–360px screens leaves <41px width per card, causing text clipping and overflow.
- **Responsive Replacement**:
```tsx
<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 2, gap: 6 }} className="mb-4">
  {days.map((day) => (
    <TouchableOpacity
      key={day}
      onPress={() => handleClaim(day)}
      disabled={!isCurrent || loading}
      className={`w-16 py-3 px-1 rounded-xl items-center justify-center border-2 overflow-hidden ${
        isPast ? 'bg-gray-800 border-gray-600 opacity-50' 
        : isCurrent ? 'bg-yellow-400 border-white' 
        : 'bg-white/10 border-white/10 opacity-70'
      }`}
    >
      <Text className={`font-black text-[10px] mb-1 ${isCurrent ? 'text-indigo-900' : 'text-white/60'}`} numberOfLines={1}>
        DAY {day}
      </Text>
      <Text className={isCurrent ? 'text-xl' : 'text-lg grayscale'}>🎁</Text>
      <Text className={`font-bold mt-1 text-[9px] ${isCurrent ? 'text-indigo-900' : 'text-yellow-400'}`} numberOfLines={1}>
        {amount >= 1000 ? `${amount/1000}k` : amount} 🪙
      </Text>
      {tokens > 0 && (
        <Text className={`font-bold mt-0.5 text-[9px] ${isCurrent ? 'text-purple-700' : 'text-purple-400'}`} numberOfLines={1}>
          +{tokens} 🎟️
        </Text>
      )}
    </TouchableOpacity>
  ))}
</ScrollView>
```

---

### Component 10: CoinShop Overlays (`src/components/CoinShop.tsx`)
- **File**: `src/components/CoinShop.tsx`
- **Lines**: 145–166
- **Problematic Code**:
```tsx
{confirmAction && (
  <View className="absolute inset-0 bg-indigo-950/95 justify-center items-center rounded-3xl z-50 p-6">
    <Text className="text-6xl mb-4 animate-pulse">💎</Text>
    <Text className="text-3xl font-black text-white italic mb-4 tracking-tighter text-center">
      {confirmAction.title}
    </Text>
    <Text className="text-yellow-400 text-xl text-center font-bold px-6 mb-8">
      {confirmAction.message}
    </Text>
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
- **Why It Breaks**: Massive font sizes and `px-8` button paddings overflow vertically on short viewports, pushing Confirm and Cancel off-screen.
- **Responsive Replacement**:
```tsx
{confirmAction && (
  <View className="absolute inset-0 bg-indigo-950/95 rounded-3xl z-50">
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
      <Text className="text-4xl mb-2 animate-pulse">💎</Text>
      <Text className="text-2xl font-black text-white italic mb-2 tracking-tighter text-center">
        {confirmAction.title}
      </Text>
      <Text className="text-yellow-400 text-base text-center font-bold px-4 mb-6">
        {confirmAction.message}
      </Text>
      <View className="flex-row gap-3 w-full justify-center px-2">
        <TouchableOpacity 
          onPress={() => setConfirmAction(null)} 
          disabled={loading} 
          className="flex-1 max-w-[130px] bg-gray-600 py-3 rounded-2xl active:scale-95 border border-gray-400 items-center"
        >
          <Text className="text-white font-black uppercase text-base">Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => {
            confirmAction.action();
            setConfirmAction(null);
          }} 
          disabled={loading} 
          className="flex-1 max-w-[130px] bg-green-500 py-3 rounded-2xl active:scale-95 border border-green-300 items-center"
        >
          <Text className="text-white font-black uppercase text-base">Confirm</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  </View>
)}
```

---

### Component 11: InviteEarnModal (`src/components/InviteEarnModal.tsx`)
- **File**: `src/components/InviteEarnModal.tsx`
- **Lines**: 30–44
- **Problematic Code**:
```tsx
<View className="bg-black/30 p-5 rounded-2xl flex-row justify-between items-center border border-white/10">
  <Text className="text-white font-mono text-3xl tracking-[0.2em] font-black">
    {String(profile.friend_id || 0).padStart(7, '0')}
  </Text>
  
  <TouchableOpacity 
    onPress={() => { 
      Clipboard.setStringAsync(String(profile.friend_id || 0).padStart(7, '0')); 
      Alert.alert('Copied!', 'Referral code copied to clipboard!'); 
    }} 
    className="bg-white/20 px-4 py-3 rounded-xl active:scale-95"
  >
    <Text className="text-white font-bold text-xs uppercase tracking-widest">Copy</Text>
  </TouchableOpacity>
</View>
```
- **Why It Breaks**: Monospace font with 0.2em tracking combined with `p-5` padding and the copy button requires >400px width, causing wrap or clipping on standard screens.
- **Responsive Replacement**:
```tsx
<View className="bg-black/30 p-4 rounded-2xl flex-row justify-between items-center border border-white/10 gap-2">
  <Text 
    className="text-white font-mono text-2xl tracking-[0.12em] font-black flex-1"
    numberOfLines={1}
    adjustsFontSizeToFit
  >
    {String(profile.friend_id || 0).padStart(7, '0')}
  </Text>
  
  <TouchableOpacity 
    onPress={() => { 
      Clipboard.setStringAsync(String(profile.friend_id || 0).padStart(7, '0')); 
      Alert.alert('Copied!', 'Referral code copied to clipboard!'); 
    }} 
    className="bg-white/20 px-4 py-2.5 rounded-xl active:scale-95 flex-shrink-0"
  >
    <Text className="text-white font-bold text-xs uppercase tracking-wider">Copy</Text>
  </TouchableOpacity>
</View>
```

---

### Component 12: OnboardingModal (`src/components/OnboardingModal.tsx`)
- **File**: `src/components/OnboardingModal.tsx`
- **Lines**: 72–76
- **Problematic Code**:
```tsx
<KeyboardAvoidingView 
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
  className="flex-1 justify-center items-center bg-black/70 p-4"
>
  <View className="w-full max-w-[400px] bg-black/80 px-6 py-5 rounded-[2rem] border border-cyan-500/30 shadow-[0_0_30px_rgba(34,211,238,0.2)]">
```
- **Why It Breaks**: Without an internal `ScrollView`, the virtual keyboard pushes form elements off-screen on compact phones, making it impossible to click "Save Profile".
- **Responsive Replacement**:
```tsx
<KeyboardAvoidingView 
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
  className="flex-1 bg-black/70"
>
  <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
    <View className="w-full max-w-[400px] bg-black/80 px-6 py-5 rounded-[2rem] border border-cyan-500/30 shadow-[0_0_30px_rgba(34,211,238,0.2)]">
      ...
    </View>
  </ScrollView>
</KeyboardAvoidingView>
```

---

### Component 13: NotificationManager (`src/components/NotificationManager.tsx`)
- **File**: `src/components/NotificationManager.tsx`
- **Line**: 79
- **Problematic Code**:
```tsx
<View className="absolute top-4 left-4 right-4 z-50 gap-2">
```
- **Why It Breaks**: Hardcoded `top-4` (16px) collides directly with device notches and Dynamic Island status bars on iOS.
- **Responsive Replacement**:
```tsx
<SafeAreaView className="absolute top-0 left-4 right-4 z-50 pointer-events-box-none">
  <View className="mt-2 gap-2">
    ...
  </View>
</SafeAreaView>
```

---

### Component 14: Game Modes Modal Cards (`App.tsx`)
- **File**: `App.tsx`
- **Lines**: 564, 582, 600, 618
- **Problematic Code**:
```tsx
<TouchableOpacity ... className="w-56 h-64 bg-slate-900 rounded-[2rem] p-5 shadow-2xl justify-between border-2 ...">
```
- **Why It Breaks**: `w-56 h-64` (224px x 256px) card bounds exceed the viewport height on landscape mode without any vertical scrolling capability.
- **Responsive Replacement**:
```tsx
<TouchableOpacity ... className="w-52 h-[230px] max-h-[60vh] bg-slate-900 rounded-3xl p-4 shadow-2xl justify-between border-2 ...">
```

---

### Component 15: IntroScreen Logo (`src/components/IntroScreen.tsx`)
- **File**: `src/components/IntroScreen.tsx`
- **Lines**: 26 & 56
- **Problematic Code**:
```tsx
<Image 
  source={require('../../assets/cv_logo_final.png')} 
  className="w-64 h-64"
  resizeMode="contain"
/>
```
- **Why It Breaks**: 256px logo scaled to 1.1x (282px) clips on small screen heights.
- **Responsive Replacement**:
```tsx
<Image 
  source={require('../../assets/cv_logo_final.png')} 
  style={{ width: '60%', maxWidth: 240, aspectRatio: 1 }}
  resizeMode="contain"
/>
```

---

### Component 16: LoadingScreen Title & Container (`src/components/LoadingScreen.tsx`)
- **File**: `src/components/LoadingScreen.tsx`
- **Lines**: 59 & 75
- **Problematic Code**:
```tsx
<Text className="text-6xl font-black tracking-widest uppercase italic" ...>
...
<View className="w-full px-16 pb-8">
```
- **Why It Breaks**: `text-6xl` font wraps awkwardly on small screens, and `px-16` (128px horizontal padding) excessively shrinks the progress bar on 320–360px viewports.
- **Responsive Replacement**:
```tsx
<Text 
  className="text-4xl sm:text-5xl font-black tracking-wider uppercase italic" 
  adjustsFontSizeToFit 
  numberOfLines={1} 
  style={{ color: '#fbbf24', textShadowColor: 'rgba(251,191,36,0.5)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 15 }}
>
  HEAD<Text className="text-cyan-400">TAIL</Text>
</Text>
...
<View className="w-full px-6 sm:px-12 pb-8">
```

---

### Component 17: Scoreboard Spectator Badge (`src/components/Scoreboard.tsx`)
- **File**: `src/components/Scoreboard.tsx`
- **Lines**: 145–150
- **Problematic Code**:
```tsx
<View key={`spec-${i}`} className="absolute top-full left-0 right-0 items-center mt-4 opacity-50">
```
- **Why It Breaks**: Positioning outside parent bounds causes it to collide with game controls (HandSelector / Coin Toss) underneath the scoreboard.
- **Responsive Replacement**:
```tsx
<View key={`spec-${i}`} className="w-full items-center mt-2 opacity-50">
```

---

### Component 18: `DashboardFriends` Widget (`App.tsx`)
- **File**: `App.tsx`
- **Lines**: 57 & 68
- **Problematic Code**:
```tsx
<View className="flex-col items-end gap-3 pr-2 mt-1 pointer-events-auto h-80">
...
  <View className="bg-indigo-900/40 border border-indigo-400/20 rounded-3xl p-5 w-44 flex-1 shadow-2xl">
```
- **Why It Breaks**: Fixed 176px width (`w-44`) placed in absolute top HUD clashes directly with user coins/profile on narrow screen widths (<375px).
- **Responsive Replacement**:
```tsx
<View className="flex-col items-end gap-2 pr-2 mt-1 pointer-events-auto max-h-[45vh]">
...
  <View className="bg-indigo-900/40 border border-indigo-400/20 rounded-2xl p-3 w-36 sm:w-44 flex-1 shadow-2xl">
```

---

## 5. Verification Method

To verify these findings and confirm resolution once changes are implemented:

1. **Static Analysis & Code Verification**:
   - Inspect files via `view_file` to confirm exact line numbers and styling props cited in Section 1.
   - Run linter/typechecker to ensure proposed replacement code produces valid JSX with no TypeScript errors:
     ```powershell
     npx tsc --noEmit
     ```

2. **Responsive Viewport Emulation**:
   - Test against representative device dimensions in React Native emulator / Expo web:
     - **Compact Portrait**: iPhone SE / small Android (320x568 and 375x667). Verify:
       - Matchmaking cards and "VS" emblem do not collide or wrap.
       - DailyRewardModal 7 days scroll smoothly without text truncating.
       - HandSelector buttons scale to ~29% width in a clean 3x2 grid.
       - InviteEarnModal 7-digit code displays on a single line alongside the Copy button.
       - Normal lobby settings scroll cleanly to reveal the "Start Match" button.
     - **Modern Flagship with Notch**: iPhone 14/15/16 Pro (393x852). Verify:
       - NotificationManager invite alerts respect the top Safe Area and do not collide with Dynamic Island.
       - GameRoom action buttons (Exit, Mic, Chat) remain accessible below the status bar.
     - **Landscape Orientation**: (e.g. 740x360). Verify:
       - CoinShop confirm/success overlays, OnboardingModal, and Game Modes cards fit cleanly inside the vertical height or enable vertical scroll.
       - WorldChat does not trap the entire screen height.

3. **Invalidation Conditions**:
   - Any layout failure where text is cut off, buttons overlap, or CTA buttons are inaccessible on screens between 320px and 430px width or under 600px height invalidates compliance.

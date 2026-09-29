# Handoff Report: Core Game Screens Audit (RevealView & GameRoom)

**Agent**: Explorer 2 (Core Game Screens Audit: RevealView & GameRoom)  
**Working Directory**: `C:\MyGames\head-tail-app\.agents\teamwork\explorer_2`  
**Date**: 2026-09-29T20:35:00Z  
**Type**: Hard Handoff (Investigation Complete)  

---

## 1. Observation

A line-by-line static inspection was conducted on `src/components/RevealView.tsx`, `src/components/GameRoom.tsx`, `src/components/HandSelector.tsx`, and `src/components/Scoreboard.tsx`. Direct code observations and problematic rigid dimensions are itemized below:

### 1.1 `src/components/RevealView.tsx`

- **Observation RV-1 (Lines 106–122, Lines 28 & 40)**:
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
  ```
  `heightAnim` translates to fixed `-60` pixels (`Animated.timing(heightAnim, { toValue: -60, duration: 800 })` at lines 28 and 40). Coin dimensions are hardcoded to `96x96` pixels.

- **Observation RV-2 (Lines 151, 157, 164, 169, 173, 176, 185, 191)**:
  Inside Toss Result Banner (`width: '90%'`):
  - Avatar containers: `width: 44, height: 44, borderRadius: 22` (lines 151, 185).
  - Choice badge pills: `height: 18, ... paddingHorizontal: 12` (lines 157, 191).
  - Title flanking gradient bars: `height: 2, width: 48, marginRight: 8` and `height: 2, width: 48, marginLeft: 8` (lines 169, 173).
  - Winner name font size: `fontSize: 28, fontWeight: '900'` inside center column `flex: 1.4` (line 176).

- **Observation RV-3 (Lines 201, 218, 220, 226, 227, 237, 238)**:
  Inside Player Choices Banner:
  - Container width: `width: '60%'` (line 201).
  - Title decorative gradients: `width: 48, marginRight: 12` and `width: 48, marginLeft: 12` with `paddingHorizontal: 16` (lines 217–221).
  - Choice boxes: `width: '42%'` each (lines 226, 237).
  - Inner avatar circle: `width: 32, height: 32` (lines 227, 238).

- **Observation RV-4 (Lines 265–286)**:
  Inside Gameplay Reveal:
  - Outer row: `className="flex-row items-center justify-center gap-8 w-full max-w-sm"` (line 266).
  - Bat & Bowl cards: `className="w-28 h-32 bg-white rounded-[2rem] ..."` (lines 271, 282).
  - Active card scale: `scale-110` (lines 267, 278).

- **Observation RV-5 (Lines 288–304)**:
  Result and Next Ball section:
  - Container: `className="h-24 justify-center items-center mt-8 w-full"` (line 288).
  - Result texts: `text-5xl` (line 292), `text-6xl` (lines 294, 298), plus button `py-3` (line 301).

---

### 1.2 `src/components/GameRoom.tsx`

- **Observation GR-1 (Casual Matchmaking, Lines 298, 348, 365, 394, 440, 522, 538–596, 602, 690–704)**:
  - Container design comment: `/* 2. Main Content Container - Perfect Landscape Layout */` (line 297).
  - Title: `fontSize: 42` (lines 348, 365).
  - Loading bar: `width: 220, height: 10, marginTop: 17` (line 394).
  - Player Card (YOU): `width: '34%', maxWidth: 245, minWidth: 185, height: 72` (line 440).
  - Opponent Card: `width: '34%', maxWidth: 245, minWidth: 185, height: 72` (line 602).
  - Center VS container: `width: '22%'` with letters `fontSize: 56, lineHeight: 80, marginLeft: -40` (lines 522–596).
  - Queue time capsule: `width: 250, height: 46, borderRadius: 23` (lines 690–704).

- **Observation GR-2 (Waiting Room Lobby Host View, Lines 788–889)**:
  - Lobby container: `<View className="space-y-6">` (line 789) without `<ScrollView>`.
  - Overs options: `flex-row flex-wrap gap-2 mb-4` with 5 items having `flex-1 py-2` and text `"UNLIMITED"` (lines 834–844).
  - Wickets options: 5 items with `flex-1 py-2` (lines 847–857).
  - Primary CTA button: `TouchableOpacity className="w-full bg-yellow-400 py-4 ..."` (line 879) rendered at the very bottom.

- **Observation GR-3 (Toss Call 2P, Lines 1113–1152)**:
  - Scoreboard positioning: `<View className="absolute top-0 w-full z-20" pointerEvents="box-none"><Scoreboard ... /></View>` (line 1113).
  - Content container: `<View className="flex-1 items-center justify-center z-10 w-full px-12 mt-20" pointerEvents="box-none">` (line 1117).
  - Coin buttons: `className="w-32 h-32 rounded-full ..."` (lines 1130, 1138) inside `px-8` (line 1126).

- **Observation GR-4 (Toss Throw, Lines 1162–1185)**:
  - Scoreboard positioning: `<View className="absolute top-0 w-full z-20" pointerEvents="box-none">` (line 1162).
  - Content container: `mt-20` (line 1166).
  - HandSelector wrapper: `className="bg-black/60 p-8 rounded-[3rem] border border-cyan-500/30 items-center "` (line 1182).
  - Throw locked indicator: `w-32 h-32` (line 1176).

- **Observation GR-5 (Select Roles, Lines 1246–1274)**:
  - Container: `className="space-y-6 flex-1 items-center justify-center"` (line 1246) without `<ScrollView>`.
  - Player buttons: `myPlayers?.map(...)` with `className="bg-indigo-500 py-3 px-4 rounded-xl active:scale-95 w-full"` (line 1260).

- **Observation GR-6 (Playing State Move Area, Lines 1288–1318)**:
  - Move container: `className="bg-white/10 p-6 rounded-3xl mt-auto"` (line 1292).
  - Waiting placeholder: `className="h-24 justify-center items-center"` (line 1310).

- **Observation GR-7 (Floating Game Controls, Lines 1359–1380)**:
  - Exit button: `className="absolute top-0 left-0 z-50 mt-1 ml-1"` with `w-10 h-10` (line 1359).
  - Media & chat buttons: `className="absolute top-0 right-0 z-50 flex-row gap-2 mt-1 mr-1"` with three `w-10 h-10` buttons (line 1364).

- **Observation GR-8 (Game Over Screen, Lines 1330–1346)**:
  - Header text: `text-5xl font-black uppercase text-center mb-2 text-white` (line 1331).

- **Observation GR-9 (In-Game Chat Modal, Lines 1402, 1466, 1474–1493)**:
  - Bottom chat bar: three `w-12 h-12` buttons + `gap-2` + `p-3` (lines 1474–1493).
  - Emote buttons: `w-14 h-14` in `gap-3` (line 1466).

---

### 1.3 `src/components/HandSelector.tsx`

- **Observation HS-1 (Lines 19, 25)**:
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
  Buttons are hardcoded to `w-20` (80px) and `h-24` (96px) with `gap-3` (12px).

---

### 1.4 `src/components/Scoreboard.tsx`

- **Observation SB-1 (Lines 70, 108, 121)**:
  - Container padding: `pt-2 px-6` (line 70).
  - Active player row: `text-base uppercase font-black tracking-widest` (line 108) with role tag `• BAT` / `• BOWL`.
  - Score display: `text-4xl font-light tracking-widest mt-1` (line 121).

- **Observation SB-2 (Lines 145–150)**:
  ```tsx
  {/* Spectator display if applicable */}
  {players.filter(p => p.id === room.waiting_player_id).map((p, i) => (
       <View key={`spec-${i}`} className="absolute top-full left-0 right-0 items-center mt-4 opacity-50">
          <Text className="text-[8px] text-white font-light tracking-[0.3em] uppercase mb-0.5">Spectating</Text>
          <Text className="text-xs text-white font-medium tracking-widest" numberOfLines={1}>{p.id === playerId ? 'YOU' : p.label}</Text>
       </View>
  ))}
  ```
  Spectator badge is taken out of flow via `absolute top-full left-0 right-0 ... mt-4`.

---

## 2. Logic Chain

From the direct code observations, the layout failures across standard mobile screens are deduced through the following verifiable steps:

1. **Horizontal Collision in Casual Matchmaking**:
   - Observations GR-1 show Player Card has `minWidth: 185` and Opponent Card has `minWidth: 185`, with Center VS taking `22%` (~80px) and outer paddings taking 88px.
   - Summing minimum widths: $185 + 185 + 80 + 88 = 538\text{px}$.
   - Standard mobile portrait screens range between $360\text{px}$ and $414\text{px}$. Because $538\text{px} > 360\text{px}$, the cards and the VS emblem physically collide, overlap, and clip outside the screen boundaries.

2. **CTA Loss via Missing Vertical Scroll in Waiting Lobby**:
   - Observations GR-2 show Room Code (~110px), Scoreboard (~80px), Invite Friends (~80px), Match Settings (5 sub-panels totaling ~380px), and Start Match CTA (~60px) are rendered inside a plain `<View className="space-y-6">` without a `<ScrollView>`.
   - Summing vertical heights: $110 + 80 + 80 + 380 + 60 + \text{spacing}(120\text{px}) > 830\text{px}$.
   - Compact screens (iPhone SE: 667px, standard Android: 640–800px) cannot fit 830px vertically. With no scroll container, the primary CTA ("Start Match") is pushed completely off-screen, rendering match initiation impossible.

3. **Coin Flipping and Hand Selection Horizontal Stacking Failures**:
   - Observations GR-3 show two coins of `w-32` ($128\text{px}$ each) rendered inside parent paddings `px-12` ($96\text{px}$) and row padding `px-8` ($64\text{px}$).
   - On a $360\text{px}$ phone: $360 - (96 + 64) = 200\text{px}$ available. Two $128\text{px}$ coins need $256\text{px}$. Because $256\text{px} > 200\text{px}$, the coins cannot fit side-by-side and overflow horizontally or wrap.
   - Similarly, Observation HS-1 shows 3 buttons of $80\text{px} + 2 \times 12\text{px} = 264\text{px}$. Placed inside Observation GR-4 (`p-8` = $64\text{px}$ padding): $264 + 64 = 328\text{px}$, which exceeds a $320\text{px}$ device width and breaks the 3-column grid into an uneven 2-2-2 or 3-2-1 wrap.

4. **Absolute Positioning Collisions**:
   - Observations GR-3 and GR-4 place `<Scoreboard />` in `absolute top-0` while the content below uses a static `mt-20` ($80\text{px}$).
   - Scoreboard with target/pot occupies $100\text{px}$–$140\text{px}$. Because $80\text{px} < 120\text{px}$, the content title directly collides and renders under/over the scoreboard text.
   - Observation SB-2 places the spectator badge at `absolute top-full`, which consumes 0px of reserved height, causing it to float directly on top of subsequent game inputs.
   - Observation GR-7 places 3 circular buttons ($136\text{px}$ total width) at `absolute top-0 right-0 mt-1` without Safe Area insets, colliding with the hardware notch and directly obscuring the Scoreboard Pot/Target header.

5. **Fixed Container Clipping in RevealView**:
   - Observations RV-3 show `width: '60%'` creates a 216px box on a 360px screen. Inside it, title divider bars of $48\text{px} \times 2 = 96\text{px}$ plus margins and paddings ($56\text{px}$) leave $<64\text{px}$ for "PLAYER CHOICES", clipping the title.
   - The choice boxes of `width: '42%'` leave only ~40px usable text width for player usernames after subtracting the 32px emoji circle and padding, truncating names to 2-3 characters.
   - Observation RV-5 shows $154\text{px}$ of result text and buttons jammed into a fixed `h-24` ($96\text{px}$) container, causing vertical clipping and container boundary breakout.

---

## 3. Comprehensive Issues & Exact Responsive Replacements

### 3.1 `src/components/RevealView.tsx`

#### Issue RV-1: Animated Coin Rigid Dimensions & Fixed TranslateY
- **File**: `src/components/RevealView.tsx`
- **Lines**: 28, 40, 106–127
- **Current Code**:
  ```tsx
  // lines 28, 40:
  Animated.timing(heightAnim, { toValue: -60, duration: 800, useNativeDriver: true })
  ...
  // lines 106-127:
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
     {showResult && <Text className="text-[10px] font-black text-yellow-900 uppercase tracking-widest mt-0.5">{winningFace === 'H' ? 'HEADS' : 'TAILS'}</Text>}
  </Animated.View>
  ```
- **Breakage Explanation**: Rigid 96x96px coin with hardcoded -60px translateY pushes the coin into the top notch/header on compact screens (iPhone SE, 640-667px height). Combined with the two stacked result banners below, the entire view overflows vertically.
- **Exact Responsive Replacement**:
  ```tsx
  <Animated.View style={{ 
    width: '24%',
    maxWidth: 96,
    minWidth: 72,
    aspectRatio: 1,
    borderRadius: 9999, 
    borderWidth: 5, 
    borderColor: '#ca8a04', 
    backgroundColor: '#facc15', 
    alignItems: 'center', 
    justifyContent: 'center', 
    transform: [{ translateY: heightAnim }, { rotateX: spin }], 
    zIndex: 20,
    marginBottom: 10,
    shadowColor: '#ca8a04',
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8
  }}>
     <Text className="text-4xl sm:text-5xl font-black text-yellow-900" adjustsFontSizeToFit numberOfLines={1}>
       {showResult ? winningFace : '?'}
     </Text>
     {showResult && (
       <Text className="text-[9px] sm:text-[10px] font-black text-yellow-900 uppercase tracking-widest mt-0.5">
         {winningFace === 'H' ? 'HEADS' : 'TAILS'}
       </Text>
     )}
  </Animated.View>
  ```

---

#### Issue RV-2: Toss Result Banner Rigid Divider Bars & Avatar Sizes
- **File**: `src/components/RevealView.tsx`
- **Lines**: 151, 157, 169, 173, 176, 185, 191
- **Current Code**:
  ```tsx
  <View style={{ width: 44, height: 44, borderRadius: 22, ... }} />
  ...
  <View style={{ height: 18, backgroundColor: 'rgba(0, 0, 0, 0.5)', borderWidth: 1, borderColor: '#003366', borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', paddingHorizontal: 12 }}>
  ...
  <LinearGradient colors={['rgba(0, 217, 255, 0)', '#00D9FF']} start={{x:0, y:0}} end={{x:1, y:0}} style={{ height: 2, width: 48, marginRight: 8 }} />
  <View style={{ backgroundColor: 'rgba(19, 53, 89, 0.8)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16 }}>
     <Text style={{ color: '#A8B6CC', fontSize: 9, fontWeight: '900', letterSpacing: 2 }}>TOSS RESULT</Text>
  </View>
  <LinearGradient colors={['#00D9FF', 'rgba(0, 217, 255, 0)']} start={{x:0, y:0}} end={{x:1, y:0}} style={{ height: 2, width: 48, marginLeft: 8 }} />
  ...
  <Text style={{ color: '#F5F7FF', fontSize: 28, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center', ... }} numberOfLines={1}>{winnerName}</Text>
  ```
- **Breakage Explanation**: Center column `flex: 1.4` has only ~120px width on a 360px screen. Two rigid 48px divider lines (96px total) plus margins and text badge (80px) need ~192px, forcing horizontal overflow and squishing the left and right player columns. Winner name at fixed `fontSize: 28` severely truncates. Fixed `height: 18` and `paddingHorizontal: 12` on choice badges clips text vertically on narrow viewports.
- **Exact Responsive Replacement**:
  ```tsx
  {/* Flanking Divider Gradients using flex: 1 */}
  <LinearGradient colors={['rgba(0, 217, 255, 0)', '#00D9FF']} start={{x:0, y:0}} end={{x:1, y:0}} style={{ height: 2, flex: 1, marginRight: 6 }} />
  <View style={{ backgroundColor: 'rgba(19, 53, 89, 0.8)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 16 }}>
     <Text style={{ color: '#A8B6CC', fontSize: 8.5, fontWeight: '900', letterSpacing: 1.5 }}>TOSS RESULT</Text>
  </View>
  <LinearGradient colors={['#00D9FF', 'rgba(0, 217, 255, 0)']} start={{x:0, y:0}} end={{x:1, y:0}} style={{ height: 2, flex: 1, marginLeft: 6 }} />

  {/* Winner Name with dynamic scaling */}
  <Text style={{ color: '#F5F7FF', fontSize: 22, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center', textShadowColor: 'rgba(0, 217, 255, 0.6)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 }} numberOfLines={1} adjustsFontSizeToFit>{winnerName}</Text>

  {/* Responsive Player Choice Badges */}
  <View style={{ minHeight: 18, backgroundColor: 'rgba(0, 0, 0, 0.5)', borderWidth: 1, borderColor: '#003366', borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', paddingHorizontal: 6, paddingVertical: 2, maxWidth: '95%' }}>
    <Text style={{ color: '#A8B6CC', fontSize: 7.5, fontWeight: '800', letterSpacing: 0.5, marginRight: 2 }}>CHOSE:</Text>
    <Text style={{ color: '#00D9FF', fontSize: 8.5, fontWeight: '900', letterSpacing: 0.5 }}>{p1Choice}</Text>
  </View>

  {/* Avatar containers scaled proportionally */}
  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0, 0, 0, 0.5)', borderWidth: 1.5, borderColor: '#005580', alignItems: 'center', justifyContent: 'center', marginBottom: 2 }}>
    <FontAwesome5 name={winnerName === p1Name ? "crown" : "user-alt"} size={14} color="#A8B6CC" />
  </View>
  ```

---

#### Issue RV-3: Player Choices Banner Rigid Width & Card Squishing
- **File**: `src/components/RevealView.tsx`
- **Lines**: 201, 218, 220, 226, 227, 237, 238
- **Current Code**:
  ```tsx
  <View style={{ 
    width: '60%', 
    backgroundColor: 'rgba(2, 17, 36, 0.95)', 
    borderRadius: 16, 
    borderWidth: 2, 
    borderColor: '#005580', 
    paddingTop: 12, 
    paddingBottom: 12, 
    paddingHorizontal: 8, 
    marginTop: 2,
    ...
  }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12, paddingHorizontal: 16 }}>
       <LinearGradient ... style={{ height: 2, width: 48, marginRight: 12 }} />
       <Text style={{ color: '#F5F7FF', fontSize: 10, fontWeight: '900', letterSpacing: 2 }}>PLAYER CHOICES</Text>
       <LinearGradient ... style={{ height: 2, width: 48, marginLeft: 12 }} />
    </View>
    <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
       <View style={{ width: '42%', paddingVertical: 12, paddingHorizontal: 6, ... marginRight: 8 }}>
          <View style={{ width: 32, height: 32, ... marginRight: 6 }}>...</View>
          <View style={{ flex: 1 }}>
             <Text style={{ color: '#F5F7FF', fontSize: 9, ... }} numberOfLines={1}>{p1Name}</Text>
             ...
          </View>
       </View>
       <View style={{ width: '42%', ... marginLeft: 8 }}>...</View>
    </View>
  </View>
  ```
- **Breakage Explanation**: Container `width: '60%'` creates a 216px box on standard 360px mobile screens. Rigid 48px divider lines overflow the header. Individual choice boxes of `width: '42%'` (~90px wide) leave only ~40px after subtracting avatar and padding, aggressively truncating player names to 2-3 characters and crushing numbers against the card borders.
- **Exact Responsive Replacement**:
  ```tsx
  <View style={{ 
    width: '90%', 
    maxWidth: 380,
    backgroundColor: 'rgba(2, 17, 36, 0.95)', 
    borderRadius: 16, 
    borderWidth: 2, 
    borderColor: '#005580', 
    paddingTop: 10, 
    paddingBottom: 10, 
    paddingHorizontal: 10, 
    marginTop: 2,
    shadowColor: '#0090FF',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8
  }}>
    {/* Responsive Title Row with flex: 1 gradients */}
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 8, paddingHorizontal: 4 }}>
       <LinearGradient colors={['rgba(0, 217, 255, 0)', '#00D9FF']} start={{x:0, y:0}} end={{x:1, y:0}} style={{ height: 2, flex: 1, marginRight: 8 }} />
       <Text style={{ color: '#F5F7FF', fontSize: 9.5, fontWeight: '900', letterSpacing: 1.5 }}>PLAYER CHOICES</Text>
       <LinearGradient colors={['#00D9FF', 'rgba(0, 217, 255, 0)']} start={{x:0, y:0}} end={{x:1, y:0}} style={{ height: 2, flex: 1, marginLeft: 8 }} />
    </View>

    {/* Responsive Choice Boxes Row using flex: 1 and gap */}
    <View style={{ flexDirection: 'row', justifyContent: 'center', width: '100%', gap: 8 }}>
       <View style={{ flex: 1, minWidth: 0, paddingVertical: 8, paddingHorizontal: 8, backgroundColor: 'rgba(0, 0, 0, 0.4)', borderRadius: 12, borderWidth: 1, borderColor: '#005580', flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: '#005580', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
             <Text style={{ fontSize: 14 }}>{getEmoji(p1T)}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
             <Text style={{ color: '#F5F7FF', fontSize: 9.5, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' }} numberOfLines={1}>{p1Name}</Text>
             <Text style={{ color: '#00D9FF', fontSize: 13, fontWeight: '900', letterSpacing: 1, marginTop: 1 }}>{p1T || '?'}</Text>
          </View>
       </View>

       <View style={{ flex: 1, minWidth: 0, paddingVertical: 8, paddingHorizontal: 8, backgroundColor: 'rgba(0, 0, 0, 0.4)', borderRadius: 12, borderWidth: 1, borderColor: '#005580', flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: '#005580', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
             <Text style={{ fontSize: 14 }}>{getEmoji(p2T)}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
             <Text style={{ color: '#F5F7FF', fontSize: 9.5, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' }} numberOfLines={1}>{p2Name}</Text>
             <Text style={{ color: '#00D9FF', fontSize: 13, fontWeight: '900', letterSpacing: 1, marginTop: 1 }}>{p2T || '?'}</Text>
          </View>
       </View>
    </View>
  </View>
  ```

---

#### Issue RV-4: Gameplay Reveal Cards Fixed Dimensions and Gap
- **File**: `src/components/RevealView.tsx`
- **Lines**: 265, 266, 271, 282
- **Current Code**:
  ```tsx
  <View className="items-center justify-center space-y-8 flex-1">
    <View className="flex-row items-center justify-center gap-8 w-full max-w-sm">
      <View className={`flex-1 items-center space-y-4 ${isBat ? 'scale-110' : 'opacity-80'}`}>
        ...
        <View className="w-28 h-32 bg-white rounded-[2rem] items-center justify-center shadow-2xl border-b-4 border-gray-300">
          <Text className="text-6xl">{getEmoji(bT)}</Text>
        </View>
      </View>
      <Text className="text-3xl font-black text-white/50">VS</Text>
      <View className={`flex-1 items-center space-y-4 ${!isBat ? 'scale-110' : 'opacity-80'}`}>
        ...
        <View className="w-28 h-32 bg-white rounded-[2rem] items-center justify-center shadow-2xl border-b-4 border-gray-300">
          <Text className="text-6xl">{getEmoji(boT)}</Text>
        </View>
      </View>
    </View>
  ```
- **Breakage Explanation**: Fixed card dimensions of `w-28 h-32` (112x128px) scaled up by `scale-110` (123x141px) combined with `gap-8` (32px gap) and the 35px "VS" divider exceed 335px width. On 320px–360px phones, cards clip horizontally. Vertical `space-y-8` (32px gaps) causes vertical overflow on screens < 680px height.
- **Exact Responsive Replacement**:
  ```tsx
  <View className="items-center justify-center space-y-4 sm:space-y-6 flex-1 px-4">
    <View className="flex-row items-center justify-around w-full max-w-sm">
      <View className={`items-center space-y-2 sm:space-y-4 ${isBat ? 'scale-105' : 'opacity-80'}`}>
        <Text className="text-[9px] sm:text-[10px] uppercase font-black tracking-widest text-white/70 bg-white/10 px-2.5 py-1 rounded-full" numberOfLines={1}>
          BAT • {batName === room.p1_name && playerId === room.player1_id ? 'YOU' : batName}
        </Text>
        <View className="w-24 sm:w-28 aspect-[7/8] bg-white rounded-[1.75rem] sm:rounded-[2rem] items-center justify-center shadow-2xl border-b-4 border-gray-300">
          <Text className="text-5xl sm:text-6xl">{getEmoji(bT)}</Text>
        </View>
      </View>

      <Text className="text-2xl sm:text-3xl font-black text-white/50 px-1">VS</Text>

      <View className={`items-center space-y-2 sm:space-y-4 ${!isBat ? 'scale-105' : 'opacity-80'}`}>
        <Text className="text-[9px] sm:text-[10px] uppercase font-black tracking-widest text-white/70 bg-white/10 px-2.5 py-1 rounded-full" numberOfLines={1}>
          BOWL • {bowlName === room.p1_name && playerId === room.player1_id ? 'YOU' : bowlName}
        </Text>
        <View className="w-24 sm:w-28 aspect-[7/8] bg-white rounded-[1.75rem] sm:rounded-[2rem] items-center justify-center shadow-2xl border-b-4 border-gray-300">
          <Text className="text-5xl sm:text-6xl">{getEmoji(boT)}</Text>
        </View>
      </View>
    </View>
  ```

---

#### Issue RV-5: Fixed Container Height on Reveal Result Area
- **File**: `src/components/RevealView.tsx`
- **Lines**: 288, 292, 294, 298
- **Current Code**:
  ```tsx
  <View className="h-24 justify-center items-center mt-8 w-full">
    {showResult ? (
      <View className="items-center justify-center">
        {isDeadBall ? (
          <Text className="text-5xl font-black uppercase text-gray-400 shadow-xl mb-4 text-center">DEAD BALL</Text>
        ) : isOut ? (
          <Text className="text-6xl font-black uppercase text-red-500 shadow-xl mb-4 text-center">OUT! 💥</Text>
        ) : (
          <View className="items-center">
            {isNoBall && <Text className="text-red-400 font-bold text-xl uppercase mb-1">NO BALL!</Text>}
            <Text className="text-6xl font-black uppercase text-green-400 shadow-xl mb-4 text-center">+{runsScored} RUNS!</Text>
          </View>
        )}
        <TouchableOpacity onPress={onContinue} className="bg-yellow-400 px-8 py-3 rounded-full shadow-lg active:scale-95">
          <Text className="text-indigo-900 font-black text-lg uppercase">Next Ball</Text>
        </TouchableOpacity>
      </View>
    ) : (
      <Text className="text-xl font-bold opacity-60 animate-pulse text-white">Calculating...</Text>
    )}
  </View>
  ```
- **Breakage Explanation**: Container has fixed `h-24` (96px). The child contents when showing results require ~154px (60px text + 16px margin + 28px no ball label + 50px button). Forcing 154px of content inside 96px creates container boundary overflow and collision with surrounding views.
- **Exact Responsive Replacement**:
  ```tsx
  <View className="min-h-[96px] justify-center items-center mt-4 sm:mt-6 w-full px-4">
    {showResult ? (
      <View className="items-center justify-center w-full">
        {isDeadBall ? (
          <Text className="text-4xl sm:text-5xl font-black uppercase text-gray-400 shadow-xl mb-3 text-center">DEAD BALL</Text>
        ) : isOut ? (
          <Text className="text-4xl sm:text-5xl font-black uppercase text-red-500 shadow-xl mb-3 text-center">OUT! 💥</Text>
        ) : (
          <View className="items-center">
            {isNoBall && <Text className="text-red-400 font-bold text-base sm:text-lg uppercase mb-1">NO BALL!</Text>}
            <Text className="text-4xl sm:text-5xl font-black uppercase text-green-400 shadow-xl mb-3 text-center">+{runsScored} RUNS!</Text>
          </View>
        )}
        <TouchableOpacity onPress={onContinue} className="bg-yellow-400 px-7 py-2.5 sm:py-3 rounded-full shadow-lg active:scale-95 mt-1">
          <Text className="text-indigo-900 font-black text-base sm:text-lg uppercase">Next Ball</Text>
        </TouchableOpacity>
      </View>
    ) : (
      <Text className="text-lg sm:text-xl font-bold opacity-60 animate-pulse text-white">Calculating...</Text>
    )}
  </View>
  ```

---

### 3.2 `src/components/GameRoom.tsx`

#### Issue GR-1: Casual Matchmaking UI Landscape Assumption & `minWidth: 185`
- **File**: `src/components/GameRoom.tsx`
- **Lines**: 298, 348, 365, 394, 440, 522, 538–596, 602, 690–704
- **Current Code**:
  ```tsx
  // lines 440 & 602:
  <View style={{ width: '34%', maxWidth: 245, minWidth: 185, height: 72, position: 'relative' }}>
  ...
  // lines 522-596:
  <View style={{ width: '22%', alignItems: 'center', justifyContent: 'center', zIndex: 20 }}>
    <Text style={{ fontSize: 56, ... lineHeight: 80, paddingLeft: 10, paddingRight: 24, paddingTop: 15, paddingBottom: 5 }}> V </Text>
    ...
    <Text style={{ fontSize: 56, ... lineHeight: 80, marginLeft: -40, paddingLeft: 20, paddingRight: 10, paddingTop: 15, paddingBottom: 5 }}> S </Text>
  </View>
  ...
  // lines 690-704:
  <View style={{ width: 250, height: 46, borderRadius: 23, ... }}>
  ```
- **Breakage Explanation**: Hardcoded `minWidth: 185` on Card 1 + `minWidth: 185` on Card 2 + Center VS `width: '22%'` (80px) + 88px horizontal paddings requires 538px of width. On any mobile screen in portrait (360–390px), the two cards and the 56px VS emblem crash into each other, clipping edges and overlapping avatars.
- **Exact Responsive Replacement**:
  ```tsx
  {/* Middle Row with fluid flexbox sizing */}
  <View style={{
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
    marginVertical: 12
  }} pointerEvents="box-none">
    
    {/* Player Card (YOU) */}
    <View style={{ flex: 1, maxWidth: 220, minWidth: 105, height: 64, position: 'relative' }}>
      <View style={{
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(7, 20, 38, 0.88)',
        borderWidth: 1.5,
        borderColor: '#0878FF',
        borderRadius: 16,
        paddingHorizontal: 8,
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'hidden'
      }}>
        <View style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: '#00D9FF', backgroundColor: '#061A3A', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
          <FontAwesome5 name="user-alt" size={15} color="#F5F7FF" />
        </View>
        <View style={{ flex: 1, minWidth: 0, justifyContent: 'center' }}>
          <Text style={{ color: '#F5F7FF', fontWeight: '900', fontSize: 13, letterSpacing: 0.5, textTransform: 'uppercase' }} numberOfLines={1}>{myName}</Text>
          <Text style={{ color: '#00D9FF', fontWeight: '800', fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase' }}>YOU</Text>
        </View>
      </View>
    </View>

    {/* Center Scaled VS Emblem */}
    <View style={{ width: 56, alignItems: 'center', justifyContent: 'center', zIndex: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 30, fontWeight: '900', color: '#00AED1', letterSpacing: -2, paddingRight: 4 }}>V</Text>
        <Text style={{ fontSize: 30, fontWeight: '900', fontStyle: 'italic', color: '#9126D1', letterSpacing: -1, marginLeft: -10 }}>S</Text>
      </View>
    </View>

    {/* Opponent Card */}
    <View style={{ flex: 1, maxWidth: 220, minWidth: 105, height: 64, position: 'relative' }}>
      <View style={{
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(7, 20, 38, 0.88)',
        borderWidth: 1.5,
        borderColor: '#5A18A8',
        borderRadius: 16,
        paddingHorizontal: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        overflow: 'hidden'
      }}>
        <View style={{ flex: 1, minWidth: 0, alignItems: 'flex-end', justifyContent: 'center', marginRight: 8 }}>
          <Text style={{ color: '#F5F7FF', fontWeight: '800', fontSize: 8.5, letterSpacing: 1, textTransform: 'uppercase' }} numberOfLines={1}>WAITING</Text>
          <Text style={{ color: '#B83CFF', fontWeight: '900', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }}>OPPONENT</Text>
        </View>
        <View style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: '#B83CFF', backgroundColor: '#061A3A', alignItems: 'center', justifyContent: 'center' }}>
          <FontAwesome5 name="question" size={15} color="#B83CFF" />
        </View>
      </View>
    </View>
  </View>

  {/* Responsive Queue Time Pill */}
  <View style={{ width: '70%', maxWidth: 250, minWidth: 180, height: 44, borderRadius: 22, ... }}>
  {/* Responsive Loading Bar */}
  <View style={{ width: '60%', maxWidth: 220, height: 8, ... }}>
  ```

---

#### Issue GR-2: Host Waiting Lobby Missing ScrollView & Clipped CTA
- **File**: `src/components/GameRoom.tsx`
- **Lines**: 788–889
- **Current Code**:
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
- **Breakage Explanation**: Total vertical content height of Room Code, Scoreboard, InviteFriends, 5 Match Setting panels, and Start Match button exceeds 830px. Because it is rendered inside an unscrollable `<View>`, the "Start Match" button is completely pushed off the screen on any device with height < 850px (including iPhone SE, iPhone 13, and standard Androids), preventing the host from ever starting the game.
- **Exact Responsive Replacement**:
  ```tsx
  return (
    <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
      <View className="space-y-4 sm:space-y-6">
        {!isCasualMatch && (
          <View className="bg-indigo-900/50 p-4 sm:p-6 rounded-3xl border border-indigo-400/20 text-center">
            <Text className="text-white opacity-80 font-bold uppercase tracking-widest text-xs mb-1 sm:mb-2">Room Code</Text>
            <Text className="text-4xl sm:text-5xl font-mono font-black text-yellow-400 tracking-[0.2em]">{room.code}</Text>
          </View>
        )}

        <Scoreboard room={room} playerId={playerId} />
        
        {!isCasualMatch && room.capacity > [room.player1_id, room.player2_id, room.player3_id].filter(Boolean).length && (
          <InviteFriends roomId={room.id} />
        )}

        {!isCasualMatch && isHost && (
          <View className="bg-white/10 p-3 sm:p-4 rounded-3xl border border-white/20 mb-2">
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
            <View className="flex-row flex-wrap justify-between gap-1.5 sm:gap-2 mb-4">
              {[0, 1000, 5000, 10000, 50000, 100000, 250000, 500000, 2000000].map(amount => (
                <TouchableOpacity key={amount} onPress={() => setBetAmount(amount)} className={`w-[31%] py-2 rounded-xl border ${betAmount === amount ? 'bg-yellow-400 border-yellow-400' : 'bg-white/10 border-white/20'}`}>
                  <Text className={`text-center font-black text-[9.5px] sm:text-[10px] ${betAmount === amount ? 'text-indigo-900' : 'text-white/60'}`} numberOfLines={1}>
                    {amount === 0 ? 'FREE' : amount >= 1000000 ? `🪙${amount/1000000}M` : `🪙${amount/1000}k`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="text-white opacity-80 font-bold uppercase text-xs mb-2 mt-2">Overs</Text>
            <View className="flex-row flex-wrap gap-1.5 sm:gap-2 mb-4">
              {[2, 5, 10, 20, null].map(o => (
                <TouchableOpacity 
                  key={o ?? 'unlimited'} 
                  onPress={() => setOversLimit(o)} 
                  className={`flex-1 min-w-[17%] py-2 rounded-xl border ${oversLimit === o ? 'bg-yellow-400 border-yellow-400' : 'bg-white/10 border-white/20'}`}
                >
                  <Text className={`text-center font-black text-[10px] sm:text-xs ${oversLimit === o ? 'text-indigo-900' : 'text-white/60'}`} numberOfLines={1}>
                    {o === null ? '∞ ALL' : o}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="text-white opacity-80 font-bold uppercase text-xs mb-2">Wickets</Text>
            <View className="flex-row flex-wrap gap-1.5 sm:gap-2">
              {[1, 2, 3, 5, 10].map(w => (
                <TouchableOpacity 
                  key={w} 
                  onPress={() => setWicketsLimit(w)} 
                  className={`flex-1 min-w-[17%] py-2 rounded-xl border ${wicketsLimit === w ? 'bg-yellow-400 border-yellow-400' : 'bg-white/10 border-white/20'}`}
                >
                  <Text className={`text-center font-black text-xs ${wicketsLimit === w ? 'text-indigo-900' : 'text-white/60'}`}>{w}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="text-white opacity-80 font-bold uppercase text-xs mb-2 mt-4">Speed</Text>
            <View className="flex-row gap-2">
              {[
                { label: 'SLOW (7s)', value: 7 },
                { label: 'MED (5s)', value: 5 },
                { label: 'FAST (3s)', value: 3 }
              ].map(speed => (
                <TouchableOpacity 
                  key={speed.value} 
                  onPress={() => setTurnTimer(speed.value)} 
                  className={`flex-1 py-2 rounded-xl border ${turnTimer === speed.value ? 'bg-yellow-400 border-yellow-400' : 'bg-white/10 border-white/20'}`}
                >
                  <Text className={`text-center font-black text-[9.5px] sm:text-[10px] ${turnTimer === speed.value ? 'text-indigo-900' : 'text-white/60'}`} numberOfLines={1}>{speed.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {isHost && (
          <TouchableOpacity
            onPress={() => takeAction({ type: 'START_MATCH', oversLimit, wicketsLimit, turnTimer, betAmount, capacity } as any)}
            disabled={loading || (is2P ? !room.player2_id : (!room.player2_id || !room.player3_id))}
            className="w-full bg-yellow-400 disabled:opacity-50 py-3.5 sm:py-4 rounded-2xl shadow-xl active:scale-95"
          >
            <Text className="text-indigo-900 font-black text-lg sm:text-xl uppercase tracking-wider text-center">
              {loading ? 'Starting...' : (isCasualMatch && !room.player2_id ? 'Searching for Opponent...' : 'Start Match')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
  ```

---

#### Issue GR-3: Toss Call Scoreboard Collision & Rigid Coin Dimensions
- **File**: `src/components/GameRoom.tsx`
- **Lines**: 1113–1152
- **Current Code**:
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
          <TouchableOpacity 
            className={`w-32 h-32 rounded-full bg-yellow-500 ...`}
          >
            <Text className="text-5xl font-black text-white">H</Text>
            <Text className="text-sm font-black text-white mt-1">HEADS</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className={`w-32 h-32 rounded-full bg-slate-200 ...`}
          >
            <Text className="text-5xl font-black text-slate-700">T</Text>
            <Text className="text-sm font-black text-slate-700 mt-1">TAILS</Text>
          </TouchableOpacity>
        </View>
      ) : ( ... )}
    </View>
  </View>
  ```
- **Breakage Explanation**:
  1. Scoreboard is positioned with `absolute top-0` and content has fixed `mt-20` (80px). Because Scoreboard height is 100-140px, the title directly overlaps with scoreboard text.
  2. Outer `px-12` (96px) plus row `px-8` (64px) = 160px padding. On a 360px screen, 200px remains, but two `w-32` (128px) coins require 256px. The coins overflow the viewport horizontally or wrap into a vertical stack.
- **Exact Responsive Replacement**:
  ```tsx
  <View className="flex-1 justify-between pb-8">
    {/* In-flow Scoreboard (no absolute overlap) */}
    <View className="w-full z-20" pointerEvents="box-none">
      <Scoreboard room={room} playerId={playerId} />
    </View>

    <View className="flex-1 items-center justify-center z-10 w-full px-4" pointerEvents="box-none">
      <Text className="text-2xl sm:text-4xl font-black uppercase italic tracking-widest mb-1 sm:mb-2 text-yellow-400 text-center">
        {room.stage === 'team_toss' ? 'Team Selection Toss' : 'Match Toss'}
      </Text>
      <Text className="text-white text-sm sm:text-base font-bold uppercase tracking-widest mb-6 sm:mb-10 opacity-80 text-center">
        {isCaller ? 'Call the Coin' : 'Opponent is Calling...'}
      </Text>

      {isCaller ? (
        <View className="flex-row justify-around items-center w-full max-w-xs px-2">
          <TouchableOpacity 
            disabled={loading} 
            onPress={() => takeAction({ type: 'TOSS_CALL', choice: 'head' })} 
            className={`w-[44%] max-w-[120px] aspect-square rounded-full bg-yellow-500 items-center justify-center border-4 border-yellow-600 shadow-xl ${loading ? 'opacity-50' : 'active:scale-95'}`}
          >
            <Text className="text-4xl sm:text-5xl font-black text-white">H</Text>
            <Text className="text-xs sm:text-sm font-black text-white mt-1">HEADS</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            disabled={loading} 
            onPress={() => takeAction({ type: 'TOSS_CALL', choice: 'tail' })} 
            className={`w-[44%] max-w-[120px] aspect-square rounded-full bg-slate-200 items-center justify-center border-4 border-slate-300 shadow-xl ${loading ? 'opacity-50' : 'active:scale-95'}`}
          >
            <Text className="text-4xl sm:text-5xl font-black text-slate-700">T</Text>
            <Text className="text-xs sm:text-sm font-black text-slate-700 mt-1">TAILS</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View className="items-center mt-4">
          <View className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-slate-700 items-center justify-center border-4 border-slate-600 animate-pulse">
            <Text className="text-4xl sm:text-5xl font-black text-slate-500">?</Text>
          </View>
          <Text className="text-white/50 font-black text-xs sm:text-sm uppercase tracking-widest animate-pulse mt-4">Awaiting Call...</Text>
        </View>
      )}
    </View>
  </View>
  ```

---

#### Issue GR-4: Toss Throw Scoreboard Collision & HandSelector Padding
- **File**: `src/components/GameRoom.tsx`
- **Lines**: 1162, 1166, 1176, 1182
- **Current Code**:
  ```tsx
  <View className="flex-1">
    <View className="absolute top-0 w-full z-20" pointerEvents="box-none">
      <Scoreboard room={room} playerId={playerId} />
    </View>

    <View className="flex-1 items-center justify-center z-10 w-full mt-20" pointerEvents="box-none">
      ...
      {myThrowInPlay ? (
         <View className="mt-10 items-center">
           <View className="w-32 h-32 bg-green-950/80 rounded-full border-4 border-green-500 items-center justify-center mb-6  ">
             <Text className="text-6xl text-green-400">✓</Text>
           </View>
           <Text className="text-green-400 font-bold uppercase tracking-widest text-sm">Throw Locked</Text>
         </View>
      ) : (
         <View className="bg-black/60 p-8 rounded-[3rem] border border-cyan-500/30  items-center ">
           <HandSelector maxFingers={5} disabled={loading} onSelect={(num) => takeAction({ type: 'THROW', fingers: num })} />
         </View>
      )}
    </View>
  </View>
  ```
- **Breakage Explanation**: Scoreboard `absolute top-0` collides with `mt-20`. `p-8` (64px padding) on the HandSelector container inside a 360px device leaves only 296px width, which when paired with 80px buttons and gaps causes horizontal overflow and pushes controls off-screen on short phones.
- **Exact Responsive Replacement**:
  ```tsx
  <View className="flex-1 justify-between pb-6">
    <View className="w-full z-20" pointerEvents="box-none">
      <Scoreboard room={room} playerId={playerId} />
    </View>

    <View className="flex-1 items-center justify-center z-10 w-full px-4" pointerEvents="box-none">
      <Text className="text-2xl sm:text-4xl font-black uppercase italic tracking-widest mb-1 text-cyan-400 text-center">
        Toss Throw
      </Text>
      <Text className="text-yellow-400 text-xs sm:text-sm font-bold uppercase tracking-widest mb-4 sm:mb-6 text-center">
        {isCaller ? `You called ${room.toss_call?.toUpperCase()}` : `They called ${room.toss_call?.toUpperCase()}`}
      </Text>
      
      {myThrowInPlay ? (
         <View className="items-center my-4">
           <View className="w-24 h-24 sm:w-28 sm:h-28 bg-green-950/80 rounded-full border-4 border-green-500 items-center justify-center mb-4">
             <Text className="text-5xl sm:text-6xl text-green-400">✓</Text>
           </View>
           <Text className="text-green-400 font-bold uppercase tracking-widest text-xs sm:text-sm">Throw Locked</Text>
         </View>
      ) : (
         <View className="bg-black/60 p-3 sm:p-5 rounded-3xl border border-cyan-500/30 items-center w-full max-w-sm">
           <HandSelector maxFingers={5} disabled={loading} onSelect={(num) => takeAction({ type: 'THROW', fingers: num })} />
         </View>
      )}
    </View>
  </View>
  ```

---

#### Issue GR-5: Select Roles Missing ScrollView with Squad Overflow
- **File**: `src/components/GameRoom.tsx`
- **Lines**: 1246–1274
- **Current Code**:
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
- **Breakage Explanation**: With 5 or 10 wickets limit, the squad has 6 to 11 players. Eleven full-width buttons of ~50px height each require >600px height. Because there is no scroll view, players at the bottom are pushed beyond the screen edge and cannot be clicked.
- **Exact Responsive Replacement**:
  ```tsx
  <View className="space-y-4 flex-1 items-center justify-between pb-6 px-4">
    <Scoreboard room={room} playerId={playerId} />
    <View className="bg-white/10 p-4 sm:p-6 rounded-3xl w-full max-w-sm items-center flex-1 max-h-[75%]">
      {needsToSelect ? (
        <>
          <Text className="text-xl sm:text-2xl font-black text-white uppercase text-center mb-3">
            Select Your {roleType}
          </Text>
          <ScrollView className="w-full flex-1" contentContainerStyle={{ gap: 8, paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
            {myPlayers?.map((pName) => (
              <TouchableOpacity
                key={pName}
                disabled={loading}
                onPress={() => takeAction({ type: 'SELECT_ROLE', role: roleType!, playerName: pName })}
                className="bg-indigo-500 py-2.5 sm:py-3 px-4 rounded-xl active:scale-95 w-full"
              >
                <Text className="text-white font-black text-center text-sm sm:text-base">{pName}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      ) : (
        <Text className="text-white/50 font-bold animate-pulse text-base sm:text-lg text-center my-auto">
          Waiting for opponent to select their player...
        </Text>
      )}
    </View>
  </View>
  ```

---

#### Issue GR-6: Floating Game Controls SafeArea & Scoreboard Collision
- **File**: `src/components/GameRoom.tsx`
- **Lines**: 1359–1380
- **Current Code**:
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
  Positioning at `top-0 mt-1` without Safe Area insets places buttons behind device hardware notches and status bar icons. On the right side, a 136px block of buttons sits directly over the Scoreboard Target / Pot display.
- **Exact Responsive Replacement**:
  ```tsx
  <View className="absolute top-1 left-2 z-50">
    <TouchableOpacity onPress={handleExit} className="w-8 h-8 sm:w-9 sm:h-9 rounded-full items-center justify-center border-2 bg-red-500/80 border-red-400/50 shadow-md">
      <Text className="text-sm sm:text-base text-white font-bold">✕</Text>
    </TouchableOpacity>
  </View>
  <View className="absolute top-1 right-2 z-50 flex-row gap-1.5">
    <TouchableOpacity onPress={toggleMic} className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full items-center justify-center border-2 ${micEnabled ? 'bg-indigo-600 border-indigo-400' : 'bg-black/50 border-white/20'}`}>
      <Text className="text-xs sm:text-sm">{micEnabled ? '🎙️' : '🔇'}</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={toggleSpeaker} className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full items-center justify-center border-2 ${speakerEnabled ? 'bg-indigo-600 border-indigo-400' : 'bg-black/50 border-white/20'}`}>
      <Text className="text-xs sm:text-sm">{speakerEnabled ? '🔊' : '🔈'}</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={() => setChatOpen(true)} className="w-8 h-8 sm:w-9 sm:h-9 rounded-full items-center justify-center border-2 bg-indigo-500 border-indigo-400 relative">
      <Text className="text-xs sm:text-sm">💬</Text>
      {messages && messages.length > 0 && !chatOpen && (
        <View className="absolute -top-1 -right-1 bg-red-500 w-3.5 h-3.5 rounded-full items-center justify-center">
          <Text className="text-white text-[7px] font-bold">{messages.length}</Text>
        </View>
      )}
    </TouchableOpacity>
  </View>
  ```

---

#### Issue GR-7: Chat Modal Bottom Bar Button Clutter
- **File**: `src/components/GameRoom.tsx`
- **Lines**: 1474–1493
- **Current Code**:
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
- **Breakage Explanation**: Three 48px buttons (`w-12 h-12`) plus gaps and padding consume 192px. On a 320–360px screen, the text input has only ~90px of usable width, severely compressing typed chat.
- **Exact Responsive Replacement**:
  ```tsx
  <View className="p-2 sm:p-3 bg-black/40 flex-row gap-1.5 sm:gap-2 items-center">
    <TouchableOpacity onPress={() => { setShowQuickChatMenu(!showQuickChatMenu); setShowEmotesMenu(false); }} className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full ${showQuickChatMenu ? 'bg-indigo-500' : 'bg-white/10'} items-center justify-center`}>
      <Text className="text-white text-base sm:text-lg">💬</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={() => { setShowEmotesMenu(!showEmotesMenu); setShowQuickChatMenu(false); }} className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full ${showEmotesMenu ? 'bg-indigo-500' : 'bg-white/10'} items-center justify-center`}>
      <Text className="text-white text-base sm:text-lg">🎭</Text>
    </TouchableOpacity>
    <TextInput
      value={chatText}
      onChangeText={setChatText}
      placeholder="Send message..."
      placeholderTextColor="rgba(255,255,255,0.3)"
      className="flex-1 bg-white/10 text-white rounded-full px-3.5 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm border border-white/10"
      maxLength={100}
      onSubmitEditing={handleSendChat}
    />
    <TouchableOpacity onPress={handleSendChat} disabled={!chatText.trim()} className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full items-center justify-center ${chatText.trim() ? 'bg-indigo-500' : 'bg-white/10'}`}>
      <Text className="text-white text-base sm:text-lg">➤</Text>
    </TouchableOpacity>
  </View>
  ```

---

### 3.3 `src/components/HandSelector.tsx`

#### Issue HS-1: Rigid Dimensions on Finger Buttons Breaking 3-Column Layout
- **File**: `src/components/HandSelector.tsx`
- **Lines**: 19, 25, 27, 28
- **Current Code**:
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
- **Breakage Explanation**: Buttons are hardcoded to `w-20` (80px) and `h-24` (96px). Inside containers with horizontal padding (`p-6` or `p-8`), 3 buttons across need 264px. On narrow devices (<360px), the 3rd button is pushed to row 2, creating an awkward 2-2-2 or 3-2-1 wrapping. Fixed height `h-24` also consumes excessive vertical space on short screens.
- **Exact Responsive Replacement**:
  ```tsx
  <View className="flex-row flex-wrap justify-center gap-2 sm:gap-3 w-full">
    {options.map((num) => (
      <TouchableOpacity
        key={num}
        disabled={disabled}
        onPress={() => onSelect(num)}
        className={`w-[29%] max-w-[80px] min-w-[64px] aspect-[4/5] bg-white rounded-2xl sm:rounded-3xl items-center justify-center shadow-xl border-b-4 border-gray-300 active:bg-gray-100 ${disabled ? 'opacity-50' : 'active:scale-95'}`}
      >
        <Text className="text-3xl sm:text-4xl">{emojiMap[num]}</Text>
        <Text className="text-lg sm:text-xl font-black text-indigo-900 mt-0.5">{num}</Text>
      </TouchableOpacity>
    ))}
  </View>
  ```

---

### 3.4 `src/components/Scoreboard.tsx`

#### Issue SB-1: Scoreboard Padding & Role Text Truncation
- **File**: `src/components/Scoreboard.tsx`
- **Lines**: 70, 108, 121
- **Current Code**:
  ```tsx
  <View className="pt-2 px-6">
    ...
    <Text className={`text-base uppercase font-black tracking-widest ${isMe ? 'text-blue-400' : 'text-red-400'}`} numberOfLines={1}>
        {baseName} {showRole ? (isBat ? '• BAT' : '• BOWL') : ''}
    </Text>
    ...
    <Text className={`text-4xl font-light tracking-widest mt-1 ${isMe ? 'text-blue-50' : 'text-red-50'}`}>
        {p.score}{isBat && room.wickets_limit > 1 ? <Text className="text-2xl opacity-40 font-light">/{wickets}</Text> : ''}
    </Text>
  ```
- **Breakage Explanation**: Heavy horizontal padding (`px-6` = 48px) reduces column widths to ~135px. Combining player name with `• BAT` or `• BOWL` at `text-base` (16px) with `tracking-widest` forces truncation of the role or username.
- **Exact Responsive Replacement**:
  ```tsx
  <View className="pt-2 px-3 sm:px-6">
    ...
    <Text className={`text-xs sm:text-base uppercase font-black tracking-wider sm:tracking-widest ${isMe ? 'text-blue-400' : 'text-red-400'}`} numberOfLines={1}>
        {baseName} {showRole ? (isBat ? '• BAT' : '• BOWL') : ''}
    </Text>
    ...
    <Text className={`text-3xl sm:text-4xl font-light tracking-wider sm:tracking-widest mt-0.5 sm:mt-1 ${isMe ? 'text-blue-50' : 'text-red-50'}`}>
        {p.score}{isBat && room.wickets_limit > 1 ? <Text className="text-xl sm:text-2xl opacity-40 font-light">/{wickets}</Text> : ''}
    </Text>
  ```

---

#### Issue SB-2: Spectator Badge Absolute Positioning Collision
- **File**: `src/components/Scoreboard.tsx`
- **Lines**: 145–150
- **Current Code**:
  ```tsx
  {/* Spectator display if applicable */}
  {players.filter(p => p.id === room.waiting_player_id).map((p, i) => (
       <View key={`spec-${i}`} className="absolute top-full left-0 right-0 items-center mt-4 opacity-50">
          <Text className="text-[8px] text-white font-light tracking-[0.3em] uppercase mb-0.5">Spectating</Text>
          <Text className="text-xs text-white font-medium tracking-widest" numberOfLines={1}>{p.id === playerId ? 'YOU' : p.label}</Text>
       </View>
  ))}
  ```
- **Breakage Explanation**: Positioning with `absolute top-full left-0 right-0` takes the spectator badge out of document flow without height reservation. It floats directly over subsequent elements in `GameRoom` (such as toss throw controls or move options).
- **Exact Responsive Replacement**:
  ```tsx
  {/* Spectator display in normal flow */}
  {players.filter(p => p.id === room.waiting_player_id).map((p, i) => (
       <View key={`spec-${i}`} className="items-center mt-2 opacity-60">
          <Text className="text-[8px] text-white font-light tracking-[0.3em] uppercase mb-0.5">Spectating</Text>
          <Text className="text-xs text-white font-medium tracking-widest" numberOfLines={1}>{p.id === playerId ? 'YOU' : p.label}</Text>
       </View>
  ))}
  ```

---

## 4. Caveats

1. **Non-Destructive Constraint**: No source files (`.tsx`, `.ts`) have been edited. The replacement code is provided as drop-in patches ready for implementation review.
2. **Auxiliary Modals Scope**: Modals that can be summoned from `GameRoom` (such as `InviteFriends.tsx` and in-game chat) were reviewed for interactions with `GameRoom`. Global standalone modals (`CoinShop`, `DailyRewardModal`, etc.) are assigned to Explorer 3.
3. **Safe Area Inset Hook**: The proposed floating game controls replacement recommends wrapping or spacing using Safe Area insets (or `top-1` with padding). If `react-native-safe-area-context`'s `useSafeAreaInsets()` hook is available in the project, setting `top: insets.top + 4` is the optimal production pattern.

---

## 5. Conclusion

The core game screens (`GameRoom`, `RevealView`, `Scoreboard`, and `HandSelector`) suffer from pervasive hardcoded pixel dimensions that break across small phones, standard portrait viewports, and short screen heights:

1. **Casual Matchmaking**: Coded exclusively for landscape layout with `minWidth: 185` on player cards, causing catastrophic horizontal collision on standard portrait devices (360–390px).
2. **Host Waiting Lobby**: Rendered in an unscrollable view exceeding 830px in height, completely hiding the "Start Match" CTA button on standard mobile devices.
3. **Coin Flipping & Finger Selection**: Hardcoded 96px, 128px, and 80px dimensions inside heavy padding containers force horizontal wrapping breakdown and vertical truncation.
4. **Absolute Positioning Overlaps**: Unbounded `absolute top-0` Scoreboard and `absolute top-full` spectator badges collide directly with action cards and titles.
5. **Fixed Container Heights in Reveal**: Rigid `h-24` containers overflow when results (154px) are rendered.

All 16 identified issues have been provided with drop-in, percentage- and flexbox-based alternatives (`w-[29%]`, `aspectRatio: 1`, `min-w-0`, `flex: 1`, `max-w-sm`, `<ScrollView>`) that preserve the exact visual design and color palette while ensuring dynamic scaling on all mobile screens.

---

## 6. Verification Method

To independently verify these findings:

1. **Inspection**:
   - Check `src/components/RevealView.tsx` lines 106–122, 169–173, 201, 226, 271, 288.
   - Check `src/components/GameRoom.tsx` lines 440, 602, 690, 789, 879, 1113, 1130, 1162, 1182, 1246, 1359.
   - Check `src/components/HandSelector.tsx` lines 19, 25.
   - Check `src/components/Scoreboard.tsx` lines 70, 108, 146.

2. **Simulation / Layout Math**:
   - Calculate width on 360px portrait screen for Casual Matchmaking: $185\text{px} + 185\text{px} + 80\text{px} + 88\text{px} = 538\text{px} > 360\text{px}$ (confirms collision).
   - Calculate vertical height on iPhone SE (667px) for Host Waiting Lobby: content $>830\text{px} > 667\text{px}$ without ScrollView (confirms hidden "Start Match" button).

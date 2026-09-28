const fs = require('fs');
const file = 'C:/MyGames/head-tail-app/src/components/GameRoom.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacement = `      // AAA Matchmaking UI for Random Match Search
      if (isCasualMatch && !room.player2_id) {
        const formatTime = (secs: number) => \\\`\\\${Math.floor(secs / 60)}:\\\${(secs % 60).toString().padStart(2, '0')}\\\`;
        
        const pulseAnim = searchAnim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.6, 1, 0.6]
        });

        const loadingBarAnim = searchAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['-100%', '100%']
        });

        return (
          <View className="flex-1 bg-black">
            {/* The Stadium Background */}
            <View className="absolute inset-0" pointerEvents="none">
              <Image 
                source={require('../../assets/cricket_stadium_bg.jpg')}
                className="absolute w-full h-full opacity-60"
                resizeMode="cover"
              />
              {/* Optional blue/purple tint to match the image */}
              <LinearGradient
                colors={['rgba(0,217,255,0.15)', 'rgba(2,11,28,0.6)', 'rgba(184,60,255,0.15)']}
                className="absolute inset-0"
              />
            </View>

            <View className="flex-1 safe-area-y z-10" pointerEvents="box-none">
              
              {/* HEADER ROW */}
              <View className="absolute top-12 w-full flex-row justify-between px-6 items-center" pointerEvents="none">
                <View className="flex-row items-center">
                  {/* Coin logo placeholder */}
                  <View className="w-8 h-8 bg-yellow-500 rounded-full items-center justify-center border-2 border-white/50 mr-3 shadow-lg">
                    <Text className="text-white text-xs font-black">C</Text>
                  </View>
                  <View>
                    <Text className="font-black italic text-xl tracking-wider">
                      <Text className="text-white">HEAD </Text>
                      <Text className="text-[#00D9FF]">TAIL</Text>
                    </Text>
                    <Text className="text-[8px] text-[#A8B6CC] tracking-[0.3em] uppercase">Hand Cricket</Text>
                  </View>
                </View>
                <View className="hidden md:flex">
                  <Text className="text-[#A8B6CC] text-[10px] font-bold tracking-[0.4em] uppercase">FLIP  •  PLAY  •  WIN</Text>
                </View>
              </View>

              <View className="flex-1 justify-center w-full" pointerEvents="box-none">
                {/* MATCHMAKING TITLE */}
                <View className="items-center mb-16" pointerEvents="none">
                  <Text className="text-5xl md:text-7xl font-black italic uppercase tracking-[0.1em]" style={{ color: '#00D9FF', textShadowColor: 'rgba(0,217,255,0.5)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 }}>
                    MATCHMAKING
                  </Text>
                  
                  <Text className="text-white font-bold text-xs md:text-sm tracking-[0.3em] mt-4 uppercase">
                    Finding Your Opponent...
                  </Text>
                  
                  {/* Gradient Loading Bar */}
                  <View className="w-64 md:w-96 h-2 bg-[#061A3A] rounded-full mt-5 overflow-hidden border border-[#00D9FF]/20 shadow-lg">
                    <Animated.View 
                      className="absolute top-0 bottom-0 w-full"
                      style={{ transform: [{ translateX: loadingBarAnim as any }] }}
                    >
                      <LinearGradient
                        colors={['transparent', '#00D9FF', '#0878FF', '#B83CFF', 'transparent']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{ flex: 1 }}
                      />
                    </Animated.View>
                  </View>
                </View>

                {/* HORIZONTAL PLAYER PANELS & VS */}
                <View className="flex-row items-center justify-center w-full px-2 md:px-8 mb-16" pointerEvents="box-none">
                  
                  {/* LEFT PANEL (YOU) */}
                  <View className="flex-row items-center bg-[#071426]/90 border border-[#00D9FF] rounded-l-full rounded-r-xl md:rounded-r-3xl p-1.5 md:p-2 shadow-[0_0_20px_rgba(0,217,255,0.4)] flex-1 max-w-[42%] md:max-w-[35%]">
                    <View className="w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-[#00D9FF] items-center justify-center bg-[#061A3A] mr-3 shadow-[0_0_10px_rgba(0,217,255,0.5)]">
                      <FontAwesome5 name="user-alt" size={20} color="#A8B6CC" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-black text-sm md:text-xl uppercase tracking-wider" numberOfLines={1}>{myName}</Text>
                      <Text className="text-[#00D9FF] font-black text-[10px] md:text-sm uppercase tracking-widest mt-0.5">YOU</Text>
                    </View>
                  </View>
                  
                  {/* VS */}
                  <View className="items-center justify-center px-3 md:px-8">
                    <Animated.View style={{ opacity: pulseAnim as any }}>
                      <Text className="text-5xl md:text-7xl font-black italic tracking-widest drop-shadow-2xl">
                        <Text className="text-[#00D9FF]">V</Text>
                        <Text className="text-[#B83CFF]">S</Text>
                      </Text>
                    </Animated.View>
                  </View>

                  {/* RIGHT PANEL (OPPONENT) */}
                  <View className="flex-row items-center bg-[#071426]/90 border border-[#B83CFF] rounded-r-full rounded-l-xl md:rounded-l-3xl p-1.5 md:p-2 shadow-[0_0_20px_rgba(184,60,255,0.4)] flex-1 max-w-[42%] md:max-w-[35%] justify-end">
                    <View className="flex-1 items-end ml-1 md:ml-3 mr-3">
                      <Text className="text-white font-black text-[9px] md:text-xs uppercase tracking-widest text-right" numberOfLines={1}>WAITING FOR</Text>
                      <Text className="text-[#B83CFF] font-black text-[10px] md:text-sm uppercase tracking-widest mt-0.5 text-right">OPPONENT</Text>
                    </View>
                    <View className="w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-[#B83CFF] items-center justify-center bg-[#061A3A] shadow-[0_0_10px_rgba(184,60,255,0.5)]">
                      <FontAwesome5 name="question" size={20} color="#B83CFF" />
                    </View>
                  </View>
                </View>

                {/* BOTTOM: Queue Timer & Inline Cancel */}
                <View className="items-center w-full absolute bottom-12 md:bottom-16" pointerEvents="box-none">
                  
                  {/* QUEUE TIME PANEL WITH RED 'X' BUTTON */}
                  <View className="bg-[#071426]/95 border-2 border-[#00D9FF]/40 rounded-full overflow-hidden shadow-[0_0_15px_rgba(0,217,255,0.2)] flex-row relative min-w-[240px]">
                    {/* Gradient background tint */}
                    <LinearGradient
                      colors={['rgba(0,217,255,0.15)', 'rgba(184,60,255,0.15)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      className="absolute inset-0"
                    />
                    
                    {/* Content */}
                    <View className="flex-row items-center w-full px-5 py-3">
                      <View className="w-10 h-10 rounded-full border-2 border-[#00D9FF] items-center justify-center mr-4 bg-[#061A3A]/50 shadow-[0_0_10px_rgba(0,217,255,0.3)]">
                        <FontAwesome5 name="clock" size={16} color="#00D9FF" />
                      </View>
                      <View className="flex-1 items-center mr-10">
                        <Text className="text-[#A8B6CC] font-black text-[10px] uppercase tracking-[0.2em] mb-1">Queue Time</Text>
                        <Text className="text-white font-black text-2xl tracking-widest" style={{ textShadowColor: 'rgba(255,255,255,0.5)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 }}>
                          {formatTime(searchTime)}
                        </Text>
                      </View>
                    </View>

                    {/* RED X CANCEL BUTTON (Integrated in corner of capsule) */}
                    <TouchableOpacity 
                      onPress={onExit} 
                      activeOpacity={0.7}
                      className="absolute right-2 top-2 bottom-2 w-12 bg-red-500 rounded-full items-center justify-center shadow-[0_0_15px_rgba(255,59,69,0.5)] border border-red-400"
                      style={{ zIndex: 50 }}
                    >
                      <FontAwesome5 name="times" size={16} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </View>
        );
      }`;

const startStr = '      // AAA Matchmaking UI for Random Match Search';
const endStr = '      // Normal Room Lobby';

const start = content.indexOf(startStr);
const end = content.indexOf(endStr);

if (start >= 0 && end > start) {
  content = content.substring(0, start) + replacement + content.substring(end);
  content = content.replace(/\\`/g, '`');
  content = content.replace(/\\\$/g, '$');
  fs.writeFileSync(file, content);
  console.log('Success - perfectly matched reference image');
} else {
  console.log('Could not find markers');
}

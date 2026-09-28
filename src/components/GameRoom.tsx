import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, TextInput, Animated, Modal, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { createAudioPlayer } from 'expo-audio';
import { FontAwesome5, Feather } from '@expo/vector-icons';
import { useChat } from '../hooks/useChat';
import { useWebRTC } from '../hooks/useWebRTC';
import { Room, UserAction } from '../lib/types';
import Scoreboard from './Scoreboard';
import HandSelector from './HandSelector';
import RevealView from './RevealView';
import InviteFriends from './InviteFriends';
import { CRICKET_TEAMS, TEAM_NAMES } from '../lib/teams';
import { api } from '../lib/api';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';

interface GameRoomProps {
  room: Room;
  playerId: string;
  onExit: () => void;
  onAction?: (action: UserAction | { type: 'EXIT_GAME' }) => Promise<void>;
  onUpdateRoom?: (room: Room) => void;
  initialEditMode?: boolean;
  isCasualMatch?: boolean;
}


const GameRoomBackground = () => (
  <View className="absolute inset-0 bg-black" pointerEvents="none">
    <Image 
      source={require('../../assets/cricket_stadium_bg.jpg')}
      className="absolute w-full h-full opacity-80"
      resizeMode="cover"
    />
    <View className="absolute inset-0 bg-black/40" />
  </View>
);

const AUDIO_ASSETS: Record<string, any> = {
  'hello': require('../../assets/voices/hello.mp3'),
  'good_luck': require('../../assets/voices/good_luck.mp3'),
  'well_played': require('../../assets/voices/well_played.mp3'),
  'oops': require('../../assets/voices/oops.mp3'),
  'hurry_up': require('../../assets/voices/hurry_up.mp3'),
  'wow': require('../../assets/voices/wow.mp3'),
  'thanks': require('../../assets/voices/thanks.mp3'),
  'good_game': require('../../assets/voices/good_game.mp3'),
};

const QUICK_CHATS = [
  { id: 'hello', text: 'Hello!' },
  { id: 'good_luck', text: 'Good Luck!' },
  { id: 'well_played', text: 'Well Played!' },
  { id: 'oops', text: 'Oops!' },
  { id: 'hurry_up', text: 'Hurry Up!' },
  { id: 'wow', text: 'Wow!' },
  { id: 'thanks', text: 'Thanks!' },
  { id: 'good_game', text: 'Good Game!' },
];

const EMOTES = [
  { id: 'bomb', icon: '💣' },
  { id: 'wine', icon: '🍷' },
  { id: 'heart', icon: '❤️' },
  { id: 'angry', icon: '😡' },
  { id: 'laugh', icon: '😂' },
  { id: 'thumbs_down', icon: '👎' },
  { id: 'tomato', icon: '🍅' },
  { id: 'rose', icon: '🌹' },
];

export default function GameRoom({ room, playerId, onExit, onAction, onUpdateRoom, initialEditMode, isCasualMatch: isCasualMatchProp }: GameRoomProps) {
  const isCasualMatch = isCasualMatchProp ?? (room.bet_amount === 0 && !room.is_ranked && room.is_public === true);
  const isBotMatch = room.player2_id === '00000000-0000-0000-0000-000000000000';

  const [loading, setLoading] = useState(false);
  const [myThrowInPlay, setMyThrowInPlay] = useState<number | null>(null);
  
  const [oversLimit, setOversLimit] = useState<number | null>(null);
  const [wicketsLimit, setWicketsLimit] = useState<number>(1);
  const [turnTimer, setTurnTimer] = useState<number>(7);
  const [betAmount, setBetAmount] = useState<number>(room.bet_amount || 0);
  const [capacity, setCapacity] = useState<number>(room.capacity || 2);
  const [isEditingSettings, setIsEditingSettings] = useState((initialEditMode && !isCasualMatch) || false);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [isCustomTeam, setIsCustomTeam] = useState(false);
  const [customTeamName, setCustomTeamName] = useState('');
  const [customPlayerNames, setCustomPlayerNames] = useState<string[]>([]);
  const [captain, setCaptain] = useState<string | null>(null);
  const [customCaptainIndex, setCustomCaptainIndex] = useState<number | null>(null);

  const myDbThrow = playerId === room.player1_id ? room.p1_throw : (playerId === room.player2_id ? room.p2_throw : room.p3_throw);
  const isSearchingMatch = isCasualMatch && !room.player2_id && room.status === 'waiting';
  const { micEnabled, speakerEnabled, toggleMic, toggleSpeaker } = useWebRTC(room.id, playerId, isSearchingMatch);

  const myName = playerId === room.player1_id ? room.p1_name : (playerId === room.player2_id ? room.p2_name : room.p3_name) || 'Player';
  const { messages, sendMessage, latestSpecialMessage } = useChat(room.id, playerId, myName || 'Player');
  
  const [chatOpen, setChatOpen] = React.useState(false);
  const [chatText, setChatText] = React.useState('');
  const [showQuickChatMenu, setShowQuickChatMenu] = React.useState(false);
  const [showEmotesMenu, setShowEmotesMenu] = React.useState(false);
  
  const [activeEmote, setActiveEmote] = React.useState<string | null>(null);
  const emoteAnim = React.useRef(new Animated.Value(0)).current;
  const scrollViewRef = React.useRef<ScrollView>(null);

  const [timeLeft, setTimeLeft] = React.useState<number | null>(null);

  const [searchTime, setSearchTime] = React.useState(0);
  const searchAnim = React.useRef(new Animated.Value(0)).current;
  const entryAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(entryAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCasualMatch && !room.player2_id && room.status === 'waiting') {
      interval = setInterval(() => setSearchTime(prev => prev + 1), 1000);
      Animated.loop(
        Animated.timing(searchAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      setSearchTime(0);
      searchAnim.stopAnimation();
    }
    return () => clearInterval(interval);
  }, [isCasualMatch, room.player2_id, room.status, searchAnim]);
  React.useEffect(() => {
    if (room.status === 'playing' && myThrowInPlay === null) {
      let timerVal = room.turn_timer || 7;
      if (room.is_ranked) {
        if (room.rank_tier === 'Gold' || room.rank_tier === 'Platinum') timerVal = 5;
        if (room.rank_tier === 'Diamond' || room.rank_tier === 'Master' || room.rank_tier === 'Grandmaster') timerVal = 3;
      }
      
      setTimeLeft(timerVal);
      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev !== null && prev <= 1) {
             clearInterval(interval);
             setMyThrowInPlay(0);
             if (onAction) onAction({ type: 'THROW', fingers: 0 } as any);
             else api.takeAction(room.id, playerId, { type: 'THROW', fingers: 0 } as any);
             return 0;
          }
          return prev !== null ? prev - 1 : null;
        });
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setTimeLeft(null);
    }
  }, [room.status, room.is_ranked, room.rank_tier, room.turn_timer, myThrowInPlay]);

  React.useEffect(() => {
    if (latestSpecialMessage && latestSpecialMessage.timestamp > Date.now() - 5000) {
      if (latestSpecialMessage.messageType === 'quick_chat' && latestSpecialMessage.metaId) {
        const asset = AUDIO_ASSETS[latestSpecialMessage.metaId];
        if (asset) {
          try {
            const player = createAudioPlayer(asset);
            player.play();
          } catch(e) {}
        }
      } else if (latestSpecialMessage.messageType === 'emote' && latestSpecialMessage.metaId) {
        setActiveEmote(latestSpecialMessage.metaId);
        emoteAnim.setValue(0);
        Animated.sequence([
          Animated.timing(emoteAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.delay(1500),
          Animated.timing(emoteAnim, { toValue: 0, duration: 500, useNativeDriver: true })
        ]).start(() => setActiveEmote(null));
      }
    }
  }, [latestSpecialMessage]);

  const handleSendChat = () => {
    if (!chatText.trim()) return;
    sendMessage(chatText, 'text');
    setChatText('');
  };

  useEffect(() => {
    if (myDbThrow === null) {
      setMyThrowInPlay(null);
    }
  }, [myDbThrow]);

  const handleExit = async () => {
    Alert.alert('Exit Room', 'Are you sure you want to leave?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: async () => {
          setLoading(true);
          try {
            if (onAction) await onAction({ type: 'EXIT_GAME' } as any);
            else await api.takeAction(room.id, playerId, { type: 'EXIT_GAME' } as any);
          } catch (err) {
            console.log(err);
          }
          setLoading(false);
          onExit();
        }
      }
    ]);
  };

  const takeAction = async (action: UserAction) => { console.log('[GameRoom.takeAction] Started with action:', action);
    setLoading(true);
    try {
      if (action.type === 'THROW') {
        setMyThrowInPlay(action.fingers);
      }
      if (onAction) await onAction(action);
      else { const updatedRoom = await api.takeAction(room.id, playerId, action); if (onUpdateRoom) onUpdateRoom(updatedRoom); }
      if (action.type === 'CONTINUE' || action.type === 'PLAY_AGAIN') {
        setMyThrowInPlay(null);
      }
    } catch (err: any) { console.error('[GameRoom.takeAction] Error caught:', err);
      console.error('takeAction error:', err); Alert.alert('Error', err.message || 'Failed to take action');
      setMyThrowInPlay(null);
    } finally { console.log('[GameRoom.takeAction] Finally block reached, setting loading false');
      setLoading(false);
    }
  };

  const is2P = room.capacity === 2;
  const is3P = room.capacity === 3;
  const isP1 = playerId === room.player1_id;
  const isP2 = playerId === room.player2_id;
  const isP3 = playerId === room.player3_id;
  const isHost = isP1;

  const renderContent = () => { console.log('[GameRoom] renderContent called, room.status =', room.status);
    if (room.status === 'waiting') {
      
      // AAA Matchmaking UI for Random Match Search
      if (isCasualMatch && !room.player2_id) {
        const formatTime = (secs: number) => {
          const m = Math.floor(secs / 60).toString().padStart(2, '0');
          const s = (secs % 60).toString().padStart(2, '0');
          return `${m} : ${s}`;
        };
        
        const pulseAnim = searchAnim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.92, 1.08, 0.92]
        });

        const loadingBarAnim = searchAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [-180, 180]
        });

        // Moving border color sweep animations
        const borderBeamPlayer = searchAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [-200, 300]
        });

        const borderBeamOpponent = searchAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [300, -200]
        });

        const borderGlowPulse = searchAnim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.4, 0.95, 0.4]
        });

        return (
          <View style={{ flex: 1, backgroundColor: '#000000' }}>
            {/* 1. Deep Dark Cricket Background with subtle ambient neon backlighting */}
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000000' }} pointerEvents="none">
              {/* Dark Stadium Image Layer */}
              <Image 
                source={require('../../assets/cricket_stadium_bg.jpg')}
                style={{ position: 'absolute', width: '100%', height: '100%' }}
                resizeMode="cover"
                blurRadius={2}
              />
              {/* Dark Gradient Overlay to ensure neon colors pop */}
              <View style={{ position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(5, 12, 25, 0.65)' }} />
            </View>

            {/* 2. Main Content Container - Perfect Landscape Layout */}
            <View style={{ flex: 1, justifyContent: 'space-between', paddingTop: 8, paddingBottom: 12, paddingHorizontal: 24 }} pointerEvents="box-none">
              
              {/* --- TOP SECTION: HEADER + MATCHMAKING TITLE & PROGRESS --- */}
              <View style={{ width: '100%', alignItems: 'center' }} pointerEvents="none">
                
                {/* Header Row */}
                <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                  {/* Logo & Brand */}
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: '#061A3A',
                      borderWidth: 2,
                      borderColor: '#00D9FF',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 10,
                      shadowColor: '#00D9FF',
                      shadowOpacity: 0.6,
                      shadowRadius: 8,
                      elevation: 5
                    }}>
                      <FontAwesome5 name="coins" size={15} color="#FFD21F" />
                    </View>
                    <View>
                      <Text style={{ fontStyle: 'italic', fontWeight: '900', fontSize: 17, letterSpacing: 1 }}>
                        <Text style={{ color: '#F5F7FF' }}>HEAD</Text>
                        <Text style={{ color: '#00D9FF', marginLeft: 2 }}>TAIL</Text>
                      </Text>
                      <Text style={{ color: '#A8B6CC', fontSize: 7, fontWeight: '700', letterSpacing: 2.5, textTransform: 'uppercase', marginTop: 1 }}>
                        HAND CRICKET
                      </Text>
                    </View>
                  </View>

                  {/* Right Tagline */}
                  <View style={{ opacity: 0.85 }}>
                    <Text style={{ color: '#A8B6CC', fontSize: 9, fontWeight: '700', letterSpacing: 3, textTransform: 'uppercase' }}>
                      FLIP  ·  PLAY  ·  WIN
                    </Text>
                  </View>
                </View>

                {/* Centered Large Gradient Title - POSITIONED HIGH UP */}
                <View style={{ alignItems: 'center', marginTop: 0 }}>
                  <MaskedView
                    maskElement={
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
                    }
                  >
                    <LinearGradient
                      colors={['#00D9FF', '#0878FF', '#B83CFF']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Text style={{
                        fontSize: 42,
                        fontWeight: '900',
                        fontStyle: 'italic',
                        letterSpacing: 2,
                        textAlign: 'center',
                        opacity: 0
                      }}>
                        MATCHMAKING
                      </Text>
                    </LinearGradient>
                  </MaskedView>

                  {/* Subtitle */}
                  <Text style={{
                    color: '#A8B6CC',
                    fontSize: 9.5,
                    fontWeight: '800',
                    letterSpacing: 3,
                    textTransform: 'uppercase',
                    marginTop: 2,
                    textShadowColor: 'rgba(0, 0, 0, 0.9)',
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 4
                  }}>
                    FINDING YOUR OPPONENT...
                  </Text>

                  {/* Animated Loading Bar */}
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
                    <Animated.View
                      style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        width: '100%',
                        transform: [{ translateX: loadingBarAnim as any }]
                      }}
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

              </View>

              {/* --- MIDDLE: PLAYER CARD  VS  OPPONENT CARD (WITH GENEROUS GAP & MOVING COLOR BORDERS) --- */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                paddingHorizontal: 20,
                marginVertical: 4
              }} pointerEvents="box-none">
                
                {/* [ PLAYER CARD (YOU) WITH MOVING COLOR BORDER ] */}
                <View style={{ width: '34%', maxWidth: 245, minWidth: 185, height: 72, position: 'relative' }}>

                  {/* Main Rounded Card Box */}
                  <View style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(7, 20, 38, 0.88)',
                    borderWidth: 1.5,
                    borderColor: '#0878FF',
                    borderRadius: 18,
                    paddingLeft: 10,
                    paddingRight: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    {/* MOVING BORDER COLOR BEAM (ANIMATED LIGHT SWEEP) */}
                    <Animated.View
                      style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        width: 140,
                        transform: [{ translateX: borderBeamPlayer as any }],
                        opacity: 0.8
                      }}
                      pointerEvents="none"
                    >
                      <LinearGradient
                        colors={['transparent', 'rgba(8, 120, 255, 0.4)', 'rgba(0, 217, 255, 0.9)', 'transparent']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{ flex: 1 }}
                      />
                    </Animated.View>

                    {/* Avatar with Neon Cyan Ring */}
                    <View style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      borderWidth: 2,
                      borderColor: '#00D9FF',
                      backgroundColor: '#061A3A',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                      shadowColor: '#00D9FF',
                      shadowOpacity: 0.9,
                      shadowRadius: 10,
                      elevation: 6
                    }}>
                      <FontAwesome5 name="user-alt" size={20} color="#F5F7FF" />
                    </View>

                    {/* Player Info Text */}
                    <View style={{ flex: 1, justifyContent: 'center', zIndex: 10 }}>
                      <Text style={{
                        color: '#F5F7FF',
                        fontWeight: '900',
                        fontSize: 16,
                        letterSpacing: 1,
                        textTransform: 'uppercase'
                      }} numberOfLines={1}>
                        {myName}
                      </Text>
                      <Text style={{
                        color: '#00D9FF',
                        fontWeight: '800',
                        fontSize: 11,
                        letterSpacing: 2,
                        textTransform: 'uppercase',
                        marginTop: 1
                      }}>
                        YOU
                      </Text>
                    </View>
                  </View>
                </View>

                {/* [ CENTER STYLIZED ELECTRIC "VS" EMBLEM WITH ENERGY SLASHES ] */}
                <View style={{ width: '22%', alignItems: 'center', justifyContent: 'center', zIndex: 20 }}>
                  <View style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                  }}>


                    {/* The Interlocking Electric VS Letters - Larger & Dynamic */}
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'visible',
                      position: 'relative'
                    }}>
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

                      {/* Divider Line / Energy Beam */}
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

                {/* [ OPPONENT CARD WITH MOVING COLOR BORDER ] */}
                <View style={{ width: '34%', maxWidth: 245, minWidth: 185, height: 72, position: 'relative' }}>

                  {/* Main Rounded Card Box */}
                  <View style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(7, 20, 38, 0.88)',
                    borderWidth: 1.5,
                    borderColor: '#5A18A8',
                    borderRadius: 18,
                    paddingLeft: 16,
                    paddingRight: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    {/* MOVING BORDER COLOR BEAM (ANIMATED LIGHT SWEEP) */}
                    <Animated.View
                      style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        width: 140,
                        transform: [{ translateX: borderBeamOpponent as any }],
                        opacity: 0.8
                      }}
                      pointerEvents="none"
                    >
                      <LinearGradient
                        colors={['transparent', 'rgba(90, 24, 168, 0.4)', 'rgba(184, 60, 255, 0.9)', 'transparent']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{ flex: 1 }}
                      />
                    </Animated.View>

                    {/* Opponent Info Text */}
                    <View style={{ flex: 1, alignItems: 'flex-end', justifyContent: 'center', zIndex: 10, marginRight: 12 }}>
                      <Text style={{
                        color: '#F5F7FF',
                        fontWeight: '800',
                        fontSize: 9.5,
                        letterSpacing: 1.5,
                        textTransform: 'uppercase'
                      }} numberOfLines={1}>
                        WAITING FOR
                      </Text>
                      <Text style={{
                        color: '#B83CFF',
                        fontWeight: '900',
                        fontSize: 13,
                        letterSpacing: 2,
                        textTransform: 'uppercase',
                        marginTop: 1
                      }}>
                        OPPONENT
                      </Text>
                    </View>

                    {/* Avatar with Neon Purple Ring */}
                    <View style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      borderWidth: 2,
                      borderColor: '#B83CFF',
                      backgroundColor: '#061A3A',
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: '#B83CFF',
                      shadowOpacity: 0.9,
                      shadowRadius: 10,
                      elevation: 6
                    }}>
                      <FontAwesome5 name="question" size={20} color="#B83CFF" />
                    </View>
                  </View>
                </View>

              </View>

              {/* --- BOTTOM SECTION: QUEUE TIME CAPSULE WITH INTEGRATED CANCEL 'X' --- */}
              <View style={{ width: '100%', alignItems: 'center', marginBottom: 2 }} pointerEvents="box-none">
                
                {/* Pill Capsule */}
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
                  {/* Subtle gradient inside */}
                  <LinearGradient
                    colors={['rgba(0, 217, 255, 0.12)', 'rgba(184, 60, 255, 0.12)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 23 }}
                  />

                  {/* Left: Clock Icon (Full size, no border) */}
                  <View style={{
                    width: 32,
                    height: 32,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: 2
                  }}>
                    <Feather
                      name="clock"
                      size={24}
                      color="#00D9FF"
                      style={{
                        shadowColor: '#00D9FF',
                        shadowOpacity: 0.8,
                        shadowRadius: 8
                      }}
                    />
                  </View>

                  {/* Center: Queue Time Labels */}
                  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{
                      color: '#A8B6CC',
                      fontSize: 8,
                      fontWeight: '800',
                      letterSpacing: 2,
                      textTransform: 'uppercase',
                      marginBottom: 1
                    }}>
                      QUEUE TIME
                    </Text>
                    <Text style={{
                      color: '#FFFFFF',
                      fontSize: 17,
                      fontWeight: '900',
                      letterSpacing: 2.5,
                      textShadowColor: 'rgba(0, 217, 255, 0.5)',
                      textShadowOffset: { width: 0, height: 0 },
                      textShadowRadius: 6,
                      lineHeight: 19
                    }}>
                      {formatTime(searchTime)}
                    </Text>
                  </View>

                  {/* Right Corner: The Red Circular 'X' Cancel Button */}
                  <TouchableOpacity
                    onPress={onExit}
                    activeOpacity={0.7}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 15,
                      backgroundColor: '#FF3B45',
                      borderWidth: 1.5,
                      borderColor: '#FFA5A9',
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: '#FF3B45',
                      shadowOpacity: 0.8,
                      shadowRadius: 8,
                      elevation: 5
                    }}
                  >
                    <FontAwesome5 name="times" size={13} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

              </View>

            </View>
          </View>
        );
      }      // Normal Room Lobby
      return (
        <View className="space-y-6">
        {!isCasualMatch && (
          <View className="bg-indigo-900/50 p-6 rounded-3xl border border-indigo-400/20 text-center">
            <Text className="text-white opacity-80 font-bold uppercase tracking-widest text-xs mb-2">Room Code</Text>
            <Text className="text-5xl font-mono font-black text-yellow-400 tracking-[0.2em]">{room.code}</Text>
          </View>
        )}

        <Scoreboard room={room} playerId={playerId} />
        
        {!isCasualMatch && room.capacity > [room.player1_id, room.player2_id, room.player3_id].filter(Boolean).length && (
          <InviteFriends roomId={room.id} />
        )}

        {!isCasualMatch && isHost && (
          <View className="bg-white/10 p-4 rounded-3xl border border-white/20 mb-2">
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
            <View className="flex-row flex-wrap justify-between gap-2 mb-4">
              {[0, 1000, 5000, 10000, 50000, 100000, 250000, 500000, 2000000].map(amount => (
                <TouchableOpacity key={amount} onPress={() => setBetAmount(amount)} className={`w-[30%] py-2 rounded-xl border ${betAmount === amount ? 'bg-yellow-400 border-yellow-400' : 'bg-white/10 border-white/20'}`}>
                  <Text className={`text-center font-black text-[10px] ${betAmount === amount ? 'text-indigo-900' : 'text-white/60'}`}>
                    {amount === 0 ? 'FREE' : amount >= 1000000 ? `🪙${amount/1000000}M` : `🪙${amount/1000}k`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

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

            <Text className="text-white opacity-80 font-bold uppercase text-xs mb-2">Wickets</Text>
            <View className="flex-row flex-wrap gap-2">
              {[1, 2, 3, 5, 10].map(w => (
                <TouchableOpacity 
                  key={w} 
                  onPress={() => setWicketsLimit(w)} 
                  className={`flex-1 py-2 rounded-xl border ${wicketsLimit === w ? 'bg-yellow-400 border-yellow-400' : 'bg-white/10 border-white/20'}`}
                >
                  <Text className={`text-center font-black text-xs ${wicketsLimit === w ? 'text-indigo-900' : 'text-white/60'}`}>{w}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="text-white opacity-80 font-bold uppercase text-xs mb-2 mt-4">Speed</Text>
            <View className="flex-row gap-2">
              {[
                { label: 'SLOW (7s)', value: 7 },
                { label: 'MEDIUM (5s)', value: 5 },
                { label: 'FAST (3s)', value: 3 }
              ].map(speed => (
                <TouchableOpacity 
                  key={speed.value} 
                  onPress={() => setTurnTimer(speed.value)} 
                  className={`flex-1 py-2 rounded-xl border ${turnTimer === speed.value ? 'bg-yellow-400 border-yellow-400' : 'bg-white/10 border-white/20'}`}
                >
                  <Text className={`text-center font-black text-[10px] ${turnTimer === speed.value ? 'text-indigo-900' : 'text-white/60'}`}>{speed.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {isHost && (
          <TouchableOpacity
            onPress={() => takeAction({ type: 'START_MATCH', oversLimit, wicketsLimit, turnTimer, betAmount, capacity } as any)}
            disabled={loading || (is2P ? !room.player2_id : (!room.player2_id || !room.player3_id))}
            className="w-full bg-yellow-400 disabled:opacity-50 py-4 rounded-2xl shadow-xl active:scale-95"
          >
            <Text className="text-indigo-900 font-black text-xl uppercase tracking-wider text-center">
              {loading ? 'Starting...' : (isCasualMatch && !room.player2_id ? 'Searching for Opponent...' : 'Start Match')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // TEAM SELECTION
  if (room.status === 'team_selection') {
    const isP1 = playerId === room.player1_id;
    const isP2 = playerId === room.player2_id;
    const isP3 = playerId === room.player3_id;
    const myTeam = isP1 ? room.p1_team : (isP2 ? room.p2_team : room.p3_team);

    if (room.capacity === 2 && playerId !== room.current_batsman) {
       return (
         <View className="space-y-6 flex-1 items-center justify-center">
            <Text className="text-white text-3xl font-black uppercase text-center mb-4">Opponent's Turn</Text>
            <Text className="text-white/50 font-bold animate-pulse text-lg text-center">They won the toss and are picking their team...</Text>
         </View>
       );
    }

    if (myTeam) {
       return (
         <View className="space-y-6 flex-1 items-center justify-center">
            <Text className="text-white text-2xl font-black uppercase text-center mb-4">Team Selected!</Text>
            <Text className="text-yellow-400 text-xl font-bold mb-8">{myTeam}</Text>
            <Text className="text-white/50 font-bold animate-pulse">Waiting for opponent to select...</Text>
         </View>
       );
    }

    const takenTeams = [room.p1_team, room.p2_team, room.p3_team].filter(Boolean);
    const requiredPlayers = room.wickets_limit + 1;
    const isSubmitEnabled = selectedTeam !== null && selectedPlayers.length === requiredPlayers && captain !== null;

    const isCustomSubmitEnabled = 
      customTeamName.trim().length > 0 && 
      !takenTeams.includes(customTeamName.trim()) && 
      customPlayerNames.length === requiredPlayers && 
      customPlayerNames.every(name => name.trim().length > 0) &&
      customCaptainIndex !== null;

    const handlePlayerSelect = (p: string) => {
      if (selectedPlayers.includes(p)) {
        setSelectedPlayers(prev => prev.filter(x => x !== p));
        if (captain === p) setCaptain(null);
      } else if (selectedPlayers.length < requiredPlayers) {
        setSelectedPlayers(prev => [...prev, p]);
      }
    };

    const handleCustomPlayerNameChange = (index: number, value: string) => {
      const newNames = [...customPlayerNames];
      newNames[index] = value;
      setCustomPlayerNames(newNames);
    };

    return (
      <View className="space-y-4 flex-1">
        <Text className="text-white text-2xl font-black uppercase text-center mb-2">{room.capacity === 2 ? 'Your Turn to Draft' : 'Select Team'}</Text>
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {!selectedTeam && !isCustomTeam ? (
            <View className="flex-1 space-y-4 pb-8">
              <View className="flex-row flex-wrap gap-3 justify-center">
                {TEAM_NAMES.map(t => {
                  const isTaken = takenTeams.includes(t);
                  return (
                    <TouchableOpacity 
                      key={t} 
                      onPress={() => !isTaken && setSelectedTeam(t)} 
                      disabled={isTaken}
                      className={`w-[47%] p-4 rounded-2xl border items-center ${isTaken ? 'bg-red-500/20 border-red-500/50 opacity-60' : 'bg-white/10 border-white/20'}`}
                    >
                      <Text className="text-white font-black">{t}</Text>
                      {isTaken && <Text className="text-red-400 font-bold text-[10px] mt-1 uppercase tracking-widest">Taken by Rival</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View className="flex-row items-center gap-4 py-2 opacity-50">
                <View className="flex-1 border-t border-white/20"></View>
                <Text className="text-xs text-white font-black uppercase tracking-widest">OR</Text>
                <View className="flex-1 border-t border-white/20"></View>
              </View>

              <TouchableOpacity 
                onPress={() => {
                  setIsCustomTeam(true);
                  setCustomPlayerNames(Array(requiredPlayers).fill(''));
                  setCustomCaptainIndex(null);
                }} 
                className="w-full bg-blue-500/20 border border-blue-400/50 p-4 rounded-2xl items-center shadow-lg active:scale-95 mt-2"
              >
                <Text className="text-blue-300 font-black uppercase tracking-wider text-lg">✏️ Create Custom Team</Text>
              </TouchableOpacity>
            </View>
          ) : isCustomTeam ? (
            <View className="space-y-4 pb-8">
              <View className="flex-row items-center justify-between mb-4">
                <TouchableOpacity onPress={() => { setIsCustomTeam(false); setCustomTeamName(''); setCustomPlayerNames([]); setCustomCaptainIndex(null); }} className="bg-white/20 px-4 py-2 rounded-full">
                  <Text className="text-white font-bold text-xs uppercase">← Back</Text>
                </TouchableOpacity>
                <Text className="text-white font-black text-xl">Custom Team</Text>
              </View>

              <View className="bg-indigo-900/40 p-4 rounded-2xl mb-2 border border-indigo-500/30 space-y-4">
                <View>
                  <Text className="text-xs font-bold text-yellow-400 uppercase tracking-widest mb-1">Team Name</Text>
                  <TextInput 
                    placeholder="e.g. Dream 11" 
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={customTeamName} 
                    onChangeText={setCustomTeamName}
                    maxLength={15}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white font-bold"
                  />
                  {takenTeams.includes(customTeamName.trim()) && <Text className="text-red-400 text-xs mt-1 font-bold">This team name is taken!</Text>}
                </View>

                <View>
                  <Text className="text-xs font-bold text-yellow-400 uppercase tracking-widest mb-2">Players & Captain ({requiredPlayers} required)</Text>
                  <View className="space-y-2">
                    {customPlayerNames.map((name, index) => (
                      <View key={index} className="flex-row items-center gap-2 mb-2">
                        <TextInput 
                          placeholder={`Player ${index + 1} Name`} 
                          placeholderTextColor="rgba(255,255,255,0.2)"
                          value={name}
                          onChangeText={(val) => handleCustomPlayerNameChange(index, val)}
                          maxLength={15}
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm font-bold"
                        />
                        <TouchableOpacity
                          onPress={() => setCustomCaptainIndex(index)}
                          className={`px-3 py-3 rounded-xl border ${customCaptainIndex === index ? 'bg-yellow-400 border-yellow-300' : 'bg-white/10 border-white/20'}`}
                        >
                          <Text className={`font-bold text-xs ${customCaptainIndex === index ? 'text-indigo-900' : 'text-white/50'}`}>CAPTAIN</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => {
                  const finalPlayers = customPlayerNames.map((n, i) => i === customCaptainIndex ? `${n.trim()} (C)` : n.trim());
                  takeAction({ type: 'SUBMIT_TEAM', team: customTeamName.trim(), players: finalPlayers });
                }}
                disabled={!isCustomSubmitEnabled || loading}
                className="w-full bg-yellow-400 disabled:opacity-50 py-4 rounded-2xl shadow-xl active:scale-95 mt-4"
              >
                <Text className="text-indigo-900 font-black text-xl uppercase tracking-wider text-center">Confirm Squad</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="space-y-4 pb-8">
              <View className="flex-row items-center justify-between mb-4">
                <TouchableOpacity onPress={() => { setSelectedTeam(null); setSelectedPlayers([]); setCaptain(null); }} className="bg-white/20 px-4 py-2 rounded-full">
                  <Text className="text-white font-bold text-xs uppercase">← Back</Text>
                </TouchableOpacity>
                <Text className="text-white font-black text-xl">{selectedTeam}</Text>
              </View>

              <View className="bg-indigo-900/40 p-4 rounded-2xl mb-2 border border-indigo-500/30">
                <Text className="text-yellow-400 font-bold text-center">Select {requiredPlayers} players ({selectedPlayers.length}/{requiredPlayers})</Text>
              </View>

              <View className="flex-row flex-wrap gap-2">
                {CRICKET_TEAMS[selectedTeam!].map(p => {
                  const isSelected = selectedPlayers.includes(p);
                  const disabled = !isSelected && selectedPlayers.length >= requiredPlayers;
                  return (
                    <TouchableOpacity 
                      key={p} 
                      onPress={() => handlePlayerSelect(p)}
                      disabled={disabled}
                      className={`w-[48%] p-3 rounded-xl border ${isSelected ? 'bg-green-500 border-green-400' : 'bg-white/10 border-white/20'} ${disabled ? 'opacity-50' : ''}`}
                    >
                      <Text className={`text-center font-bold text-xs ${isSelected ? 'text-white' : 'text-white/70'}`}>{p}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {selectedPlayers.length === requiredPlayers && (
                <View className="mt-4 bg-yellow-400/10 p-4 rounded-2xl border border-yellow-400/30">
                  <Text className="text-center text-xs font-black uppercase text-yellow-400 tracking-widest mb-3">Select Captain</Text>
                  <View className="flex-row flex-wrap gap-2 justify-center">
                    {selectedPlayers.map(p => (
                      <TouchableOpacity
                        key={`capt-${p}`}
                        onPress={() => setCaptain(p)}
                        className={`w-[48%] p-3 rounded-xl border ${captain === p ? 'bg-yellow-400 border-yellow-300' : 'bg-white/10 border-white/20'}`}
                      >
                        <Text className={`text-center font-bold text-xs ${captain === p ? 'text-indigo-900' : 'text-white'}`}>{p}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <TouchableOpacity
                onPress={() => {
                  const finalPlayers = selectedPlayers.map(p => p === captain ? `${p} (C)` : p);
                  takeAction({ type: 'SUBMIT_TEAM', team: selectedTeam!, players: finalPlayers });
                }}
                disabled={!isSubmitEnabled || loading}
                className="w-full bg-yellow-400 disabled:opacity-50 py-4 rounded-2xl shadow-xl active:scale-95 mt-4"
              >
                <Text className="text-indigo-900 font-black text-xl uppercase tracking-wider text-center">Confirm Squad</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  // TOSS CALL (2P)
  if (room.status === 'toss_call') {
    const isCaller = playerId === room.current_batsman;
    return (
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
          ) : (
            <View className="items-center mt-6">
              <View className="w-32 h-32 rounded-full bg-slate-700 items-center justify-center border-4 border-slate-600 animate-pulse">
                <Text className="text-5xl font-black text-slate-500">?</Text>
              </View>
              <Text className="text-white/50 font-black text-sm uppercase tracking-widest animate-pulse mt-4">Awaiting Call...</Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  // TOSS THROW
  if (room.status === 'toss_throw') { console.log('[GameRoom] Rendering Toss Throw UI');
    const isCaller = playerId === room.current_batsman;
    return (
      <View className="flex-1">
        <View className="absolute top-0 w-full z-20" pointerEvents="box-none">
          <Scoreboard room={room} playerId={playerId} />
        </View>

        <View className="flex-1 items-center justify-center z-10 w-full mt-20" pointerEvents="box-none">
          <Text className="text-4xl font-black uppercase italic tracking-widest mb-1 text-cyan-400">
            Toss Throw
          </Text>
          <Text className="text-yellow-400 text-sm font-bold uppercase tracking-widest mb-8">
            {isCaller ? `You called ${room.toss_call?.toUpperCase()}` : `They called ${room.toss_call?.toUpperCase()}`}
          </Text>
          
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
    );
  }

  // REVEALS
  if (room.status === 'toss_reveal') {
    return <RevealView room={room} playerId={playerId} type="toss" onContinue={() => takeAction({ type: 'CONTINUE' })} />;
  }
  
  if (room.status === 'reveal') {
    return <RevealView room={room} playerId={playerId} type="play" onContinue={() => takeAction({ type: 'CONTINUE' })} />;
  }

  // TOSS DECISION
  if (room.status === 'toss_decision') {
    const isWinner = playerId === room.current_batsman;
    return (
      <View className="space-y-6">
        <Scoreboard room={room} playerId={playerId} />
        <View className="bg-white/10 p-6 rounded-3xl items-center">
          <Text className="text-2xl font-black text-white uppercase text-center mb-6">
            {isWinner ? 'You won the toss!' : 'You lost the toss...'}
          </Text>
          {isWinner ? (
            <View className="flex-row gap-4 w-full">
              <TouchableOpacity onPress={() => takeAction({ type: 'TOSS_DECISION', choice: 'bat' })} className="flex-1 bg-green-400 py-4 rounded-2xl">
                <Text className="text-indigo-900 font-black text-xl text-center">BAT</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => takeAction({ type: 'TOSS_DECISION', choice: 'bowl' })} className="flex-1 bg-red-400 py-4 rounded-2xl">
                <Text className="text-indigo-900 font-black text-xl text-center">BOWL</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text className="text-white/50 font-bold animate-pulse">Waiting for opponent's decision...</Text>
          )}
        </View>
      </View>
    );
  }

  // SELECT ROLES
  if (room.status === 'select_roles' || room.status === 'select_batsman' || room.status === 'select_bowler') {
    const isBat = playerId === room.current_batsman;
    const isBowl = playerId === room.current_bowler;
    const myPlayers = isP1 ? room.p1_players : (isP2 ? room.p2_players : room.p3_players);

    let needsToSelect = false;
    let roleType: 'batsman' | 'bowler' | null = null;

    if (isBat && !room.active_batsman_name && (room.status === 'select_roles' || room.status === 'select_batsman')) {
      needsToSelect = true;
      roleType = 'batsman';
    }
    if (isBowl && !room.active_bowler_name && (room.status === 'select_roles' || room.status === 'select_bowler')) {
      needsToSelect = true;
      roleType = 'bowler';
    }

    return (
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
          ) : (
            <Text className="text-white/50 font-bold animate-pulse text-lg text-center">
              Waiting for opponent to select their player...
            </Text>
          )}
        </View>
      </View>
    );
  }

  // PLAYING
  if (room.status === 'playing') {
    const isBat = playerId === room.current_batsman;
    
    let playingMaxFingers = 6;
    if (room.is_ranked) {
      if (room.rank_tier === 'Gold' || room.rank_tier === 'Platinum') playingMaxFingers = 4;
      if (room.rank_tier === 'Diamond' || room.rank_tier === 'Master' || room.rank_tier === 'Grandmaster') playingMaxFingers = 2;
    }
    const isSpectator = playerId === room.waiting_player_id;
    return (
      <View className="space-y-6 flex-1">
        <Scoreboard room={room} playerId={playerId} />
        
        {!isSpectator && (
          <View className="bg-white/10 p-6 rounded-3xl mt-auto">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-black text-white uppercase">Your Move</Text>
              <Text className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest ${isBat ? 'bg-green-400/20 text-green-400' : 'bg-red-400/20 text-red-400'}`}>
                {isBat ? 'BATTING' : 'BOWLING'}
              </Text>
            </View>
            
            {timeLeft !== null && !myThrowInPlay && (
              <View className="mb-4 items-center">
                <Text className="text-red-400 font-black text-2xl animate-pulse">{timeLeft}s</Text>
                <View className="h-2 w-full bg-white/10 rounded-full mt-2 overflow-hidden">
                  <Animated.View style={{ width: `${(timeLeft / (room.turn_timer || 7)) * 100}%` }} className="h-full bg-red-500" />
                </View>
              </View>
            )}
            
            {myThrowInPlay ? (
              <View className="h-24 justify-center items-center">
                 <Text className="text-white font-bold opacity-50 animate-pulse text-lg">Waiting for opponent...</Text>
              </View>
            ) : (
              <HandSelector maxFingers={playingMaxFingers} disabled={loading} onSelect={(num) => takeAction({ type: 'THROW', fingers: num })} />
            )}
          </View>
        )}
      </View>
    );
  }

  // GAME OVER
  if (room.status === 'game_over') {
    const isWinner = playerId === room.winner;
    const isTie = room.winner === 'TIE';
    const hasVoted = room.toss_choices && room.toss_choices[playerId] === 'play_again';
    return (
      <View className="space-y-6">
        <Scoreboard room={room} playerId={playerId} />
        <View className="bg-white/10 p-6 rounded-3xl items-center">
          <Text className="text-5xl font-black uppercase text-center mb-2 text-white">
             {isTie ? "IT'S A TIE!" : (isWinner ? 'YOU WIN! 🎉' : 'YOU LOSE 💀')}
          </Text>
          <TouchableOpacity 
            onPress={() => takeAction({ type: 'PLAY_AGAIN' })} 
            disabled={hasVoted || loading}
            className={`w-full py-4 rounded-2xl active:scale-95 mb-3 ${hasVoted ? 'bg-yellow-400/50' : 'bg-yellow-400'}`}
          >
             <Text className={`font-black text-xl text-center uppercase tracking-wider ${hasVoted ? 'text-indigo-900/50' : 'text-indigo-900'}`}>
               {hasVoted ? 'Waiting for others...' : 'Play Again'}
             </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleExit} className="w-full bg-red-500/80 py-4 rounded-2xl active:scale-95">
             <Text className="text-white font-black text-xl text-center uppercase tracking-wider">Exit Room</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return null;
  };

  return (
    <Animated.View className="flex-1 bg-black" style={{ opacity: entryAnim }}>
      <GameRoomBackground />
      {(room.status === 'playing' || room.status === 'reveal' || room.status === 'game_over') && (
        <>
          <View className="absolute top-0 left-0 z-50 mt-1 ml-1">
            <TouchableOpacity onPress={handleExit} className="w-10 h-10 rounded-full items-center justify-center border-2 bg-red-500/80 border-red-400/50">
              <Text className="text-lg text-white font-bold">X</Text>
            </TouchableOpacity>
          </View>
          <View className="absolute top-0 right-0 z-50 flex-row gap-2 mt-1 mr-1">
            <TouchableOpacity onPress={toggleMic} className={`w-10 h-10 rounded-full items-center justify-center border-2 ${micEnabled ? '🎙️' : '🔇'}`}>
              <Text className="text-lg">{micEnabled ? '🎙️' : '🔇'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleSpeaker} className={`w-10 h-10 rounded-full items-center justify-center border-2 ${speakerEnabled ? '🔊' : '🔈'}`}>
              <Text className="text-lg">{speakerEnabled ? '🔊' : '🔈'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setChatOpen(true)} className="w-10 h-10 rounded-full items-center justify-center border-2 bg-indigo-500 border-indigo-400 relative">
              <Text className="text-lg">💬</Text>
              {messages && messages.length > 0 && !chatOpen && (
                <View className="absolute -top-1 -right-1 bg-red-500 w-4 h-4 rounded-full items-center justify-center">
                  <Text className="text-white text-[8px] font-bold">{messages.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
      {renderContent()}

      {activeEmote && (
        <Animated.View 
          pointerEvents="none"
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            justifyContent: 'center', alignItems: 'center', zIndex: 9999,
            opacity: emoteAnim,
            transform: [{ scale: emoteAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.5, 1.5, 1] }) }]
          }}
        >
          <Text style={{ fontSize: 120 }}>
            {EMOTES.find(e => e.id === activeEmote)?.icon || activeEmote}
          </Text>
        </Animated.View>
      )}

      <Modal visible={chatOpen} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-end bg-black/50">
          <View className="bg-indigo-950 h-3/4 rounded-t-3xl border-t border-white/20 flex flex-col overflow-hidden">
            <View className="bg-white/10 p-4 flex-row justify-between items-center border-b border-white/10">
              <Text className="text-white font-bold text-base uppercase tracking-wider">In-Game Chat</Text>
              <TouchableOpacity onPress={() => setChatOpen(false)} className="p-1">
                <Text className="text-white/50 font-bold text-lg">✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView ref={scrollViewRef} onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })} className="flex-1 p-4">
              {!messages || messages.length === 0 ? (
                <Text className="text-white/40 text-center italic mt-10 text-xs">No messages yet.{"\\n"}Messages disappear after the game.</Text>
              ) : (
                messages.map(msg => {
                  const isMe = msg.senderId === playerId;
                  return (
                    <View key={msg.id} className={`mb-3 max-w-[85%] ${isMe ? 'self-end' : 'self-start'}`}>
                      <Text className={`text-[10px] text-white/50 font-bold mb-1 ${isMe ? 'text-right' : 'text-left'}`}>{msg.senderName}</Text>
                      {msg.messageType === 'emote' ? (
                        <Text style={{ fontSize: 50 }}>{EMOTES.find(e => e.id === msg.metaId)?.icon || msg.metaId}</Text>
                      ) : msg.messageType === 'quick_chat' ? (
                        <View className={`px-4 py-3 rounded-2xl ${isMe ? 'bg-indigo-400 rounded-tr-none' : 'bg-white/30 rounded-tl-none'}`}>
                          <Text className="text-white text-sm italic">🔊 {msg.text}</Text>
                        </View>
                      ) : (
                        <View className={`px-4 py-3 rounded-2xl ${isMe ? 'bg-indigo-500 rounded-tr-none' : 'bg-white/20 rounded-tl-none'}`}>
                          <Text className="text-white text-sm">{msg.text}</Text>
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </ScrollView>
            
            {showQuickChatMenu && (
              <View className="p-3 bg-indigo-900 border-t border-white/10">
                <View className="flex-row justify-between items-center mb-3">
                  <View className="w-6" />
                  <Text className="text-white/50 text-xs text-center uppercase tracking-widest font-bold">Quick Chat</Text>
                  <TouchableOpacity onPress={() => setShowQuickChatMenu(false)} className="w-6 items-center">
                    <Text className="text-white/50 text-base">✕</Text>
                  </TouchableOpacity>
                </View>
                <View className="flex-row flex-wrap justify-center gap-2">
                  {QUICK_CHATS.map(qc => (
                    <TouchableOpacity key={qc.id} onPress={() => { sendMessage(qc.text, 'quick_chat', qc.id); setShowQuickChatMenu(false); }} className="bg-white/10 px-4 py-2 rounded-full border border-white/10">
                      <Text className="text-white text-sm font-bold">{qc.text}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {showEmotesMenu && (
              <View className="p-3 bg-indigo-900 border-t border-white/10">
                <View className="flex-row justify-between items-center mb-3">
                  <View className="w-6" />
                  <Text className="text-white/50 text-xs text-center uppercase tracking-widest font-bold">Emotes</Text>
                  <TouchableOpacity onPress={() => setShowEmotesMenu(false)} className="w-6 items-center">
                    <Text className="text-white/50 text-base">✕</Text>
                  </TouchableOpacity>
                </View>
                <View className="flex-row flex-wrap justify-center gap-3 py-2">
                  {EMOTES.map(em => (
                    <TouchableOpacity key={em.id} onPress={() => { sendMessage(em.icon, 'emote', em.id); setShowEmotesMenu(false); }} className="w-14 h-14 bg-white/5 rounded-2xl items-center justify-center border border-white/10">
                      <Text className="text-4xl">{em.icon}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View className="p-3 bg-black/40 flex-row gap-2 items-center">
              <TouchableOpacity onPress={() => { setShowQuickChatMenu(!showQuickChatMenu); setShowEmotesMenu(false); }} className={`w-12 h-12 rounded-full ${showQuickChatMenu ? 'bg-indigo-500' : 'bg-white/10'} items-center justify-center`}>
                <Text className="text-white text-xl">💬</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setShowEmotesMenu(!showEmotesMenu); setShowQuickChatMenu(false); }} className={`w-12 h-12 rounded-full ${showEmotesMenu ? 'bg-indigo-500' : 'bg-white/10'} items-center justify-center`}>
                <Text className="text-white text-xl">🎭</Text>
              </TouchableOpacity>
              <TextInput
                value={chatText}
                onChangeText={setChatText}
                placeholder="Send a message..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                className="flex-1 bg-white/10 text-white rounded-full px-5 py-3 text-sm border border-white/10"
                maxLength={100}
                onSubmitEditing={handleSendChat}
              />
              <TouchableOpacity onPress={handleSendChat} disabled={!chatText.trim()} className={`w-12 h-12 rounded-full items-center justify-center ${chatText.trim() ? 'bg-indigo-500' : 'bg-white/10'}`}>
                <Text className="text-white text-xl">➤</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Animated.View>
  );
}

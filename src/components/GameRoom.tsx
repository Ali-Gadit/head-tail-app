import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Room, UserAction } from '../lib/types';
import Scoreboard from './Scoreboard';
import HandSelector from './HandSelector';
import RevealView from './RevealView';
import InviteFriends from './InviteFriends';
import { CRICKET_TEAMS, TEAM_NAMES } from '../lib/teams';
import { api } from '../lib/api';

interface GameRoomProps {
  room: Room;
  playerId: string;
  onExit: () => void;
  onAction?: (action: UserAction | { type: 'EXIT_GAME' }) => Promise<void>;
}

export default function GameRoom({ room, playerId, onExit, onAction }: GameRoomProps) {
  const [loading, setLoading] = useState(false);
  const [myThrowInPlay, setMyThrowInPlay] = useState<number | null>(null);
  
  const [oversLimit, setOversLimit] = useState<number | null>(null);
  const [wicketsLimit, setWicketsLimit] = useState<number>(1);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);

  const myDbThrow = playerId === room.player1_id ? room.p1_throw : (playerId === room.player2_id ? room.p2_throw : room.p3_throw);
  
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

  const takeAction = async (action: UserAction) => {
    setLoading(true);
    try {
      if (action.type === 'THROW') {
        setMyThrowInPlay(action.fingers);
      }
      if (onAction) await onAction(action);
      else await api.takeAction(room.id, playerId, action);
      if (action.type === 'CONTINUE' || action.type === 'PLAY_AGAIN') {
        setMyThrowInPlay(null);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to take action');
      setMyThrowInPlay(null);
    } finally {
      setLoading(false);
    }
  };

  const is2P = room.capacity === 2;
  const is3P = room.capacity === 3;
  const isP1 = playerId === room.player1_id;
  const isP2 = playerId === room.player2_id;
  const isP3 = playerId === room.player3_id;
  const isHost = isP1;

  if (room.status === 'waiting') {
    return (
      <View className="space-y-6">
        <View className="bg-indigo-900/50 p-6 rounded-3xl border border-indigo-400/20 text-center">
          <Text className="text-white opacity-80 font-bold uppercase tracking-widest text-xs mb-2">Room Code</Text>
          <Text className="text-5xl font-mono font-black text-yellow-400 tracking-[0.2em]">{room.code}</Text>
        </View>

        <Scoreboard room={room} playerId={playerId} />
        
        {room.capacity > [room.player1_id, room.player2_id, room.player3_id].filter(Boolean).length && (
          <InviteFriends roomId={room.id} />
        )}

        {isHost && (
          <View className="bg-white/10 p-4 rounded-3xl border border-white/20 mb-2">
            <Text className="text-center text-[10px] text-white font-black uppercase opacity-50 tracking-widest mb-2">Match Settings</Text>
            
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
          </View>
        )}

        {isHost && (
          <TouchableOpacity
            onPress={() => takeAction({ type: 'START_MATCH', oversLimit, wicketsLimit })}
            disabled={loading || (is2P ? !room.player2_id : (!room.player2_id || !room.player3_id))}
            className="w-full bg-yellow-400 disabled:opacity-50 py-4 rounded-2xl shadow-xl active:scale-95"
          >
            <Text className="text-indigo-900 font-black text-xl uppercase tracking-wider text-center">
              {loading ? 'Starting...' : 'Start Match'}
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
    const availableTeams = TEAM_NAMES.filter(t => !takenTeams.includes(t));
    const requiredPlayers = room.wickets_limit + 1;
    const isSubmitEnabled = selectedTeam !== null && selectedPlayers.length === requiredPlayers;

    const handlePlayerSelect = (p: string) => {
      if (selectedPlayers.includes(p)) {
        setSelectedPlayers(prev => prev.filter(x => x !== p));
      } else if (selectedPlayers.length < requiredPlayers) {
        setSelectedPlayers(prev => [...prev, p]);
      }
    };

    return (
      <View className="space-y-4 flex-1">
        <Text className="text-white text-2xl font-black uppercase text-center mb-2">{room.capacity === 2 ? 'Your Turn to Draft' : 'Select Team'}</Text>
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {!selectedTeam ? (
            <View className="flex-row flex-wrap gap-3 pb-8 justify-center">
              {availableTeams.map(t => (
                <TouchableOpacity key={t} onPress={() => setSelectedTeam(t)} className="w-[47%] bg-white/10 p-4 rounded-2xl border border-white/20 items-center">
                  <Text className="text-white font-black">{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View className="space-y-4 pb-8">
              <View className="flex-row items-center justify-between mb-4">
                <TouchableOpacity onPress={() => { setSelectedTeam(null); setSelectedPlayers([]); }} className="bg-white/20 px-4 py-2 rounded-full">
                  <Text className="text-white font-bold text-xs uppercase">← Back</Text>
                </TouchableOpacity>
                <Text className="text-white font-black text-xl">{selectedTeam}</Text>
              </View>

              <View className="bg-indigo-900/40 p-4 rounded-2xl mb-2 border border-indigo-500/30">
                <Text className="text-yellow-400 font-bold text-center">Select {requiredPlayers} players ({selectedPlayers.length}/{requiredPlayers})</Text>
              </View>

              <View className="flex-row flex-wrap gap-2">
                {CRICKET_TEAMS[selectedTeam].map(p => {
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

              <TouchableOpacity
                onPress={() => takeAction({ type: 'SUBMIT_TEAM', team: selectedTeam, players: selectedPlayers })}
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
      <View className="space-y-6">
        <Scoreboard room={room} playerId={playerId} />
        <View className="bg-white/10 p-6 rounded-3xl items-center">
          <Text className="text-2xl font-black text-yellow-300 uppercase text-center mb-6">
            {room.stage === 'team_toss' ? 'Team Selection Toss!' : 'Match Toss Time!'}
          </Text>
          <Text className="text-xl font-bold text-white uppercase text-center mb-6">
            {isCaller ? 'Call the Toss!' : 'Opponent is calling...'}
          </Text>
          {isCaller ? (
            <View className="flex-row gap-4 w-full">
              <TouchableOpacity onPress={() => takeAction({ type: 'TOSS_CALL', choice: 'head' })} className="flex-1 bg-yellow-400 py-4 rounded-2xl">
                <Text className="text-indigo-900 font-black text-xl text-center">HEADS</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => takeAction({ type: 'TOSS_CALL', choice: 'tail' })} className="flex-1 bg-yellow-400 py-4 rounded-2xl">
                <Text className="text-indigo-900 font-black text-xl text-center">TAILS</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text className="text-white/50 font-bold animate-pulse">Waiting for opponent...</Text>
          )}
        </View>
      </View>
    );
  }

  // TOSS THROW
  if (room.status === 'toss_throw') {
    const isCaller = playerId === room.current_batsman;
    return (
      <View className="space-y-6">
        <Scoreboard room={room} playerId={playerId} />
        <View className="bg-white/10 p-6 rounded-3xl items-center">
          <Text className="text-2xl font-black text-white uppercase text-center mb-2">Toss Time!</Text>
          <Text className="text-yellow-300 font-bold mb-6">
            {isCaller ? `You called ${room.toss_call?.toUpperCase()}` : `They called ${room.toss_call?.toUpperCase()}`}
          </Text>
          {myThrowInPlay ? (
            <Text className="text-white font-bold opacity-50">Waiting for opponent...</Text>
          ) : (
            <HandSelector maxFingers={5} disabled={loading} onSelect={(num) => takeAction({ type: 'THROW', fingers: num })} />
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

  // PLAYING
  if (room.status === 'playing') {
    const isBat = playerId === room.current_batsman;
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
            
            {myThrowInPlay ? (
              <View className="h-24 justify-center items-center">
                 <Text className="text-white font-bold opacity-50 animate-pulse text-lg">Waiting for opponent...</Text>
              </View>
            ) : (
              <HandSelector disabled={loading} onSelect={(num) => takeAction({ type: 'THROW', fingers: num })} />
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
}

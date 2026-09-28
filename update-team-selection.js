const fs = require('fs');
let code = fs.readFileSync('src/components/GameRoom.tsx', 'utf8');

const oldCheck = `    if (room.capacity === 2 && playerId !== room.current_batsman) {
       return (
         <View className="space-y-6 flex-1 items-center justify-center">
            <Text className="text-white text-3xl font-black uppercase text-center mb-4">Opponent's Turn</Text>
            <Text className="text-white/50 font-bold animate-pulse text-lg text-center">They won the toss and are picking their team...</Text>
         </View>
       );
    }`;

const newCheck = `    const currentlySelecting = room.stage === 'team_selection_winner' ? room.current_batsman : room.current_bowler;
    if (room.capacity === 2 && playerId !== currentlySelecting) {
       const selectName = currentlySelecting === room.player1_id ? room.p1_name : room.p2_name;
       return (
         <View className="space-y-6 flex-1 items-center justify-center">
            <Text className="text-white text-3xl font-black uppercase text-center mb-4">{selectName}'s Turn</Text>
            <Text className="text-white/50 font-bold animate-pulse text-lg text-center">{room.stage === 'team_selection_winner' ? 'They won the toss and are picking their team...' : 'They are picking their team...'}</Text>
         </View>
       );
    }`;

code = code.replace(oldCheck, newCheck);
fs.writeFileSync('src/components/GameRoom.tsx', code);

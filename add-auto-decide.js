const fs = require('fs');
let code = fs.readFileSync('src/components/GameRoom.tsx', 'utf8');

const autoDecideEffect = `
  React.useEffect(() => {
    if (room.status === 'toss_decision' && room.current_batsman === playerId) {
      const timer = setTimeout(() => {
         const decision = Math.random() > 0.5 ? 'bat' : 'bowl';
         if (onAction) onAction({ type: 'TOSS_DECISION', choice: decision });
         else api.takeAction(room.id, playerId, { type: 'TOSS_DECISION', choice: decision }).then(updatedRoom => {
             if (onUpdateRoom) onUpdateRoom(updatedRoom);
         });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [room.status, room.current_batsman, playerId, room.id, onAction, onUpdateRoom]);
`;

code = code.replace("  React.useEffect(() => {\n    if (room.status === 'toss_decision'", autoDecideEffect + "\n  React.useEffect(() => {\n    if (room.status === 'toss_decision'");
fs.writeFileSync('src/components/GameRoom.tsx', code);

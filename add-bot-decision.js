const fs = require('fs');
let code = fs.readFileSync('src/components/GameRoom.tsx', 'utf8');

const botDecisionEffect = `
  React.useEffect(() => {
    if (room.status === 'toss_decision' && room.current_batsman === '00000000-0000-0000-0000-000000000000') {
      const timer = setTimeout(() => {
         const decision = Math.random() > 0.5 ? 'bat' : 'bowl';
         if (onAction) onAction({ type: 'TOSS_DECISION', choice: decision });
         else api.takeAction(room.id, '00000000-0000-0000-0000-000000000000', { type: 'TOSS_DECISION', choice: decision }).then(updatedRoom => {
             if (onUpdateRoom) onUpdateRoom(updatedRoom);
         });
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [room.status, room.current_batsman, room.id, onAction, onUpdateRoom]);
`;

code = code.replace("  React.useEffect(() => {\n    if (room.status === 'playing' && myThrowInPlay === null) {", botDecisionEffect + "\n  React.useEffect(() => {\n    if (room.status === 'playing' && myThrowInPlay === null) {");

fs.writeFileSync('src/components/GameRoom.tsx', code);

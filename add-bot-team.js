const fs = require('fs');
let code = fs.readFileSync('src/components/GameRoom.tsx', 'utf8');

const botTeamSelectEffect = `
  React.useEffect(() => {
    if (room.status === 'team_selection') {
      const currentlySelecting = room.stage === 'team_selection_winner' ? room.current_batsman : room.current_bowler;
      if (currentlySelecting === '00000000-0000-0000-0000-000000000000') {
        const timer = setTimeout(() => {
          const team = 'Australia';
          const players = ['David Warner (C)', 'Steve Smith', 'Pat Cummins', 'Mitchell Starc', 'Glenn Maxwell', 'Travis Head', 'Mitchell Marsh', 'Adam Zampa', 'Josh Hazlewood', 'Josh Inglis', 'Marnus Labuschagne'].slice(0, (room.wickets_limit || 3) + 1);
          if (onAction) onAction({ type: 'SUBMIT_TEAM', team, players });
          else api.takeAction(room.id, '00000000-0000-0000-0000-000000000000', { type: 'SUBMIT_TEAM', team, players }).then(updatedRoom => {
             if (onUpdateRoom) onUpdateRoom(updatedRoom);
          });
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [room.status, room.stage, room.current_batsman, room.current_bowler, room.id, room.wickets_limit, onAction, onUpdateRoom]);
`;

code = code.replace("  React.useEffect(() => {\n    if (room.status === 'toss_decision'", botTeamSelectEffect + "\n  React.useEffect(() => {\n    if (room.status === 'toss_decision'");
fs.writeFileSync('src/components/GameRoom.tsx', code);

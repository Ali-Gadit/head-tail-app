import { processAction } from './src/lib/gameLogic';

const room = {
  capacity: 2,
  status: 'toss_call',
  stage: 'team_toss',
  player1_id: 'p1',
  player2_id: 'p2',
  current_batsman: 'p1',
  current_bowler: 'p2',
  p1_throw: null,
  p2_throw: null
};

try {
  const result = processAction(room as any, 'p1', { type: 'TOSS_CALL', choice: 'head' });
  console.log('Result:', result);
} catch(e) {
  console.error('Error:', e);
}

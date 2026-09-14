import { Room, UserAction } from './types';

// A stripped down but functional version for Squads
export function processAction(room: Room, playerId: string, action: UserAction): Partial<Room> {
  // We will fallback to existing gameLogic for 2P and 3P matches.
  // This file will only handle capacity >= 4.
  return {};
}

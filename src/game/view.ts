import { SCALE, SECTOR_SIZE, type GameState, type Ship } from './types';

export function playerShip(state: GameState): Ship {
  return state.ships.find((ship) => ship.id === state.playerShipId)!;
}

export function formatTime(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const rest = whole % 60;
  return hours
    ? `${hours}h ${minutes}m`
    : `${minutes}:${String(rest).padStart(2, '0')}`;
}

export function sectorOf(position: number): number {
  return Math.floor(position / SCALE / SECTOR_SIZE);
}

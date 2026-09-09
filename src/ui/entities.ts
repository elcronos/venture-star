import { wrappedDelta } from '../game/math';
import {
  SCALE,
  SECTOR_SIZE,
  type Discovery,
  type GameState,
  type Planet,
  type ResourceNode,
  type Ship,
} from '../game/types';
import type { MeterState, Relation } from './types';

export function meter(
  current: number,
  max: number,
  label: string,
  critical = false,
) {
  return {
    current: Math.max(0, Math.round(current * 10) / 10),
    max,
    label,
    ...(critical ? { critical: true } : {}),
  };
}

export function relation(owner: string | null) {
  return owner === 'player'
    ? ('player' as const)
    : owner
      ? ('hostile' as const)
      : ('neutral' as const);
}

export function findEntityInState(state: GameState, id: string) {
  return (
    state.planets.find((item) => item.id === id) ??
    state.nodes.find((item) => item.id === id) ??
    state.discoveries.find((item) => item.id === id) ??
    state.ships.find((item) => item.id === id) ??
    null
  );
}

export function bearing(
  from: { x: number; y: number },
  to: { x: number; y: number },
  state: GameState,
): string {
  const angle =
    (Math.atan2(
      wrappedDelta(from.y, to.y, state.height * SECTOR_SIZE * SCALE),
      wrappedDelta(from.x, to.x, state.width * SECTOR_SIZE * SCALE),
    ) *
      180) /
    Math.PI;
  return `${Math.round((angle + 360) % 360)}°`;
}

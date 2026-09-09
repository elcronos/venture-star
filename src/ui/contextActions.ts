import {
  blocked,
  bombBlockedReason,
  dockBlockedReason,
  miningBlockedReason,
} from '../game/interactions';
import { wrappedDistance } from '../game/math';
import { SCALE, type GameState, type Ship } from '../game/types';
import { findEntityInState } from './entities';
import type { ContextAction } from './types';

export function actionsFor(
  state: GameState,
  ship: Ship,
  entity: ReturnType<typeof findEntityInState>,
): ContextAction[] {
  if (!entity) return [];
  const distance =
    wrappedDistance(ship.position, entity.position, state.width, state.height) /
    SCALE;
  // Moving is a tap on the map, not a button, so no travel action appears here.
  // The contacts list keeps a per-contact "Fly here" as the keyboard route.
  if ('material' in entity)
    return [
      {
        id: ship.miningNodeId === entity.id ? 'stop-mining' : 'mine',
        label: ship.miningNodeId === entity.id ? 'Stop mining' : 'Mine',
        icon: 'mining' as const,
        ...(ship.miningNodeId === entity.id
          ? {}
          : blocked(miningBlockedReason(ship, entity, distance))),
      },
    ];
  if ('market' in entity) {
    const result: ContextAction[] = [
      {
        id: 'dock',
        label: 'Dock',
        icon: 'planet',
        ...blocked(dockBlockedReason(state, ship, entity, distance)),
      },
    ];
    if (entity.owner !== 'player')
      result.push({
        id: 'bomb',
        label: 'Bomb',
        icon: 'bomb' as const,
        destructive: true,
        ...blocked(bombBlockedReason(state, ship, distance)),
      });
    return result;
  }
  if ('faction' in entity)
    return [
      {
        id: 'bomb',
        label: 'Bomb',
        icon: 'bomb' as const,
        destructive: true,
        ...blocked(bombBlockedReason(state, ship, distance)),
      },
      {
        id: ship.holdFire ? 'autofire' : 'hold-fire',
        label: ship.holdFire ? 'Auto fire' : 'Hold fire',
        icon: 'weapon' as const,
      },
    ];
  return [];
}

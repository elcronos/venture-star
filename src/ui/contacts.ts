import { SCALE, type GameState, type Ship } from '../game/types';
import { wrappedDistance } from '../game/math';
import type { UiState } from './types';
import { bearing, findEntityInState, meter, relation } from './entities';
import { tradeSummary } from './tradeSummary';
import { actionsFor } from './contextActions';

export function targetState(
  state: GameState,
  ship: Ship,
  entity: NonNullable<ReturnType<typeof findEntityInState>>,
): NonNullable<UiState['flight']['target']> {
  const distance =
    wrappedDistance(ship.position, entity.position, state.width, state.height) /
    SCALE;
  const name =
    'name' in entity
      ? entity.name
      : 'material' in entity
        ? `${entity.material} deposit`
        : 'kind' in entity
          ? entity.kind.replaceAll('-', ' ')
          : entity.faction;
  return {
    id: entity.id,
    name,
    type:
      'market' in entity
        ? 'Planet'
        : 'material' in entity
          ? 'Resource'
          : 'kind' in entity
            ? 'Discovery'
            : 'Ship',
    relation:
      'owner' in entity
        ? relation(entity.owner)
        : 'faction' in entity
          ? relation(entity.faction)
          : 'neutral',
    distance: Math.round(distance),
    intel: 'LIVE',
    rangeState: distance <= 96 ? 'Interaction range' : 'Approach required',
    ...('shield' in entity
      ? {
          shield: meter(
            entity.shield,
            'stats' in entity ? entity.stats.maxShield : 50,
            'Shield',
          ),
        }
      : {}),
    ...('armour' in entity
      ? {
          armour: meter(entity.armour, 60, 'Armour'),
          hull: meter(entity.hull, 120, 'Hull'),
        }
      : {}),
    ...('market' in entity ? { trade: tradeSummary(ship, entity) } : {}),
    ...('market' in entity && (entity.defence?.hull ?? 0) > 0
      ? { defence: meter(entity.defence!.hull, 100, 'Orbital battery') }
      : {}),
    ...('material' in entity
      ? {
          deposit: meter(
            entity.remaining,
            entity.capacity ?? entity.remaining,
            `${entity.material} remaining`,
            entity.remaining === 0,
          ),
        }
      : {}),
    // Actions are rendered once, in the context bar; repeating them on the
    // target card gave every planet two identical Dock/Autopilot/Bomb rows.
    actions: [],
  };
}

export function nearbyContacts(
  state: GameState,
  ship: Ship,
  selectedId: string | null,
): UiState['flight']['contacts'] {
  const entities = [
    ...state.planets,
    ...state.nodes.filter((node) => node.remaining > 0),
    ...state.discoveries.filter((item) => !item.claimed),
    ...state.ships.filter((item) => item.id !== ship.id && !item.destroyed),
  ];
  return entities
    .map((entity) => ({
      entity,
      distance:
        wrappedDistance(
          ship.position,
          entity.position,
          state.width,
          state.height,
        ) / SCALE,
    }))
    .filter(({ distance }) => distance <= ship.stats.sensorRange * 1.6)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 12)
    .map(({ entity, distance }) => ({
      id: entity.id,
      name:
        'name' in entity
          ? entity.name
          : 'material' in entity
            ? `${entity.material} deposit`
            : 'kind' in entity
              ? entity.kind.replaceAll('-', ' ')
              : entity.faction,
      type:
        'market' in entity
          ? 'Planet'
          : 'material' in entity
            ? 'Resource'
            : 'kind' in entity
              ? 'Discovery'
              : 'Ship',
      relation:
        'owner' in entity
          ? relation(entity.owner)
          : 'faction' in entity
            ? relation(entity.faction)
            : 'neutral',
      direction: bearing(ship.position, entity.position, state),
      distance: Math.round(distance),
      selected: entity.id === selectedId,
      threat: 'faction' in entity && entity.faction !== 'player',
      interactable: distance <= 96,
    }));
}

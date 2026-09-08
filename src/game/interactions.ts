import { cargoUsed } from './math';
import {
  BOMB_RANGE_MILLI,
  DOCK_SPEED_MILLI,
  INTERACTION_RANGE_MILLI,
  MINING_SPEED_MILLI,
  MINING_THROTTLE_MAX_BP,
} from './simulation';
import {
  SCALE,
  TICKS_PER_SECOND,
  type GameState,
  type Planet,
  type ResourceNode,
  type Ship,
} from './types';

export const INTERACTION_RANGE_WU = INTERACTION_RANGE_MILLI / SCALE;
export const BOMB_RANGE_WU = BOMB_RANGE_MILLI / SCALE;

/**
 * Why the simulation would currently refuse an interaction, phrased for the
 * player. These mirror the guards in `simulation.ts` one for one: an action the
 * UI offers must succeed, and one it blocks must say what to change.
 */
function outOfRange(distanceWu: number): string | undefined {
  return distanceWu > INTERACTION_RANGE_WU
    ? `Move within ${INTERACTION_RANGE_WU} wu`
    : undefined;
}

export function miningBlockedReason(
  ship: Ship,
  node: ResourceNode,
  distanceWu: number,
): string | undefined {
  const speed = Math.hypot(ship.velocity.x, ship.velocity.y);
  return (
    outOfRange(distanceWu) ??
    (node.remaining <= 0
      ? 'Node is exhausted'
      : ship.emergency
        ? 'Emergency drift — mining offline'
        : speed > MINING_SPEED_MILLI
          ? `Slow below ${MINING_SPEED_MILLI / SCALE} wu/s to acquire a mining lock`
          : ship.throttleBasisPoints > MINING_THROTTLE_MAX_BP
            ? `Reduce throttle below ${MINING_THROTTLE_MAX_BP / 100}% to acquire a mining lock`
            : cargoUsed(ship.cargo) >= ship.stats.cargoCapacity
              ? 'Cargo hold is full'
              : undefined)
  );
}

export function dockBlockedReason(
  state: GameState,
  ship: Ship,
  planet: Planet,
  distanceWu: number,
): string | undefined {
  const speed = Math.hypot(ship.velocity.x, ship.velocity.y);
  return (
    outOfRange(distanceWu) ??
    (planet.owner !== 'player' && planet.owner !== null
      ? 'Rival-held: take the planet before docking'
      : speed > DOCK_SPEED_MILLI
        ? `Slow below ${DOCK_SPEED_MILLI / SCALE} wu/s to dock`
        : state.tick < planet.serviceLockUntilTick
          ? 'Services are locked after a recent action'
          : undefined)
  );
}

export function bombBlockedReason(
  state: GameState,
  ship: Ship,
  distanceWu: number,
): string | undefined {
  if (ship.bombs <= 0) return 'No bombs in the magazine';
  if (ship.emergency) return 'Emergency drift — weapons offline';
  if (ship.dockedPlanetId) return 'Undock before arming a bomb';
  if (state.tick < ship.bombReadyTick)
    return `Bomb bay reloading (${Math.ceil((ship.bombReadyTick - state.tick) / TICKS_PER_SECOND)}s)`;
  if (distanceWu > BOMB_RANGE_WU) return `Move within ${BOMB_RANGE_WU} wu`;
  return undefined;
}

/** Spreads a blocking reason into a `ContextAction`-shaped object, or nothing. */
export function blocked(reason: string | undefined): { disabledReason?: string } {
  return reason ? { disabledReason: reason } : {};
}

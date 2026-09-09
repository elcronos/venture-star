import { baseStats } from './generation';
import {
  clamp,
  wrap,
  wrappedDelta,
  wrappedDistance,
  wrappedDistanceSquared,
} from './math';
import {
  SCALE,
  SECTOR_SIZE,
  type FactionId,
  type GameState,
  type Planet,
  type Ship,
  type UpgradeFamily,
} from './types';

export function dockedAt(
  state: GameState,
  ship: Ship,
  planetId: string,
): Planet | null {
  return ship.dockedPlanetId === planetId
    ? (state.planets.find((planet) => planet.id === planetId) ?? null)
    : null;
}

export function nearestPlanet(
  state: GameState,
  ship: Ship,
  predicate: (planet: Planet) => boolean,
): Planet | null {
  return (
    state.planets
      .filter(predicate)
      .sort(
        (a, b) =>
          wrappedDistanceSquared(
            ship.position,
            a.position,
            state.width,
            state.height,
          ) -
            wrappedDistanceSquared(
              ship.position,
              b.position,
              state.width,
              state.height,
            ) || a.id.localeCompare(b.id),
      )[0] ?? null
  );
}

export function steerToward(
  ship: Ship,
  target: { x: number; y: number },
  width: number,
  height: number,
): void {
  ship.aiDestination = { ...target };
  const worldW = width * SECTOR_SIZE * SCALE;
  const worldH = height * SECTOR_SIZE * SCALE;
  const dx = wrappedDelta(ship.position.x, target.x, worldW);
  const dy = wrappedDelta(ship.position.y, target.y, worldH);
  ship.heading = wrap(
    Math.round((Math.atan2(dy, dx) / (Math.PI * 2)) * 65_536),
    65_536,
  );
  const distance =
    wrappedDistance(ship.position, target, width, height) / SCALE;
  const speed = Math.hypot(ship.velocity.x, ship.velocity.y) / SCALE;
  const approachSpeed = Math.min(
    180,
    Math.sqrt(300 * Math.max(0, distance - 72)),
  );
  ship.throttleBasisPoints =
    speed > approachSpeed ? -10000 : distance > 84 ? 7000 : 0;
}

export function canFly(ship: Ship): boolean {
  return !ship.destroyed && !ship.dockedPlanetId;
}

export function isHostile(
  state: GameState,
  a: FactionId,
  b: FactionId,
): boolean {
  if (a === b) return false;
  if (a === 'player')
    return (
      state.factions.find((f) => f.id === b)?.relationToPlayer === 'hostile'
    );
  if (b === 'player')
    return (
      state.factions.find((f) => f.id === a)?.relationToPlayer === 'hostile'
    );
  return true;
}

export function declareHostile(
  state: GameState,
  a: FactionId,
  b: FactionId,
): void {
  const rival = state.factions.find((f) => f.id === (a === 'player' ? b : a));
  if (rival) rival.relationToPlayer = 'hostile';
}

export function recalculateStats(ship: Ship): void {
  const stats = baseStats();
  const tier = (family: UpgradeFamily) => ship.upgrades[family] ?? 0;
  if (tier('drill') === 1) stats.miningMilliPerSecond = 5200;
  if (tier('drill') === 2) stats.miningMilliPerSecond = 6800;
  if (tier('hold') === 1) stats.cargoCapacity = 36;
  if (tier('hold') === 2) stats.cargoCapacity = 52;
  if (tier('cell') === 1) stats.fuelCapacity = 112;
  if (tier('cell') === 2) stats.fuelCapacity = 150;
  if (tier('surveyor') === 1) stats.sensorRange = 430;
  if (tier('surveyor') === 2) stats.sensorRange = 560;
  if (tier('aegis') === 1) {
    stats.maxShield = 78;
    stats.shieldRegenMilliPerSecond = 7500;
  }
  if (tier('aegis') === 2) {
    stats.maxShield = 112;
    stats.shieldRegenMilliPerSecond = 9000;
  }
  if (tier('director') === 1) stats.weaponDamage = 15;
  if (tier('director') === 2) {
    stats.weaponDamage = 19;
    stats.weaponCooldownTicks = 14;
  }
  ship.stats = stats;
  ship.shield = Math.min(ship.shield, stats.maxShield);
  ship.fuelHundredths = Math.min(ship.fuelHundredths, stats.fuelCapacity * 100);
}

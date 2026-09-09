import { cargoUsed, frontierTier } from '../game/math';
import {
  SCALE,
  SECTOR_SIZE,
  TICKS_PER_SECOND,
  type GameState,
  type Ship,
} from '../game/types';
import { formatTime, playerShip } from '../game/view';
import type { CampaignRecord, DangerBand } from './types';

export function objectiveFor(state: GameState): string {
  const ship = playerShip(state);
  if (!state.launched) return 'Launch from Hearthlight';
  if (!Object.values(ship.upgrades).some((tier) => tier > 0)) {
    if (ship.dockedPlanetId && ship.cargo.ore >= 4 && ship.credits >= 320)
      return 'Shipyard: fit Deepglass Drill · 4.0 → 5.2 ore/s';
    if (ship.dockedPlanetId && ship.cargo.ore > 4)
      return 'Sell ore in Market · keep 4 ore for your first drill';
    if (
      ship.cargo.ore >= 16 ||
      cargoUsed(ship.cargo) >= ship.stats.cargoCapacity
    )
      return 'Return to Hearthlight · sell ore, keeping 4 for your drill';
    if (ship.miningNodeId)
      return `Hold position · gather 16 ore (${ship.cargo.ore}/16), then return home`;
    return 'Select the nearby ore deposit · Autopilot, then Mine';
  }
  if (state.stats.discoveries === 0)
    return 'Explore a new sector and investigate a signal';
  if (state.planets.filter((planet) => planet.owner === 'player').length === 1)
    return 'Build influence or conquer a neutral planet';
  return 'Control every planet in the galaxy';
}

export function recordFromState(
  state: GameState,
  startedAt: number,
): CampaignRecord {
  return {
    id: state.campaignId,
    title: 'Venture Star',
    outcome: state.outcome === 'victory' ? 'Victory' : 'Defeat',
    seed: state.seed,
    startedAt: new Date(startedAt).toISOString(),
    endedAt: new Date().toISOString(),
    simulationDuration: formatTime(state.tick / TICKS_PER_SECOND),
    engagedDuration: formatTime(state.tick / TICKS_PER_SECOND),
    wallSpan: formatTime((Date.now() - startedAt) / 1000),
    dimensions: `${state.width}×${state.height}`,
    difficulty: state.difficulty,
    planetsControlled: `${state.planets.filter((planet) => planet.owner === 'player').length}/${state.planets.length}`,
    discoveries: state.stats.discoveries,
    rulesVersion: state.rulesVersion,
    finalMap: state.planets.map((planet) => ({
      name: planet.name,
      owner: planet.owner ?? 'neutral',
      x: planet.sectorX,
      y: planet.sectorY,
    })),
    finalTimeline: state.events.slice(-40).map((event) => ({
      time: formatTime(event.tick / TICKS_PER_SECOND),
      summary: event.summary,
    })),
    statistics: {
      fuelUsed: Math.round(state.stats.fuelConsumedHundredths / 100),
      distance: Math.round(state.stats.distanceMilli / SCALE),
      tradeProfit: state.stats.tradeProfit,
      shipsDestroyed: state.stats.shipsDestroyed,
    },
  };
}

export function dangerAt(state: GameState, x: number, y: number): DangerBand {
  const home = state.planets.find((planet) => planet.acquisition === 'home')!;
  const dx = Math.min(
    Math.abs(x - home.sectorX),
    state.width - Math.abs(x - home.sectorX),
  );
  const dy = Math.min(
    Math.abs(y - home.sectorY),
    state.height - Math.abs(y - home.sectorY),
  );
  const ratio =
    Math.hypot(dx, dy) /
    Math.hypot(Math.floor(state.width / 2), Math.floor(state.height / 2));
  return (['Haven', 'Near Reach', 'Far Reach', 'Verge', 'Antipode'] as const)[
    Math.min(4, Math.floor(ratio * 5))
  ]!;
}

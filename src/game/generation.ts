import {
  frontierTier,
  sectorCenter,
  wrap,
  wrappedDistanceSquared,
} from './math';
import { canonicalSeed, RandomStream, sha256 } from './prng';
import {
  SCALE,
  SECTOR_SIZE,
  type CampaignOptions,
  type Difficulty,
  type Discovery,
  type Faction,
  type FactionId,
  type GameState,
  type Hazard,
  type Material,
  type Planet,
  type ResourceNode,
  type Ship,
  type ShipStats,
  type Vec2,
} from './types';

/** Chance a sector away from home carries at least one deposit, in basis points. */
const SECTOR_HAS_NODES_BP = 6_500;

const MATERIALS: Material[] = ['ore', 'metal', 'crystal', 'exotic'];
const BASE_PRICES: Record<Material, number> = {
  ore: 10,
  metal: 18,
  crystal: 26,
  exotic: 65,
};
const EMPTY_CARGO = (): Record<Material, number> => ({
  ore: 0,
  metal: 0,
  crystal: 0,
  exotic: 0,
});

export interface OpeningValidationReport {
  valid: boolean;
  homePlanetId: string;
  openingNodeId: string | null;
  discoveryId: string | null;
  reachablePlanets: number;
  reasons: string[];
}

export function createGame(options: CampaignOptions): GameState {
  const seed = canonicalSeed(options.seed);
  const width = options.width ?? 10;
  const height = options.height ?? 10;
  const rivals =
    options.rivals ??
    Math.max(1, Math.min(3, Math.round((width * height) / 100)));
  const difficulty = options.difficulty ?? 'Captain';
  validateOptions(width, height, rivals, difficulty);
  const topology = new RandomStream(seed, 'topology');
  const homeX = topology.int(0, width - 1);
  const homeY = topology.int(0, height - 1);
  const occupied = new Set([`${homeX},${homeY}`]);
  const planetCount = Math.max(
    8,
    Math.min(90, Math.round(width * height * 0.1)),
  );
  const planetSectors: Array<[number, number]> = [[homeX, homeY]];
  for (let rival = 0; rival < rivals; rival++) {
    const x = wrap(homeX + Math.floor(width / 2) + rival, width);
    const y = wrap(homeY + Math.floor(height / 2) + rival * 2, height);
    let key = `${x},${y}`;
    let adjustedX = x;
    while (occupied.has(key)) {
      adjustedX = wrap(adjustedX + 1, width);
      key = `${adjustedX},${y}`;
    }
    occupied.add(key);
    planetSectors.push([adjustedX, y]);
  }
  while (planetSectors.length < planetCount) {
    const x = topology.int(0, width - 1);
    const y = topology.int(0, height - 1);
    const key = `${x},${y}`;
    if (!occupied.has(key)) {
      occupied.add(key);
      planetSectors.push([x, y]);
    }
  }
  planetSectors
    .splice(1 + rivals, planetSectors.length)
    .sort((a, b) => a[1] - b[1] || a[0] - b[0])
    .forEach((sector) => planetSectors.push(sector));
  const planets = planetSectors.map(([x, y], index) =>
    makePlanet(seed, x, y, index, homeX, homeY, width, height, rivals),
  );
  const home = planets[0]!;
  const nodes = generateNodes(seed, width, height, homeX, homeY, home.position);
  const discoveries = generateDiscoveries(seed, width, height, homeX, homeY);
  const hazards = generateHazards(seed, width, height, homeX, homeY);
  const playerPosition = {
    x: home.position.x + 112 * SCALE,
    y: home.position.y,
  };
  const ships: Ship[] = [
    makeShip('ship-player', 'player', playerPosition, true),
  ];
  const factions: Faction[] = [];
  for (let index = 0; index < rivals; index++) {
    const id = `rival-${index + 1}` as FactionId;
    const origin = planets[index + 1]!;
    const ship = makeShip(
      `ship-${id}`,
      id,
      { x: origin.position.x + 112 * SCALE, y: origin.position.y },
      false,
    );
    ships.push(ship);
    factions.push({
      id,
      credits: 600,
      stock: { ore: 30, metal: 24, crystal: 14, exotic: 0 },
      shipId: ship.id,
      relationToPlayer: 'peace',
      nextPlanTick: planInterval(difficulty),
      collapseTicks: 0,
      reconstruction: null,
    });
  }
  const campaignId =
    options.campaignId ?? campaignIdFor(seed, width, height, rivals);
  const state: GameState = {
    schemaVersion: 1,
    rulesVersion: '1.0.0',
    generatorVersion: 2,
    campaignId,
    seed,
    width,
    height,
    difficulty,
    tick: 0,
    running: false,
    launched: false,
    outcome: 'active',
    sealedAtTick: null,
    playerShipId: 'ship-player',
    planets,
    nodes,
    discoveries,
    hazards,
    ships,
    factions,
    bombs: [],
    events: [],
    commandSequence: 0,
    stats: {
      fuelConsumedHundredths: 0,
      distanceMilli: 0,
      tradeProfit: 0,
      discoveries: 0,
      shipsDestroyed: 0,
    },
  };
  const report = validateOpening(state);
  if (!report.valid)
    throw new Error(`Generated opening invalid: ${report.reasons.join(', ')}`);
  return state;
}

function validateOptions(
  width: number,
  height: number,
  rivals: number,
  difficulty: Difficulty,
): void {
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width < 10 ||
    width > 30 ||
    height < 10 ||
    height > 30
  ) {
    throw new Error('Galaxy dimensions must be integers from 10 through 30');
  }
  if (!Number.isInteger(rivals) || rivals < 1 || rivals > 3)
    throw new Error('Rival count must be 1 through 3');
  if (!['Explorer', 'Captain', 'Strategist'].includes(difficulty))
    throw new Error('Unknown difficulty');
}

function makePlanet(
  seed: string,
  x: number,
  y: number,
  index: number,
  ox: number,
  oy: number,
  width: number,
  height: number,
  rivals: number,
): Planet {
  const rng = new RandomStream(seed, 'planets', `${x},${y}`);
  const tier = frontierTier(x, y, ox, oy, width, height);
  const specialized = index > rivals && rng.chance(2500);
  const resistance = 100 + 15 * tier + (specialized ? 10 : 0);
  const owner =
    index === 0
      ? 'player'
      : index <= rivals
        ? (`rival-${index}` as FactionId)
        : null;
  const modifier = rng.int(85, 115);
  const position = localPosition(x, y, rng);
  return {
    id: `planet-${String(index).padStart(3, '0')}`,
    name: index === 0 ? 'Hearthlight' : `Venture ${index}`,
    sectorX: x,
    sectorY: y,
    position,
    owner,
    acquisition: index === 0 ? 'home' : null,
    tier,
    specialized,
    resistance,
    influence: {},
    resolve: resistance,
    shield: owner === null ? 0 : 50,
    hasShipyard: index <= rivals,
    serviceLockUntilTick: 0,
    outputBasisPoints: 10_000,
    market: {
      stock: {
        ore: index === 0 ? 120 : rng.int(20, 80),
        metal: rng.int(12, 50),
        crystal: rng.int(8, 30),
        exotic: 0,
      },
      prices: Object.fromEntries(
        MATERIALS.map((material) => [
          material,
          Math.max(1, Math.round((BASE_PRICES[material] * modifier) / 100)),
        ]),
      ) as Record<Material, number>,
      fuel: index === 0 ? 320 : rng.int(80, 200),
    },
  };
}

function generateNodes(
  seed: string,
  width: number,
  height: number,
  homeX: number,
  homeY: number,
  homePosition: Vec2,
): ResourceNode[] {
  const nodes: ResourceNode[] = [];
  // The guaranteed node is close enough for the opening mine/sell loop.
  const shipX = homePosition.x + 112 * SCALE;
  const localShipX = shipX / SCALE - homeX * SECTOR_SIZE;
  const direction = localShipX <= SECTOR_SIZE / 2 ? 1 : -1;
  nodes.push({
    id: 'node-000',
    sectorX: homeX,
    sectorY: homeY,
    position: { x: shipX + direction * 240 * SCALE, y: homePosition.y },
    material: 'ore',
    remaining: 40,
    capacity: 40,
    miningProgressMilli: 0,
  });
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      if (x === homeX && y === homeY) continue;
      const rng = new RandomStream(seed, 'nodes', `${x},${y}`);
      // Mining is the core loop, so most sectors carry something to mine and
      // the deep frontier carries more of it.
      if (!rng.chance(SECTOR_HAS_NODES_BP)) continue;
      const tier = frontierTier(x, y, homeX, homeY, width, height);
      const count =
        1 +
        (tier >= 2 && rng.chance(4_000) ? 1 : 0) +
        (tier >= 3 && rng.chance(2_500) ? 1 : 0);
      for (let index = 0; index < count; index++) {
        const material: Material =
          rng.int(0, 9) < 6 ? 'ore' : rng.int(0, 1) ? 'metal' : 'crystal';
        const ranges: Record<Material, [number, number]> = {
          ore: [20, 60],
          metal: [12, 40],
          crystal: [8, 24],
          exotic: [2, 8],
        };
        const multipliers = [0.85, 1, 1.25, 1.6, 2.1];
        const [min, max] = ranges[material];
        const yielded = Math.floor(rng.int(min, max) * multipliers[tier]!);
        nodes.push({
          id: '',
          sectorX: x,
          sectorY: y,
          position: localPosition(x, y, rng),
          material,
          remaining: yielded,
          capacity: yielded,
          miningProgressMilli: 0,
        });
      }
    }
  nodes.sort(entityOrder).forEach((node, index) => {
    node.id = `node-${String(index).padStart(3, '0')}`;
  });
  return nodes;
}

function generateDiscoveries(
  seed: string,
  width: number,
  height: number,
  homeX: number,
  homeY: number,
): Discovery[] {
  const firstX = wrap(homeX + 1, width);
  const first: Discovery = {
    id: '',
    sectorX: firstX,
    sectorY: homeY,
    position: sectorCenter(firstX, homeY),
    kind: 'treasure-asteroid',
    claimed: false,
    credits: 40,
    cargo: { ore: 8 },
  };
  const discoveries = [first];
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      if (x === firstX && y === homeY) continue;
      const rng = new RandomStream(seed, 'discoveries', `${x},${y}`);
      if (rng.chance(800))
        discoveries.push({
          id: '',
          sectorX: x,
          sectorY: y,
          position: localPosition(x, y, rng),
          kind: rng.chance(5000) ? 'abandoned-cargo' : 'treasure-asteroid',
          claimed: false,
          credits: rng.int(20, 60),
          cargo: { ore: rng.int(4, 12) },
        });
    }
  discoveries.sort(entityOrder).forEach((item, index) => {
    item.id = `discovery-${String(index).padStart(3, '0')}`;
  });
  return discoveries;
}

function generateHazards(
  seed: string,
  width: number,
  height: number,
  homeX: number,
  homeY: number,
): Hazard[] {
  const hazards: Hazard[] = [];
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      if (Math.abs(x - homeX) <= 1 && Math.abs(y - homeY) <= 1) continue;
      const rng = new RandomStream(seed, 'hazards', `${x},${y}`);
      if (rng.chance(1000))
        hazards.push({
          id: '',
          sectorX: x,
          sectorY: y,
          position: localPosition(x, y, rng),
          radius: rng.int(90, 180),
          severity: rng.chance(2500) ? 'severe' : 'moderate',
        });
    }
  hazards.sort(entityOrder).forEach((item, index) => {
    item.id = `hazard-${String(index).padStart(3, '0')}`;
  });
  return hazards;
}

function makeShip(
  id: string,
  faction: FactionId,
  position: Vec2,
  player: boolean,
): Ship {
  return {
    id,
    faction,
    position,
    velocity: { x: 0, y: 0 },
    heading: 0,
    throttleBasisPoints: 0,
    fuelHundredths: player ? 8000 : 8000,
    cargo: EMPTY_CARGO(),
    credits: player ? 240 : 0,
    hull: 120,
    armour: 60,
    shield: 50,
    lastDamageTick: -1000,
    weaponReadyTick: 0,
    bombReadyTick: 0,
    bombs: player ? 1 : 0,
    selectedTargetId: null,
    holdFire: false,
    dockedPlanetId: player ? 'planet-000' : null,
    miningNodeId: null,
    miningStartedTick: 0,
    miningReadyTick: 0,
    emergency: false,
    destroyed: false,
    upgrades: {},
    stats: baseStats(),
  };
}

export function baseStats(): ShipStats {
  return {
    cargoCapacity: 24,
    fuelCapacity: 80,
    sensorRange: 320,
    maxShield: 50,
    shieldRegenMilliPerSecond: 6000,
    weaponDamage: 12,
    weaponCooldownTicks: 16,
    miningMilliPerSecond: 4000,
  };
}

function localPosition(x: number, y: number, rng: RandomStream): Vec2 {
  return {
    x: (x * SECTOR_SIZE + rng.int(160, 864)) * SCALE,
    y: (y * SECTOR_SIZE + rng.int(160, 864)) * SCALE,
  };
}

function entityOrder(
  a: { sectorX: number; sectorY: number },
  b: { sectorX: number; sectorY: number },
): number {
  return a.sectorY - b.sectorY || a.sectorX - b.sectorX;
}

function campaignIdFor(
  seed: string,
  width: number,
  height: number,
  rivals: number,
): string {
  return [...sha256(`${seed}|${width}|${height}|${rivals}`)]
    .slice(0, 4)
    .map((word) => word.toString(16).padStart(8, '0'))
    .join('');
}

function planInterval(difficulty: Difficulty): number {
  return difficulty === 'Explorer'
    ? 120
    : difficulty === 'Strategist'
      ? 50
      : 80;
}

export function validateOpening(state: GameState): OpeningValidationReport {
  const home = state.planets.find(
    (planet) => planet.owner === 'player' && planet.acquisition === 'home',
  )!;
  const player = state.ships.find((ship) => ship.id === state.playerShipId)!;
  const openingNode = state.nodes
    .filter((node) => node.material === 'ore' && node.remaining >= 16)
    .sort(
      (a, b) =>
        wrappedDistanceSquared(
          player.position,
          a.position,
          state.width,
          state.height,
        ) -
          wrappedDistanceSquared(
            player.position,
            b.position,
            state.width,
            state.height,
          ) || a.id.localeCompare(b.id),
    )[0];
  const discovery = state.discoveries.find((item) => {
    const dx = Math.min(
      Math.abs(item.sectorX - home.sectorX),
      state.width - Math.abs(item.sectorX - home.sectorX),
    );
    const dy = Math.min(
      Math.abs(item.sectorY - home.sectorY),
      state.height - Math.abs(item.sectorY - home.sectorY),
    );
    return dx + dy <= 2;
  });
  const reasons: string[] = [];
  if (!home.hasShipyard || home.market.fuel < 320)
    reasons.push('home-services');
  if (!openingNode) reasons.push('opening-node');
  else {
    const distance =
      Math.sqrt(
        wrappedDistanceSquared(
          openingNode.position,
          player.position,
          state.width,
          state.height,
        ),
      ) / SCALE;
    if (distance < 180 || distance > 270) reasons.push('opening-node-approach');
  }
  if (!discovery) reasons.push('opening-discovery');
  const reachablePlanets = state.planets.length; // The unobstructed toroidal grid is fully connected.
  if (reachablePlanets < 2) reasons.push('planet-connectivity');
  return {
    valid: reasons.length === 0,
    homePlanetId: home.id,
    openingNodeId: openingNode?.id ?? null,
    discoveryId: discovery?.id ?? null,
    reachablePlanets,
    reasons,
  };
}

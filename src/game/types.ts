export const TICKS_PER_SECOND = 20;
export const TICK_MS = 50;
export const SECTOR_SIZE = 1024;
export const SCALE = 1000;

export type Difficulty = 'Explorer' | 'Captain' | 'Strategist';
export type Material = 'ore' | 'metal' | 'crystal' | 'exotic';
export type FactionId = 'player' | `rival-${number}`;
export type Outcome = 'active' | 'victory' | 'defeat';
export type AcquisitionMethod = 'home' | 'peaceful' | 'force' | 'capitulation';
export type UpgradeFamily =
  'drill' | 'hold' | 'cell' | 'surveyor' | 'aegis' | 'director';

export interface Vec2 {
  /** Authoritative milli-world-units. */
  x: number;
  /** Authoritative milli-world-units. */
  y: number;
}

export interface CampaignOptions {
  seed: string;
  width?: number;
  height?: number;
  rivals?: number;
  difficulty?: Difficulty;
  campaignId?: string;
}

export interface Market {
  stock: Record<Material, number>;
  prices: Record<Material, number>;
  fuel: number;
}

export interface Planet {
  id: string;
  name: string;
  sectorX: number;
  sectorY: number;
  position: Vec2;
  owner: FactionId | null;
  acquisition: AcquisitionMethod | null;
  tier: number;
  specialized: boolean;
  resistance: number;
  influence: Record<string, number>;
  resolve: number;
  shield: number;
  hasShipyard: boolean;
  serviceLockUntilTick: number;
  outputBasisPoints: number;
  market: Market;
}

export interface ResourceNode {
  id: string;
  sectorX: number;
  sectorY: number;
  position: Vec2;
  material: Material;
  remaining: number;
  /** Yield the deposit held when generated. Absent in pre-capacity saves. */
  capacity?: number;
  miningProgressMilli: number;
}

export interface Discovery {
  id: string;
  sectorX: number;
  sectorY: number;
  position: Vec2;
  kind: 'abandoned-cargo' | 'treasure-asteroid';
  claimed: boolean;
  credits: number;
  cargo: Partial<Record<Material, number>>;
}

export interface Hazard {
  id: string;
  sectorX: number;
  sectorY: number;
  position: Vec2;
  radius: number;
  severity: 'moderate' | 'severe';
}

export interface ShipStats {
  cargoCapacity: number;
  fuelCapacity: number;
  sensorRange: number;
  maxShield: number;
  shieldRegenMilliPerSecond: number;
  weaponDamage: number;
  weaponCooldownTicks: number;
  miningMilliPerSecond: number;
}

export interface Ship {
  id: string;
  faction: FactionId;
  position: Vec2;
  velocity: Vec2;
  heading: number;
  throttleBasisPoints: number;
  fuelHundredths: number;
  cargo: Record<Material, number>;
  credits: number;
  hull: number;
  armour: number;
  shield: number;
  lastDamageTick: number;
  weaponReadyTick: number;
  bombReadyTick: number;
  bombs: number;
  selectedTargetId: string | null;
  holdFire: boolean;
  dockedPlanetId: string | null;
  miningNodeId: string | null;
  miningStartedTick: number;
  miningReadyTick: number;
  emergency: boolean;
  destroyed: boolean;
  upgrades: Partial<Record<UpgradeFamily, 1 | 2>>;
  stats: ShipStats;
}

export interface Faction {
  id: FactionId;
  credits: number;
  stock: Record<Material, number>;
  shipId: string | null;
  relationToPlayer: 'peace' | 'hostile';
  nextPlanTick: number;
  collapseTicks: number;
  reconstruction: null | { planetId: string; completeTick: number };
}

export interface PendingBomb {
  id: string;
  sourceShipId: string;
  targetId: string;
  impactTick: number;
}

export interface GameEvent {
  id: string;
  tick: number;
  type: string;
  summary: string;
  actors: string[];
  entityId?: string;
}

export interface GameState {
  schemaVersion: 1;
  rulesVersion: '1.0.0';
  generatorVersion: 1;
  campaignId: string;
  seed: string;
  width: number;
  height: number;
  difficulty: Difficulty;
  tick: number;
  running: boolean;
  launched: boolean;
  outcome: Outcome;
  sealedAtTick: number | null;
  playerShipId: 'ship-player';
  planets: Planet[];
  nodes: ResourceNode[];
  discoveries: Discovery[];
  hazards: Hazard[];
  ships: Ship[];
  factions: Faction[];
  bombs: PendingBomb[];
  events: GameEvent[];
  commandSequence: number;
  stats: {
    fuelConsumedHundredths: number;
    distanceMilli: number;
    tradeProfit: number;
    discoveries: number;
    shipsDestroyed: number;
  };
}

export type GameCommand =
  | { type: 'launch' }
  | { type: 'pause'; paused: boolean }
  | { type: 'flight'; throttle: number; turn: -1 | 0 | 1; brake?: boolean }
  | { type: 'selectTarget'; targetId: string | null }
  | { type: 'setHoldFire'; hold: boolean }
  | { type: 'startMining'; nodeId: string }
  | { type: 'stopMining' }
  | { type: 'scan' }
  | { type: 'dock'; planetId: string }
  | { type: 'undock' }
  | {
      type: 'trade';
      planetId: string;
      material: Material;
      side: 'buy' | 'sell';
      quantity: number;
    }
  | { type: 'refuel'; planetId: string; amount: number }
  | { type: 'repair'; planetId: string }
  | { type: 'buyUpgrade'; planetId: string; family: UpgradeFamily; tier: 1 | 2 }
  | { type: 'buyBomb'; planetId: string; quantity: number }
  | {
      type: 'influence';
      planetId: string;
      action: 'trade' | 'aid' | 'broadcast';
    }
  | { type: 'activateBomb'; targetId: string; confirmNeutral?: boolean }
  | { type: 'acceptCapitulation'; factionId: FactionId };

export interface CommandEnvelope {
  tick: number;
  sequence: number;
  command: GameCommand;
}

export interface CommandResult {
  accepted: boolean;
  reason?: string;
}

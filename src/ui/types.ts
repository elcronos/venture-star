export type Destination =
  'home' | 'flight' | 'galaxy' | 'management' | 'history';
export type PauseReason =
  | 'EXPLICIT'
  | 'MANAGEMENT'
  | 'GALAXY'
  | 'HIDDEN'
  | 'LEASE_LOST'
  | 'RECOVERY'
  | 'RUN_END';

export type IntelState = 'LIVE' | 'RECENT' | 'STALE' | 'UNKNOWN';
export type Relation =
  'player' | 'friendly' | 'neutral' | 'rival' | 'hostile' | 'unknown';
export type Severity = 'info' | 'major' | 'critical';
export type SaveState = 'Saved' | 'Saving…' | 'Unsaved changes' | 'Save failed';

export interface MeterState {
  current: number;
  max: number;
  label: string;
  critical?: boolean;
}

export interface ContextAction {
  id: string;
  label: string;
  icon?: UiIcon;
  disabledReason?: string;
  destructive?: boolean;
}

export interface TargetState {
  id: string;
  name: string;
  type: string;
  relation: Relation;
  faction?: string;
  distance: number;
  intel: IntelState;
  intelAge?: string;
  rangeState?: string;
  shield?: MeterState;
  armour?: MeterState;
  hull?: MeterState;
  /** Remaining yield of a resource deposit, against what it held when found. */
  deposit?: MeterState;
  /** What this planet's market pays, so selling can be judged before flying. */
  trade?: string;
  actions: ContextAction[];
}

export interface ContactState {
  id: string;
  name: string;
  type: string;
  relation: Relation;
  direction: string;
  distance: number;
  health?: string;
  intel?: IntelState;
  selected?: boolean;
  threat?: boolean;
  interactable?: boolean;
}

export interface AlertState {
  id: string;
  severity: Severity;
  message: string;
  simulationTime: string;
  category?: TimelineCategory;
  unread?: boolean;
  location?: { x: number; y: number; intelAge?: string };
  count?: number;
}

export type TimelineCategory =
  'Critical' | 'Planets' | 'Rivals' | 'Economy' | 'Discoveries' | 'Combat';

export interface TimelineEvent extends AlertState {
  category: TimelineCategory;
  title: string;
  occurredAtUnknownTime?: boolean;
}

export type DangerBand =
  'Haven' | 'Near Reach' | 'Far Reach' | 'Verge' | 'Antipode';

export interface GalaxyCell {
  x: number;
  y: number;
  discovered: boolean;
  danger?: DangerBand;
  owner?: Relation;
  planet?: string;
  resources?: boolean;
  hazard?: string;
  discovery?: boolean;
  /** Set when a discovered planet here has a market the player may dock with. */
  trade?: string;
  intel?: IntelState;
  selected?: boolean;
  player?: boolean;
}

export interface MinimapState {
  width: number;
  height: number;
  /** Zero-based sector the player currently occupies. */
  sector: { x: number; y: number };
  /** Player position inside that sector, 0..1 on each axis. */
  offset: { x: number; y: number };
  cells: GalaxyCell[];
}

export interface RouteForecast {
  destination: string;
  wrappedDistance: number;
  crossings: number;
  estimatedFuel: number;
  remainingFuel: number;
  reserveImpact: string;
  highestDanger: DangerBand | 'Unknown';
  knownHazards: string[];
  intel: IntelState;
  unknownConditions?: boolean;
  blockedReason?: string;
  requiresReserveConfirmation?: boolean;
}

export interface GalaxyState {
  width: number;
  height: number;
  cells: GalaxyCell[];
  zoom: number;
  route?: RouteForecast;
  filters: Record<
    'planets' | 'resources' | 'hazards' | 'discoveries' | 'factions' | 'trade',
    boolean
  >;
}

export interface MarketRow {
  id: string;
  material: 'ore' | 'metal' | 'crystal' | 'exotic';
  name: string;
  playerQuantity: number;
  cargoWeight: number;
  stock: number;
  buyPrice: number;
  sellPrice: number;
  intel: IntelState;
  quantity: number;
  maxQuantity: number;
}

export interface ModuleCard {
  id: string;
  name: string;
  family: string;
  tier: number;
  price: number;
  materialCost?: string;
  installed?: boolean;
  statLabel: string;
  before: string;
  after: string;
  disabledReason?: string;
}

export interface FuelOffer {
  /** Credits per fuel unit at this planet. */
  price: number;
  /** Units the planet still has to sell. */
  stock: number;
  /** Units the player has chosen to buy. */
  quantity: number;
  /** The most the player could take right now, given credits, stock and tank. */
  maxQuantity: number;
  disabledReason?: string;
}

export interface DockState {
  planetName: string;
  owner: Relation;
  activeTab: 'overview' | 'market' | 'shipyard' | 'planet' | 'research';
  availableTabs: Array<
    'overview' | 'market' | 'shipyard' | 'planet' | 'research'
  >;
  credits: number;
  cargo: MeterState;
  fuel: MeterState;
  hull: MeterState;
  bombs: number;
  influence?: number;
  resistance?: number;
  /** The peaceful acquisition actions this port will accept right now. */
  influenceActions?: ContextAction[];
  /** Multiplier applied to refit prices at this port. */
  refitMultiplier?: number;
  market: MarketRow[];
  fuelOffer: FuelOffer;
  modules: ModuleCard[];
  selectedMarketId?: string;
  selectedModuleId?: string;
  captured?: boolean;
}

export type RunOutcome = 'Victory' | 'Defeat' | 'Abandoned';

export interface CampaignRecord {
  id: string;
  title: string;
  outcome: RunOutcome;
  seed: string;
  startedAt: string;
  endedAt: string;
  simulationDuration: string;
  engagedDuration: string;
  wallSpan: string;
  dimensions: string;
  difficulty: string;
  planetsControlled: string;
  discoveries: number;
  rulesVersion: string;
  fatalSource?: string;
  finalMap?: Array<{ name: string; owner: string; x: number; y: number }>;
  finalTimeline?: Array<{ time: string; summary: string }>;
  statistics?: {
    fuelUsed: number;
    distance: number;
    tradeProfit: number;
    shipsDestroyed: number;
  };
}

export interface SettingsState {
  haptics: boolean;
  screenShake: 'off' | 'half' | 'full';
  reducedMotion: boolean;
  highContrast: boolean;
  textScale: '100' | '115' | '130' | '150';
  hudNumbers: boolean;
  fixedJoystick: boolean;
  touchControls: 'auto' | 'on' | 'off';
  tutorial: boolean;
}

export interface HomeState {
  version: string;
  activeCampaign?: {
    name: string;
    seed: string;
    dimensions: string;
    difficulty: string;
    simulationTime: string;
    saveAge: string;
    status: string;
  };
  recordCount: number;
  offline?: boolean;
}

export interface FlightState {
  campaignName: string;
  sector: { x: number; y: number; danger: DangerBand };
  shield: MeterState;
  armour: MeterState;
  hull: MeterState;
  fuel: MeterState;
  cargo: MeterState;
  credits: number;
  bombs: number;
  speed: number;
  throttle: number;
  heading: number;
  autopilot?: string;
  stationLock?: number;
  objective?: string;
  planetsControlled?: string;
  target?: TargetState;
  contacts: ContactState[];
  actions: ContextAction[];
  alerts: AlertState[];
  timeline: TimelineEvent[];
  emergencyDrift?: boolean;
  minimap: MinimapState;
  /** True while the all-stop assist is braking the ship to rest. */
  allStop?: boolean;
}

export interface UiState {
  destination: Destination;
  pauseReasons: PauseReason[];
  saveState: SaveState;
  home: HomeState;
  flight: FlightState;
  galaxy: GalaxyState;
  dock: DockState;
  records: CampaignRecord[];
  settings: SettingsState;
  overlay?: 'pause' | 'settings' | 'help' | 'timeline' | 'resume' | 'run-end';
  selectedRecordId?: string;
  timelineFilter?: 'All' | TimelineCategory;
  timelineSearch?: string;
}

export type UiAction =
  | { type: 'navigate'; destination: Destination }
  | { type: 'open-overlay'; overlay: NonNullable<UiState['overlay']> }
  | { type: 'close-overlay' }
  | { type: 'resume' }
  | { type: 'pause' }
  | { type: 'new-campaign'; config?: CampaignSetup | undefined }
  | { type: 'continue-campaign' }
  | { type: 'return-home' }
  | { type: 'launch' }
  | { type: 'scan' }
  | { type: 'context-action'; actionId: string; targetId?: string | undefined }
  | { type: 'select-contact'; contactId: string }
  | { type: 'autopilot-contact'; contactId: string }
  | { type: 'galaxy-select'; x: number; y: number }
  | { type: 'galaxy-zoom'; delta: -1 | 1 }
  | { type: 'galaxy-center' }
  | {
      type: 'galaxy-filter';
      filter: keyof GalaxyState['filters'];
      enabled: boolean;
    }
  | { type: 'start-route'; useReserve: boolean }
  | { type: 'dock-tab'; tab: DockState['activeTab'] }
  | { type: 'market-quantity'; rowId: string; quantity: number }
  | {
      type: 'market-trade';
      rowId: string;
      side: 'buy' | 'sell';
      quantity: number;
    }
  | { type: 'select-module'; moduleId: string }
  | { type: 'fit-module'; moduleId: string }
  | {
      type: 'dock-service';
      service:
        | 'refuel'
        | 'repair'
        | 'buy-bomb'
        | 'influence-trade'
        | 'influence-aid'
        | 'influence-broadcast';
      amount?: number;
    }
  | { type: 'select-record'; recordId: string }
  | { type: 'delete-record'; recordId: string }
  | { type: 'replay-seed'; recordId: string }
  | { type: 'timeline-filter'; filter: 'All' | TimelineCategory }
  | { type: 'timeline-search'; query: string }
  | { type: 'timeline-location'; eventId: string }
  | { type: 'dismiss-alert'; alertId: string }
  | { type: 'settings-change'; settings: SettingsState }
  | { type: 'settings-apply'; settings: SettingsState }
  | { type: 'settings-reset-presentation' }
  | { type: 'settings-reset-tutorial' }
  | {
      type: 'flight-control';
      control: 'thrust' | 'left' | 'right' | 'brake';
      active: boolean;
    }
  | { type: 'joystick'; x: number; y: number; active: boolean }
  | { type: 'clear-flight-inputs' }
  | { type: 'all-stop' }
  | { type: 'throttle'; value: number };

export type UiDispatch = (action: UiAction) => void;

export interface CampaignSetup {
  seed: string;
  width: number;
  height: number;
  rivals: 1 | 2 | 3;
  difficulty: 'Explorer' | 'Captain' | 'Strategist';
  tutorial: boolean;
}

export type UiIcon =
  | 'all-stop'
  | 'armour'
  | 'back'
  | 'bomb'
  | 'cargo'
  | 'center'
  | 'close'
  | 'credits'
  | 'danger'
  | 'discovery'
  | 'fuel'
  | 'home'
  | 'hull'
  | 'market'
  | 'metal'
  | 'mining'
  | 'objective'
  | 'ore'
  | 'pause'
  | 'planet'
  | 'play'
  | 'record'
  | 'research'
  | 'route'
  | 'scanner'
  | 'settings'
  | 'shield'
  | 'ship'
  | 'shipyard'
  | 'stale-intel'
  | 'timeline'
  | 'unknown'
  | 'weapon'
  | 'wrapped-route'
  | 'zoom-in'
  | 'zoom-out';

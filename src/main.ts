import './styles/index.css';
import {
  GameEngine,
  type CampaignOptions,
  type GameCommand,
  type GameState,
} from './game/engine';
import {
  blocked,
  bombBlockedReason,
  dockBlockedReason,
  miningBlockedReason,
} from './game/interactions';
import { cargoUsed, wrappedDelta, wrappedDistance } from './game/math';
import {
  SCALE,
  SECTOR_SIZE,
  TICKS_PER_SECOND,
  type Material,
  type Planet,
  type Ship,
  type UpgradeFamily,
} from './game/types';
import { installTestHook } from './devHook';
import { VentureStore } from './persistence/store';
import { SpaceCanvas } from './render/spaceCanvas';
import { emptyUiState as buildEmptyUiState } from './ui/emptyState';
import { minimapState, syncMinimapMarker } from './ui/components/minimap';
import {
  mountVentureUi,
  type CampaignRecord,
  type CampaignSetup,
  type DockState,
  type FlightState,
  type GalaxyCell,
  type SettingsState,
  type UiAction,
  type UiState,
} from './ui';
import type { ContextAction, DangerBand, TimelineCategory } from './ui/types';

interface StoredCampaign {
  serialized: string;
  visited: string[];
  startedAt: number;
}

interface StoredRecord {
  record: CampaignRecord;
  serialized: string;
}

const DEFAULT_SETTINGS: SettingsState = {
  haptics: true,
  screenShake: 'half',
  reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
  highContrast: false,
  textScale: '100',
  hudNumbers: true,
  fixedJoystick: false,
  touchControls: 'auto',
  tutorial: true,
};

const store = new VentureStore();
const tabId = `tab-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
const LEASE_MS = 6_000;
let leasedCampaignId: string | null = null;
const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('Missing #app root');

let engine: GameEngine | null = null;
let visited = new Set<string>();
let startedAt = Date.now();
let destination: UiState['destination'] = 'home';
let overlay: UiState['overlay'];
let settings = DEFAULT_SETTINGS;
let records: CampaignRecord[] = [];
let selectedId: string | null = null;
let selectedCell: { x: number; y: number } | null = null;
let dockTab: DockState['activeTab'] = 'overview';
let marketQuantities: Record<string, number> = {};
let autopilot: {
  x: number;
  y: number;
  name: string;
  /** World units to stop short of the target, so it stays in interaction range. */
  standoff: number;
  phase: 'Travelling' | 'Braking' | 'Arrived';
} | null = null;
let controls = {
  thrust: false,
  left: false,
  right: false,
  brake: false,
  throttle: 0,
};
let joystickActive = false;
/** Cancels autopilot and brakes to rest; cleared once the ship is stationary. */
let allStop = false;
let saveState: UiState['saveState'] = 'Saved';
let sealed = false;
let sealing = false;
let lastRenderedTick = -1;
let uiState = emptyUiState();
const ui = mountVentureUi(root, uiState, dispatchUi);
const space = new SpaceCanvas(ui.getCanvasHost(), {
  reducedMotion: () => settings.reducedMotion,
  onWorldTap: (x, y) => {
    if (!engine) return;
    autopilot = {
      x,
      y,
      name: 'selected coordinates',
      standoff: POINT_STANDOFF_WU,
      phase: 'Travelling',
    };
    destination = 'flight';
    resumeSimulation();
  },
  onEntityTap: (id) => {
    if (!engine) return;
    if (selectedId === id) setAutopilotTo(id);
    else selectEntity(id);
  },
});

void boot();

async function boot(): Promise<void> {
  settings = await store.getSetting('settings', DEFAULT_SETTINGS);
  const storedRecords = await store.records<StoredRecord>();
  records = storedRecords.map((entry) => entry.state.record);
  const stored = await store.newestCampaign<StoredCampaign>();
  if (stored) {
    engine = GameEngine.restore(stored.state.serialized);
    visited = new Set(stored.state.visited);
    startedAt = stored.state.startedAt;
  }
  uiState = buildUiState();
  ui.update(uiState);
  window.addEventListener('online', render);
  window.addEventListener('offline', render);
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('keydown', onKey, { passive: false });
  window.addEventListener('keyup', onKey, { passive: false });
  setInterval(gameLoop, 1000 / TICKS_PER_SECOND);
  setInterval(() => void saveCampaign(), 5000);
  setInterval(() => void journalCampaign(), 10_000);
  setInterval(refreshLease, 2_000);
  window.addEventListener('beforeunload', releaseLease);
  installTestHook({
    engine: () => engine,
    send,
    render,
    flush,
    createCampaign(options) {
      engine = GameEngine.create(options);
      render();
    },
    autopilotTo: setAutopilotTo,
    selectEntity: selectEntity,
    space,
  });
}

function gameLoop(): void {
  if (!engine) return;
  const before = engine.snapshot();
  if (before.outcome !== 'active') {
    void sealIfNeeded(before);
    return;
  }
  let advanced = false;
  if (destination === 'flight' && !overlay && before.running) {
    if (!acquireLease(before.campaignId)) {
      pauseSimulation();
      overlay = 'pause';
      render();
      return;
    }
    applyFlightIntent(before);
    engine.stepTicks(1);
    advanced = true;
  }
  const state = engine.snapshot();
  const player = playerShip(state);
  visited.add(`${sectorOf(player.position.x)},${sectorOf(player.position.y)}`);
  const controlHeld =
    joystickActive ||
    controls.thrust ||
    controls.left ||
    controls.right ||
    controls.brake;
  // The canvas takes every tick so motion stays smooth, while the DOM rebuild
  // stays throttled and paused during input to keep pointer capture intact.
  if (advanced) {
    space.setState(state);
    if (root) syncMinimapMarker(root, minimapState(state, player, []));
  }
  if (
    advanced &&
    !controlHeld &&
    state.tick !== lastRenderedTick &&
    state.tick % 5 === 0
  ) {
    lastRenderedTick = state.tick;
    render();
  }
  if (state.outcome !== 'active') void sealIfNeeded(state);
}

/** Cuts autopilot and throttle, then holds the brake until the ship is at rest. */
function beginAllStop(): void {
  allStop = true;
  autopilot = null;
  controls.throttle = 0;
  controls.thrust = false;
  controls.left = false;
  controls.right = false;
  render();
}

/** Mirrors the simulation's own braking authority, in world units per second². */
const BRAKE_WU_PER_SECOND = 150;
/**
 * Autopilot arrives at a standstill rather than merely slow. Docking allows
 * 20 wu/s and a mining lock only 8, and unpowered drag sheds just 8 wu/s², so
 * anything short of a stop leaves the player coasting out of range again.
 */
const ARRIVAL_SPEED_MILLI = 0;
/** Stop this far from an interaction target: inside dock range, clear of it. */
const INTERACTION_STANDOFF_WU = 84;
/** A bare coordinate has nothing to keep clear of. */
const POINT_STANDOFF_WU = 24;

function applyFlightIntent(state: GameState): void {
  const ship = playerShip(state);
  if (allStop) {
    const stopped = ship.velocity.x === 0 && ship.velocity.y === 0;
    send({ type: 'flight', throttle: 0, turn: 0, brake: !stopped });
    if (stopped) {
      allStop = false;
      render();
    }
    return;
  }
  if (
    ship.miningNodeId &&
    !autopilot &&
    !controls.thrust &&
    !controls.left &&
    !controls.right &&
    !controls.brake
  )
    return;
  if (controls.brake) autopilot = null;
  let turn: -1 | 0 | 1 = controls.left ? -1 : controls.right ? 1 : 0;
  let throttle = controls.thrust ? 1 : controls.throttle;
  let brake = controls.brake;
  if (autopilot) {
    const worldWidth = state.width * SECTOR_SIZE * SCALE;
    const worldHeight = state.height * SECTOR_SIZE * SCALE;
    const dx = wrappedDelta(ship.position.x, autopilot.x, worldWidth);
    const dy = wrappedDelta(ship.position.y, autopilot.y, worldHeight);
    const speed = Math.hypot(ship.velocity.x, ship.velocity.y);
    // Distance still to cover before the ship should be at a standstill.
    const remaining =
      Math.hypot(dx, dy) - autopilot.standoff * SCALE;
    // Ship-frame braking distance, matching the simulation's own deceleration.
    const stopping = speed ** 2 / (2 * BRAKE_WU_PER_SECOND * SCALE);
    const desired = normalizeTurn((Math.atan2(dy, dx) / (Math.PI * 2)) * 65_536);
    const error = signedHeadingDelta(ship.heading, desired);

    if (remaining <= 0 && speed <= ARRIVAL_SPEED_MILLI) {
      // Arrived and slow enough to dock, mine, or bomb. Hand back control.
      autopilot = null;
      throttle = 0;
      turn = 0;
      render();
    } else if (remaining <= stopping) {
      // Coasting is far too weak to stop in range: brake under power instead.
      autopilot.phase = 'Braking';
      throttle = 0;
      turn = 0;
      brake = true;
    } else {
      autopilot.phase = 'Travelling';
      turn = Math.abs(error) < 600 ? 0 : error < 0 ? -1 : 1;
      // Never build speed while pointing the wrong way; it only costs fuel and
      // lengthens the approach.
      throttle =
        Math.abs(error) > 8_000 ? 0 : remaining < 240 * SCALE ? 0.35 : 0.82;
    }
  }
  send({
    type: 'flight',
    throttle,
    turn,
    ...(brake ? { brake: true } : {}),
  });
}

function dispatchUi(action: UiAction): void {
  switch (action.type) {
    case 'new-campaign':
      createCampaign(action.config);
      break;
    case 'continue-campaign':
      void continueCampaign();
      break;
    case 'navigate':
      navigate(action.destination);
      break;
    case 'open-overlay':
      overlay = action.overlay;
      pauseSimulation();
      break;
    case 'close-overlay':
      overlay = undefined;
      break;
    case 'pause':
      overlay = 'pause';
      pauseSimulation();
      break;
    case 'resume':
      overlay = undefined;
      destination = 'flight';
      resumeSimulation();
      break;
    case 'return-home':
      void saveCampaign();
      destination = 'home';
      overlay = undefined;
      pauseSimulation();
      releaseLease();
      break;
    case 'launch':
      launch();
      break;
    case 'scan':
      scanSector();
      break;
    case 'select-contact':
      selectedId = action.contactId;
      send({ type: 'selectTarget', targetId: action.contactId });
      flush();
      break;
    case 'autopilot-contact':
      setAutopilotTo(action.contactId);
      break;
    case 'flight-control':
      controls[action.control] = action.active;
      if (action.active) {
        autopilot = null;
        allStop = false;
      }
      return;
    case 'all-stop':
      beginAllStop();
      return;
    case 'joystick':
      joystickActive = action.active;
      controls.left = action.active && action.x < -0.15;
      controls.right = action.active && action.x > 0.15;
      controls.thrust = action.active && action.y < -0.15;
      if (action.active) {
        controls.throttle = Math.max(
          0.2,
          Math.min(1, Math.hypot(action.x, action.y)),
        );
        autopilot = null;
        allStop = false;
      }
      return;
    case 'clear-flight-inputs':
      joystickActive = false;
      controls = {
        ...controls,
        thrust: false,
        left: false,
        right: false,
        brake: false,
      };
      return;
    case 'throttle':
      controls.throttle = Math.max(0, Math.min(1, action.value / 100));
      if (controls.throttle > 0) allStop = false;
      return;
    case 'context-action':
      runContextAction(action.actionId, action.targetId);
      break;
    case 'galaxy-select':
      selectedCell = { x: action.x, y: action.y };
      break;
    case 'start-route':
      startSelectedRoute();
      break;
    case 'galaxy-center':
      centerMap();
      break;
    case 'galaxy-zoom':
      break;
    case 'galaxy-filter':
      uiState.galaxy.filters[action.filter] = action.enabled;
      break;
    case 'dock-tab':
      dockTab = action.tab;
      break;
    case 'market-quantity':
      marketQuantities[action.rowId] = action.quantity;
      break;
    case 'market-trade':
      trade(action.rowId as Material, action.side, action.quantity);
      break;
    case 'select-module':
      break;
    case 'fit-module':
      fitModule(action.moduleId);
      break;
    case 'dock-service':
      useDockService(action.service);
      break;
    case 'select-record':
      uiState.selectedRecordId = action.recordId;
      break;
    case 'delete-record':
      void deleteRecord(action.recordId);
      break;
    case 'replay-seed':
      replaySeed(action.recordId);
      break;
    case 'timeline-filter':
      uiState.timelineFilter = action.filter;
      break;
    case 'timeline-search':
      uiState.timelineSearch = action.query;
      break;
    case 'timeline-location':
      focusTimelineEntity(action.eventId);
      break;
    case 'dismiss-alert':
      break;
    case 'settings-change':
      settings = action.settings;
      break;
    case 'settings-apply':
      settings = action.settings;
      overlay = undefined;
      void store.setSetting('settings', settings);
      break;
    case 'settings-reset-presentation':
      settings = DEFAULT_SETTINGS;
      break;
    case 'settings-reset-tutorial':
      settings = { ...settings, tutorial: true };
      break;
  }
  render();
}

function createCampaign(config?: CampaignSetup): void {
  if (engine?.snapshot().outcome === 'active') {
    const previous = engine.snapshot();
    const record = {
      ...recordFromState(previous),
      outcome: 'Abandoned' as const,
    };
    records = [record, ...records];
    void store.sealRecord(previous.campaignId, 'abandoned', {
      record,
      serialized: engine.serialize(),
    } satisfies StoredRecord);
    releaseLease();
  }
  const chosen = config ?? {
    seed: '',
    width: 10,
    height: 10,
    rivals: 1 as const,
    difficulty: 'Captain' as const,
    tutorial: true,
  };
  const seed = chosen.seed || randomSeed();
  const options: CampaignOptions = {
    seed,
    width: chosen.width,
    height: chosen.height,
    rivals: chosen.rivals,
    difficulty: chosen.difficulty,
    campaignId: newCampaignId(),
  };
  engine = GameEngine.create(options);
  const state = engine.snapshot();
  const home = state.planets.find((planet) => planet.owner === 'player')!;
  visited = new Set([`${home.sectorX},${home.sectorY}`]);
  startedAt = Date.now();
  destination = 'management';
  overlay = undefined;
  selectedId = null;
  selectedCell = null;
  autopilot = null;
  sealed = false;
  sealing = false;
  acquireLease(state.campaignId);
  settings = { ...settings, tutorial: chosen.tutorial };
  void saveCampaign();
}

async function continueCampaign(): Promise<void> {
  const row = await store.newestCampaign<StoredCampaign>();
  if (!row) {
    engine = null;
    releaseLease();
    records = (await store.records<StoredRecord>()).map(
      (entry) => entry.state.record,
    );
    destination = 'home';
    render();
    return;
  }
  engine = GameEngine.restore(row.state.serialized);
  visited = new Set(row.state.visited);
  startedAt = row.state.startedAt;
  if (!acquireLease(engine.snapshot().campaignId)) {
    destination = 'home';
    render();
    return;
  }
  destination = playerShip(engine.snapshot()).dockedPlanetId
    ? 'management'
    : 'flight';
  if (destination === 'flight') resumeSimulation();
  sealed = false;
  render();
}

function navigate(next: UiState['destination']): void {
  destination = next;
  overlay = undefined;
  if (next === 'flight') resumeSimulation();
  else if (
    next === 'home' ||
    next === 'galaxy' ||
    next === 'management' ||
    next === 'history'
  )
    pauseSimulation();
}

function launch(): void {
  if (!engine) return;
  const state = engine.snapshot();
  send(state.launched ? { type: 'undock' } : { type: 'launch' });
  flush();
  destination = 'flight';
  overlay = undefined;
}

function pauseSimulation(): void {
  if (!engine || !engine.snapshot().running) return;
  send({ type: 'pause', paused: true });
  flush();
}

function resumeSimulation(): void {
  if (
    !engine ||
    engine.snapshot().running ||
    engine.snapshot().outcome !== 'active'
  )
    return;
  if (!acquireLease(engine.snapshot().campaignId)) return;
  send({ type: 'pause', paused: false });
  flush();
}

/** Selects an entity the way tapping it on the tactical canvas does. */
function selectEntity(id: string): void {
  if (!engine) return;
  selectedId = id;
  send({ type: 'selectTarget', targetId: id });
  flush();
  render();
}

function setAutopilotTo(id: string): void {
  const entity = findEntity(id);
  if (!entity) return;
  selectedId = id;
  autopilot = {
    x: entity.position.x,
    y: entity.position.y,
    name: 'name' in entity ? entity.name : id,
    standoff: INTERACTION_STANDOFF_WU,
    phase: 'Travelling',
  };
  destination = 'flight';
  resumeSimulation();
}

function startSelectedRoute(): void {
  if (!engine || !selectedCell) return;
  autopilot = {
    x: (selectedCell.x * SECTOR_SIZE + SECTOR_SIZE / 2) * SCALE,
    y: (selectedCell.y * SECTOR_SIZE + SECTOR_SIZE / 2) * SCALE,
    name: `sector ${selectedCell.x + 1},${selectedCell.y + 1}`,
    standoff: POINT_STANDOFF_WU,
    phase: 'Travelling',
  };
  destination = 'flight';
  resumeSimulation();
}

function runContextAction(actionId: string, targetId?: string): void {
  if (!engine) return;
  const id = targetId ?? selectedId;
  if (actionId === 'stop-mining') send({ type: 'stopMining' });
  else if (actionId === 'mine' && id) send({ type: 'startMining', nodeId: id });
  else if (actionId === 'dock' && id) send({ type: 'dock', planetId: id });
  else if (actionId === 'bomb' && id)
    send({ type: 'activateBomb', targetId: id, confirmNeutral: true });
  else if (actionId === 'influence' && id)
    send({ type: 'influence', planetId: id, action: 'aid' });
  else if (actionId === 'hold-fire') send({ type: 'setHoldFire', hold: true });
  else if (actionId === 'autofire') send({ type: 'setHoldFire', hold: false });
  else if (actionId === 'autopilot' && id) setAutopilotTo(id);
  flush();
  const state = engine.snapshot();
  if (playerShip(state).dockedPlanetId) destination = 'management';
}

function trade(
  material: Material,
  side: 'buy' | 'sell',
  quantity: number,
): void {
  if (!engine) return;
  const ship = playerShip(engine.snapshot());
  if (!ship.dockedPlanetId) return;
  send({
    type: 'trade',
    planetId: ship.dockedPlanetId,
    material,
    side,
    quantity,
  });
  flush();
}

function fitModule(moduleId: string): void {
  if (!engine) return;
  const ship = playerShip(engine.snapshot());
  if (!ship.dockedPlanetId) return;
  const [family, tierText] = moduleId.split(':');
  const tier = Number(tierText) as 1 | 2;
  if (!isUpgradeFamily(family) || (tier !== 1 && tier !== 2)) return;
  send({ type: 'buyUpgrade', planetId: ship.dockedPlanetId, family, tier });
  flush();
}

function useDockService(
  service: 'refuel' | 'repair' | 'buy-bomb' | 'influence',
): void {
  if (!engine) return;
  const ship = playerShip(engine.snapshot());
  const planetId = ship.dockedPlanetId;
  if (!planetId) return;
  if (service === 'refuel') send({ type: 'refuel', planetId, amount: 10 });
  else if (service === 'repair') send({ type: 'repair', planetId });
  else if (service === 'buy-bomb')
    send({ type: 'buyBomb', planetId, quantity: 1 });
  else send({ type: 'influence', planetId, action: 'aid' });
  flush();
}

function replaySeed(recordId: string): void {
  const record = records.find((item) => item.id === recordId);
  if (!record) return;
  const [width, height] = record.dimensions.split('×').map(Number);
  createCampaign({
    seed: record.seed,
    width: width ?? 10,
    height: height ?? 10,
    rivals: 1,
    difficulty: record.difficulty as CampaignSetup['difficulty'],
    tutorial: settings.tutorial,
  });
}

async function deleteRecord(recordId: string): Promise<void> {
  await store.deleteRecord(recordId);
  records = records.filter((record) => record.id !== recordId);
  if (uiState.selectedRecordId === recordId) {
    if (records[0]) uiState.selectedRecordId = records[0].id;
    else delete uiState.selectedRecordId;
  }
  render();
}

function scanSector(): void {
  if (!engine) return;
  const state = engine.snapshot();
  const ship = playerShip(state);
  const x = sectorOf(ship.position.x),
    y = sectorOf(ship.position.y);
  for (const [dx, dy] of [
    [0, 0],
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ] as const)
    visited.add(
      `${(x + dx + state.width) % state.width},${(y + dy + state.height) % state.height}`,
    );
  send({ type: 'scan' });
  flush();
  render();
}

function centerMap(): void {
  if (!engine) return;
  const ship = playerShip(engine.snapshot());
  selectedCell = { x: sectorOf(ship.position.x), y: sectorOf(ship.position.y) };
}

function focusTimelineEntity(eventId: string): void {
  if (!engine) return;
  const event = engine.snapshot().events.find((item) => item.id === eventId);
  if (event?.entityId) setAutopilotTo(event.entityId);
}

async function saveCampaign(): Promise<void> {
  if (!engine || engine.snapshot().outcome !== 'active') return;
  if (leasedCampaignId !== engine.snapshot().campaignId) return;
  saveState = 'Saving…';
  render();
  try {
    const state = engine.snapshot();
    await store.saveCampaign(
      state.campaignId,
      {
        serialized: engine.serialize(),
        visited: [...visited].sort(),
        startedAt,
      } satisfies StoredCampaign,
      () => ownsLease(state.campaignId),
    );
    saveState = 'Saved';
  } catch {
    saveState = 'Save failed';
  }
  render();
}

async function journalCampaign(): Promise<void> {
  if (
    !engine ||
    engine.snapshot().outcome !== 'active' ||
    leasedCampaignId !== engine.snapshot().campaignId
  )
    return;
  const state = engine.snapshot();
  await store.journalCampaign(
    state.campaignId,
    {
      serialized: engine.serialize(),
      visited: [...visited].sort(),
      startedAt,
    } satisfies StoredCampaign,
    () => ownsLease(state.campaignId),
  );
}

async function sealIfNeeded(state: GameState): Promise<void> {
  if (sealed || sealing || state.outcome === 'active') return;
  sealing = true;
  const record = recordFromState(state);
  records = [record, ...records];
  try {
    await store.sealRecord(state.campaignId, state.outcome, {
      record,
      serialized: engine?.serialize() ?? '',
    } satisfies StoredRecord);
    sealed = true;
    overlay = 'run-end';
    destination = 'flight';
  } catch {
    saveState = 'Save failed';
  } finally {
    sealing = false;
    render();
  }
}

function render(): void {
  uiState = buildUiState();
  ui.update(uiState);
  if (engine) space.setState(engine.snapshot());
}

function emptyUiState(): UiState {
  return buildEmptyUiState(records, settings);
}

function buildUiState(): UiState {
  if (!engine) return emptyUiState();
  const state = engine.snapshot();
  const ship = playerShip(state);
  const docked =
    state.planets.find((planet) => planet.id === ship.dockedPlanetId) ??
    state.planets.find((planet) => planet.owner === 'player')!;
  const selected = selectedId ? findEntityInState(state, selectedId) : null;
  const contacts = nearbyContacts(state, ship);
  const cells = galaxyCells(state, ship);
  const minimap = minimapState(state, ship, cells);
  const timeline = state.events
    .slice(-100)
    .reverse()
    .map((event) => ({
      id: event.id,
      severity:
        event.type.includes('DESTROYED') || event.type.includes('DAMAGE')
          ? ('critical' as const)
          : event.type.includes('PLANET')
            ? ('major' as const)
            : ('info' as const),
      message: event.summary,
      simulationTime: formatTime(event.tick / TICKS_PER_SECOND),
      category: eventCategory(event.type),
      title: event.type.replaceAll('_', ' '),
      unread: false,
    }));
  const base: UiState = {
    destination,
    pauseReasons:
      !state.running && destination !== 'home'
        ? [
            state.outcome === 'active'
              ? destination === 'management'
                ? 'MANAGEMENT'
                : destination === 'galaxy'
                  ? 'GALAXY'
                  : 'EXPLICIT'
              : 'RUN_END',
          ]
        : [],
    saveState,
    home: {
      version: state.rulesVersion,
      activeCampaign: {
        name: 'Venture Star',
        seed: state.seed,
        dimensions: `${state.width}×${state.height}`,
        difficulty: state.difficulty,
        simulationTime: formatTime(state.tick / TICKS_PER_SECOND),
        saveAge: 'recently',
        status:
          state.outcome === 'active' ? 'Active expedition' : state.outcome,
      },
      recordCount: records.length,
      offline: !navigator.onLine,
    },
    flight: {
      campaignName: 'Venture Star',
      sector: {
        x: sectorOf(ship.position.x) + 1,
        y: sectorOf(ship.position.y) + 1,
        danger: dangerAt(
          state,
          sectorOf(ship.position.x),
          sectorOf(ship.position.y),
        ),
      },
      shield: meter(ship.shield, ship.stats.maxShield, 'Shield'),
      armour: meter(ship.armour, 60, 'Armour'),
      hull: meter(ship.hull, 120, 'Hull', ship.hull < 30),
      fuel: meter(
        ship.fuelHundredths / 100,
        ship.stats.fuelCapacity,
        'Fuel',
        ship.fuelHundredths < 1200,
      ),
      cargo: meter(cargoUsed(ship.cargo), ship.stats.cargoCapacity, 'Cargo'),
      credits: ship.credits,
      bombs: ship.bombs,
      speed: Math.hypot(ship.velocity.x, ship.velocity.y) / SCALE,
      throttle: Math.max(0, Math.round(ship.throttleBasisPoints / 100)),
      heading: Math.round((ship.heading / 65_536) * 360),
      ...(autopilot
        ? { autopilot: `${autopilot.phase}: ${autopilot.name}` }
        : {}),
      ...(ship.miningNodeId
        ? {
            stationLock: Math.max(
              0,
              Math.min(
                1,
                (state.tick - (ship.miningStartedTick ?? state.tick)) /
                  Math.max(
                    1,
                    (ship.miningReadyTick ?? state.tick + 1) -
                      (ship.miningStartedTick ?? state.tick),
                  ),
              ),
            ),
          }
        : {}),
      objective: objectiveFor(state),
      planetsControlled: `${state.planets.filter((planet) => planet.owner === 'player').length}/${state.planets.length} planets`,
      ...(selected ? { target: targetState(state, ship, selected) } : {}),
      contacts,
      actions: selected ? actionsFor(state, ship, selected) : [],
      alerts: timeline.slice(0, 4),
      timeline,
      emergencyDrift: ship.emergency,
      minimap,
      ...(allStop ? { allStop: true } : {}),
    },
    galaxy: {
      width: state.width,
      height: state.height,
      cells,
      zoom: 1,
      ...(selectedCell
        ? { route: routeForecast(state, ship, selectedCell.x, selectedCell.y) }
        : {}),
      filters: uiState.galaxy?.filters ?? {
        planets: true,
        resources: true,
        hazards: true,
        discoveries: true,
        factions: true,
        trade: true,
      },
    },
    dock: dockState(state, ship, docked),
    records,
    settings,
    ...(overlay ? { overlay } : {}),
    ...(uiState.selectedRecordId
      ? { selectedRecordId: uiState.selectedRecordId }
      : {}),
    ...(uiState.timelineFilter
      ? { timelineFilter: uiState.timelineFilter }
      : {}),
    ...(uiState.timelineSearch
      ? { timelineSearch: uiState.timelineSearch }
      : {}),
  };
  return base;
}


function dockState(state: GameState, ship: Ship, planet: Planet): DockState {
  const materials: Material[] = ['ore', 'metal', 'crystal', 'exotic'];
  const modules: Array<{ family: UpgradeFamily; name: string }> = [
    { family: 'drill', name: 'Helix Drill' },
    { family: 'hold', name: 'Expanded Hold' },
    { family: 'cell', name: 'Frontier Cell' },
    { family: 'surveyor', name: 'Survey Array' },
    { family: 'aegis', name: 'Aegis Screen' },
    { family: 'director', name: 'Pulse Director' },
  ];
  return {
    planetName: planet.name,
    owner: relation(planet.owner),
    activeTab: dockTab,
    availableTabs:
      planet.owner === 'player'
        ? ['overview', 'market', 'shipyard']
        : ['overview', 'market'],
    credits: ship.credits,
    cargo: meter(cargoUsed(ship.cargo), ship.stats.cargoCapacity, 'Cargo'),
    fuel: meter(ship.fuelHundredths / 100, ship.stats.fuelCapacity, 'Fuel'),
    hull: meter(ship.hull, 120, 'Hull'),
    bombs: ship.bombs,
    ...(planet.owner === null
      ? {
          influence: planet.influence.player ?? 0,
          resistance: planet.resistance,
        }
      : {}),
    market: materials.map((material) => ({
      id: material,
      material,
      name: material[0]!.toUpperCase() + material.slice(1),
      playerQuantity: ship.cargo[material],
      cargoWeight: 1,
      stock: planet.market.stock[material],
      buyPrice: planet.market.prices[material],
      sellPrice: Math.floor(planet.market.prices[material] * 0.82),
      intel: 'LIVE',
      quantity: marketQuantities[material] ?? 1,
      maxQuantity: 99,
    })),
    modules: modules.flatMap((module) =>
      ([1, 2] as const).map((tier) => ({
        id: `${module.family}:${tier}`,
        name: `${module.name} T${tier}`,
        family: module.family,
        tier,
        price: tier === 1 ? 350 : 850,
        installed: ship.upgrades[module.family] === tier,
        statLabel: 'Performance',
        before: tier === 1 ? 'Standard' : 'Tier I',
        after: `Tier ${tier}`,
        ...(!planet.hasShipyard
          ? { disabledReason: 'No functioning shipyard' }
          : {}),
      })),
    ),
  };
}

function nearbyContacts(
  state: GameState,
  ship: Ship,
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
      interactable: distance <= 110,
    }));
}

function actionsFor(
  state: GameState,
  ship: Ship,
  entity: ReturnType<typeof findEntityInState>,
): ContextAction[] {
  if (!entity) return [];
  const distance =
    wrappedDistance(ship.position, entity.position, state.width, state.height) /
    SCALE;
  const autopilotAction = {
    id: 'autopilot',
    label: 'Autopilot',
    icon: 'route' as const,
  };
  if ('material' in entity)
    return [
      {
        id: ship.miningNodeId === entity.id ? 'stop-mining' : 'mine',
        label: ship.miningNodeId === entity.id ? 'Stop mining' : 'Mine',
        icon: 'mining' as const,
        ...blocked(miningBlockedReason(ship, entity, distance)),
      },
      autopilotAction,
    ];
  if ('market' in entity) {
    const result: ContextAction[] = [
      {
        id: 'dock',
        label: 'Dock',
        icon: 'planet',
        ...blocked(dockBlockedReason(state, ship, entity, distance)),
      },
      autopilotAction,
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
      { ...autopilotAction, label: 'Pursue' },
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
  return [autopilotAction];
}

/**
 * What a market pays right now, led by whatever the hold is actually carrying,
 * so the player can tell where to sell without docking to find out.
 */
function tradeSummary(ship: Ship, planet: Planet): string {
  const materials: Material[] = ['ore', 'metal', 'crystal', 'exotic'];
  const carried = materials.filter((material) => ship.cargo[material] > 0);
  const listed = (carried.length ? carried : materials)
    .filter((material) => planet.market.prices[material] > 0)
    .slice(0, 3)
    .map(
      (material) =>
        `${planet.market.prices[material]}c ${material}${carried.includes(material) ? ` ×${ship.cargo[material]}` : ''}`,
    );
  if (!listed.length) return 'Market buys nothing you carry';
  return `${carried.length ? 'Pays for your cargo' : 'Buys'}: ${listed.join(' · ')}`;
}

function targetState(
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
    rangeState: distance <= 100 ? 'Interaction range' : 'Approach required',
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

function galaxyCells(state: GameState, ship: Ship): GalaxyCell[] {
  const playerX = sectorOf(ship.position.x),
    playerY = sectorOf(ship.position.y);
  const cells: GalaxyCell[] = [];
  for (let y = 0; y < state.height; y++)
    for (let x = 0; x < state.width; x++) {
      const key = `${x},${y}`;
      const planet = state.planets.find(
        (item) => item.sectorX === x && item.sectorY === y,
      );
      const discovered =
        visited.has(key) || Boolean(planet?.owner === 'player');
      cells.push({
        x,
        y,
        discovered,
        danger: dangerAt(state, x, y),
        ...(planet && discovered
          ? {
              planet: planet.name,
              owner: relation(planet.owner),
              ...(planet.owner === 'player' || planet.owner === null
                ? { trade: `Sells here · ${planet.market.prices.ore}c ore` }
                : {}),
            }
          : {}),
        ...(discovered &&
        state.nodes.some(
          (node) =>
            node.sectorX === x && node.sectorY === y && node.remaining > 0,
        )
          ? { resources: true }
          : {}),
        ...(discovered &&
        state.hazards.some(
          (hazard) => hazard.sectorX === x && hazard.sectorY === y,
        )
          ? { hazard: 'Asteroid field' }
          : {}),
        ...(discovered &&
        state.discoveries.some(
          (item) => item.sectorX === x && item.sectorY === y && !item.claimed,
        )
          ? { discovery: true }
          : {}),
        selected: selectedCell?.x === x && selectedCell.y === y,
        player: playerX === x && playerY === y,
        intel: discovered ? 'LIVE' : 'UNKNOWN',
      });
    }
  return cells;
}

function routeForecast(
  state: GameState,
  ship: Ship,
  x: number,
  y: number,
): NonNullable<UiState['galaxy']['route']> {
  const destinationPoint = {
    x: (x * SECTOR_SIZE + SECTOR_SIZE / 2) * SCALE,
    y: (y * SECTOR_SIZE + SECTOR_SIZE / 2) * SCALE,
  };
  const distance =
    wrappedDistance(
      ship.position,
      destinationPoint,
      state.width,
      state.height,
    ) / SCALE;
  return {
    destination: `Sector ${x + 1},${y + 1}`,
    wrappedDistance: Math.round(distance),
    crossings: 0,
    estimatedFuel: Math.ceil(distance / 900),
    remainingFuel: ship.fuelHundredths / 100,
    reserveImpact: 'Emergency drift remains available',
    highestDanger: dangerAt(state, x, y),
    knownHazards: state.hazards.some(
      (hazard) => hazard.sectorX === x && hazard.sectorY === y,
    )
      ? ['Asteroid field']
      : [],
    intel: visited.has(`${x},${y}`) ? 'LIVE' : 'UNKNOWN',
    unknownConditions: !visited.has(`${x},${y}`),
  };
}

function objectiveFor(state: GameState): string {
  const ship = playerShip(state);
  if (!state.launched) return 'Launch from Hearthlight';
  if (state.stats.discoveries === 0)
    return 'Explore a new sector and investigate a signal';
  if (state.planets.filter((planet) => planet.owner === 'player').length === 1)
    return 'Build influence or conquer a neutral planet';
  return 'Control every planet in the galaxy';
}

function dangerAt(state: GameState, x: number, y: number): DangerBand {
  const home = state.planets.find((planet) => planet.acquisition === 'home')!;
  const dx = Math.min(
    Math.abs(x - home.sectorX),
    state.width - Math.abs(x - home.sectorX),
  );
  const dy = Math.min(
    Math.abs(y - home.sectorY),
    state.height - Math.abs(y - home.sectorY),
  );
  const ratio = (dx + dy) / ((state.width + state.height) / 2);
  return ratio < 0.15
    ? 'Haven'
    : ratio < 0.3
      ? 'Near Reach'
      : ratio < 0.5
        ? 'Far Reach'
        : ratio < 0.7
          ? 'Verge'
          : 'Antipode';
}

function recordFromState(state: GameState): CampaignRecord {
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

function eventCategory(type: string): TimelineCategory {
  if (type.includes('PLANET') || type.includes('CAPITULATION'))
    return 'Planets';
  if (
    type.includes('TRADE') ||
    type.includes('CARGO') ||
    type.includes('EQUIPMENT')
  )
    return 'Economy';
  if (type.includes('DISCOVERY')) return 'Discoveries';
  if (
    type.includes('DAMAGE') ||
    type.includes('WEAPON') ||
    type.includes('DESTROYED')
  )
    return 'Combat';
  return 'Rivals';
}

function meter(current: number, max: number, label: string, critical = false) {
  return {
    current: Math.max(0, Math.round(current * 10) / 10),
    max,
    label,
    ...(critical ? { critical: true } : {}),
  };
}
function playerShip(state: GameState): Ship {
  return state.ships.find((ship) => ship.id === state.playerShipId)!;
}
function sectorOf(position: number): number {
  return Math.floor(position / SCALE / SECTOR_SIZE);
}
function normalizeTurn(value: number): number {
  return ((Math.round(value) % 65_536) + 65_536) % 65_536;
}
function signedHeadingDelta(from: number, to: number): number {
  return ((to - from + 98_304) % 65_536) - 32_768;
}
function relation(owner: string | null) {
  return owner === 'player'
    ? ('player' as const)
    : owner
      ? ('hostile' as const)
      : ('neutral' as const);
}
function send(command: GameCommand): void {
  engine?.dispatch(command);
}
function flush(): void {
  engine?.stepTicks(1);
  render();
  void saveCampaign();
}
function findEntity(id: string) {
  return engine ? findEntityInState(engine.snapshot(), id) : null;
}
function findEntityInState(state: GameState, id: string) {
  return (
    state.planets.find((item) => item.id === id) ??
    state.nodes.find((item) => item.id === id) ??
    state.discoveries.find((item) => item.id === id) ??
    state.ships.find((item) => item.id === id) ??
    null
  );
}
function bearing(
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
function formatTime(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const rest = whole % 60;
  return hours
    ? `${hours}h ${minutes}m`
    : `${minutes}:${String(rest).padStart(2, '0')}`;
}
function randomSeed(): string {
  const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  return Array.from(
    crypto.getRandomValues(new Uint8Array(16)),
    (byte) => alphabet[byte % alphabet.length] ?? '0',
  ).join('');
}
function newCampaignId(): string {
  return `campaign-${Date.now().toString(36)}-${randomSeed().slice(0, 8).toLowerCase()}`;
}
function leaseKey(campaignId: string): string {
  return `venture-star:lease:${campaignId}`;
}
function acquireLease(campaignId: string): boolean {
  try {
    const key = leaseKey(campaignId);
    const now = Date.now();
    const current = JSON.parse(localStorage.getItem(key) ?? 'null') as {
      tabId?: string;
      expires?: number;
    } | null;
    if (
      current?.tabId &&
      current.tabId !== tabId &&
      (current.expires ?? 0) > now
    )
      return false;
    localStorage.setItem(
      key,
      JSON.stringify({ tabId, expires: now + LEASE_MS }),
    );
    leasedCampaignId = campaignId;
    return true;
  } catch {
    leasedCampaignId = campaignId;
    return true;
  }
}
function ownsLease(campaignId: string): boolean {
  if (leasedCampaignId !== campaignId) return false;
  try {
    const current = JSON.parse(
      localStorage.getItem(leaseKey(campaignId)) ?? 'null',
    ) as { tabId?: string; expires?: number } | null;
    return current?.tabId === tabId && (current.expires ?? 0) > Date.now();
  } catch {
    return true;
  }
}
function refreshLease(): void {
  if (leasedCampaignId) acquireLease(leasedCampaignId);
}
function releaseLease(): void {
  if (!leasedCampaignId) return;
  try {
    const key = leaseKey(leasedCampaignId);
    const current = JSON.parse(localStorage.getItem(key) ?? 'null') as {
      tabId?: string;
    } | null;
    if (current?.tabId === tabId) localStorage.removeItem(key);
  } catch {
    /* storage is optional */
  }
  leasedCampaignId = null;
}
function isUpgradeFamily(value: string | undefined): value is UpgradeFamily {
  return (
    value !== undefined &&
    ['drill', 'hold', 'cell', 'surveyor', 'aegis', 'director'].includes(value)
  );
}

function onVisibility(): void {
  if (document.hidden) {
    pauseSimulation();
    releaseLease();
  }
}
function onKey(event: KeyboardEvent): void {
  const active = event.type === 'keydown';
  if (
    ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)
  )
    event.preventDefault();
  if (event.key === 'w' || event.key === 'ArrowUp') controls.thrust = active;
  if (event.key === 'a' || event.key === 'ArrowLeft') controls.left = active;
  if (event.key === 'd' || event.key === 'ArrowRight') controls.right = active;
  if (event.key === 's' || event.key === 'ArrowDown') controls.brake = active;
  if (active && (controls.thrust || controls.left || controls.right))
    allStop = false;
  if (!active || event.repeat) return;
  if (event.key.toLowerCase() === 'x') dispatchUi({ type: 'all-stop' });
  if (event.key === ' ')
    dispatchUi(
      engine?.snapshot().running ? { type: 'pause' } : { type: 'resume' },
    );
  if (event.key.toLowerCase() === 'm' || event.key.toLowerCase() === 'g')
    dispatchUi({ type: 'navigate', destination: 'galaxy' });
}

import './styles/index.css';
import {
  GameEngine,
  type CampaignOptions,
  type GameCommand,
  type GameState,
} from './game/engine';
import { cargoUsed, wrappedDelta, wrappedDistance } from './game/math';
import { UPGRADE_COSTS } from './game/simulation';
import {
  SCALE,
  SECTOR_SIZE,
  TICKS_PER_SECOND,
  type Material,
  type Planet,
  type Ship,
  type UpgradeFamily,
} from './game/types';
import { VentureStore } from './persistence/store';
import { SpaceCanvas } from './render/spaceCanvas';
import {
  mountVentureUi,
  type CampaignRecord,
  type CampaignSetup,
  type DockState,
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
  label: string;
  entityId?: string;
  startedTick: number;
} | null = null;
let flightMessage = '';
let galaxyZoom = 1;
let selectedModuleId: string | undefined;
let settingsBeforeEdit: SettingsState | null = null;
const dismissedAlerts = new Set<string>();
let controls = {
  thrust: false,
  left: false,
  right: false,
  brake: false,
  throttle: 0,
};
let joystickActive = false;
let saveState: UiState['saveState'] = 'Saved';
let sealed = false;
let sealing = false;
let lastRenderedTick = -1;
let uiState = emptyUiState();
const ui = mountVentureUi(root, uiState, dispatchUi);
const space = new SpaceCanvas(ui.getCanvasHost(), {
  reducedMotion: () => settings.reducedMotion,
  destination: () => autopilot,
  onWorldTap: (x, y) => {
    if (!engine || destination !== 'flight' || overlay) return;
    clearFlightInputs();
    autopilot = {
      x,
      y,
      label: 'Selected coordinates',
      startedTick: engine.snapshot().tick,
    };
    destination = 'flight';
    resumeSimulation();
  },
  onEntityTap: (id) => {
    if (!engine || destination !== 'flight' || overlay) return;
    if (selectedId === id) setAutopilotTo(id);
    else {
      selectedId = id;
      send({ type: 'selectTarget', targetId: id });
      flush();
      render();
    }
  },
});

void boot();

async function boot(): Promise<void> {
  settings = await store.getSetting('settings', DEFAULT_SETTINGS);
  uiState.galaxy.filters = await store.getSetting(
    'mapFilters',
    uiState.galaxy.filters,
  );
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
  window.addEventListener('blur', clearFlightInputs);
  window.addEventListener('resize', clearFlightInputs);
  document.addEventListener('focusin', (event) => {
    if (
      event.target instanceof HTMLElement &&
      event.target.matches('input, select, textarea')
    )
      clearFlightInputs();
  });
  setInterval(gameLoop, 1000 / TICKS_PER_SECOND);
  setInterval(() => void saveCampaign(), 5000);
  setInterval(() => void journalCampaign(), 10_000);
  setInterval(refreshLease, 2_000);
  window.addEventListener('beforeunload', releaseLease);
  installTestHook();
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
  space.setState(state);
  const player = playerShip(state);
  visited.add(`${sectorOf(player.position.x)},${sectorOf(player.position.y)}`);
  if (advanced && state.tick !== lastRenderedTick && state.tick % 5 === 0) {
    lastRenderedTick = state.tick;
    render();
  }
  if (state.outcome !== 'active') void sealIfNeeded(state);
}

function applyFlightIntent(state: GameState): void {
  const ship = playerShip(state);
  if (
    ship.miningNodeId &&
    !autopilot &&
    !controls.thrust &&
    !controls.left &&
    !controls.right &&
    !controls.brake
  )
    return;
  let turn: -1 | 0 | 1 = controls.left ? -1 : controls.right ? 1 : 0;
  let throttle = controls.thrust ? 1 : controls.throttle;
  let brake = controls.brake;
  if (autopilot) {
    const target = autopilot.entityId
      ? findEntityInState(state, autopilot.entityId)
      : null;
    if (
      autopilot.entityId &&
      (!target || ('destroyed' in target && target.destroyed))
    ) {
      interruptAutopilot('Destination is no longer available');
      send({ type: 'flight', throttle: 0, turn: 0, brake: true });
      return;
    }
    if (ship.lastDamageTick > autopilot.startedTick) {
      interruptAutopilot('Incoming damage — take control');
      send({ type: 'flight', throttle: 0, turn: 0, brake: true });
      return;
    }
    if (target) {
      autopilot.x = target.position.x;
      autopilot.y = target.position.y;
    }
    const worldWidth = state.width * SECTOR_SIZE * SCALE;
    const worldHeight = state.height * SECTOR_SIZE * SCALE;
    const dx = wrappedDelta(ship.position.x, autopilot.x, worldWidth);
    const dy = wrappedDelta(ship.position.y, autopilot.y, worldHeight);
    const distance = Math.hypot(dx, dy) / SCALE;
    const speed = Math.hypot(ship.velocity.x, ship.velocity.y) / SCALE;
    const arrival = target ? 78 : 20;
    if (distance <= arrival && speed <= 2) {
      flightMessage = `Arrived: ${autopilot.label}`;
      autopilot = null;
      controls.throttle = 0;
      throttle = 0;
      brake = true;
    } else {
      const desired = normalizeTurn(
        (Math.atan2(dy, dx) / (Math.PI * 2)) * 65_536,
      );
      const error = signedHeadingDelta(ship.heading, desired);
      turn = Math.abs(error) < 350 ? 0 : error < 0 ? -1 : 1;
      brake = distance <= (speed * speed) / 300 + arrival - 8;
      throttle =
        brake || Math.abs(error) > 1400
          ? 0
          : speed >= 180
            ? 0
            : distance > 240
              ? 0.82
              : 0.25;
      flightMessage = `${distance < 240 ? 'Approaching' : 'Travelling'}: ${autopilot.label} · ${Math.round(distance)} wu`;
    }
  }
  send({
    type: 'flight',
    throttle,
    turn,
    ...(brake ? { brake: true } : {}),
  });
}

function clearFlightInputs(): void {
  joystickActive = false;
  controls = {
    thrust: false,
    left: false,
    right: false,
    brake: false,
    throttle: 0,
  };
}

function interruptAutopilot(reason: string): void {
  if (autopilot) flightMessage = `Interrupted: ${reason}`;
  autopilot = null;
  controls.throttle = 0;
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
      if (action.overlay === 'settings') settingsBeforeEdit = { ...settings };
      overlay = action.overlay;
      pauseSimulation();
      break;
    case 'close-overlay':
      if (overlay === 'settings' && settingsBeforeEdit)
        settings = settingsBeforeEdit;
      settingsBeforeEdit = null;
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
      void returnHome();
      return;
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
      if (action.active) interruptAutopilot('Manual control');
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
        interruptAutopilot('Manual steering');
        controls.throttle = Math.max(
          0.2,
          Math.min(1, Math.hypot(action.x, action.y)),
        );
      } else {
        controls.throttle = 0;
      }
      return;
    case 'clear-flight-inputs':
      clearFlightInputs();
      return;
    case 'throttle':
      interruptAutopilot('Manual throttle');
      controls.throttle = Math.max(0, Math.min(1, action.value / 100));
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
      galaxyZoom = Math.max(0.5, Math.min(3, galaxyZoom + action.delta * 0.25));
      break;
    case 'galaxy-filter':
      uiState.galaxy.filters[action.filter] = action.enabled;
      void store.setSetting('mapFilters', uiState.galaxy.filters);
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
      selectedModuleId = action.moduleId;
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
      dismissedAlerts.add(action.alertId);
      break;
    case 'settings-change':
      settings = action.settings;
      break;
    case 'settings-apply':
      settings = action.settings;
      overlay = undefined;
      settingsBeforeEdit = null;
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

async function returnHome(): Promise<void> {
  pauseSimulation();
  await saveCampaign();
  if (saveState === 'Save failed') {
    overlay = 'pause';
    render();
    return;
  }
  destination = 'home';
  overlay = undefined;
  releaseLease();
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
  flightMessage = '';
  clearFlightInputs();
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
  clearFlightInputs();
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

function setAutopilotTo(id: string): void {
  const entity = findEntity(id);
  if (!entity) return;
  selectedId = id;
  clearFlightInputs();
  send({ type: 'stopMining' });
  send({ type: 'selectTarget', targetId: id });
  autopilot = {
    x: entity.position.x,
    y: entity.position.y,
    label:
      'name' in entity
        ? entity.name
        : 'material' in entity
          ? `${entity.material} deposit`
          : 'kind' in entity
            ? entity.kind.replaceAll('-', ' ')
            : 'contact',
    entityId: id,
    startedTick: engine!.snapshot().tick,
  };
  destination = 'flight';
  resumeSimulation();
}

function startSelectedRoute(): void {
  if (!engine || !selectedCell) return;
  autopilot = {
    x: (selectedCell.x * SECTOR_SIZE + SECTOR_SIZE / 2) * SCALE,
    y: (selectedCell.y * SECTOR_SIZE + SECTOR_SIZE / 2) * SCALE,
    label: `Sector ${selectedCell.x + 1},${selectedCell.y + 1}`,
    startedTick: engine.snapshot().tick,
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
    pauseSimulation();
    overlay = 'pause';
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
  try {
    await store.journalCampaign(
      state.campaignId,
      {
        serialized: engine.serialize(),
        visited: [...visited].sort(),
        startedAt,
      } satisfies StoredCampaign,
      () => ownsLease(state.campaignId),
    );
  } catch {
    saveState = 'Save failed';
    pauseSimulation();
    overlay = 'pause';
    render();
  }
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

function buildUiState(): UiState {
  if (!engine)
    return { ...emptyUiState(), settings, ...(overlay ? { overlay } : {}) };
  const state = engine.snapshot();
  const ship = playerShip(state);
  const docked =
    state.planets.find((planet) => planet.id === ship.dockedPlanetId) ??
    state.planets.find((planet) => planet.owner === 'player')!;
  const selected = selectedId ? findEntityInState(state, selectedId) : null;
  const contacts = nearbyContacts(state, ship);
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
      ...(flightMessage || autopilot
        ? { autopilot: flightMessage || `Travelling: ${autopilot!.label}` }
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
      alerts: timeline
        .filter((event) => !dismissedAlerts.has(event.id))
        .slice(0, 1),
      timeline,
      emergencyDrift: ship.emergency,
    },
    galaxy: {
      width: state.width,
      height: state.height,
      cells: galaxyCells(state, ship),
      zoom: galaxyZoom,
      ...(selectedCell
        ? { route: routeForecast(state, ship, selectedCell.x, selectedCell.y) }
        : {}),
      filters: uiState.galaxy?.filters ?? {
        planets: true,
        resources: true,
        hazards: true,
        discoveries: true,
        factions: true,
        trade: false,
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

function emptyUiState(): UiState {
  const zero = meter(0, 1, '-');
  return {
    destination: 'home',
    pauseReasons: [],
    saveState: 'Saved',
    home: {
      version: '1.0.0',
      recordCount: records.length,
      offline: !navigator.onLine,
    },
    flight: {
      campaignName: 'Venture Star',
      sector: { x: 1, y: 1, danger: 'Haven' },
      shield: zero,
      armour: zero,
      hull: zero,
      fuel: zero,
      cargo: zero,
      credits: 0,
      bombs: 0,
      speed: 0,
      throttle: 0,
      heading: 0,
      contacts: [],
      actions: [],
      alerts: [],
      timeline: [],
    },
    galaxy: {
      width: 10,
      height: 10,
      cells: [],
      zoom: 1,
      filters: {
        planets: true,
        resources: true,
        hazards: true,
        discoveries: true,
        factions: true,
        trade: false,
      },
    },
    dock: {
      planetName: 'Hearthlight',
      owner: 'player',
      activeTab: 'overview',
      availableTabs: ['overview', 'market', 'shipyard'],
      credits: 0,
      cargo: zero,
      fuel: zero,
      hull: zero,
      bombs: 0,
      market: [],
      modules: [],
    },
    records,
    settings,
  };
}

function dockState(state: GameState, ship: Ship, planet: Planet): DockState {
  const materials: Material[] = ['ore', 'metal', 'crystal', 'exotic'];
  const modules: Array<{ family: UpgradeFamily; name: string }> = [
    { family: 'drill', name: 'Deepglass Drill' },
    { family: 'hold', name: 'Folded Hold' },
    { family: 'cell', name: 'Longwake Cell' },
    { family: 'surveyor', name: 'Prism Surveyor' },
    { family: 'aegis', name: 'Aegis Loom' },
    { family: 'director', name: 'Helix Director' },
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
    ...(selectedModuleId ? { selectedModuleId } : {}),
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
      ([1, 2] as const).map((tier) => {
        const cost = UPGRADE_COSTS[module.family][tier];
        const missing = Object.entries(cost.cargo).filter(
          ([material, amount]) => ship.cargo[material as Material] < amount,
        );
        const disabledReason = !planet.hasShipyard
          ? 'No functioning shipyard'
          : (ship.upgrades[module.family] ?? 0) >= tier
            ? 'Already fitted or superseded'
            : ship.credits < cost.credits
              ? `Need ${cost.credits - ship.credits} more credits`
              : missing.length
                ? `Need ${missing.map(([material, amount]) => `${amount - ship.cargo[material as Material]} ${material}`).join(' + ')}`
                : undefined;
        const previews = {
          drill: [
            'Extraction',
            `${ship.stats.miningMilliPerSecond / 1000} ore/s`,
            `${tier === 1 ? 5.2 : 6.8} ore/s`,
          ],
          hold: [
            'Cargo capacity',
            `${ship.stats.cargoCapacity} CU`,
            `${tier === 1 ? 36 : 52} CU`,
          ],
          cell: [
            'Fuel capacity',
            `${ship.stats.fuelCapacity} FU`,
            `${tier === 1 ? 112 : 150} FU`,
          ],
          surveyor: [
            'Sensor range',
            `${ship.stats.sensorRange} wu`,
            `${tier === 1 ? 430 : 560} wu`,
          ],
          aegis: [
            'Shield capacity',
            `${ship.stats.maxShield} pt`,
            `${tier === 1 ? 78 : 112} pt`,
          ],
          director: [
            'Cannon damage',
            `${ship.stats.weaponDamage} pt`,
            `${tier === 1 ? 15 : 19} pt`,
          ],
        } as const;
        const preview = previews[module.family];
        return {
          id: `${module.family}:${tier}`,
          name: `${module.name} T${tier}`,
          family: module.family,
          tier,
          price: cost.credits,
          materialCost: Object.entries(cost.cargo)
            .map(([material, amount]) => `${amount} ${material}`)
            .join(' + '),
          installed: ship.upgrades[module.family] === tier,
          statLabel: preview[0],
          before: preview[1],
          after: preview[2],
          ...(disabledReason ? { disabledReason } : {}),
        };
      }),
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
      interactable: distance <= 96,
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
  const far = distance > 96 ? 'Move within 96 wu' : undefined;
  if ('material' in entity) {
    const miningBlocked =
      far ??
      (ship.emergency
        ? 'Refuel before mining'
        : cargoUsed(ship.cargo) >= ship.stats.cargoCapacity
          ? 'Cargo full — return home to sell'
          : entity.remaining <= 0
            ? 'Deposit depleted'
            : Math.hypot(ship.velocity.x, ship.velocity.y) / SCALE > 8
              ? 'Slow below 8 wu/s to acquire a mining lock'
              : ship.throttleBasisPoints > 1_500
                ? 'Reduce throttle below 15% to acquire a mining lock'
                : undefined);
    return [
      {
        id: ship.miningNodeId === entity.id ? 'stop-mining' : 'mine',
        label: ship.miningNodeId === entity.id ? 'Stop mining' : 'Mine',
        icon: 'mining' as const,
        ...(miningBlocked && ship.miningNodeId !== entity.id
          ? { disabledReason: miningBlocked }
          : {}),
      },
      { id: 'autopilot', label: 'Autopilot', icon: 'route' as const },
    ];
  }
  if ('market' in entity) {
    const result: ContextAction[] = [
      {
        id: 'dock',
        label: 'Dock',
        icon: 'planet',
        ...(far
          ? { disabledReason: far }
          : Math.hypot(ship.velocity.x, ship.velocity.y) / SCALE > 20
            ? { disabledReason: 'Slow below 20 wu/s to dock' }
            : entity.owner !== null && entity.owner !== 'player'
              ? { disabledReason: 'Rival planet — acquire control first' }
              : {}),
      },
      { id: 'autopilot', label: 'Autopilot', icon: 'route' },
    ];
    if (entity.owner !== 'player')
      result.push({
        id: 'bomb',
        label: 'Bomb',
        icon: 'bomb' as const,
        destructive: true,
        ...(distance > 260 ? { disabledReason: 'Outside bomb range' } : {}),
      });
    return result;
  }
  if ('faction' in entity)
    return [
      { id: 'autopilot', label: 'Pursue', icon: 'route' as const },
      {
        id: 'bomb',
        label: 'Bomb',
        icon: 'bomb' as const,
        destructive: true,
        ...(distance > 260 ? { disabledReason: 'Outside bomb range' } : {}),
      },
      {
        id: ship.holdFire ? 'autofire' : 'hold-fire',
        label: ship.holdFire ? 'Auto fire' : 'Hold fire',
        icon: 'weapon' as const,
      },
    ];
  return [{ id: 'autopilot', label: 'Autopilot', icon: 'route' as const }];
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
    actions: actionsFor(state, ship, entity),
  };
}

function galaxyCells(state: GameState, ship: Ship): GalaxyCell[] {
  const filters = uiState.galaxy.filters;
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
        ...(discovered ? { danger: dangerAt(state, x, y) } : {}),
        ...(planet && discovered && filters.planets
          ? { planet: planet.name }
          : {}),
        ...(planet && discovered && filters.factions
          ? { owner: relation(planet.owner) }
          : {}),
        ...(discovered &&
        filters.resources &&
        state.nodes.some(
          (node) =>
            node.sectorX === x && node.sectorY === y && node.remaining > 0,
        )
          ? { resources: true }
          : {}),
        ...(discovered &&
        filters.hazards &&
        state.hazards.some(
          (hazard) => hazard.sectorX === x && hazard.sectorY === y,
        )
          ? { hazard: 'Asteroid field' }
          : {}),
        ...(discovered &&
        filters.discoveries &&
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
  const dx = wrappedDelta(
    ship.position.x,
    destinationPoint.x,
    state.width * SECTOR_SIZE * SCALE,
  );
  const dy = wrappedDelta(
    ship.position.y,
    destinationPoint.y,
    state.height * SECTOR_SIZE * SCALE,
  );
  const crossings =
    Number(Math.abs(destinationPoint.x - ship.position.x - dx) > SCALE) +
    Number(Math.abs(destinationPoint.y - ship.position.y - dy) > SCALE);
  const estimatedFuel =
    Math.ceil(
      ((distance / 180) * (0.018 + 0.0000018 * 180 ** 2) + 0.12) * 1.05 * 10,
    ) / 10;
  return {
    destination: `Sector ${x + 1},${y + 1}`,
    wrappedDistance: Math.round((distance / SECTOR_SIZE) * 100) / 100,
    crossings,
    estimatedFuel,
    remainingFuel: Math.max(0, ship.fuelHundredths / 100 - estimatedFuel),
    reserveImpact:
      estimatedFuel > ship.fuelHundredths / 100
        ? 'Needs emergency drift — weapons and mining offline'
        : 'Normal fuel · direct-route cruise estimate',
    highestDanger: dangerAt(state, x, y),
    knownHazards:
      visited.has(`${x},${y}`) &&
      state.hazards.some(
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
  const ratio =
    Math.hypot(dx, dy) /
    Math.hypot(Math.floor(state.width / 2), Math.floor(state.height / 2));
  return (['Haven', 'Near Reach', 'Far Reach', 'Verge', 'Antipode'] as const)[
    Math.min(4, Math.floor(ratio * 5))
  ]!;
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
    if (destination === 'flight') overlay = 'pause';
    releaseLease();
    render();
  }
}
function onKey(event: KeyboardEvent): void {
  const active = event.type === 'keydown';
  const typing =
    event.target instanceof HTMLElement &&
    (event.target.matches('input,select,textarea') ||
      event.target.isContentEditable);
  if (typing || !engine) return;
  const key = event.key.toLowerCase();
  const flight = destination === 'flight' && !overlay;
  const binding = (
    {
      KeyW: 'thrust',
      ArrowUp: 'thrust',
      KeyA: 'left',
      ArrowLeft: 'left',
      KeyD: 'right',
      ArrowRight: 'right',
      KeyS: 'brake',
      ArrowDown: 'brake',
      KeyX: 'brake',
    } as const
  )[event.code as 'KeyW'];
  if (binding && (flight || !active)) {
    event.preventDefault();
    controls[binding] = active;
    if (active) interruptAutopilot('Manual control');
  }
  if (!active || event.repeat) return;
  if (key === 'escape') {
    if (overlay) dispatchUi({ type: 'close-overlay' });
    else if (destination === 'flight') dispatchUi({ type: 'pause' });
    else if (destination === 'galaxy')
      dispatchUi({ type: 'navigate', destination: 'flight' });
    return;
  }
  if (overlay || destination === 'home' || destination === 'history') return;
  if (key === ' ' && flight && event.target === space.canvas) {
    event.preventDefault();
    dispatchUi(
      engine?.snapshot().running ? { type: 'pause' } : { type: 'resume' },
    );
  }
  if (key === 'p' && flight) dispatchUi({ type: 'pause' });
  if (key === 'm' || key === 'g')
    dispatchUi({
      type: 'navigate',
      destination: destination === 'galaxy' ? 'flight' : 'galaxy',
    });
  if (!flight) return;
  if (key === 't') dispatchUi({ type: 'open-overlay', overlay: 'timeline' });
  if (key === 'r' && selectedId) {
    if (autopilot) interruptAutopilot('Route cancelled');
    else setAutopilotTo(selectedId);
    render();
  }
  if (key === 'h') {
    send({
      type: 'setHoldFire',
      hold: !playerShip(engine.snapshot()).holdFire,
    });
    flush();
    render();
  }
  if (key === 'e' && selectedId) {
    const state = engine.snapshot();
    const action = actionsFor(
      state,
      playerShip(state),
      findEntityInState(state, selectedId),
    ).find((item) => !item.disabledReason && !item.destructive);
    if (action)
      dispatchUi({
        type: 'context-action',
        actionId: action.id,
        targetId: selectedId,
      });
  }
}

function installTestHook(): void {
  if (!import.meta.env.DEV && import.meta.env.MODE !== 'test') return;
  Object.defineProperty(window, '__GAME__', {
    value: Object.freeze({
      get state() {
        return engine?.snapshot() ?? null;
      },
      input(command: GameCommand) {
        send(command);
      },
      tick(frames: number) {
        return engine?.stepTicks(frames) ?? null;
      },
      setPaused(paused: boolean) {
        send({ type: 'pause', paused });
        flush();
      },
      create(options: CampaignOptions) {
        engine = GameEngine.create(options);
        render();
      },
    }),
    configurable: false,
  });
}

declare global {
  interface Window {
    __GAME__?: Readonly<{
      readonly state: GameState | null;
      input(command: GameCommand): void;
      tick(frames: number): GameState | null;
      setPaused(paused: boolean): void;
      create(options: CampaignOptions): void;
    }>;
  }
}

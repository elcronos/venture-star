import type {
  CampaignRecord,
  MeterState,
  SettingsState,
  UiState,
} from './types';

const meter = (
  current: number,
  max: number,
  label: string,
  critical = false,
): MeterState => ({ current, max, label, ...(critical ? { critical } : {}) });

/** The screen state before any campaign exists, and after one is cleared. */
export function emptyUiState(
  records: CampaignRecord[],
  settings: SettingsState,
): UiState {
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
      minimap: {
        width: 10,
        height: 10,
        sector: { x: 0, y: 0 },
        offset: { x: 0.5, y: 0.5 },
        cells: [],
      },
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
        trade: true,
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

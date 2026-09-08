/** Stable UI integration entry point. */
export {
  BOMB_RANGE_MILLI,
  DOCK_SPEED_MILLI,
  INTERACTION_RANGE_MILLI,
  MINING_SPEED_MILLI,
  MINING_THROTTLE_MAX_BP,
  GameEngine,
  canonicalStringify,
  deserializeGame,
  serializeGame,
} from './simulation';
export type {
  GameCommand,
  GameState,
  CommandResult,
  CampaignOptions,
} from './types';

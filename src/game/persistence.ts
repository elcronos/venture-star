import { z } from 'zod';
import type { GameState } from './types';

export function serializeGame(state: GameState): string {
  return canonicalStringify(state);
}

export function deserializeGame(serialized: string): GameState {
  const value: unknown = JSON.parse(serialized);
  return validateRestoredState(value);
}

const restoredStateSchema = z
  .object({
    schemaVersion: z.literal(1),
    rulesVersion: z.literal('1.0.0'),
    generatorVersion: z.union([z.literal(1), z.literal(2)]),
    campaignId: z.string().min(1),
    seed: z.string().min(1),
    width: z.number().int().min(10).max(30),
    height: z.number().int().min(10).max(30),
    difficulty: z.enum(['Explorer', 'Captain', 'Strategist']),
    tick: z.number().int().nonnegative(),
    running: z.boolean(),
    launched: z.boolean(),
    outcome: z.enum(['active', 'victory', 'defeat']),
    sealedAtTick: z.number().int().nonnegative().nullable(),
    commandSequence: z.number().int().nonnegative(),
    playerShipId: z.string().min(1),
    planets: z
      .array(
        z
          .object({
            id: z.string(),
            owner: z.union([
              z.literal('player'),
              z.string().regex(/^rival-\d+$/),
              z.null(),
            ]),
            position: z.object({
              x: z.number().finite(),
              y: z.number().finite(),
            }),
          })
          .passthrough(),
      )
      .min(1),
    ships: z
      .array(
        z
          .object({
            id: z.string(),
            faction: z.union([
              z.literal('player'),
              z.string().regex(/^rival-\d+$/),
            ]),
            position: z.object({
              x: z.number().finite(),
              y: z.number().finite(),
            }),
            hull: z.number().finite(),
            destroyed: z.boolean(),
          })
          .passthrough(),
      )
      .min(1),
    nodes: z.array(
      z
        .object({
          id: z.string(),
          remaining: z.number().finite(),
          position: z.object({
            x: z.number().finite(),
            y: z.number().finite(),
          }),
        })
        .passthrough(),
    ),
    discoveries: z.array(
      z.object({ id: z.string(), claimed: z.boolean() }).passthrough(),
    ),
    hazards: z.array(
      z.object({ id: z.string(), radius: z.number().positive() }).passthrough(),
    ),
    factions: z.array(z.object({ id: z.string() }).passthrough()),
    bombs: z.array(
      z.object({ id: z.string(), impactTick: z.number().int() }).passthrough(),
    ),
    events: z.array(
      z
        .object({ id: z.string(), tick: z.number().int(), type: z.string() })
        .passthrough(),
    ),
    stats: z
      .object({
        fuelConsumedHundredths: z.number().finite(),
        distanceMilli: z.number().finite(),
        tradeProfit: z.number().finite(),
        discoveries: z.number().finite(),
        shipsDestroyed: z.number().finite(),
      })
      .passthrough(),
  })
  .passthrough();

export function validateRestoredState(state: unknown): GameState {
  const copy = structuredClone(
    restoredStateSchema.parse(state),
  ) as unknown as GameState;
  if (
    copy.schemaVersion !== 1 ||
    copy.rulesVersion !== '1.0.0' ||
    !Array.isArray(copy.planets) ||
    !Array.isArray(copy.ships) ||
    copy.planets.length === 0
  )
    throw new Error('Unsupported or malformed game state');
  if (
    !copy.ships.some(
      (ship) => ship.id === copy.playerShipId && ship.faction === 'player',
    )
  )
    throw new Error('Malformed player ship reference');
  if (copy.outcome !== 'active') copy.running = false;
  return copy;
}

export function canonicalStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    if (typeof value === 'number' && !Number.isFinite(value))
      throw new Error('Cannot serialize non-finite number');
    return JSON.stringify(value);
  }
  if (Array.isArray(value))
    return `[${value.map(canonicalStringify).join(',')}]`;
  return `{${Object.keys(value as object)
    .sort()
    .map(
      (key) =>
        `${JSON.stringify(key)}:${canonicalStringify((value as Record<string, unknown>)[key])}`,
    )
    .join(',')}}`;
}

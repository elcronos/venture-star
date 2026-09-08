import { describe, expect, it } from 'vitest';
import {
  RandomStream,
  canonicalSeed,
  createGame,
  validateOpening,
  wrap,
  wrappedDelta,
} from '../../src/game';

describe('deterministic galaxy generation', () => {
  it('canonicalizes Crockford aliases and rejects invalid seeds', () => {
    expect(canonicalSeed('o00000000000000l')).toBe('0000000000000001');
    expect(() => canonicalSeed('000000000000000U')).toThrow(/Crockford/);
  });

  it('replays the same seed exactly and isolates random domains', () => {
    const a = createGame({
      seed: '0000000000000000',
      width: 10,
      height: 10,
      rivals: 1,
      campaignId: 'a',
    });
    const b = createGame({
      seed: '0000000000000000',
      width: 10,
      height: 10,
      rivals: 1,
      campaignId: 'b',
    });
    expect({ ...a, campaignId: 'same' }).toEqual({ ...b, campaignId: 'same' });
    const topology = new RandomStream(a.seed, 'topology');
    const nodes = new RandomStream(a.seed, 'nodes');
    expect(topology.nextUint32()).not.toBe(nodes.nextUint32());
  });

  it('generates valid rectangular 10-30 toroidal galaxies', () => {
    for (const [width, height, rivals] of [
      [10, 10, 1],
      [15, 11, 2],
      [30, 30, 3],
    ] as const) {
      const state = createGame({
        seed: '01ARZ3NDEKTSV4RR',
        width,
        height,
        rivals,
      });
      expect(state.planets).toHaveLength(
        Math.max(8, Math.min(90, Math.round(width * height * 0.1))),
      );
      expect(
        new Set(
          state.planets.map((planet) => `${planet.sectorX},${planet.sectorY}`),
        ).size,
      ).toBe(state.planets.length);
      expect(validateOpening(state)).toMatchObject({
        valid: true,
        reachablePlanets: state.planets.length,
      });
      const report = validateOpening(state);
      const ship = state.ships.find((item) => item.id === state.playerShipId)!;
      const node = state.nodes.find(
        (item) => item.id === report.openingNodeId,
      )!;
      expect(
        Math.hypot(
          node.position.x - ship.position.x,
          node.position.y - ship.position.y,
        ) / 1_000,
      ).toBe(240);
    }
  });

  it('passes a deterministic 250-seed smoke sweep', () => {
    const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
    for (let value = 0; value < 250; value++) {
      let remaining = value;
      let seed = '';
      for (let digit = 0; digit < 16; digit++) {
        seed = alphabet[remaining % 32]! + seed;
        remaining = Math.floor(remaining / 32);
      }
      const width = 10 + (value % 21);
      const height = 10 + ((value * 7) % 21);
      const rivals = 1 + (value % 3);
      expect(
        validateOpening(createGame({ seed, width, height, rivals })).valid,
        seed,
      ).toBe(true);
    }
  });

  it('uses deterministic wrap ties', () => {
    expect(wrap(-1, 10)).toBe(9);
    expect(wrappedDelta(0, 5, 10)).toBe(-5);
    expect(wrappedDelta(9, 0, 10)).toBe(1);
  });
});

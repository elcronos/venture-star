import { describe, expect, it } from 'vitest';
import { GameEngine, SCALE, createGame, deserializeGame } from '../../src/game';

const SEED = '01ARZ3NDEKTSV4RR';

describe('GameEngine command simulation', () => {
  it('queues launch and produces deterministic fixed-step movement and fuel burn', () => {
    const first = GameEngine.create({ seed: SEED });
    const second = GameEngine.create({ seed: SEED });
    for (const engine of [first, second]) {
      engine.dispatch({ type: 'launch' });
      engine.stepTicks(1);
      engine.dispatch({ type: 'flight', throttle: 1, turn: 0 });
      engine.stepTicks(200);
    }
    expect(first.snapshot()).toEqual(second.snapshot());
    const ship = first
      .snapshot()
      .ships.find((candidate) => candidate.id === 'ship-player')!;
    expect(Math.hypot(ship.velocity.x, ship.velocity.y)).toBeLessThanOrEqual(
      220 * SCALE,
    );
    expect(ship.fuelHundredths).toBeLessThan(8000);
  });

  it('mines finite cargo without consuming a node beyond hold capacity', () => {
    const state = createGame({ seed: SEED });
    const ship = state.ships[0]!;
    const node = state.nodes.find((candidate) => candidate.material === 'ore')!;
    state.launched = true;
    state.running = true;
    ship.dockedPlanetId = null;
    ship.position = { ...node.position };
    ship.stats.cargoCapacity = 3;
    const engine = new GameEngine(state);
    engine.dispatch({ type: 'startMining', nodeId: node.id });
    engine.stepTicks(100);
    const after = engine.snapshot();
    const afterShip = after.ships[0]!;
    const afterNode = after.nodes.find(
      (candidate) => candidate.id === node.id,
    )!;
    expect(afterShip.cargo.ore).toBe(3);
    expect(afterNode.remaining).toBe(node.remaining - 3);
  });

  it('holds station while mining through idle flight frames and supports active scans', () => {
    const state = createGame({ seed: SEED });
    const ship = state.ships[0]!;
    const node = state.nodes.find((candidate) => candidate.material === 'ore')!;
    state.launched = true;
    state.running = true;
    ship.dockedPlanetId = null;
    ship.position = { ...node.position };
    ship.velocity = { x: 6_000, y: 1_000 };
    const engine = new GameEngine(state);
    engine.dispatch({ type: 'startMining', nodeId: node.id });
    engine.stepTicks(1);
    engine.dispatch({ type: 'flight', throttle: 0, turn: 0 });
    engine.stepTicks(10);
    engine.dispatch({ type: 'scan' });
    engine.stepTicks(1);
    const after = engine.snapshot();
    const afterShip = after.ships[0]!;
    expect(afterShip.miningNodeId).toBe(node.id);
    expect(afterShip.velocity).toEqual({ x: 0, y: 0 });
    expect(afterShip.cargo.ore).toBe(0);
    expect(after.events.some((event) => event.type === 'SCAN_PULSE')).toBe(
      true,
    );
    engine.stepTicks(40);
    expect(engine.snapshot().ships[0]!.cargo.ore).toBeGreaterThan(0);
  });

  it('rejects a mining lock while the flagship is moving too quickly', () => {
    const state = createGame({ seed: SEED });
    const ship = state.ships[0]!;
    const node = state.nodes.find((candidate) => candidate.material === 'ore')!;
    state.launched = true;
    state.running = true;
    ship.dockedPlanetId = null;
    ship.position = { ...node.position };
    ship.velocity = { x: 9_000, y: 0 };
    const engine = new GameEngine(state);
    engine.dispatch({ type: 'startMining', nodeId: node.id });
    engine.stepTicks(1);
    expect(engine.snapshot().ships[0]!.miningNodeId).toBeNull();
  });

  it('commits atomic docked trade and refit commands while management is paused', () => {
    const state = createGame({ seed: SEED });
    const ship = state.ships[0]!;
    const home = state.planets[0]!;
    ship.dockedPlanetId = home.id;
    ship.cargo.ore = 10;
    ship.credits = 500;
    const engine = new GameEngine(state);
    engine.dispatch({
      type: 'trade',
      planetId: home.id,
      material: 'ore',
      side: 'sell',
      quantity: 3,
    });
    engine.stepTicks(1);
    engine.dispatch({
      type: 'buyUpgrade',
      planetId: home.id,
      family: 'drill',
      tier: 1,
    });
    engine.stepTicks(1);
    const after = engine.snapshot().ships[0]!;
    expect(after.upgrades.drill).toBe(1);
    expect(after.stats.miningMilliPerSecond).toBe(5200);
    expect(after.cargo.ore).toBe(3);
  });

  it('restores dock services and manufactures consumable bombs only on a friendly world', () => {
    const state = createGame({ seed: SEED });
    const ship = state.ships[0]!;
    const home = state.planets[0]!;
    ship.dockedPlanetId = home.id;
    ship.fuelHundredths = 2_000;
    ship.hull = 90;
    ship.armour = 40;
    ship.credits = 1_000;
    ship.cargo.metal = 10;
    ship.cargo.crystal = 5;
    ship.bombs = 0;
    const engine = new GameEngine(state);
    engine.dispatch({ type: 'refuel', planetId: home.id, amount: 10 });
    engine.stepTicks(1);
    engine.dispatch({ type: 'repair', planetId: home.id });
    engine.stepTicks(1);
    engine.dispatch({ type: 'buyBomb', planetId: home.id, quantity: 1 });
    engine.stepTicks(1);
    const after = engine.snapshot().ships[0]!;
    expect(after.fuelHundredths).toBe(3_000);
    expect(after).toMatchObject({ hull: 120, armour: 60, bombs: 1 });
    expect(
      engine.snapshot().events.some((event) => event.type === 'BOMB_BUILT'),
    ).toBe(true);
  });

  it('lets a docked player repeatedly aid a neutral world until peaceful capture', () => {
    const state = createGame({ seed: SEED });
    const ship = state.ships[0]!;
    const neutral = state.planets.find((planet) => planet.owner === null)!;
    ship.dockedPlanetId = neutral.id;
    ship.position = { ...neutral.position };
    ship.credits = 1_000;
    ship.cargo.ore = 20;
    neutral.resistance = 44;
    const engine = new GameEngine(state);
    engine.dispatch({ type: 'influence', planetId: neutral.id, action: 'aid' });
    engine.stepTicks(1);
    engine.dispatch({ type: 'influence', planetId: neutral.id, action: 'aid' });
    engine.stepTicks(1);
    expect(
      engine.snapshot().planets.find((planet) => planet.id === neutral.id),
    ).toMatchObject({ owner: 'player', acquisition: 'peaceful' });
  });

  it('automatically fires only after hostility and resolves layered damage', () => {
    const state = createGame({ seed: SEED });
    const player = state.ships[0]!;
    const rival = state.ships[1]!;
    state.launched = true;
    state.running = true;
    player.dockedPlanetId = null;
    rival.dockedPlanetId = null;
    rival.position = {
      x: player.position.x + 100 * SCALE,
      y: player.position.y,
    };
    state.factions[0]!.relationToPlayer = 'hostile';
    const engine = new GameEngine(state);
    engine.dispatch({ type: 'selectTarget', targetId: rival.id });
    engine.stepTicks(20);
    const after = engine.snapshot().ships.find((ship) => ship.id === rival.id)!;
    expect(after.shield).toBeLessThan(50);
    expect(after.hull).toBe(120);
  });

  it('lets rule-paying rival AI travel and peacefully acquire neutral planets', () => {
    const state = createGame({ seed: SEED });
    const faction = state.factions[0]!;
    const rival = state.ships.find((ship) => ship.id === faction.shipId)!;
    const neutral = state.planets.find((planet) => planet.owner === null)!;
    state.launched = true;
    state.running = true;
    rival.dockedPlanetId = null;
    rival.position = { ...neutral.position };
    neutral.resistance = 100;
    const creditsBefore = faction.credits;
    const engine = new GameEngine(state);
    engine.stepTicks(500);
    const after = engine.snapshot();
    expect(
      after.planets.find((planet) => planet.id === neutral.id)!.owner,
    ).toBe(faction.id);
    expect(after.factions[0]!.credits).toBeLessThan(creditsBefore);
  });

  it('requires manual bomb activation and captures after resolve reaches zero', () => {
    const state = createGame({ seed: SEED });
    const player = state.ships[0]!;
    const neutral = state.planets.find((planet) => planet.owner === null)!;
    state.launched = true;
    state.running = true;
    player.dockedPlanetId = null;
    player.position = { ...neutral.position };
    player.bombs = 2;
    neutral.resolve = 68;
    neutral.shield = 0;
    const engine = new GameEngine(state);
    engine.dispatch({
      type: 'activateBomb',
      targetId: neutral.id,
      confirmNeutral: true,
    });
    engine.stepTicks(100);
    engine.dispatch({
      type: 'activateBomb',
      targetId: neutral.id,
      confirmNeutral: true,
    });
    engine.stepTicks(17);
    expect(
      engine.snapshot().planets.find((planet) => planet.id === neutral.id),
    ).toMatchObject({
      owner: 'player',
      acquisition: 'force',
      outputBasisPoints: 6000,
    });
  });

  it('seals exact all-planets victory after a paused ownership transaction', () => {
    const state = createGame({ seed: SEED });
    const final = state.planets.at(-1)!;
    const player = state.ships[0]!;
    for (const planet of state.planets) planet.owner = 'player';
    final.owner = null;
    final.resistance = 18;
    final.influence = {};
    player.dockedPlanetId = final.id;
    player.position = { ...final.position };
    const engine = new GameEngine(state);
    engine.dispatch({ type: 'influence', planetId: final.id, action: 'trade' });
    engine.stepTicks(1);
    expect(engine.snapshot()).toMatchObject({
      outcome: 'victory',
      running: false,
      sealedAtTick: 0,
    });
  });

  it('seals defeat ahead of victory and rejects further input', () => {
    const state = createGame({ seed: SEED });
    state.running = true;
    state.launched = true;
    for (const planet of state.planets) planet.owner = 'player';
    state.ships[0]!.hull = 0;
    state.ships[0]!.destroyed = true;
    const engine = new GameEngine(state);
    engine.stepTicks(1);
    expect(engine.snapshot().outcome).toBe('defeat');
    expect(
      engine.dispatch({ type: 'flight', throttle: 1, turn: 0 }),
    ).toMatchObject({ accepted: false });
  });

  it('makes severe procedural hazards capable of permanently destroying the flagship', () => {
    const state = createGame({ seed: SEED });
    const player = state.ships[0]!;
    const hazard = state.hazards[0] ?? {
      id: 'hazard-test',
      sectorX: 0,
      sectorY: 0,
      position: { ...player.position },
      radius: 100,
      severity: 'severe' as const,
    };
    if (!state.hazards.length) state.hazards.push(hazard);
    hazard.position = { ...player.position };
    player.dockedPlanetId = null;
    player.shield = 0;
    player.armour = 0;
    player.hull = 9;
    state.running = true;
    state.launched = true;
    const engine = new GameEngine(state);
    engine.stepTicks(21);
    expect(engine.snapshot()).toMatchObject({
      outcome: 'defeat',
      running: false,
    });
  });

  it('serializes a canonical restorable snapshot', () => {
    const engine = GameEngine.create({ seed: SEED });
    engine.dispatch({ type: 'launch' });
    engine.stepTicks(25);
    const serialized = engine.serialize();
    expect(new GameEngine(deserializeGame(serialized)).snapshot()).toEqual(
      engine.snapshot(),
    );
    expect(GameEngine.restore(serialized).serialize()).toBe(serialized);
  });
});

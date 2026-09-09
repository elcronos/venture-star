import { describe, expect, it } from 'vitest';
import { createGame, GameEngine, SCALE } from '../../src/game';

const seed = '01ARZ3NDEKTSV4RR';
function flight() {
  const state = createGame({ seed });
  state.running = true;
  state.launched = true;
  state.hazards = [];
  state.discoveries = [];
  state.ships[0]!.dockedPlanetId = null;
  return state;
}

describe('Specification-linked gameplay polish', () => {
  it('M21/M22: an exhausted rival mines finite ore and sells it to fund further expansion', () => {
    const state = flight();
    const faction = state.factions[0]!;
    const ship = state.ships.find(
      (candidate) => candidate.id === faction.shipId,
    )!;
    const home = state.planets.find((planet) => planet.owner === faction.id)!;
    faction.credits = 0;
    faction.stock.ore = 0;
    ship.position = { x: home.position.x + 240 * SCALE, y: home.position.y };
    state.nodes = [
      {
        id: 'supply',
        sectorX: home.sectorX,
        sectorY: home.sectorY,
        position: { ...ship.position },
        material: 'ore',
        remaining: 100,
        miningProgressMilli: 0,
      },
    ];
    const engine = new GameEngine(state);
    engine.stepTicks(2400);
    const after = engine.snapshot();
    expect(after.nodes[0]!.remaining).toBeLessThan(100);
    expect(after.events.some((event) => event.type === 'RIVAL_MINING')).toBe(
      true,
    );
    expect(after.events.some((event) => event.type === 'RIVAL_RESUPPLY')).toBe(
      true,
    );
    expect(after.factions[0]!.credits).toBeGreaterThan(0);
    expect(after.stats.tradeProfit).toBe(0);
  });
  it('M05: speed/throttle burn scales and fractional fuel survives save/load', () => {
    const slow = new GameEngine(flight());
    const fast = new GameEngine(flight());
    slow.dispatch({ type: 'flight', throttle: 0.2, turn: 0 });
    fast.dispatch({ type: 'flight', throttle: 1, turn: 0 });
    slow.stepTicks(600);
    fast.stepTicks(600);
    const slowBurn = 8000 - slow.snapshot().ships[0]!.fuelHundredths;
    const fastBurn = 8000 - fast.snapshot().ships[0]!.fuelHundredths;
    expect(slowBurn).toBeGreaterThan(0);
    expect(fastBurn).toBeGreaterThan(slowBurn * 3);
    expect(fastBurn).toBeLessThan(330);
    const restored = GameEngine.restore(fast.serialize());
    fast.stepTicks(37);
    restored.stepTicks(37);
    expect(restored.snapshot()).toEqual(fast.snapshot());
  });

  it('M25: a full hold preserves discovery cargo and pays credits only once', () => {
    const state = flight();
    const ship = state.ships[0]!;
    ship.cargo.ore = 24;
    state.discoveries.push({
      id: 'cache',
      sectorX: 0,
      sectorY: 0,
      position: { ...ship.position },
      kind: 'treasure-asteroid',
      claimed: false,
      credits: 40,
      cargo: { ore: 8 },
    });
    const engine = new GameEngine(state);
    engine.stepTicks(10);
    const partial = engine.snapshot();
    expect(partial.ships[0]!.credits).toBe(280);
    expect(partial.discoveries[0]).toMatchObject({
      claimed: false,
      credits: 0,
      cargo: { ore: 8 },
    });
    const resume = structuredClone(partial);
    resume.ships[0]!.cargo.ore = 20;
    const more = new GameEngine(resume);
    more.stepTicks(1);
    expect(more.snapshot().discoveries[0]).toMatchObject({
      claimed: false,
      cargo: { ore: 4 },
    });
    const finish = structuredClone(more.snapshot());
    finish.ships[0]!.cargo.ore = 0;
    const final = new GameEngine(finish);
    final.stepTicks(3);
    expect(final.snapshot().discoveries[0]!.claimed).toBe(true);
    expect(final.snapshot().stats.discoveries).toBe(1);
    expect(final.snapshot().ships[0]!.credits).toBe(280);
  });

  it('M12: repeated fitting and downgrades cannot debit resources', () => {
    const state = createGame({ seed });
    const ship = state.ships[0]!;
    ship.credits = 5000;
    ship.cargo = { ore: 10, metal: 10, crystal: 10, exotic: 0 };
    ship.upgrades.drill = 2;
    const engine = new GameEngine(state);
    for (const tier of [1, 2] as const) {
      engine.dispatch({
        type: 'buyUpgrade',
        planetId: ship.dockedPlanetId!,
        family: 'drill',
        tier,
      });
      engine.stepTicks(1);
    }
    expect(engine.snapshot().ships[0]!.credits).toBe(5000);
    expect(engine.snapshot().ships[0]!.cargo).toEqual(ship.cargo);
    expect(engine.snapshot().ships[0]!.upgrades.drill).toBe(2);
  });

  it('M11/M14: docked and protected undocking ships reject incoming bombs', () => {
    for (const docked of [true, false]) {
      const state = flight();
      const player = state.ships[0]!;
      if (docked) player.dockedPlanetId = state.planets[0]!.id;
      else player.invulnerableUntilTick = 40;
      state.bombs.push({
        id: 'incoming',
        sourceShipId: state.ships[1]!.id,
        targetId: player.id,
        impactTick: 1,
      });
      const engine = new GameEngine(state);
      engine.stepTicks(1);
      expect(engine.snapshot().ships[0]!.shield).toBe(50);
      expect(engine.snapshot().ships[0]!.lastDamageTick).toBe(-1000);
    }
  });

  it('M22: captured shipyard pauses then cancels reconstruction with material salvage', () => {
    const state = flight();
    const faction = state.factions[0]!;
    const yard = state.planets.find((planet) => planet.owner === faction.id)!;
    state.ships = [state.ships[0]!];
    faction.shipId = null;
    faction.reconstruction = { planetId: yard.id, completeTick: 20 };
    yard.owner = 'player';
    const metal = yard.market.stock.metal;
    const crystal = yard.market.stock.crystal;
    yard.market.stock.ore = 0;
    const engine = new GameEngine(state);
    engine.stepTicks(1240);
    const after = engine.snapshot();
    expect(after.ships).toHaveLength(1);
    expect(after.factions[0]!.reconstruction).toBeNull();
    expect(
      after.planets.find((planet) => planet.id === yard.id)!.market.stock,
    ).toMatchObject({ metal: metal + 10, crystal: crystal + 5 });
  });

  it('M26: slow passage is safe while fast asteroid travel has deterministic collision risk', () => {
    const state = flight();
    state.hazards = [
      {
        id: 'asteroids',
        position: { ...state.ships[0]!.position },
        sectorX: 0,
        sectorY: 0,
        radius: 100000,
        severity: 'severe',
      },
    ];
    const safe = new GameEngine(state);
    safe.stepTicks(600);
    expect(safe.snapshot().ships[0]!.hull).toBe(120);
    state.ships[0]!.velocity.x = 220 * SCALE;
    state.ships[0]!.throttleBasisPoints = 10000;
    const fast = new GameEngine(state);
    fast.stepTicks(600);
    expect(fast.snapshot().ships[0]!.hull).toBeLessThan(120);
    expect(
      fast.snapshot().events.some((event) => event.type === 'HAZARD_DAMAGE'),
    ).toBe(true);
  });

  it('M05: emergency fuel advance is rate-limited and repaid from future sales', () => {
    const state = createGame({ seed });
    const ship = state.ships[0]!;
    const planetId = ship.dockedPlanetId!;
    ship.credits = 0;
    ship.fuelHundredths = 0;
    ship.emergency = true;
    ship.cargo.ore = 10;
    const engine = new GameEngine(state);
    engine.dispatch({ type: 'refuel', planetId, amount: 10 });
    engine.stepTicks(1);
    expect(engine.snapshot().ships[0]).toMatchObject({
      fuelHundredths: 1500,
      fuelDebt: 30,
      emergency: false,
    });
    engine.dispatch({ type: 'refuel', planetId, amount: 10 });
    engine.stepTicks(1);
    expect(engine.snapshot().ships[0]!.fuelHundredths).toBe(1500);
    const price = Math.floor(
      state.planets.find((planet) => planet.id === planetId)!.market.prices
        .ore * 0.82,
    );
    engine.dispatch({
      type: 'trade',
      planetId,
      material: 'ore',
      side: 'sell',
      quantity: 10,
    });
    engine.stepTicks(1);
    expect(engine.snapshot().ships[0]).toMatchObject({
      fuelDebt: 0,
      credits: price * 10 - 30,
    });
  });
});

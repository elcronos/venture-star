import {
  cargoUsed,
  clamp,
  wrappedDelta,
  wrappedDistance,
  wrappedDistanceSquared,
  wrap,
} from './math';
import { baseStats, createGame } from './generation';
import {
  SCALE,
  SECTOR_SIZE,
  TICKS_PER_SECOND,
  type CampaignOptions,
  type CommandEnvelope,
  type CommandResult,
  type Faction,
  type FactionId,
  type GameCommand,
  type GameEvent,
  type GameState,
  type Material,
  type Planet,
  type Ship,
  type UpgradeFamily,
} from './types';
import { z } from 'zod';

const INTERACTION_RANGE_MILLI = 96 * SCALE;
const WEAPON_RANGE_MILLI = 300 * SCALE;
const BOMB_RANGE_MILLI = 260 * SCALE;
const MAX_SPEED_MILLI = 220 * SCALE;
const EMERGENCY_SPEED_MILLI = 55 * SCALE;
const ACCEL_MILLI_PER_SECOND = 92 * SCALE;
const BRAKE_MILLI_PER_SECOND = 150 * SCALE;

const UPGRADE_COSTS: Record<
  UpgradeFamily,
  Record<1 | 2, { credits: number; cargo: Partial<Record<Material, number>> }>
> = {
  drill: {
    1: { credits: 320, cargo: { ore: 4 } },
    2: { credits: 760, cargo: { metal: 8, crystal: 4 } },
  },
  hold: {
    1: { credits: 300, cargo: { ore: 6 } },
    2: { credits: 720, cargo: { metal: 10 } },
  },
  cell: {
    1: { credits: 340, cargo: { metal: 4 } },
    2: { credits: 820, cargo: { metal: 10, crystal: 3 } },
  },
  surveyor: {
    1: { credits: 360, cargo: { crystal: 3 } },
    2: { credits: 860, cargo: { crystal: 7, metal: 4 } },
  },
  aegis: {
    1: { credits: 390, cargo: { metal: 5, crystal: 2 } },
    2: { credits: 920, cargo: { metal: 10, crystal: 6 } },
  },
  director: {
    1: { credits: 400, cargo: { crystal: 4, metal: 2 } },
    2: { credits: 950, cargo: { crystal: 9, metal: 5 } },
  },
};

export class GameEngine {
  private state: GameState;
  private queue: CommandEnvelope[] = [];

  constructor(initial: CampaignOptions | GameState) {
    this.state =
      'schemaVersion' in initial
        ? validateRestoredState(initial)
        : createGame(initial);
  }

  static create(options: CampaignOptions): GameEngine {
    return new GameEngine(options);
  }
  static restore(serialized: string): GameEngine {
    return new GameEngine(deserializeGame(serialized));
  }

  dispatch(command: GameCommand): CommandResult {
    if (this.state.outcome !== 'active')
      return { accepted: false, reason: 'Campaign is sealed' };
    this.queue.push({
      tick: this.state.tick + 1,
      sequence: ++this.state.commandSequence,
      command: structuredClone(command),
    });
    return { accepted: true };
  }

  /** Advances exactly the requested number of fixed 50 ms simulation opportunities. */
  stepTicks(count = 1): GameState {
    if (!Number.isInteger(count) || count < 0 || count > 100_000)
      throw new Error('Tick count must be an integer from 0 through 100000');
    for (let index = 0; index < count; index++) this.stepOne();
    return this.snapshot();
  }

  snapshot(): GameState {
    return deepFreeze(structuredClone(this.state));
  }
  serialize(): string {
    return serializeGame(this.state);
  }

  private stepOne(): void {
    if (this.state.outcome !== 'active') return;
    const nextTick = this.state.tick + 1;
    const due = this.queue
      .filter((entry) => entry.tick <= nextTick)
      .sort((a, b) => a.tick - b.tick || a.sequence - b.sequence);
    this.queue = this.queue.filter((entry) => entry.tick > nextTick);
    for (const entry of due) this.applyCommand(entry.command);
    if (!this.state.running) {
      this.resolveTerminalState();
      return;
    }
    this.state.tick = nextTick;
    this.moveShips();
    this.runMining();
    this.collectDiscoveries();
    this.runWeapons();
    this.runBombs();
    this.rechargeShields();
    if (this.state.tick % TICKS_PER_SECOND === 0) this.strategyTick();
    this.updateCaptureRecovery();
    this.resolveTerminalState();
  }

  private applyCommand(command: GameCommand): void {
    const ship = playerShip(this.state);
    switch (command.type) {
      case 'launch':
        if (!this.state.launched) {
          this.state.launched = true;
          this.state.running = true;
          ship.dockedPlanetId = null;
          this.event('LAUNCH', 'Flagship launched', [ship.id]);
        }
        return;
      case 'pause':
        this.state.running = !command.paused;
        return;
      case 'flight': {
        if (!canFly(ship)) return;
        ship.throttleBasisPoints = clamp(
          Math.round(command.throttle * 10_000),
          0,
          10_000,
        );
        ship.heading = wrap(ship.heading + command.turn * 700, 65_536);
        if (command.brake) ship.throttleBasisPoints = -10_000;
        if (command.throttle !== 0 || command.turn !== 0 || command.brake) {
          ship.miningNodeId = null;
          ship.miningStartedTick = 0;
          ship.miningReadyTick = 0;
        }
        return;
      }
      case 'selectTarget':
        ship.selectedTargetId = command.targetId;
        return;
      case 'setHoldFire':
        ship.holdFire = command.hold;
        return;
      case 'startMining': {
        const node = this.state.nodes.find(
          (candidate) => candidate.id === command.nodeId,
        );
        if (
          node &&
          !ship.emergency &&
          !ship.dockedPlanetId &&
          Math.hypot(ship.velocity.x, ship.velocity.y) <= 8 * SCALE &&
          ship.throttleBasisPoints <= 1_500 &&
          wrappedDistanceSquared(
            ship.position,
            node.position,
            this.state.width,
            this.state.height,
          ) <=
            INTERACTION_RANGE_MILLI ** 2
        ) {
          ship.miningNodeId = node.id;
          ship.miningStartedTick = this.state.tick;
          ship.miningReadyTick = this.state.tick + 47;
          ship.throttleBasisPoints = 0;
          ship.velocity = { x: 0, y: 0 };
        }
        return;
      }
      case 'stopMining':
        ship.miningNodeId = null;
        ship.miningStartedTick = 0;
        ship.miningReadyTick = 0;
        return;
      case 'scan':
        this.scan(ship);
        return;
      case 'dock':
        this.dock(ship, command.planetId);
        return;
      case 'undock':
        this.undock(ship);
        return;
      case 'trade':
        this.trade(
          ship,
          command.planetId,
          command.material,
          command.side,
          command.quantity,
        );
        return;
      case 'refuel':
        this.refuel(ship, command.planetId, command.amount);
        return;
      case 'repair':
        this.repair(ship, command.planetId);
        return;
      case 'buyUpgrade':
        this.buyUpgrade(ship, command.planetId, command.family, command.tier);
        return;
      case 'buyBomb':
        this.buyBomb(ship, command.planetId, command.quantity);
        return;
      case 'influence':
        this.influence(ship, command.planetId, command.action);
        return;
      case 'activateBomb':
        this.launchBomb(
          ship,
          command.targetId,
          command.confirmNeutral ?? false,
        );
        return;
      case 'acceptCapitulation':
        this.capitulate(command.factionId);
        return;
    }
  }

  private moveShips(): void {
    const worldW = this.state.width * SECTOR_SIZE * SCALE;
    const worldH = this.state.height * SECTOR_SIZE * SCALE;
    for (const ship of this.state.ships.sort((a, b) =>
      a.id.localeCompare(b.id),
    )) {
      if (!canFly(ship)) continue;
      const oldX = ship.position.x;
      const oldY = ship.position.y;
      const speed = Math.hypot(ship.velocity.x, ship.velocity.y);
      if (ship.throttleBasisPoints < 0) {
        const reduction = Math.min(
          speed,
          BRAKE_MILLI_PER_SECOND / TICKS_PER_SECOND,
        );
        if (speed > 0) {
          ship.velocity.x = Math.trunc(
            (ship.velocity.x * (speed - reduction)) / speed,
          );
          ship.velocity.y = Math.trunc(
            (ship.velocity.y * (speed - reduction)) / speed,
          );
        }
      } else if (ship.throttleBasisPoints > 0) {
        const angle = (ship.heading / 65_536) * Math.PI * 2;
        const accel = Math.trunc(
          (ACCEL_MILLI_PER_SECOND * ship.throttleBasisPoints) /
            10_000 /
            TICKS_PER_SECOND,
        );
        ship.velocity.x += Math.trunc(Math.cos(angle) * accel);
        ship.velocity.y += Math.trunc(Math.sin(angle) * accel);
        const newSpeed = Math.hypot(ship.velocity.x, ship.velocity.y);
        const cap = ship.emergency ? EMERGENCY_SPEED_MILLI : MAX_SPEED_MILLI;
        if (newSpeed > cap) {
          ship.velocity.x = Math.trunc((ship.velocity.x * cap) / newSpeed);
          ship.velocity.y = Math.trunc((ship.velocity.y * cap) / newSpeed);
        }
        const speedWu = newSpeed / SCALE;
        if (!ship.emergency) {
          const burn = Math.max(
            1,
            Math.trunc(
              ((ship.throttleBasisPoints / 10_000) *
                (0.018 + 0.0000018 * speedWu * speedWu) *
                100) /
                TICKS_PER_SECOND,
            ),
          );
          ship.fuelHundredths = Math.max(0, ship.fuelHundredths - burn);
          if (ship.id === this.state.playerShipId)
            this.state.stats.fuelConsumedHundredths += burn;
          if (ship.fuelHundredths === 0) ship.emergency = true;
        }
      } else if (speed > 0) {
        const reduction = Math.min(speed, (8 * SCALE) / TICKS_PER_SECOND);
        ship.velocity.x = Math.trunc(
          (ship.velocity.x * (speed - reduction)) / speed,
        );
        ship.velocity.y = Math.trunc(
          (ship.velocity.y * (speed - reduction)) / speed,
        );
      }
      ship.position.x = wrap(
        ship.position.x + Math.trunc(ship.velocity.x / TICKS_PER_SECOND),
        worldW,
      );
      ship.position.y = wrap(
        ship.position.y + Math.trunc(ship.velocity.y / TICKS_PER_SECOND),
        worldH,
      );
      if (ship.id === this.state.playerShipId)
        this.state.stats.distanceMilli += Math.trunc(
          Math.hypot(
            wrappedDelta(oldX, ship.position.x, worldW),
            wrappedDelta(oldY, ship.position.y, worldH),
          ),
        );
      const hazard = this.state.hazards.find(
        (candidate) =>
          wrappedDistanceSquared(
            ship.position,
            candidate.position,
            this.state.width,
            this.state.height,
          ) <=
          (candidate.radius * SCALE) ** 2,
      );
      if (hazard && this.state.tick - ship.lastDamageTick >= TICKS_PER_SECOND) {
        this.damageShip(
          ship,
          hazard.severity === 'severe' ? 9 : 5,
          'explosive',
          hazard.id,
        );
        this.event(
          'HAZARD_DAMAGE',
          `${ship.id} struck debris in ${hazard.id}`,
          [ship.id, hazard.id],
          hazard.id,
        );
      }
    }
  }

  private scan(ship: Ship): void {
    if (ship.destroyed || ship.emergency || ship.dockedPlanetId) return;
    const recent = this.state.events.findLast(
      (event) => event.type === 'SCAN_PULSE' && event.actors.includes(ship.id),
    );
    if (recent && this.state.tick - recent.tick < 5 * TICKS_PER_SECOND) return;
    const discovery = this.state.discoveries
      .filter(
        (item) =>
          !item.claimed &&
          wrappedDistanceSquared(
            ship.position,
            item.position,
            this.state.width,
            this.state.height,
          ) <=
            (ship.stats.sensorRange * 2 * SCALE) ** 2,
      )
      .sort((a, b) => a.id.localeCompare(b.id))[0];
    this.event(
      'SCAN_PULSE',
      discovery ? `Scan found ${discovery.kind}` : 'Scan found no anomaly',
      [ship.id, ...(discovery ? [discovery.id] : [])],
      discovery?.id,
    );
  }

  private runMining(): void {
    for (const ship of this.state.ships) {
      if (!ship.miningNodeId || ship.destroyed || ship.emergency) continue;
      if (this.state.tick < (ship.miningReadyTick ?? 0)) continue;
      const node = this.state.nodes.find(
        (candidate) => candidate.id === ship.miningNodeId,
      );
      if (
        !node ||
        node.remaining <= 0 ||
        wrappedDistanceSquared(
          ship.position,
          node.position,
          this.state.width,
          this.state.height,
        ) >
          INTERACTION_RANGE_MILLI ** 2
      ) {
        ship.miningNodeId = null;
        ship.miningStartedTick = 0;
        ship.miningReadyTick = 0;
        continue;
      }
      if (cargoUsed(ship.cargo) >= ship.stats.cargoCapacity) continue;
      const materialRatio = {
        ore: 1000,
        metal: 650,
        crystal: 400,
        exotic: 150,
      }[node.material];
      node.miningProgressMilli += Math.trunc(
        (ship.stats.miningMilliPerSecond * materialRatio) /
          1000 /
          TICKS_PER_SECOND,
      );
      while (
        node.miningProgressMilli >= 1000 &&
        node.remaining > 0 &&
        cargoUsed(ship.cargo) < ship.stats.cargoCapacity
      ) {
        node.miningProgressMilli -= 1000;
        node.remaining--;
        ship.cargo[node.material]++;
        this.event(
          'CARGO_GAIN',
          `Mined 1 ${node.material}`,
          [ship.id],
          node.id,
        );
      }
    }
  }

  private collectDiscoveries(): void {
    const ship = playerShip(this.state);
    for (const item of this.state.discoveries) {
      if (
        item.claimed ||
        wrappedDistanceSquared(
          ship.position,
          item.position,
          this.state.width,
          this.state.height,
        ) >
          INTERACTION_RANGE_MILLI ** 2
      )
        continue;
      item.claimed = true;
      ship.credits += item.credits;
      for (const [material, amount] of Object.entries(item.cargo) as [
        Material,
        number,
      ][]) {
        const quantity = Math.min(
          amount,
          ship.stats.cargoCapacity - cargoUsed(ship.cargo),
        );
        ship.cargo[material] += quantity;
      }
      this.state.stats.discoveries++;
      this.event('DISCOVERY', `Claimed ${item.kind}`, [ship.id], item.id);
    }
  }

  private runWeapons(): void {
    for (const ship of this.state.ships.sort((a, b) =>
      a.id.localeCompare(b.id),
    )) {
      if (
        ship.destroyed ||
        ship.emergency ||
        ship.dockedPlanetId ||
        ship.holdFire ||
        this.state.tick < ship.weaponReadyTick ||
        !ship.selectedTargetId
      )
        continue;
      const targetShip = this.state.ships.find(
        (candidate) =>
          candidate.id === ship.selectedTargetId && !candidate.destroyed,
      );
      const targetPlanet = this.state.planets.find(
        (candidate) => candidate.id === ship.selectedTargetId,
      );
      const target = targetShip ?? targetPlanet;
      if (
        !target ||
        (targetShip
          ? !isHostile(this.state, ship.faction, targetShip.faction)
          : !targetPlanet!.owner ||
            targetPlanet!.owner === ship.faction ||
            !isHostile(this.state, ship.faction, targetPlanet!.owner!))
      )
        continue;
      if (
        wrappedDistanceSquared(
          ship.position,
          target.position,
          this.state.width,
          this.state.height,
        ) >
        WEAPON_RANGE_MILLI ** 2
      )
        continue;
      ship.weaponReadyTick = this.state.tick + ship.stats.weaponCooldownTicks;
      if (targetShip)
        this.damageShip(
          targetShip,
          ship.stats.weaponDamage,
          'kinetic',
          ship.id,
        );
      else
        targetPlanet!.shield = Math.max(
          0,
          targetPlanet!.shield - ship.stats.weaponDamage,
        );
      this.event(
        'WEAPON_FIRED',
        `${ship.id} fired`,
        [ship.id, target.id],
        target.id,
      );
    }
  }

  private runBombs(): void {
    for (const bomb of this.state.bombs
      .filter((candidate) => candidate.impactTick <= this.state.tick)
      .sort((a, b) => a.id.localeCompare(b.id))) {
      const source = this.state.ships.find(
        (ship) => ship.id === bomb.sourceShipId,
      );
      const shipTarget = this.state.ships.find(
        (ship) => ship.id === bomb.targetId && !ship.destroyed,
      );
      const planet = this.state.planets.find(
        (candidate) => candidate.id === bomb.targetId,
      );
      if (source && shipTarget)
        this.damageShip(shipTarget, 50, 'explosive', source.id);
      if (source && planet) {
        if (planet.shield > 0) planet.shield = Math.max(0, planet.shield - 50);
        else {
          planet.resolve = Math.max(0, planet.resolve - 34);
          if (planet.resolve === 0)
            this.capturePlanet(planet, source.faction, 'force');
        }
      }
    }
    this.state.bombs = this.state.bombs.filter(
      (candidate) => candidate.impactTick > this.state.tick,
    );
  }

  private rechargeShields(): void {
    for (const ship of this.state.ships)
      if (
        !ship.destroyed &&
        !ship.emergency &&
        this.state.tick - ship.lastDamageTick >= 80 &&
        ship.shield < ship.stats.maxShield
      ) {
        ship.shield = Math.min(
          ship.stats.maxShield,
          ship.shield +
            ship.stats.shieldRegenMilliPerSecond / 1000 / TICKS_PER_SECOND,
        );
      }
  }

  private strategyTick(): void {
    if (this.state.tick % 600 === 0) this.producePlanets();
    for (const faction of this.state.factions.sort((a, b) =>
      a.id.localeCompare(b.id),
    )) {
      this.reconstruct(faction);
      if (this.state.tick < faction.nextPlanTick || !faction.shipId) continue;
      faction.nextPlanTick =
        this.state.tick + planInterval(this.state.difficulty);
      const ship = this.state.ships.find(
        (candidate) => candidate.id === faction.shipId && !candidate.destroyed,
      );
      if (!ship) continue;
      const player = playerShip(this.state);
      if (faction.relationToPlayer === 'hostile' && !player.destroyed) {
        ship.selectedTargetId = player.id;
        steerToward(ship, player.position, this.state.width, this.state.height);
        continue;
      }
      const target = nearestPlanet(
        this.state,
        ship,
        (planet) => planet.owner === null,
      );
      if (target) {
        steerToward(ship, target.position, this.state.width, this.state.height);
        if (
          wrappedDistanceSquared(
            ship.position,
            target.position,
            this.state.width,
            this.state.height,
          ) <=
            INTERACTION_RANGE_MILLI ** 2 &&
          faction.credits >= 80 &&
          faction.stock.ore >= 2
        ) {
          faction.credits -= 80;
          faction.stock.ore -= 2;
          target.influence[faction.id] =
            (target.influence[faction.id] ?? 0) + 22;
          if (target.influence[faction.id]! >= target.resistance)
            this.capturePlanet(target, faction.id, 'peaceful');
        }
      } else {
        const playerTarget = nearestPlanet(
          this.state,
          ship,
          (planet) => planet.owner === 'player',
        );
        if (playerTarget)
          steerToward(
            ship,
            playerTarget.position,
            this.state.width,
            this.state.height,
          );
      }
    }
  }

  private producePlanets(): void {
    for (const planet of this.state.planets.sort((a, b) =>
      a.id.localeCompare(b.id),
    )) {
      if (!planet.owner || planet.market.stock.ore < 1) continue;
      planet.market.stock.ore--;
      planet.market.stock.metal = Math.min(
        300,
        planet.market.stock.metal +
          Math.max(1, Math.round((2 * planet.outputBasisPoints) / 10_000)),
      );
      if (planet.owner !== 'player') {
        const faction = this.state.factions.find(
          (candidate) => candidate.id === planet.owner,
        );
        if (faction) faction.stock.metal += 2;
      }
    }
  }

  private reconstruct(faction: Faction): void {
    if (faction.shipId || faction.reconstruction) {
      if (
        faction.reconstruction &&
        this.state.tick >= faction.reconstruction.completeTick
      ) {
        const planet = this.state.planets.find(
          (p) => p.id === faction.reconstruction!.planetId,
        )!;
        const ship = makeRebuiltShip(faction.id, planet);
        this.state.ships.push(ship);
        faction.shipId = ship.id;
        faction.reconstruction = null;
        this.event(
          'SHIP_REBUILT',
          `${faction.id} rebuilt its explorer`,
          [faction.id],
          ship.id,
        );
      }
      return;
    }
    const yard = this.state.planets.find(
      (planet) => planet.owner === faction.id && planet.hasShipyard,
    );
    if (
      yard &&
      faction.credits >= 300 &&
      faction.stock.metal >= 20 &&
      faction.stock.crystal >= 10
    ) {
      faction.credits -= 300;
      faction.stock.metal -= 20;
      faction.stock.crystal -= 10;
      faction.reconstruction = {
        planetId: yard.id,
        completeTick: this.state.tick + 120 * TICKS_PER_SECOND,
      };
    }
  }

  private dock(ship: Ship, planetId: string): void {
    const planet = this.state.planets.find(
      (candidate) => candidate.id === planetId,
    );
    if (
      !planet ||
      ship.dockedPlanetId ||
      ship.destroyed ||
      this.state.tick < planet.serviceLockUntilTick
    )
      return;
    if (planet.owner !== 'player' && planet.owner !== null) return;
    if (
      wrappedDistanceSquared(
        ship.position,
        planet.position,
        this.state.width,
        this.state.height,
      ) >
      INTERACTION_RANGE_MILLI ** 2
    )
      return;
    if (
      Math.hypot(ship.velocity.x, ship.velocity.y) > 20 * SCALE ||
      this.state.tick - ship.lastDamageTick < 100
    )
      return;
    ship.dockedPlanetId = planet.id;
    ship.velocity = { x: 0, y: 0 };
    ship.throttleBasisPoints = 0;
    ship.shield = ship.stats.maxShield;
    this.state.running = false;
    this.event('DOCK', `Docked at ${planet.name}`, [ship.id], planet.id);
  }

  private undock(ship: Ship): void {
    if (!ship.dockedPlanetId) return;
    const planet = this.state.planets.find(
      (candidate) => candidate.id === ship.dockedPlanetId,
    )!;
    ship.position = {
      x: planet.position.x + 112 * SCALE,
      y: planet.position.y,
    };
    ship.dockedPlanetId = null;
    ship.weaponReadyTick = this.state.tick + 40;
    this.state.running = true;
  }

  private trade(
    ship: Ship,
    planetId: string,
    material: Material,
    side: 'buy' | 'sell',
    quantity: number,
  ): void {
    const planet = dockedAt(this.state, ship, planetId);
    if (!planet || !Number.isInteger(quantity) || quantity <= 0) return;
    const price =
      side === 'buy'
        ? planet.market.prices[material]
        : Math.floor(planet.market.prices[material] * 0.82);
    if (side === 'buy') {
      if (
        planet.market.stock[material] < quantity ||
        ship.credits < price * quantity ||
        cargoUsed(ship.cargo) + quantity > ship.stats.cargoCapacity
      )
        return;
      planet.market.stock[material] -= quantity;
      ship.cargo[material] += quantity;
      ship.credits -= price * quantity;
    } else {
      if (ship.cargo[material] < quantity) return;
      ship.cargo[material] -= quantity;
      planet.market.stock[material] += quantity;
      ship.credits += price * quantity;
      this.state.stats.tradeProfit += price * quantity;
    }
    this.event(
      'TRADE',
      `${side} ${quantity} ${material}`,
      [ship.id],
      planet.id,
    );
  }

  private refuel(ship: Ship, planetId: string, amount: number): void {
    const planet = dockedAt(this.state, ship, planetId);
    if (!planet || planet.owner !== 'player' || amount <= 0) return;
    const units = Math.min(
      Math.floor(amount),
      planet.market.fuel,
      ship.stats.fuelCapacity - ship.fuelHundredths / 100,
    );
    const rate = planet.owner === 'player' ? 1 : 3;
    if (units <= 0 || ship.credits < units * rate) return;
    ship.credits -= units * rate;
    planet.market.fuel -= units;
    ship.fuelHundredths += units * 100;
    ship.emergency = false;
  }

  private repair(ship: Ship, planetId: string): void {
    const planet = dockedAt(this.state, ship, planetId);
    if (!planet || planet.owner !== 'player') return;
    const points = 120 - ship.hull + (60 - ship.armour);
    const bundles = Math.ceil(points / 10);
    if (points <= 0 || ship.cargo.metal < bundles || ship.credits < bundles * 2)
      return;
    ship.cargo.metal -= bundles;
    ship.credits -= bundles * 2;
    ship.hull = 120;
    ship.armour = 60;
  }

  private buyUpgrade(
    ship: Ship,
    planetId: string,
    family: UpgradeFamily,
    tier: 1 | 2,
  ): void {
    const planet = dockedAt(this.state, ship, planetId);
    if (!planet || planet.owner !== 'player' || !planet.hasShipyard) return;
    const cost = UPGRADE_COSTS[family][tier];
    if (
      ship.credits < cost.credits ||
      Object.entries(cost.cargo).some(
        ([material, amount]) => ship.cargo[material as Material] < amount!,
      )
    )
      return;
    ship.credits -= cost.credits;
    for (const [material, amount] of Object.entries(cost.cargo) as [
      Material,
      number,
    ][])
      ship.cargo[material] -= amount;
    ship.upgrades[family] = tier;
    recalculateStats(ship);
    this.event(
      'EQUIPMENT_FITTED',
      `Fitted ${family} T${tier}`,
      [ship.id],
      planet.id,
    );
  }

  private buyBomb(ship: Ship, planetId: string, quantity: number): void {
    const planet = dockedAt(this.state, ship, planetId);
    if (
      !planet ||
      planet.owner !== 'player' ||
      !Number.isInteger(quantity) ||
      quantity <= 0
    )
      return;
    const amount = Math.min(quantity, 3 - ship.bombs);
    const credits = 110 * amount;
    const metal = amount;
    const crystal = amount;
    if (
      amount <= 0 ||
      ship.credits < credits ||
      ship.cargo.metal < metal ||
      ship.cargo.crystal < crystal
    )
      return;
    ship.credits -= credits;
    ship.cargo.metal -= metal;
    ship.cargo.crystal -= crystal;
    ship.bombs += amount;
    this.event(
      'BOMB_BUILT',
      `Built ${amount} strategic bomb${amount === 1 ? '' : 's'}`,
      [ship.id],
      planet.id,
    );
  }

  private influence(
    ship: Ship,
    planetId: string,
    action: 'trade' | 'aid' | 'broadcast',
  ): void {
    const planet = this.state.planets.find(
      (candidate) => candidate.id === planetId,
    );
    if (
      !planet ||
      planet.owner === 'player' ||
      !ship.dockedPlanetId ||
      ship.dockedPlanetId !== planet.id
    )
      return;
    const requirements = {
      trade: { credits: 0, ore: 0, gain: 18 },
      aid: { credits: 80, ore: 2, gain: 22 },
      broadcast: { credits: 25, ore: 0, gain: 8 },
    }[action];
    if (
      action === 'trade' &&
      this.state.events.some(
        (event) =>
          event.type === 'INFLUENCE_TRADE' && event.entityId === planet.id,
      )
    )
      return;
    if (
      action === 'broadcast' &&
      this.state.events.some(
        (event) =>
          event.type === 'INFLUENCE_BROADCAST' &&
          event.entityId === planet.id &&
          this.state.tick - event.tick < 900,
      )
    )
      return;
    if (
      ship.credits < requirements.credits ||
      ship.cargo.ore < requirements.ore
    )
      return;
    ship.credits -= requirements.credits;
    ship.cargo.ore -= requirements.ore;
    planet.influence.player =
      (planet.influence.player ?? 0) + requirements.gain;
    this.event(
      `INFLUENCE_${action.toUpperCase()}`,
      `${action} influenced ${planet.name}`,
      [ship.id],
      planet.id,
    );
    if (planet.influence.player >= planet.resistance)
      this.capturePlanet(planet, 'player', 'peaceful');
  }

  private launchBomb(ship: Ship, targetId: string, confirmed: boolean): void {
    if (
      ship.bombs <= 0 ||
      ship.emergency ||
      ship.dockedPlanetId ||
      this.state.tick < ship.bombReadyTick
    )
      return;
    const target =
      this.state.ships.find(
        (candidate) => candidate.id === targetId && !candidate.destroyed,
      ) ?? this.state.planets.find((candidate) => candidate.id === targetId);
    if (
      !target ||
      wrappedDistanceSquared(
        ship.position,
        target.position,
        this.state.width,
        this.state.height,
      ) >
        BOMB_RANGE_MILLI ** 2
    )
      return;
    const owner = 'faction' in target ? target.faction : target.owner;
    if (owner === null && !confirmed) return;
    if (owner && owner !== ship.faction)
      declareHostile(this.state, ship.faction, owner);
    ship.bombs--;
    ship.bombReadyTick = this.state.tick + 100;
    this.state.bombs.push({
      id: `bomb-${this.state.tick}-${ship.id}`,
      sourceShipId: ship.id,
      targetId,
      impactTick: this.state.tick + 16,
    });
  }

  private capturePlanet(
    planet: Planet,
    owner: FactionId,
    method: 'peaceful' | 'force',
  ): void {
    planet.owner = owner;
    planet.acquisition = method;
    planet.influence = {};
    planet.resolve = planet.resistance;
    if (method === 'force') {
      planet.serviceLockUntilTick = this.state.tick + 300;
      planet.outputBasisPoints = 6000;
    }
    this.event(
      'PLANET_ACQUIRED',
      `${owner} acquired ${planet.name} by ${method}`,
      [owner],
      planet.id,
    );
  }

  private updateCaptureRecovery(): void {
    for (const planet of this.state.planets)
      if (
        planet.outputBasisPoints < 10_000 &&
        this.state.tick >= planet.serviceLockUntilTick
      )
        planet.outputBasisPoints = Math.min(
          10_000,
          planet.outputBasisPoints + Math.ceil(4000 / 2400),
        );
  }

  private capitulate(factionId: FactionId): void {
    if (factionId === 'player') return;
    const faction = this.state.factions.find(
      (candidate) => candidate.id === factionId,
    );
    const owned = this.state.planets.filter(
      (planet) => planet.owner === factionId,
    );
    if (
      !faction ||
      faction.shipId ||
      faction.reconstruction ||
      owned.some((planet) => planet.hasShipyard) ||
      owned.length / this.state.planets.length > 0.2
    )
      return;
    for (const planet of owned) {
      planet.owner = 'player';
      planet.acquisition = 'capitulation';
      planet.outputBasisPoints = 5000;
    }
    this.event('CAPITULATION', `${factionId} capitulated`, [
      factionId,
      'player',
    ]);
  }

  private damageShip(
    ship: Ship,
    raw: number,
    type: 'kinetic' | 'energy' | 'explosive' | 'collision',
    source: string,
  ): void {
    if (raw <= 0 || ship.destroyed) return;
    ship.lastDamageTick = this.state.tick;
    if (type === 'collision') ship.hull -= raw;
    else {
      const multipliers = {
        kinetic: [0.75, 1.25, 1],
        energy: [1.25, 0.75, 1],
        explosive: [1, 1, 1.25],
      }[type] as [number, number, number];
      let remainingRaw = raw;
      if (ship.shield > 0) {
        const capacityRaw = ship.shield / multipliers[0];
        const usedRaw = Math.min(remainingRaw, capacityRaw);
        ship.shield = Math.max(
          0,
          ship.shield - Math.ceil(usedRaw * multipliers[0]),
        );
        remainingRaw -= usedRaw;
      }
      if (remainingRaw > 0 && ship.armour > 0) {
        const capacityRaw = ship.armour / multipliers[1];
        const usedRaw = Math.min(remainingRaw, capacityRaw);
        ship.armour = Math.max(
          0,
          ship.armour - Math.ceil(usedRaw * multipliers[1]),
        );
        remainingRaw -= usedRaw;
      }
      if (remainingRaw > 0)
        ship.hull -= Math.ceil(remainingRaw * multipliers[2]);
    }
    this.event(
      'DAMAGE',
      `${ship.id} took ${raw} ${type}`,
      [source, ship.id],
      ship.id,
    );
    if (ship.hull <= 0) {
      ship.hull = 0;
      ship.destroyed = true;
      ship.throttleBasisPoints = 0;
      ship.miningNodeId = null;
      ship.miningStartedTick = 0;
      ship.miningReadyTick = 0;
      if (ship.id !== this.state.playerShipId) {
        const faction = this.state.factions.find(
          (candidate) => candidate.shipId === ship.id,
        );
        if (faction) faction.shipId = null;
        this.state.stats.shipsDestroyed++;
      }
      this.event(
        'SHIP_DESTROYED',
        `${ship.id} was destroyed`,
        [source, ship.id],
        ship.id,
      );
    }
  }

  private resolveTerminalState(): void {
    const player = playerShip(this.state);
    if (player.destroyed || player.hull <= 0) {
      this.state.outcome = 'defeat';
      this.state.running = false;
      this.state.sealedAtTick = this.state.tick;
      this.event('DEATH_CONFIRMED', 'The flagship was destroyed', [player.id]);
      return;
    }
    if (
      this.state.planets.length > 0 &&
      this.state.planets.every((planet) => planet.owner === 'player')
    ) {
      this.state.outcome = 'victory';
      this.state.running = false;
      this.state.sealedAtTick = this.state.tick;
      this.event('VICTORY_CONFIRMED', 'Every planet is under player control', [
        'player',
      ]);
    }
  }

  private event(
    type: string,
    summary: string,
    actors: string[],
    entityId?: string,
  ): void {
    const event: GameEvent = {
      id: `event-${this.state.tick}-${this.state.events.length}`,
      tick: this.state.tick,
      type,
      summary,
      actors,
      ...(entityId ? { entityId } : {}),
    };
    this.state.events.push(event);
    if (this.state.events.length > 2000)
      this.state.events.splice(0, this.state.events.length - 2000);
  }
}

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
    generatorVersion: z.literal(1),
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

function validateRestoredState(state: unknown): GameState {
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

function recalculateStats(ship: Ship): void {
  const stats = baseStats();
  const tier = (family: UpgradeFamily) => ship.upgrades[family] ?? 0;
  if (tier('drill') === 1) stats.miningMilliPerSecond = 5200;
  if (tier('drill') === 2) stats.miningMilliPerSecond = 6800;
  if (tier('hold') === 1) stats.cargoCapacity = 36;
  if (tier('hold') === 2) stats.cargoCapacity = 52;
  if (tier('cell') === 1) stats.fuelCapacity = 112;
  if (tier('cell') === 2) stats.fuelCapacity = 150;
  if (tier('surveyor') === 1) stats.sensorRange = 430;
  if (tier('surveyor') === 2) stats.sensorRange = 560;
  if (tier('aegis') === 1) {
    stats.maxShield = 78;
    stats.shieldRegenMilliPerSecond = 7500;
  }
  if (tier('aegis') === 2) {
    stats.maxShield = 112;
    stats.shieldRegenMilliPerSecond = 9000;
  }
  if (tier('director') === 1) stats.weaponDamage = 15;
  if (tier('director') === 2) {
    stats.weaponDamage = 19;
    stats.weaponCooldownTicks = 14;
  }
  ship.stats = stats;
  ship.shield = Math.min(ship.shield, stats.maxShield);
  ship.fuelHundredths = Math.min(ship.fuelHundredths, stats.fuelCapacity * 100);
}

function playerShip(state: GameState): Ship {
  return state.ships.find((ship) => ship.id === state.playerShipId)!;
}
function canFly(ship: Ship): boolean {
  return !ship.destroyed && !ship.dockedPlanetId;
}
function dockedAt(
  state: GameState,
  ship: Ship,
  planetId: string,
): Planet | null {
  return ship.dockedPlanetId === planetId
    ? (state.planets.find((planet) => planet.id === planetId) ?? null)
    : null;
}
function isHostile(state: GameState, a: FactionId, b: FactionId): boolean {
  if (a === b) return false;
  if (a === 'player')
    return (
      state.factions.find((f) => f.id === b)?.relationToPlayer === 'hostile'
    );
  if (b === 'player')
    return (
      state.factions.find((f) => f.id === a)?.relationToPlayer === 'hostile'
    );
  return true;
}
function declareHostile(state: GameState, a: FactionId, b: FactionId): void {
  const rival = state.factions.find((f) => f.id === (a === 'player' ? b : a));
  if (rival) rival.relationToPlayer = 'hostile';
}
export function planInterval(difficulty: GameState['difficulty']): number {
  return { Explorer: 120, Captain: 80, Strategist: 50 }[difficulty];
}

function nearestPlanet(
  state: GameState,
  ship: Ship,
  predicate: (planet: Planet) => boolean,
): Planet | null {
  return (
    state.planets
      .filter(predicate)
      .sort(
        (a, b) =>
          wrappedDistanceSquared(
            ship.position,
            a.position,
            state.width,
            state.height,
          ) -
            wrappedDistanceSquared(
              ship.position,
              b.position,
              state.width,
              state.height,
            ) || a.id.localeCompare(b.id),
      )[0] ?? null
  );
}

function steerToward(
  ship: Ship,
  target: { x: number; y: number },
  width: number,
  height: number,
): void {
  const worldW = width * SECTOR_SIZE * SCALE;
  const worldH = height * SECTOR_SIZE * SCALE;
  const dx = wrappedDelta(ship.position.x, target.x, worldW);
  const dy = wrappedDelta(ship.position.y, target.y, worldH);
  ship.heading = wrap(
    Math.round((Math.atan2(dy, dx) / (Math.PI * 2)) * 65_536),
    65_536,
  );
  ship.throttleBasisPoints =
    wrappedDistance(ship.position, target, width, height) >
    INTERACTION_RANGE_MILLI
      ? 7000
      : 0;
}

function makeRebuiltShip(faction: FactionId, planet: Planet): Ship {
  return {
    id: `ship-${faction}-${planet.id}`,
    faction,
    position: { x: planet.position.x + 112 * SCALE, y: planet.position.y },
    velocity: { x: 0, y: 0 },
    heading: 0,
    throttleBasisPoints: 0,
    fuelHundredths: 8000,
    cargo: { ore: 0, metal: 0, crystal: 0, exotic: 0 },
    credits: 0,
    hull: 120,
    armour: 60,
    shield: 50,
    lastDamageTick: -1000,
    weaponReadyTick: 0,
    bombReadyTick: 0,
    bombs: 0,
    selectedTargetId: null,
    holdFire: false,
    dockedPlanetId: null,
    miningNodeId: null,
    miningStartedTick: 0,
    miningReadyTick: 0,
    emergency: false,
    destroyed: false,
    upgrades: {},
    stats: baseStats(),
  };
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>))
      deepFreeze(child);
  }
  return value;
}

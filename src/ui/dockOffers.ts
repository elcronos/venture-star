import { UPGRADE_COSTS, refitMultiplier } from '../game/simulation';
import {
  TICKS_PER_SECOND,
  type GameState,
  type Material,
  type Planet,
  type Ship,
  type UpgradeFamily,
} from '../game/types';
import type { ContextAction, DockState } from './types';

/**
 * M18's three peaceful acquisition actions, with the simulation's own costs,
 * anti-farm rule and cooldown surfaced as reasons rather than silent refusals.
 */
export function influenceActions(
  state: GameState,
  ship: Ship,
  planet: Planet,
): ContextAction[] {
  const tradeUsed = state.events.some(
    (event) => event.type === 'INFLUENCE_TRADE' && event.entityId === planet.id,
  );
  const broadcast = state.events.findLast(
    (event) =>
      event.type === 'INFLUENCE_BROADCAST' && event.entityId === planet.id,
  );
  const cooling = broadcast && state.tick - broadcast.tick < 900;
  return [
    {
      id: 'influence-trade',
      label: 'Sign trade contract · +18',
      icon: 'market',
      ...(tradeUsed
        ? { disabledReason: 'This port has already signed one contract' }
        : {}),
    },
    {
      id: 'influence-aid',
      label: 'Send development aid · 80 cr + 2 ore · +22',
      icon: 'research',
      ...(ship.credits < 80
        ? { disabledReason: 'Need 80 credits' }
        : ship.cargo.ore < 2
          ? { disabledReason: 'Need 2 ore in the hold' }
          : {}),
    },
    {
      id: 'influence-broadcast',
      label: 'Broadcast appeal · 25 cr · +8',
      icon: 'scanner',
      ...(cooling
        ? {
            disabledReason: `Recently broadcast (${Math.ceil((900 - (state.tick - broadcast!.tick)) / TICKS_PER_SECOND)}s)`,
          }
        : ship.credits < 25
          ? { disabledReason: 'Need 25 credits' }
          : {}),
    },
  ];
}

const MODULE_EFFECTS: Record<
  UpgradeFamily,
  { stat: string; tiers: [string, string] }
> = {
  drill: { stat: 'Mining rate', tiers: ['+45%', '+95%'] },
  hold: { stat: 'Cargo capacity', tiers: ['24 → 32', '24 → 44'] },
  cell: { stat: 'Fuel capacity', tiers: ['80 → 96', '80 → 112'] },
  surveyor: { stat: 'Sensor range', tiers: ['+35%', '+80%'] },
  aegis: { stat: 'Shield', tiers: ['50 → 65', '50 → 80'] },
  director: { stat: 'Weapon damage', tiers: ['10 → 15', '10 → 22'] },
};

/** A refit offer priced for this port, saying exactly why it cannot be taken. */
export function moduleCard(
  ship: Ship,
  planet: Planet,
  family: UpgradeFamily,
  name: string,
  tier: 1 | 2,
): DockState['modules'][number] {
  const cost = UPGRADE_COSTS[family][tier];
  const price = Math.round(cost.credits * refitMultiplier(planet));
  const missing = Object.entries(cost.cargo).filter(
    ([material, amount]) => ship.cargo[material as Material] < (amount ?? 0),
  );
  const materialCost = Object.entries(cost.cargo)
    .map(([material, amount]) => `${amount} ${material}`)
    .join(' + ');
  const effect = MODULE_EFFECTS[family];
  const fitted = ship.upgrades[family];
  return {
    id: `${family}:${tier}`,
    name: `${name} T${tier}`,
    family,
    tier,
    price,
    ...(materialCost ? { materialCost } : {}),
    installed: fitted === tier,
    statLabel: effect.stat,
    before: fitted ? `Tier ${fitted}` : 'Standard',
    after: effect.tiers[tier - 1]!,
    ...(fitted === tier
      ? { disabledReason: 'Already fitted' }
      : fitted && fitted > tier
        ? { disabledReason: 'A higher tier is already fitted' }
        : ship.credits < price
          ? { disabledReason: `Need ${price} credits` }
          : missing.length
            ? {
                disabledReason: `Need ${missing
                  .map(([material, amount]) => `${amount} ${material}`)
                  .join(' and ')} in the hold`,
              }
            : {}),
  };
}

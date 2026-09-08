import type { Material, Planet, Ship } from '../game/types';

/**
 * What a market pays right now, led by whatever the hold is actually carrying,
 * so the player can tell where to sell without docking to find out.
 */
export function tradeSummary(ship: Ship, planet: Planet): string {
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


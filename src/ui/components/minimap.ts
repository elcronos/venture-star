import {
  SCALE,
  SECTOR_SIZE,
  type GameState,
  type Ship,
} from '../../game/types';
import { el } from '../dom';
import type { GalaxyCell, MinimapState, UiDispatch } from '../types';

/** Sector index and fractional in-sector offset for the ship's position. */
export function minimapState(
  state: GameState,
  ship: Ship,
  cells: GalaxyCell[],
): MinimapState {
  const span = SECTOR_SIZE * SCALE;
  const sectorX = Math.floor(ship.position.x / span);
  const sectorY = Math.floor(ship.position.y / span);
  return {
    width: state.width,
    height: state.height,
    sector: { x: sectorX, y: sectorY },
    offset: {
      x: (ship.position.x - sectorX * span) / span,
      y: (ship.position.y - sectorY * span) / span,
    },
    cells,
  };
}

/**
 * Writes the marker position straight to the mounted minimap so it keeps
 * tracking the ship on ticks where the HUD document is deliberately not rebuilt.
 */
export function syncMinimapMarker(
  root: ParentNode,
  minimap: MinimapState,
): void {
  const node = root.querySelector<HTMLElement>('.vs-minimap');
  if (!node) return;
  for (const declaration of minimapVariables(minimap).split(';')) {
    const [name, value] = declaration.split(':');
    if (name && value) node.style.setProperty(name, value);
  }
}

/**
 * Galaxy-scale position indicator for the flight screen: which sector the ship
 * occupies, where it sits inside that sector, and which sectors are known.
 *
 * The marker position is also written straight to these custom properties from
 * the simulation loop, so it keeps tracking between DOM rebuilds.
 */
export function renderMinimap(
  minimap: MinimapState,
  dispatch: UiDispatch,
): HTMLElement {
  const { width, height, sector, offset } = minimap;
  const known = minimap.cells.filter((cell) => cell.discovered).length;
  const grid = el(
    'div',
    {
      className: 'vs-minimap__grid',
      attrs: {
        'aria-hidden': 'true',
        style: `--minimap-cols:${width};--minimap-rows:${height}`,
      },
    },
    minimap.cells.map((cell) =>
      el('span', {
        className: [
          'vs-minimap__cell',
          cell.discovered ? 'is-known' : 'is-unknown',
          cell.planet ? `has-planet owner-${cell.owner ?? 'neutral'}` : '',
          cell.hazard ? 'has-hazard' : '',
        ]
          .filter(Boolean)
          .join(' '),
      }),
    ),
  );
  grid.append(
    el('span', {
      className: 'vs-minimap__sector',
      attrs: { 'aria-hidden': 'true' },
    }),
    el('span', {
      className: 'vs-minimap__marker',
      attrs: { 'aria-hidden': 'true' },
    }),
  );
  const open = el(
    'button',
    {
      className: 'vs-minimap__open',
      attrs: {
        type: 'button',
        title: 'Scan this sector and open the galaxy map to plot a route',
        'aria-label': `Scan and open galaxy map. Currently in sector ${sector.x + 1}.${sector.y + 1} of ${width} by ${height}.`,
      },
    },
    [
      el('div', { className: 'vs-minimap__heading' }, [
        el('span', { className: 'vs-eyebrow', text: 'Position' }),
        el('strong', {
          text: `${sector.x + 1}.${sector.y + 1} / ${width}×${height}`,
        }),
      ]),
      grid,
    ],
  );
  open.addEventListener('click', () => {
    // Scan first: opening the galaxy pauses the simulation, and a scan pulse
    // is only meaningful against the live sector the ship is sitting in.
    dispatch({ type: 'scan' });
    dispatch({ type: 'navigate', destination: 'galaxy' });
  });
  const root = el(
    'section',
    {
      className: 'vs-minimap',
      attrs: {
        'aria-label': 'Galaxy position map',
        style: minimapVariables(minimap),
      },
    },
    [
      open,
      el('p', {
        className: 'vs-minimap__readout',
        text: `Sector ${sector.x + 1}.${sector.y + 1} of ${width} by ${height}, ${Math.round(offset.x * 100)}% across and ${Math.round(offset.y * 100)}% down the sector. ${known} of ${width * height} sectors charted.`,
      }),
    ],
  );
  return root;
}

/**
 * Fractional marker and occupied-sector positions across the galaxy grid, 0..1
 * per axis. Both are written live so neither can drift from the ship.
 */
export function minimapVariables(minimap: MinimapState): string {
  const columns = Math.max(1, minimap.width);
  const rows = Math.max(1, minimap.height);
  const x = (minimap.sector.x + minimap.offset.x) / columns;
  const y = (minimap.sector.y + minimap.offset.y) / rows;
  return [
    `--minimap-x:${x.toFixed(5)}`,
    `--minimap-y:${y.toFixed(5)}`,
    `--minimap-sector-x:${(minimap.sector.x / columns).toFixed(5)}`,
    `--minimap-sector-y:${(minimap.sector.y / rows).toFixed(5)}`,
  ].join(';');
}

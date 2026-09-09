import { button, el, formatNumber, icon, labeledValue } from '../dom';
import type { DangerBand, GalaxyCell, UiDispatch, UiState } from '../types';

const dangerSymbol: Record<DangerBand, string> = {
  Haven: '○',
  'Near Reach': '›',
  'Far Reach': '»',
  Verge: '▲',
  Antipode: '◆',
};

function cellLabel(cell: GalaxyCell): string {
  if (!cell.discovered) return `Undiscovered, ${cell.x},${cell.y}`;
  return [
    `${cell.x},${cell.y}`,
    cell.player ? 'player location' : '',
    cell.planet ? `planet ${cell.planet}` : '',
    cell.owner ? `${cell.owner} ownership` : '',
    cell.danger ? `${cell.danger} danger` : '',
    cell.hazard ? `hazard ${cell.hazard}` : '',
    cell.discovery ? 'discovery' : '',
    cell.intel ? `${cell.intel} intel` : '',
  ]
    .filter(Boolean)
    .join(', ');
}

function galaxyCell(
  cell: GalaxyCell,
  state: UiState,
  dispatch: UiDispatch,
): HTMLButtonElement {
  const node = el(
    'button',
    {
      className: [
        'vs-galaxy-cell',
        cell.discovered ? 'is-discovered' : 'is-fogged',
        cell.selected ? 'is-selected' : '',
        cell.player ? 'is-player' : '',
        cell.owner ? `relation-${cell.owner}` : '',
      ]
        .filter(Boolean)
        .join(' '),
      attrs: {
        type: 'button',
        role: 'gridcell',
        'aria-label': cellLabel(cell),
        'aria-selected': Boolean(cell.selected),
        tabindex:
          cell.selected ||
          (!state.galaxy.cells.some((item) => item.selected) &&
            cell.x === 0 &&
            cell.y === 0)
            ? 0
            : -1,
        'data-x': cell.x,
        'data-y': cell.y,
      },
    },
    [
      el('span', {
        className: 'vs-galaxy-cell__coordinate',
        text: `${cell.x},${cell.y}`,
      }),
      cell.player
        ? el('span', {
            className: 'vs-galaxy-cell__player',
            text: '✦',
            attrs: { 'aria-hidden': 'true' },
          })
        : null,
      cell.planet ? icon('planet') : null,
      cell.resources ? icon('ore') : null,
      cell.discovery ? icon('discovery') : null,
      cell.danger
        ? el('span', {
            className: 'vs-galaxy-cell__danger',
            text: dangerSymbol[cell.danger],
            attrs: { 'aria-hidden': 'true' },
          })
        : null,
    ],
  );
  node.addEventListener('click', () =>
    dispatch({ type: 'galaxy-select', x: cell.x, y: cell.y }),
  );
  node.addEventListener('keydown', (event) => {
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
      PageUp: [0, -5],
      PageDown: [0, 5],
    };
    if (event.key === 'Home') {
      event.preventDefault();
      const player = node
        .closest('[role=grid]')
        ?.querySelector<HTMLButtonElement>('.is-player');
      player?.focus();
      return;
    }
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    const rawX = cell.x + move[0];
    const rawY = cell.y + move[1];
    const x =
      ((rawX % state.galaxy.width) + state.galaxy.width) % state.galaxy.width;
    const y =
      ((rawY % state.galaxy.height) + state.galaxy.height) %
      state.galaxy.height;
    const wrapped = rawX !== x || rawY !== y;
    const next = node
      .closest('[role=grid]')
      ?.querySelector<HTMLButtonElement>(`[data-x="${x}"][data-y="${y}"]`);
    next?.focus();
    if (wrapped) {
      const direction =
        rawX < 0
          ? 'west'
          : rawX >= state.galaxy.width
            ? 'east'
            : rawY < 0
              ? 'north'
              : 'south';
      const status = node
        .closest('.vs-galaxy')
        ?.querySelector<HTMLElement>('.vs-galaxy__live');
      if (status) status.textContent = `Wrapped ${direction}`;
    }
  });
  return node;
}

function routeSheet(state: UiState, dispatch: UiDispatch): HTMLElement | null {
  const route = state.galaxy.route;
  if (!route) return null;
  return el(
    'aside',
    {
      className: 'vs-panel vs-route-sheet',
      attrs: { 'aria-labelledby': 'route-heading' },
    },
    [
      el('div', { className: 'vs-panel__heading' }, [
        el('h2', { text: 'Route forecast', attrs: { id: 'route-heading' } }),
        icon('route'),
      ]),
      el('dl', { className: 'vs-key-values' }, [
        labeledValue('Destination', route.destination),
        labeledValue(
          'Wrapped distance',
          `${formatNumber(route.wrappedDistance, 1)} sectors`,
        ),
        labeledValue('Crossings', String(route.crossings)),
        labeledValue(
          'Estimated fuel + 5%',
          `${formatNumber(route.estimatedFuel, 1)} FU`,
        ),
        labeledValue(
          'Remaining fuel',
          `${formatNumber(route.remainingFuel, 1)} FU`,
        ),
        labeledValue('Reserve impact', route.reserveImpact),
        labeledValue('Highest known danger', route.highestDanger),
        labeledValue(
          'Known hazards',
          route.knownHazards.length
            ? route.knownHazards.join(', ')
            : 'None known',
        ),
        labeledValue('Intel freshness', route.intel),
      ]),
      route.unknownConditions
        ? el(
            'p',
            {
              className: 'vs-route-sheet__unknown',
              text: 'Unknown conditions',
            },
            [icon('unknown')],
          )
        : null,
      route.blockedReason
        ? el('p', { className: 'vs-error-copy', text: route.blockedReason }, [
            icon('danger'),
          ])
        : null,
      button(
        route.requiresReserveConfirmation
          ? 'Use emergency reserve'
          : 'Start autopilot',
        () =>
          dispatch({
            type: 'start-route',
            useReserve: Boolean(route.requiresReserveConfirmation),
          }),
        {
          icon: 'route',
          className: 'vs-button--primary',
          disabledReason: route.blockedReason,
        },
      ),
    ],
  );
}

export function renderGalaxy(
  state: UiState,
  dispatch: UiDispatch,
): HTMLElement {
  const filterLabels: Array<[keyof typeof state.galaxy.filters, string]> = [
    ['planets', 'Planets'],
    ['resources', 'Resources'],
    ['hazards', 'Hazards'],
    ['discoveries', 'Discoveries'],
    ['factions', 'Factions'],
  ];
  return el(
    'section',
    {
      className: 'vs-screen vs-galaxy',
      attrs: { 'aria-labelledby': 'galaxy-title' },
    },
    [
      el('header', { className: 'vs-screen__header' }, [
        el('div', {}, [
          el('p', {
            className: 'vs-eyebrow',
            text: 'Strategic view · simulation paused',
          }),
          el('h1', {
            text: 'Galaxy',
            attrs: { id: 'galaxy-title', tabindex: -1 },
          }),
        ]),
        el('div', { className: 'vs-action-row' }, [
          button('Center on ship', () => dispatch({ type: 'galaxy-center' }), {
            icon: 'center',
            className: 'vs-button--compact',
          }),
          button(
            'Return to flight',
            () => dispatch({ type: 'navigate', destination: 'flight' }),
            { icon: 'back' },
          ),
        ]),
      ]),
      el(
        'nav',
        {
          className: 'vs-filter-bar',
          attrs: { 'aria-label': 'Galaxy filters' },
        },
        filterLabels.map(([filter, label]) =>
          button(
            label,
            () =>
              dispatch({
                type: 'galaxy-filter',
                filter,
                enabled: !state.galaxy.filters[filter],
              }),
            {
              pressed: state.galaxy.filters[filter],
              className: 'vs-button--compact',
            },
          ),
        ),
      ),
      el(
        'main',
        { className: 'vs-galaxy__layout', attrs: { id: 'main-content' } },
        [
          el('div', { className: 'vs-galaxy__viewport' }, [
            el('p', {
              className: 'vs-galaxy__live vs-sr-only',
              attrs: { 'aria-live': 'polite' },
            }),
            el(
              'div',
              {
                className: 'vs-galaxy__grid',
                attrs: {
                  role: 'grid',
                  'aria-label': `Galaxy map, ${state.galaxy.width} by ${state.galaxy.height} sectors`,
                  style: `--galaxy-columns:${state.galaxy.width};--galaxy-zoom:${state.galaxy.zoom}`,
                },
              },
              state.galaxy.cells.map((cell) =>
                galaxyCell(cell, state, dispatch),
              ),
            ),
            el('div', { className: 'vs-zoom-controls' }, [
              button(
                'Zoom out',
                () => dispatch({ type: 'galaxy-zoom', delta: -1 }),
                { icon: 'zoom-out', className: 'vs-button--icon' },
              ),
              el('output', {
                text: `${state.galaxy.zoom.toFixed(1)}×`,
                attrs: { 'aria-label': 'Galaxy zoom' },
              }),
              button(
                'Zoom in',
                () => dispatch({ type: 'galaxy-zoom', delta: 1 }),
                { icon: 'zoom-in', className: 'vs-button--icon' },
              ),
            ]),
          ]),
          routeSheet(state, dispatch),
        ],
      ),
    ],
  );
}

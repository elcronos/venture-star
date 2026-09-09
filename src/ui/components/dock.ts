import { button, el, formatNumber, icon, labeledValue } from '../dom';
import type {
  DockState,
  MarketRow,
  ModuleCard,
  UiDispatch,
  UiIcon,
  UiState,
} from '../types';

const tabIcon: Record<DockState['activeTab'], UiIcon> = {
  overview: 'planet',
  market: 'market',
  shipyard: 'shipyard',
  planet: 'planet',
  research: 'research',
};

function overview(state: UiState, dispatch: UiDispatch): HTMLElement {
  const { dock } = state;
  return el(
    'section',
    {
      className: 'vs-management-panel',
      attrs: { 'aria-labelledby': 'overview-heading' },
    },
    [
      el('h2', {
        text: 'Dock overview',
        attrs: { id: 'overview-heading', tabindex: -1 },
      }),
      el('div', { className: 'vs-summary-grid' }, [
        el('article', { className: 'vs-stat-card' }, [
          icon('credits'),
          el('span', { text: 'Credits' }),
          el('strong', { text: formatNumber(dock.credits) }),
        ]),
        el('article', { className: 'vs-stat-card' }, [
          icon('cargo'),
          el('span', { text: 'Cargo' }),
          el('strong', { text: `${dock.cargo.current}/${dock.cargo.max}` }),
        ]),
        el('article', { className: 'vs-stat-card' }, [
          icon('fuel'),
          el('span', { text: 'Fuel' }),
          el('strong', { text: `${dock.fuel.current}/${dock.fuel.max} FU` }),
        ]),
        el('article', { className: 'vs-stat-card' }, [
          icon('hull'),
          el('span', { text: 'Hull' }),
          el('strong', { text: `${dock.hull.current}/${dock.hull.max}` }),
        ]),
        el('article', { className: 'vs-stat-card' }, [
          icon('bomb'),
          el('span', { text: 'Bombs' }),
          el('strong', { text: `${dock.bombs}/3` }),
        ]),
      ]),
      el('div', { className: 'vs-panel vs-dock-brief' }, [
        el('h3', { text: 'Services' }),
        el('p', {
          text: 'Trade local materials or fit a module before launching. Your route and tactical selection are preserved.',
        }),
        ...(dock.owner === 'player'
          ? [
              el('div', { className: 'vs-action-row' }, [
                button(
                  'Refuel 10 FU',
                  () => dispatch({ type: 'dock-service', service: 'refuel' }),
                  { icon: 'fuel' },
                ),
                button(
                  'Repair ship',
                  () => dispatch({ type: 'dock-service', service: 'repair' }),
                  { icon: 'hull' },
                ),
                button(
                  'Build bomb · 110 cr + 1 metal + 1 crystal',
                  () => dispatch({ type: 'dock-service', service: 'buy-bomb' }),
                  {
                    icon: 'bomb',
                    disabledReason:
                      dock.bombs >= 3 ? 'Bomb rack is full' : undefined,
                  },
                ),
              ]),
            ]
          : []),
        ...(dock.owner === 'neutral'
          ? [
              el('h3', { text: 'Peaceful acquisition' }),
              el('p', {
                text: `Influence ${dock.influence ?? 0}/${dock.resistance ?? 100}. Aid costs 80 credits and 2 ore.`,
              }),
              button(
                'Provide aid',
                () => dispatch({ type: 'dock-service', service: 'influence' }),
                { icon: 'research', className: 'vs-button--primary' },
              ),
            ]
          : []),
      ]),
    ],
  );
}

function materialIcon(row: MarketRow): UiIcon {
  return row.material === 'ore'
    ? 'ore'
    : row.material === 'metal'
      ? 'metal'
      : row.material === 'crystal'
        ? 'discovery'
        : 'discovery';
}

function market(state: UiState, dispatch: UiDispatch): HTMLElement {
  const { dock } = state;
  return el(
    'section',
    {
      className: 'vs-management-panel',
      attrs: { 'aria-labelledby': 'market-heading' },
    },
    [
      el('div', { className: 'vs-section-heading' }, [
        el('div', {}, [
          el('h2', {
            text: 'Market',
            attrs: { id: 'market-heading', tabindex: -1 },
          }),
          el('p', {
            text: 'Buy supplies for your next journey, or sell cargo to fund a refit. Prices are per unit.',
          }),
        ]),
        el('span', {
          className: 'vs-chip',
          text: `${formatNumber(dock.credits)} credits`,
        }),
      ]),
      el(
        'div',
        {
          className: 'vs-market',
          attrs: { role: 'table', 'aria-label': 'Market materials' },
        },
        [
          el(
            'div',
            { className: 'vs-market__header', attrs: { role: 'row' } },
            ['Material', 'You / stock', 'Buy / sell', 'Quantity', 'Action'].map(
              (label) =>
                el('span', { text: label, attrs: { role: 'columnheader' } }),
            ),
          ),
          ...dock.market.map((row) => marketRow(row, dock, dispatch)),
        ],
      ),
    ],
  );
}

function marketRow(
  row: MarketRow,
  dock: DockState,
  dispatch: UiDispatch,
): HTMLElement {
  const quantity = Math.max(1, Math.min(row.maxQuantity, row.quantity));
  const affordable = Math.floor(dock.credits / Math.max(1, row.buyPrice));
  const buyLimit = Math.min(
    row.stock,
    row.maxQuantity,
    affordable,
    Math.floor(
      (dock.cargo.max - dock.cargo.current) / Math.max(1, row.cargoWeight),
    ),
  );
  const buyReason =
    buyLimit < quantity
      ? row.stock < quantity
        ? 'Planet stock is too low'
        : affordable < quantity
          ? 'Insufficient credits'
          : 'Cargo capacity exceeded'
      : undefined;
  const sellReason =
    row.playerQuantity < quantity ? 'Not enough material in cargo' : undefined;
  const input = el('input', {
    attrs: {
      type: 'number',
      min: 1,
      max: row.maxQuantity,
      value: quantity,
      'aria-label': `${row.name} quantity`,
    },
  });
  input.addEventListener('change', () =>
    dispatch({
      type: 'market-quantity',
      rowId: row.id,
      quantity: Number(input.value),
    }),
  );
  return el('div', { className: 'vs-market__row', attrs: { role: 'row' } }, [
    el(
      'div',
      {
        className: 'vs-market__material',
        attrs: { role: 'cell', 'data-label': 'Material' },
      },
      [
        icon(materialIcon(row)),
        el('div', {}, [
          el('strong', { text: row.name }),
          el('span', { text: `${row.cargoWeight} cargo/unit · ${row.intel}` }),
        ]),
      ],
    ),
    el('span', {
      text: `${row.playerQuantity} / ${row.stock}`,
      attrs: { role: 'cell', 'data-label': 'You / stock' },
    }),
    el('span', {
      text: `${row.buyPrice} / ${row.sellPrice} cr`,
      attrs: { role: 'cell', 'data-label': 'Buy / sell' },
    }),
    el(
      'div',
      {
        className: 'vs-stepper',
        attrs: { role: 'cell', 'data-label': 'Quantity' },
      },
      [
        button(
          '−',
          () =>
            dispatch({
              type: 'market-quantity',
              rowId: row.id,
              quantity: Math.max(1, quantity - 1),
            }),
          {
            title: `Decrease ${row.name} quantity`,
            className: 'vs-button--icon',
          },
        ),
        input,
        button(
          '+',
          () =>
            dispatch({
              type: 'market-quantity',
              rowId: row.id,
              quantity: Math.min(row.maxQuantity, quantity + 1),
            }),
          {
            title: `Increase ${row.name} quantity`,
            className: 'vs-button--icon',
          },
        ),
        button(
          'Max',
          () =>
            dispatch({
              type: 'market-quantity',
              rowId: row.id,
              quantity: Math.max(1, buyLimit),
            }),
          { className: 'vs-button--compact' },
        ),
      ],
    ),
    el(
      'div',
      {
        className: 'vs-action-row',
        attrs: { role: 'cell', 'data-label': 'Action' },
      },
      [
        button(
          `Buy ${quantity} · ${quantity * row.buyPrice} cr`,
          () =>
            dispatch({
              type: 'market-trade',
              rowId: row.id,
              side: 'buy',
              quantity,
            }),
          { className: 'vs-button--compact', disabledReason: buyReason },
        ),
        button(
          `Sell ${quantity} · ${quantity * row.sellPrice} cr`,
          () =>
            dispatch({
              type: 'market-trade',
              rowId: row.id,
              side: 'sell',
              quantity,
            }),
          { className: 'vs-button--compact', disabledReason: sellReason },
        ),
      ],
    ),
  ]);
}

function moduleCard(module: ModuleCard, dispatch: UiDispatch): HTMLElement {
  return el(
    'article',
    { className: `vs-module-card ${module.installed ? 'is-installed' : ''}` },
    [
      el('div', { className: 'vs-panel__heading' }, [
        el('div', {}, [
          el('p', {
            className: 'vs-eyebrow',
            text: `${module.family} · T${module.tier}`,
          }),
          el('h3', { text: module.name }),
        ]),
        icon(
          module.family.toLowerCase().includes('scanner')
            ? 'scanner'
            : module.family.toLowerCase().includes('weapon')
              ? 'weapon'
              : 'shipyard',
        ),
      ]),
      module.installed
        ? el('span', { className: 'vs-chip', text: 'Installed' })
        : null,
      el('dl', { className: 'vs-key-values' }, [
        labeledValue(
          'Price',
          `${module.price} cr${module.materialCost ? ` + ${module.materialCost}` : ''}`,
        ),
        labeledValue(
          module.statLabel,
          `${module.before} → ${module.after}`,
          'is-upgrade',
        ),
      ]),
      module.disabledReason
        ? el('p', { className: 'vs-error-copy', text: module.disabledReason })
        : null,
      button(
        module.installed ? 'Installed' : 'Buy and fit',
        () => dispatch({ type: 'fit-module', moduleId: module.id }),
        {
          icon: 'shipyard',
          className: 'vs-button--primary',
          disabledReason: module.installed
            ? 'This module is already fitted'
            : module.disabledReason,
        },
      ),
    ],
  );
}

function shipyard(state: UiState, dispatch: UiDispatch): HTMLElement {
  return el(
    'section',
    {
      className: 'vs-management-panel',
      attrs: { 'aria-labelledby': 'shipyard-heading' },
    },
    [
      el('div', { className: 'vs-section-heading' }, [
        el('div', {}, [
          el('h2', {
            text: 'Shipyard',
            attrs: { id: 'shipyard-heading', tabindex: -1 },
          }),
          el('p', {
            text: 'Choose a system to improve. Review the full cost and resulting performance before fitting.',
          }),
        ]),
        el('span', {
          className: 'vs-chip',
          text: `${state.dock.modules.filter((item) => item.installed).length} upgraded systems`,
        }),
      ]),
      el(
        'div',
        { className: 'vs-card-grid' },
        state.dock.modules.map((module) => moduleCard(module, dispatch)),
      ),
    ],
  );
}

export function renderDock(state: UiState, dispatch: UiDispatch): HTMLElement {
  const { dock } = state;
  if (dock.captured) {
    return el(
      'section',
      {
        className: 'vs-screen vs-run-end',
        attrs: { 'aria-labelledby': 'capture-heading' },
      },
      [
        icon('danger'),
        el('h1', {
          text: 'Planet captured — emergency launch',
          attrs: { id: 'capture-heading' },
        }),
        el('p', {
          text: 'Management services are unavailable. The flagship will be ejected into a legal launch corridor.',
        }),
        button('Emergency launch', () => dispatch({ type: 'launch' }), {
          icon: 'play',
          className: 'vs-button--primary',
        }),
      ],
    );
  }
  const body =
    dock.activeTab === 'market'
      ? market(state, dispatch)
      : dock.activeTab === 'shipyard'
        ? shipyard(state, dispatch)
        : overview(state, dispatch);
  return el(
    'section',
    {
      className: 'vs-screen vs-management',
      attrs: { 'aria-labelledby': 'dock-title' },
    },
    [
      el('header', { className: 'vs-screen__header' }, [
        el('div', {}, [
          el('p', {
            className: `vs-eyebrow relation-${dock.owner}`,
            text: `${dock.owner} world · PAUSED`,
          }),
          el('h1', {
            text: dock.planetName,
            attrs: { id: 'dock-title', tabindex: -1 },
          }),
        ]),
        button('Launch', () => dispatch({ type: 'launch' }), {
          icon: 'play',
          className: 'vs-button--primary',
        }),
      ]),
      el(
        'nav',
        {
          className: 'vs-management-tabs',
          attrs: { 'aria-label': 'Dock services' },
        },
        (['overview', 'market', 'shipyard', 'planet', 'research'] as const)
          .filter((tab) => dock.availableTabs.includes(tab))
          .map((tab) =>
            button(
              tab.charAt(0).toUpperCase() + tab.slice(1),
              () => dispatch({ type: 'dock-tab', tab }),
              { icon: tabIcon[tab], pressed: dock.activeTab === tab },
            ),
          ),
      ),
      el(
        'main',
        { className: 'vs-management__body', attrs: { id: 'main-content' } },
        [body],
      ),
      el('div', { className: 'vs-management__launch' }, [
        button('Launch', () => dispatch({ type: 'launch' }), {
          icon: 'play',
          className: 'vs-button--primary',
        }),
      ]),
    ],
  );
}

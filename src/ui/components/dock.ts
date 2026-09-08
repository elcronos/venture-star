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
          text: 'Fuel and materials are traded in the Market tab. Your route and tactical selection are preserved.',
        }),
        el('div', { className: 'vs-action-row' }, [
          button(
            'Repair hull and armour',
            () => dispatch({ type: 'dock-service', service: 'repair' }),
            {
              icon: 'hull',
              // Repairs are a service of a planet you own, not of any market.
              disabledReason:
                dock.owner !== 'player'
                  ? 'Repairs need a planet you control'
                  : dock.hull.current >= dock.hull.max
                    ? 'Hull and armour are already intact'
                    : undefined,
            },
          ),
          button(
            'Build bomb · 110 cr + 1 metal + 1 crystal',
            () => dispatch({ type: 'dock-service', service: 'buy-bomb' }),
            {
              icon: 'bomb',
              disabledReason:
                dock.owner !== 'player'
                  ? 'Bombs are built at a planet you control'
                  : dock.bombs >= 3
                    ? 'Bomb rack is full'
                    : undefined,
            },
          ),
        ]),
        ...(dock.owner === 'neutral' && dock.influenceActions
          ? [
              el('h3', { text: 'Peaceful acquisition' }),
              el('p', {
                text: `This world answers to nobody. Win it by argument rather than by bombs: reach ${dock.resistance ?? 100} influence and it joins you. Each action can be repeated as its own rules allow.`,
              }),
              influenceMeter(dock.influence ?? 0, dock.resistance ?? 100),
              el(
                'div',
                { className: 'vs-action-row vs-influence-actions' },
                dock.influenceActions.map((action) =>
                  button(
                    action.label,
                    () =>
                      dispatch({
                        type: 'dock-service',
                        service: action.id as 'influence-aid',
                      }),
                    {
                      icon: action.icon,
                      disabledReason: action.disabledReason,
                      className: 'vs-button--compact',
                    },
                  ),
                ),
              ),
            ]
          : []),
      ]),
    ],
  );
}

/** Progress toward owning a neutral world by persuasion rather than force. */
function influenceMeter(current: number, max: number): HTMLElement {
  const ratio = max > 0 ? Math.max(0, Math.min(1, current / max)) : 0;
  return el(
    'div',
    {
      className: 'vs-meter vs-meter--influence',
      attrs: {
        role: 'meter',
        'aria-label': 'Influence',
        'aria-valuemin': 0,
        'aria-valuemax': max,
        'aria-valuenow': current,
      },
    },
    [
      icon('research'),
      el('span', { className: 'vs-meter__label', text: 'Influence' }),
      el(
        'span',
        { className: 'vs-meter__track', attrs: { 'aria-hidden': 'true' } },
        [
          el('span', {
            className: 'vs-meter__fill',
            attrs: { style: `--meter-value:${ratio}` },
          }),
        ],
      ),
      el('span', { className: 'vs-meter__value', text: `${current}/${max}` }),
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
            text: 'Fixed local quotes. Transactions commit atomically.',
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
            [
              'Material',
              'In hold / for sale',
              'Buy at',
              'Sell at',
              'Quantity',
              'Action',
            ].map(
              (label) =>
                el('span', { text: label, attrs: { role: 'columnheader' } }),
            ),
          ),
          ...dock.market.map((row) => marketRow(row, dock, dispatch)),
          fuelRow(dock, dispatch),
        ],
      ),
      el('p', { className: 'vs-market__footnote' }, [
        icon('fuel'),
        el('span', {
          text:
            dock.owner === 'player'
              ? 'Fuel is subsidised at your own planets. Neutral ports charge triple.'
              : 'Neutral ports charge 3 credits per unit. Your own planets charge 1.',
        }),
      ]),
    ],
  );
}

/**
 * Fuel sits in the market rather than behind a fixed "Refuel 10" button: it is
 * bought by the unit at a quoted price, exactly like every other commodity.
 */
function fuelRow(dock: DockState, dispatch: UiDispatch): HTMLElement {
  const offer = dock.fuelOffer;
  const quantity = Math.max(1, Math.min(offer.quantity, offer.maxQuantity || 1));
  const setQuantity = (value: number) =>
    dispatch({
      type: 'market-quantity',
      rowId: 'fuel',
      quantity: Math.max(1, Math.min(value, offer.maxQuantity || 1)),
    });
  const input = el('input', {
    attrs: {
      type: 'number',
      min: 1,
      max: Math.max(1, offer.maxQuantity),
      value: quantity,
      'aria-label': 'Fuel quantity',
    },
  });
  input.addEventListener('change', () => setQuantity(Number(input.value)));
  return el(
    'div',
    { className: 'vs-market__row is-fuel', attrs: { role: 'row' } },
    [
      el(
        'div',
        {
          className: 'vs-market__material',
          attrs: { role: 'cell', 'data-label': 'Material' },
        },
        [
          icon('fuel'),
          el('div', {}, [
            el('strong', { text: 'Fuel' }),
            el('span', {
              text: `${dock.fuel.current}/${dock.fuel.max} FU in tank`,
            }),
          ]),
        ],
      ),
      el('span', {
        text: `${dock.fuel.current} / ${offer.stock}`,
        attrs: { role: 'cell', 'data-label': 'In hold / for sale' },
      }),
      el('span', {
        className: 'vs-market__price',
        text: `${offer.price} cr`,
        attrs: { role: 'cell', 'data-label': 'Buy at' },
      }),
      el('span', {
        className: 'vs-muted',
        text: '—',
        attrs: { role: 'cell', 'data-label': 'Sell at' },
      }),
      el(
        'div',
        {
          className: 'vs-stepper',
          attrs: { role: 'cell', 'data-label': 'Quantity' },
        },
        [
          button('−', () => setQuantity(quantity - 1), {
            title: 'Decrease fuel quantity',
            className: 'vs-button--glyph',
          }),
          input,
          button('+', () => setQuantity(quantity + 1), {
            title: 'Increase fuel quantity',
            className: 'vs-button--glyph',
          }),
          button('Fill tank', () => setQuantity(offer.maxQuantity), {
            className: 'vs-button--compact',
            title: `Take as much as credits, stock and tank allow (${offer.maxQuantity})`,
            disabledReason: offer.maxQuantity < 1 ? 'Cannot buy any' : undefined,
          }),
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
            `Buy ${quantity} FU · ${formatNumber(quantity * offer.price)} cr`,
            () =>
              dispatch({
                type: 'dock-service',
                service: 'refuel',
                amount: quantity,
              }),
            {
              className: 'vs-button--primary vs-button--compact',
              icon: 'fuel',
              disabledReason:
                offer.disabledReason ??
                (offer.maxQuantity < 1 ? 'Cannot buy any' : undefined),
            },
          ),
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
      attrs: { role: 'cell', 'data-label': 'In hold / for sale' },
    }),
    el('span', {
      className: 'vs-market__price',
      text: `${row.buyPrice} cr`,
      attrs: { role: 'cell', 'data-label': 'Buy at' },
    }),
    el('span', {
      className: 'vs-market__price',
      text: `${row.sellPrice} cr`,
      attrs: { role: 'cell', 'data-label': 'Sell at' },
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
            className: 'vs-button--glyph',
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
            className: 'vs-button--glyph',
          },
        ),
        button(
          'Max buy',
          () =>
            dispatch({
              type: 'market-quantity',
              rowId: row.id,
              quantity: Math.max(1, buyLimit),
            }),
          {
            className: 'vs-button--compact',
            title: `Buy as many as credits, stock and hold allow (${buyLimit})`,
            disabledReason: buyLimit < 1 ? 'Cannot buy any' : undefined,
          },
        ),
        button(
          'Max sell',
          () =>
            dispatch({
              type: 'market-quantity',
              rowId: row.id,
              quantity: Math.max(1, row.playerQuantity),
            }),
          {
            className: 'vs-button--compact',
            title: `Sell the whole stack (${row.playerQuantity})`,
            disabledReason:
              row.playerQuantity < 1 ? 'None in the hold' : undefined,
          },
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
          `Buy ${quantity} · ${formatNumber(quantity * row.buyPrice)} cr`,
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
          `Sell ${quantity} · +${formatNumber(quantity * row.sellPrice)} cr`,
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
            text: 'Three generic slots. Review every resulting stat before fitting.',
          }),
        ]),
        el('span', {
          className: 'vs-chip',
          text: `${state.dock.modules.filter((item) => item.installed).length}/3 slots`,
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

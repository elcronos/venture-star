import { button, el, formatNumber, icon } from '../dom';
import type {
  FlightState,
  MeterState,
  UiDispatch,
  UiIcon,
  UiState,
} from '../types';

function meter(
  state: MeterState,
  iconName: UiIcon,
  extraClass = '',
): HTMLElement {
  const ratio =
    state.max > 0 ? Math.max(0, Math.min(1, state.current / state.max)) : 0;
  const critical = Boolean(state.critical);
  const root = el('div', {
    className: `vs-meter vs-meter--${iconName} ${critical ? 'is-critical' : ''} ${extraClass}`,
    attrs: {
      role: 'meter',
      'aria-label': state.label,
      'aria-valuemin': 0,
      'aria-valuemax': state.max,
      'aria-valuenow': state.current,
    },
  });
  root.append(
    icon(iconName),
    el('span', { className: 'vs-meter__label', text: state.label }),
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
    el('span', {
      className: 'vs-meter__value',
      text: ['shield', 'armour', 'hull'].includes(iconName)
        ? formatNumber(state.current)
        : `${formatNumber(state.current)}/${formatNumber(state.max)}`,
    }),
  );
  if (critical)
    root.append(
      el('strong', { className: 'vs-meter__critical', text: 'CRITICAL' }, [
        icon('danger'),
      ]),
    );
  return root;
}

function targetCard(
  flight: FlightState,
  dispatch: UiDispatch,
): HTMLElement | null {
  const target = flight.target;
  if (!target) return null;
  const actions = target.actions.slice(0, 3).map((action) =>
    button(
      action.label,
      () =>
        dispatch({
          type: 'context-action',
          actionId: action.id,
          targetId: target.id,
        }),
      {
        icon: action.icon,
        disabledReason: action.disabledReason,
        className: action.destructive
          ? 'vs-button--danger'
          : 'vs-button--compact',
      },
    ),
  );
  return el(
    'section',
    {
      className: `vs-panel vs-target relation-${target.relation}`,
      attrs: { 'aria-labelledby': 'target-heading' },
    },
    [
      el('div', { className: 'vs-panel__heading' }, [
        el('div', {}, [
          el('p', {
            className: 'vs-eyebrow',
            text: `${target.relation} · ${target.intel}`,
          }),
          el('h2', { text: target.name, attrs: { id: 'target-heading' } }),
        ]),
        icon(
          target.relation === 'hostile'
            ? 'danger'
            : target.type === 'planet'
              ? 'planet'
              : 'ship',
        ),
      ]),
      el('dl', { className: 'vs-target__facts' }, [
        el('div', {}, [
          el('dt', { text: 'Type' }),
          el('dd', { text: target.type }),
        ]),
        el('div', {}, [
          el('dt', { text: 'Distance' }),
          el('dd', { text: `${formatNumber(target.distance, 1)} wu` }),
        ]),
        el('div', {}, [
          el('dt', { text: 'Range' }),
          el('dd', { text: target.rangeState ?? 'Unknown' }),
        ]),
        el('div', {}, [
          el('dt', { text: 'Intel' }),
          el('dd', {
            text: target.intelAge
              ? `${target.intel} · ${target.intelAge}`
              : target.intel,
          }),
        ]),
      ]),
      target.shield || target.armour || target.hull
        ? el('div', { className: 'vs-target__health' }, [
            target.shield ? meter(target.shield, 'shield') : null,
            target.armour ? meter(target.armour, 'armour') : null,
            target.hull ? meter(target.hull, 'hull') : null,
          ])
        : null,
      el('div', { className: 'vs-action-row vs-target__actions' }, actions),
    ],
  );
}

function contacts(flight: FlightState, dispatch: UiDispatch): HTMLElement {
  const ordered = [...flight.contacts].sort((a, b) => {
    const rank = (contact: (typeof flight.contacts)[number]) =>
      contact.selected ? 0 : contact.threat ? 1 : contact.interactable ? 2 : 3;
    return rank(a) - rank(b) || a.distance - b.distance;
  });
  return el(
    'section',
    {
      className: 'vs-sr-contacts',
      attrs: { 'aria-labelledby': 'contacts-heading' },
    },
    [
      el('h2', { text: 'Nearby contacts', attrs: { id: 'contacts-heading' } }),
      el(
        'ul',
        {},
        ordered.map((contact) =>
          el('li', { className: contact.selected ? 'is-selected' : '' }, [
            el('div', {}, [
              el('strong', { text: contact.name }),
              el('span', {
                text: `${contact.type}; ${contact.relation}; ${contact.direction}; ${formatNumber(contact.distance, 1)} wu`,
              }),
              contact.health
                ? el('span', { text: `Health ${contact.health}` })
                : null,
            ]),
            el('div', { className: 'vs-action-row' }, [
              button(
                'Select',
                () =>
                  dispatch({ type: 'select-contact', contactId: contact.id }),
                { className: 'vs-button--compact' },
              ),
              button(
                'Autopilot',
                () =>
                  dispatch({
                    type: 'autopilot-contact',
                    contactId: contact.id,
                  }),
                { className: 'vs-button--compact', icon: 'route' },
              ),
            ]),
          ]),
        ),
      ),
    ],
  );
}

function touchControls(flight: FlightState, dispatch: UiDispatch): HTMLElement {
  const hold = (control: 'thrust' | 'left' | 'right' | 'brake') => {
    const node = button(
      control === 'brake' ? 'Brake' : control,
      () => undefined,
      { className: `vs-touch-${control}` },
    );
    const activate = (event: PointerEvent) => {
      event.preventDefault();
      node.setPointerCapture(event.pointerId);
      dispatch({ type: 'flight-control', control, active: true });
    };
    const release = () =>
      dispatch({ type: 'flight-control', control, active: false });
    node.addEventListener('pointerdown', activate);
    node.addEventListener('pointerup', release);
    node.addEventListener('pointercancel', release);
    node.addEventListener('lostpointercapture', release);
    return node;
  };
  const throttle = el('input', {
    className: 'vs-throttle__input',
    attrs: {
      type: 'range',
      min: 0,
      max: 100,
      step: 25,
      value: flight.throttle,
      'aria-label': 'Throttle percent',
    },
  });
  throttle.addEventListener('input', () =>
    dispatch({ type: 'throttle', value: Number(throttle.value) }),
  );
  const changeThrottle = (delta: number) => {
    const value = Math.max(0, Math.min(100, Number(throttle.value) + delta));
    throttle.value = String(value);
    dispatch({ type: 'throttle', value });
  };
  const joystick = el(
    'div',
    {
      className: 'vs-joystick',
      attrs: { role: 'application', 'aria-label': 'Analog flight joystick' },
    },
    [
      el('span', {
        className: 'vs-joystick__knob',
        attrs: { 'aria-hidden': 'true' },
      }),
    ],
  );
  let joystickPointer: number | undefined;
  const moveJoystick = (event: PointerEvent) => {
    if (joystickPointer !== event.pointerId) return;
    const bounds = joystick.getBoundingClientRect();
    const radius = Math.min(bounds.width, bounds.height) / 2;
    const rawX = (event.clientX - (bounds.left + bounds.width / 2)) / radius;
    const rawY = (event.clientY - (bounds.top + bounds.height / 2)) / radius;
    const length = Math.hypot(rawX, rawY);
    const scale = length > 1 ? 1 / length : 1;
    const x = rawX * scale;
    const y = rawY * scale;
    const dead = length <= 0.12;
    joystick.style.setProperty('--joystick-x', String(dead ? 0 : x));
    joystick.style.setProperty('--joystick-y', String(dead ? 0 : y));
    dispatch({
      type: 'joystick',
      x: dead ? 0 : x,
      y: dead ? 0 : y,
      active: !dead,
    });
  };
  const stopJoystick = () => {
    joystickPointer = undefined;
    joystick.style.setProperty('--joystick-x', '0');
    joystick.style.setProperty('--joystick-y', '0');
    dispatch({ type: 'joystick', x: 0, y: 0, active: false });
  };
  joystick.addEventListener('pointerdown', (event) => {
    if (joystickPointer !== undefined) return;
    joystickPointer = event.pointerId;
    joystick.setPointerCapture(event.pointerId);
    moveJoystick(event);
  });
  joystick.addEventListener('pointermove', moveJoystick);
  joystick.addEventListener('pointerup', stopJoystick);
  joystick.addEventListener('pointercancel', stopJoystick);
  joystick.addEventListener('lostpointercapture', stopJoystick);
  return el(
    'section',
    {
      className: 'vs-touch-controls',
      attrs: { 'aria-label': 'Flight controls' },
    },
    [
      joystick,
      el(
        'div',
        {
          className: 'vs-screen-reader-flight',
          attrs: { role: 'group', 'aria-label': 'Discrete flight controls' },
        },
        [hold('thrust'), hold('left'), hold('right'), hold('brake')],
      ),
      el('label', { className: 'vs-throttle' }, [
        el('span', { text: `Throttle ${flight.throttle}%` }),
        throttle,
        el('span', { className: 'vs-throttle__buttons' }, [
          button(
            'Decrease throttle',
            () => changeThrottle(-25),
            { className: 'vs-button--compact' },
          ),
          button(
            'Increase throttle',
            () => changeThrottle(25),
            { className: 'vs-button--compact' },
          ),
        ]),
      ]),
    ],
  );
}

export function renderHud(state: UiState, dispatch: UiDispatch): HTMLElement {
  const { flight } = state;
  const criticalAlert = flight.alerts.find(
    (alert) => alert.severity === 'critical',
  );
  return el(
    'main',
    { className: 'vs-hud', attrs: { 'aria-labelledby': 'flight-title' } },
    [
      el('h1', {
        className: 'vs-flight-title vs-sr-only',
        text: `Flight — ${flight.campaignName}`,
        attrs: { id: 'flight-title' },
      }),
      el('a', {
        className: 'vs-skip-link',
        text: 'Skip to flight controls',
        attrs: { href: '#flight-controls' },
      }),
      el('a', {
        className: 'vs-skip-link',
        text: 'Skip to status',
        attrs: { href: '#ship-status' },
      }),
      el('header', { className: 'vs-hud__top' }, [
        el('div', { className: 'vs-sector' }, [
          el('span', { className: 'vs-eyebrow', text: 'Sector' }),
          el('strong', { text: `${flight.sector.x},${flight.sector.y}` }),
          el(
            'span',
            {
              className: `vs-danger danger-${flight.sector.danger.toLowerCase().replaceAll(' ', '-')}`,
              text: flight.sector.danger,
            },
            [icon('danger')],
          ),
        ]),
        button(
          'Galaxy',
          () => dispatch({ type: 'navigate', destination: 'galaxy' }),
          { icon: 'route', className: 'vs-button--compact' },
        ),
        button('Scan', () => dispatch({ type: 'scan' }), {
          icon: 'scanner',
          className: 'vs-button--compact',
        }),
        button(
          'Timeline',
          () => dispatch({ type: 'open-overlay', overlay: 'timeline' }),
          { icon: 'timeline', className: 'vs-button--compact' },
        ),
        state.pauseReasons.length
          ? button(
              'PAUSED',
              () => dispatch({ type: 'open-overlay', overlay: 'pause' }),
              { icon: 'pause', className: 'vs-button--warning' },
            )
          : button('Pause', () => dispatch({ type: 'pause' }), {
              icon: 'pause',
              className: 'vs-button--icon',
            }),
        el('span', {
          className: `vs-save-state ${state.saveState === 'Save failed' ? 'is-critical' : ''}`,
          text: state.saveState,
        }),
      ]),
      criticalAlert
        ? el(
            'div',
            { className: 'vs-critical-banner', attrs: { role: 'alert' } },
            [icon('danger'), el('strong', { text: criticalAlert.message })],
          )
        : null,
      el(
        'aside',
        {
          className: 'vs-panel vs-status',
          attrs: { id: 'ship-status', 'aria-labelledby': 'status-heading' },
        },
        [
          el('div', { className: 'vs-panel__heading' }, [
            el('h2', {
              text: flight.campaignName,
              attrs: { id: 'status-heading' },
            }),
            icon('ship'),
          ]),
          meter(flight.shield, 'shield'),
          meter(flight.armour, 'armour'),
          meter(flight.hull, 'hull'),
          meter(flight.fuel, 'fuel'),
          meter(flight.cargo, 'cargo'),
          flight.emergencyDrift
            ? el(
                'p',
                {
                  className: 'vs-emergency',
                  text: 'EMERGENCY DRIFT — weapons and mining offline',
                },
                [icon('danger')],
              )
            : null,
          el('dl', { className: 'vs-status__data' }, [
            el('div', {}, [
              el('dt', { text: 'Speed' }),
              el('dd', { text: `${formatNumber(flight.speed, 1)} wu/s` }),
            ]),
            el('div', {}, [
              el('dt', { text: 'Throttle' }),
              el('dd', { text: `${flight.throttle}%` }),
            ]),
            el('div', {}, [
              el('dt', { text: 'Heading' }),
              el('dd', { text: `${flight.heading}°` }),
            ]),
            el('div', {}, [
              el('dt', { text: 'Credits' }),
              el('dd', { text: formatNumber(flight.credits) }),
            ]),
            el('div', {}, [
              el('dt', { text: 'Bombs' }),
              el('dd', { text: String(flight.bombs) }),
            ]),
          ]),
          flight.autopilot
            ? el('p', { className: 'vs-autopilot', text: flight.autopilot }, [
                icon('route'),
              ])
            : null,
          flight.stationLock !== undefined
            ? el(
                'p',
                {
                  className: 'vs-lock',
                  text: `Range lock ${Math.round(flight.stationLock * 100)}%`,
                },
                [icon('mining')],
              )
            : null,
        ],
      ),
      targetCard(flight, dispatch),
      flight.objective
        ? el(
            'section',
            {
              className: 'vs-objective',
              attrs: { 'aria-label': 'Current objective' },
            },
            [
              icon('objective'),
              el('div', {}, [
                el('span', {
                  className: 'vs-eyebrow',
                  text: 'Current objective',
                }),
                el('strong', { text: flight.objective }),
              ]),
              flight.planetsControlled
                ? el('span', { text: flight.planetsControlled })
                : null,
            ],
          )
        : null,
      el(
        'nav',
        {
          className: 'vs-context-actions',
          attrs: { 'aria-label': 'Context actions', id: 'flight-controls' },
        },
        flight.actions.slice(0, 3).map((action) =>
          button(
            action.label,
            () =>
              dispatch({
                type: 'context-action',
                actionId: action.id,
                targetId: flight.target?.id,
              }),
            {
              icon: action.icon,
              disabledReason: action.disabledReason,
              className: action.destructive
                ? 'vs-button--danger vs-button--special'
                : 'vs-button--primary',
            },
          ),
        ),
      ),
      touchControls(flight, dispatch),
      contacts(flight, dispatch),
    ],
  );
}

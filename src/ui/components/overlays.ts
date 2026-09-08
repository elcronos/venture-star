import { button, el, icon } from '../dom';
import type {
  SettingsState,
  TimelineCategory,
  UiDispatch,
  UiState,
} from '../types';

function timeline(state: UiState, dispatch: UiDispatch): HTMLElement {
  const filter = state.timelineFilter ?? 'All';
  const query = (state.timelineSearch ?? '').toLocaleLowerCase();
  const events = state.flight.timeline.filter(
    (event) =>
      (filter === 'All' || event.category === filter) &&
      (!query ||
        `${event.title} ${event.message}`.toLocaleLowerCase().includes(query)),
  );
  const search = el('input', {
    attrs: {
      type: 'search',
      value: state.timelineSearch ?? '',
      placeholder: 'Search events',
      'aria-label': 'Search timeline',
    },
  });
  search.addEventListener('input', () =>
    dispatch({ type: 'timeline-search', query: search.value }),
  );
  const filters: Array<'All' | TimelineCategory> = [
    'All',
    'Critical',
    'Planets',
    'Rivals',
    'Economy',
    'Discoveries',
    'Combat',
  ];
  return el(
    'aside',
    {
      className: 'vs-layer vs-drawer vs-timeline',
      attrs: {
        role: 'dialog',
        'aria-modal': 'true',
        'aria-labelledby': 'timeline-title',
      },
    },
    [
      el('header', { className: 'vs-layer__header' }, [
        el('div', {}, [
          el('p', {
            className: 'vs-eyebrow',
            text: `${events.length} visible events`,
          }),
          el('h2', {
            text: 'Campaign timeline',
            attrs: { id: 'timeline-title', tabindex: -1 },
          }),
        ]),
        button('Close', () => dispatch({ type: 'close-overlay' }), {
          icon: 'close',
          className: 'vs-button--icon',
        }),
      ]),
      search,
      el(
        'nav',
        {
          className: 'vs-filter-bar',
          attrs: { 'aria-label': 'Timeline filters' },
        },
        filters.map((item) =>
          button(
            item,
            () => dispatch({ type: 'timeline-filter', filter: item }),
            { pressed: item === filter, className: 'vs-button--compact' },
          ),
        ),
      ),
      el(
        'ol',
        { className: 'vs-timeline__events' },
        events.map((event) =>
          el('li', { className: `severity-${event.severity}` }, [
            el('div', {}, [
              el('span', {
                className: 'vs-eyebrow',
                text: `${event.category} · ${event.occurredAtUnknownTime ? 'Occurred at unknown time' : event.simulationTime}`,
              }),
              el('h3', { text: event.title }),
              el('p', { text: event.message }),
            ]),
            event.location
              ? button(
                  'Show location',
                  () =>
                    dispatch({ type: 'timeline-location', eventId: event.id }),
                  {
                    icon: 'center',
                    className: 'vs-button--compact',
                    title: event.location.intelAge
                      ? `Intel ${event.location.intelAge}`
                      : undefined,
                  },
                )
              : null,
          ]),
        ),
      ),
    ],
  );
}

function settings(state: UiState, dispatch: UiDispatch): HTMLElement {
  let draft: SettingsState = { ...state.settings };
  const form = el('form', { className: 'vs-settings' });
  const checkbox = (
    key: keyof Pick<
      SettingsState,
      | 'haptics'
      | 'reducedMotion'
      | 'highContrast'
      | 'hudNumbers'
      | 'fixedJoystick'
      | 'tutorial'
    >,
    label: string,
  ) => {
    const input = el('input', {
      attrs: { type: 'checkbox', checked: draft[key] },
    });
    input.addEventListener('change', () => {
      draft = { ...draft, [key]: input.checked };
      dispatch({ type: 'settings-change', settings: draft });
    });
    return el('label', { className: 'vs-check-field' }, [
      input,
      el('span', { text: label }),
    ]);
  };
  const select = <K extends keyof SettingsState>(
    key: K,
    label: string,
    values: Array<[SettingsState[K], string]>,
  ) => {
    const id = `setting-${String(key)}`;
    const input = el(
      'select',
      { attrs: { id } },
      values.map(([value, text]) =>
        el('option', {
          text,
          attrs: { value: String(value), selected: value === draft[key] },
        }),
      ),
    );
    input.addEventListener('change', () => {
      draft = { ...draft, [key]: input.value as SettingsState[K] };
      dispatch({ type: 'settings-change', settings: draft });
    });
    return el('div', { className: 'vs-field' }, [
      el('label', { text: label, attrs: { for: id } }),
      input,
    ]);
  };
  form.append(
    checkbox('reducedMotion', 'Reduced motion'),
    checkbox('highContrast', 'High contrast'),
    checkbox('hudNumbers', 'Show HUD numbers'),
    checkbox('haptics', 'Haptics'),
    checkbox('fixedJoystick', 'Fixed joystick center'),
    checkbox('tutorial', 'Tutorial guidance'),
    select('screenShake', 'Screen shake', [
      ['off', 'Off'],
      ['half', 'Half'],
      ['full', 'Full'],
    ]),
    select('textScale', 'Text scale', [
      ['100', '100%'],
      ['115', '115%'],
      ['130', '130%'],
      ['150', '150%'],
    ]),
    select('touchControls', 'Touch controls', [
      ['auto', 'Automatic'],
      ['on', 'Always on'],
      ['off', 'Off'],
    ]),
    el('div', { className: 'vs-action-row vs-field--wide' }, [
      button('Cancel', () => dispatch({ type: 'close-overlay' }), {
        icon: 'close',
      }),
      button(
        'Apply settings',
        () => dispatch({ type: 'settings-apply', settings: draft }),
        { icon: 'settings', className: 'vs-button--primary' },
      ),
    ]),
    el('section', { className: 'vs-danger-zone vs-field--wide' }, [
      el('h3', { text: 'Reset' }),
      el('p', {
        text: 'Presentation and tutorial resets never alter campaign saves or records.',
      }),
      button('Reset presentation settings', () =>
        dispatch({ type: 'settings-reset-presentation' }),
      ),
      button('Reset tutorial progress', () => {
        if (
          globalThis.confirm(
            'Reset completed tutorial lessons? Campaign saves and records will not be changed.',
          )
        )
          dispatch({ type: 'settings-reset-tutorial' });
      }),
    ]),
  );
  form.addEventListener('submit', (event) => event.preventDefault());
  return modal('Settings', form, () => dispatch({ type: 'close-overlay' }));
}

function help(dispatch: UiDispatch): HTMLElement {
  const controls: Array<[string, string]> = [
    ['W / ↑', 'Forward thrust'],
    ['S / ↓', 'Brake, then reverse'],
    ['A D / ← →', 'Turn'],
    ['E', 'Context action'],
    ['R', 'Plot or cancel autopilot'],
    ['G', 'Galaxy'],
    ['T', 'Timeline'],
    ['Space', 'Pause'],
    ['Escape', 'Back / Pause'],
  ];
  return modal(
    'Controls / How to play',
    el('div', { className: 'vs-help' }, [
      el('p', {
        text: 'Fly one flagship, scan the frontier, mine and trade, then win every planet through influence or force.',
      }),
      el(
        'dl',
        { className: 'vs-controls-list' },
        controls.map(([key, action]) =>
          el('div', {}, [el('dt', { text: key }), el('dd', { text: action })]),
        ),
      ),
      el('p', {
        className: 'vs-muted',
        text: 'Touch provides directional controls, throttle, brake, and the same contextual actions. The game is intentionally silent; all events have durable visual and text feedback.',
      }),
    ]),
    () => dispatch({ type: 'close-overlay' }),
  );
}

function pause(state: UiState, dispatch: UiDispatch): HTMLElement {
  return modal(
    'Paused',
    el('div', { className: 'vs-pause-menu' }, [
      el('p', {
        text: `Simulation stopped: ${state.pauseReasons.join(', ') || 'explicit pause'}. Clearing one reason will not clear the others.`,
      }),
      button('Resume', () => dispatch({ type: 'resume' }), {
        icon: 'play',
        className: 'vs-button--primary',
      }),
      button(
        'Galaxy',
        () => dispatch({ type: 'navigate', destination: 'galaxy' }),
        { icon: 'route' },
      ),
      button(
        'Timeline',
        () => dispatch({ type: 'open-overlay', overlay: 'timeline' }),
        { icon: 'timeline' },
      ),
      button(
        'Settings',
        () => dispatch({ type: 'open-overlay', overlay: 'settings' }),
        { icon: 'settings' },
      ),
      button(
        'Help / Controls',
        () => dispatch({ type: 'open-overlay', overlay: 'help' }),
        { icon: 'objective' },
      ),
      el('p', { className: 'vs-save-state', text: state.saveState }),
      button('Return Home', () => dispatch({ type: 'return-home' }), {
        icon: 'home',
      }),
    ]),
    () => dispatch({ type: 'close-overlay' }),
  );
}

function resume(state: UiState, dispatch: UiDispatch): HTMLElement {
  return modal(
    'Ready to resume',
    el('div', { className: 'vs-resume-card' }, [
      el('p', {
        text: `Location ${state.flight.sector.x},${state.flight.sector.y} · ${state.flight.objective ?? 'No active objective'}`,
      }),
      el('p', { className: 'vs-save-state', text: state.saveState }),
      el('p', {
        className: 'vs-muted',
        text: 'Flight input remains neutral until you choose Resume and make a fresh input.',
      }),
      button('Resume flight', () => dispatch({ type: 'resume' }), {
        icon: 'play',
        className: 'vs-button--primary',
      }),
    ]),
    () => dispatch({ type: 'return-home' }),
  );
}

function runEnd(state: UiState, dispatch: UiDispatch): HTMLElement {
  const record =
    state.records.find((item) => item.id === state.selectedRecordId) ??
    state.records[0];
  const title =
    record?.outcome === 'Victory'
      ? 'Galaxy secured'
      : 'Flagship destroyed — campaign sealed';
  return el(
    'section',
    {
      className: 'vs-layer vs-modal vs-run-end',
      attrs: {
        role: 'alertdialog',
        'aria-modal': 'true',
        'aria-labelledby': 'run-end-title',
      },
    },
    [
      icon(record?.outcome === 'Victory' ? 'discovery' : 'danger'),
      el('h2', { text: title, attrs: { id: 'run-end-title', tabindex: -1 } }),
      el('p', {
        text: record
          ? `${record.seed} · ${record.engagedDuration} engaged duration`
          : 'The terminal transaction is sealed and cannot be continued.',
      }),
      record?.fatalSource
        ? el('p', {
            className: 'vs-error-copy',
            text: `Fatal source: ${record.fatalSource}`,
          })
        : null,
      button('New galaxy', () => dispatch({ type: 'new-campaign' }), {
        icon: 'play',
        className: 'vs-button--primary',
      }),
      record
        ? button(
            'Replay seed',
            () => dispatch({ type: 'replay-seed', recordId: record.id }),
            { icon: 'route' },
          )
        : null,
      button(
        'View History',
        () => dispatch({ type: 'navigate', destination: 'history' }),
        { icon: 'record' },
      ),
    ],
  );
}

function modal(
  title: string,
  content: HTMLElement,
  close: () => void,
): HTMLElement {
  return el(
    'section',
    {
      className: 'vs-layer vs-modal',
      attrs: {
        role: 'dialog',
        'aria-modal': 'true',
        'aria-labelledby': 'modal-title',
      },
    },
    [
      el('header', { className: 'vs-layer__header' }, [
        el('h2', { text: title, attrs: { id: 'modal-title', tabindex: -1 } }),
        button('Close', close, { icon: 'close', className: 'vs-button--icon' }),
      ]),
      content,
    ],
  );
}

export function renderOverlay(
  state: UiState,
  dispatch: UiDispatch,
): HTMLElement | null {
  switch (state.overlay) {
    case 'timeline':
      return timeline(state, dispatch);
    case 'settings':
      return settings(state, dispatch);
    case 'help':
      return help(dispatch);
    case 'pause':
      return pause(state, dispatch);
    case 'resume':
      return resume(state, dispatch);
    case 'run-end':
      return runEnd(state, dispatch);
    default:
      return null;
  }
}

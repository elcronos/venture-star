import { button, el, icon, labeledValue } from '../dom';
import type { CampaignRecord, UiDispatch, UiState } from '../types';

function recordDetail(
  record: CampaignRecord,
  dispatch: UiDispatch,
): HTMLElement {
  return el(
    'article',
    {
      className: `vs-panel vs-record-detail outcome-${record.outcome.toLowerCase()}`,
      attrs: { 'aria-labelledby': 'record-detail-title' },
    },
    [
      el('p', {
        className: 'vs-eyebrow',
        text: `${record.outcome} · read-only record`,
      }),
      el('h2', {
        text: record.title,
        attrs: { id: 'record-detail-title', tabindex: -1 },
      }),
      record.outcome === 'Defeat'
        ? el('p', {
            className: 'vs-error-copy',
            text: `Flagship destroyed — this campaign is permanently sealed${record.fatalSource ? ` (${record.fatalSource})` : ''}.`,
          })
        : null,
      el('dl', { className: 'vs-key-values' }, [
        labeledValue('Outcome', record.outcome),
        labeledValue('Seed', record.seed),
        labeledValue('Simulation duration', record.simulationDuration),
        labeledValue('Engaged duration', record.engagedDuration),
        labeledValue('Wall span', record.wallSpan),
        labeledValue('Galaxy', record.dimensions),
        labeledValue('Difficulty', record.difficulty),
        labeledValue('Planets controlled', record.planetsControlled),
        labeledValue('Discoveries', String(record.discoveries)),
        labeledValue('Rules version', record.rulesVersion),
        ...(record.statistics
          ? [
              labeledValue(
                'Distance travelled',
                `${record.statistics.distance} wu`,
              ),
              labeledValue('Fuel consumed', `${record.statistics.fuelUsed} FU`),
              labeledValue(
                'Trade profit',
                `${record.statistics.tradeProfit} cr`,
              ),
              labeledValue(
                'Ships destroyed',
                String(record.statistics.shipsDestroyed),
              ),
            ]
          : []),
      ]),
      record.finalMap
        ? el('section', {}, [
            el('h3', { text: 'Final galaxy ownership' }),
            el('p', {
              text: record.finalMap
                .map(
                  (planet) =>
                    `${planet.name}: ${planet.owner} [${planet.x + 1},${planet.y + 1}]`,
                )
                .join(' · '),
            }),
          ])
        : null,
      record.finalTimeline
        ? el('section', {}, [
            el('h3', { text: 'Final timeline' }),
            el(
              'ol',
              {},
              record.finalTimeline.map((event) =>
                el('li', { text: `${event.time} — ${event.summary}` }),
              ),
            ),
          ])
        : null,
      el('div', { className: 'vs-action-row' }, [
        button(
          'Replay seed',
          () => dispatch({ type: 'replay-seed', recordId: record.id }),
          { icon: 'route' },
        ),
        button(
          'Delete record',
          () => {
            if (
              globalThis.confirm(
                `Delete record “${record.title}” (${record.seed})? This local action cannot be undone.`,
              )
            )
              dispatch({ type: 'delete-record', recordId: record.id });
          },
          { icon: 'danger', className: 'vs-button--danger' },
        ),
      ]),
    ],
  );
}

export function renderHistory(
  state: UiState,
  dispatch: UiDispatch,
): HTMLElement {
  const selected =
    state.records.find((record) => record.id === state.selectedRecordId) ??
    state.records[0];
  return el(
    'section',
    {
      className: 'vs-screen vs-history',
      attrs: { 'aria-labelledby': 'history-title' },
    },
    [
      el('header', { className: 'vs-screen__header' }, [
        el('div', {}, [
          el('p', { className: 'vs-eyebrow', text: 'Sealed local records' }),
          el('h1', {
            text: 'History',
            attrs: { id: 'history-title', tabindex: -1 },
          }),
        ]),
        button(
          'Back to Home',
          () => dispatch({ type: 'navigate', destination: 'home' }),
          { icon: 'back' },
        ),
      ]),
      el(
        'main',
        { className: 'vs-history__layout', attrs: { id: 'main-content' } },
        [
          el(
            'nav',
            {
              className: 'vs-record-list',
              attrs: { 'aria-label': 'Campaign records' },
            },
            state.records.map((record) =>
              button(
                `${record.outcome}: ${record.title}`,
                () => dispatch({ type: 'select-record', recordId: record.id }),
                {
                  pressed: record.id === selected?.id,
                  className: `vs-record-row outcome-${record.outcome.toLowerCase()}`,
                },
              ),
            ),
          ),
          selected
            ? recordDetail(selected, dispatch)
            : el(
                'p',
                {
                  className: 'vs-empty-state',
                  text: 'No completed campaigns yet.',
                },
                [icon('record')],
              ),
        ],
      ),
    ],
  );
}

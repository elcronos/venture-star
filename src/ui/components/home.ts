import { button, el, icon, logoUrl } from '../dom';
import type { CampaignSetup, UiDispatch, UiState } from '../types';

function randomSeed(): string {
  const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(
    bytes,
    (value) => alphabet[value % alphabet.length] ?? '0',
  ).join('');
}

function campaignSetup(state: UiState, dispatch: UiDispatch): HTMLElement {
  const form = el('form', { className: 'vs-setup' });
  const seed = el('input', {
    attrs: {
      id: 'campaign-seed',
      name: 'seed',
      maxlength: 16,
      pattern: '[0-9A-HJ-KM-NP-TV-Z]{16}',
      placeholder: 'Random seed',
      autocomplete: 'off',
    },
  });
  const randomize = button(
    'Randomize',
    () => {
      seed.value = randomSeed();
      seed.focus();
    },
    { className: 'vs-button--compact' },
  );
  const width = selectNumber('campaign-width', [10, 15, 20, 25, 30], 10);
  const height = selectNumber('campaign-height', [10, 15, 20, 25, 30], 10);
  const rivals = selectNumber('campaign-rivals', [1, 2, 3], 1);
  const difficulty = el(
    'select',
    { attrs: { id: 'campaign-difficulty', name: 'difficulty' } },
    [
      el('option', { text: 'Explorer', attrs: { value: 'Explorer' } }),
      el('option', {
        text: 'Captain',
        attrs: { value: 'Captain', selected: true },
      }),
      el('option', { text: 'Strategist', attrs: { value: 'Strategist' } }),
    ],
  );
  const tutorial = el('input', {
    attrs: {
      id: 'campaign-tutorial',
      name: 'tutorial',
      type: 'checkbox',
      checked: state.settings.tutorial,
    },
  });
  const launch = button('Launch campaign', () => form.requestSubmit(), {
    icon: 'play',
    className: 'vs-button--primary vs-field--wide',
  });
  form.append(
    el('div', { className: 'vs-field vs-field--wide' }, [
      el('label', { text: 'Seed', attrs: { for: 'campaign-seed' } }),
      el('div', { className: 'vs-inline-field' }, [seed, randomize]),
      el('small', { text: 'Leave blank for a random 16-character seed.' }),
    ]),
    el('div', { className: 'vs-field' }, [
      el('label', { text: 'Galaxy width', attrs: { for: 'campaign-width' } }),
      width,
    ]),
    el('div', { className: 'vs-field' }, [
      el('label', { text: 'Galaxy height', attrs: { for: 'campaign-height' } }),
      height,
    ]),
    el('div', { className: 'vs-field' }, [
      el('label', { text: 'Rivals', attrs: { for: 'campaign-rivals' } }),
      rivals,
      el('small', { text: '1 rival is recommended.' }),
    ]),
    el('div', { className: 'vs-field' }, [
      el('label', {
        text: 'Difficulty',
        attrs: { for: 'campaign-difficulty' },
      }),
      difficulty,
    ]),
    el('label', { className: 'vs-check-field vs-field--wide' }, [
      tutorial,
      el('span', { text: 'Tutorial guidance' }),
    ]),
    launch,
  );
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const config: CampaignSetup = {
      seed: seed.value.trim().toUpperCase(),
      width: Number(width.value),
      height: Number(height.value),
      rivals: Number(rivals.value) as 1 | 2 | 3,
      difficulty: difficulty.value as CampaignSetup['difficulty'],
      tutorial: tutorial.checked,
    };
    if (
      state.home.activeCampaign &&
      !globalThis.confirm(
        'Starting a new campaign archives the current active campaign as Abandoned. It cannot be resumed.\n\nChoose Cancel to keep the current campaign, or OK to archive and start new.',
      )
    )
      return;
    dispatch({ type: 'new-campaign', config });
  });
  return form;
}

function selectNumber(
  id: string,
  values: number[],
  selected: number,
): HTMLSelectElement {
  return el(
    'select',
    { attrs: { id, name: id } },
    values.map((value) =>
      el('option', {
        text: String(value),
        attrs: { value, selected: value === selected },
      }),
    ),
  );
}

export function renderHome(state: UiState, dispatch: UiDispatch): HTMLElement {
  const campaign = state.home.activeCampaign;
  return el(
    'section',
    {
      className: 'vs-screen vs-home',
      attrs: { 'aria-labelledby': 'home-title' },
    },
    [
      el('header', { className: 'vs-home__brand' }, [
        el('img', { attrs: { src: logoUrl, alt: 'Venture Star', width: 420 } }),
        el('p', { text: 'A one-ship frontier strategy campaign' }),
        el('span', {
          className: 'vs-chip',
          text: `Version ${state.home.version}`,
        }),
      ]),
      el(
        'main',
        { className: 'vs-home__main', attrs: { id: 'main-content' } },
        [
          el('h1', {
            className: 'vs-sr-only',
            text: 'Venture Star home',
            attrs: { id: 'home-title' },
          }),
          campaign
            ? el('article', { className: 'vs-panel vs-continue-card' }, [
                el('p', { className: 'vs-eyebrow', text: campaign.status }),
                el('h2', { text: campaign.name }),
                el('p', {
                  text: `${campaign.seed.slice(0, 8)} · ${campaign.dimensions} · ${campaign.difficulty}`,
                }),
                el('p', {
                  className: 'vs-muted',
                  text: `${campaign.simulationTime} simulation time · saved ${campaign.saveAge}`,
                }),
                button(
                  `Continue — ${campaign.name}`,
                  () => dispatch({ type: 'continue-campaign' }),
                  { icon: 'play', className: 'vs-button--primary' },
                ),
              ])
            : null,
          el(
            'section',
            {
              className: 'vs-panel vs-new-campaign',
              attrs: { 'aria-labelledby': 'new-campaign-title' },
            },
            [
              el('div', { className: 'vs-section-heading' }, [
                el('div', {}, [
                  el('p', {
                    className: 'vs-eyebrow',
                    text: 'Chart a frontier',
                  }),
                  el('h2', {
                    text: 'New campaign',
                    attrs: { id: 'new-campaign-title' },
                  }),
                ]),
                icon('route'),
              ]),
              campaignSetup(state, dispatch),
            ],
          ),
        ],
      ),
      el(
        'nav',
        {
          className: 'vs-home__nav',
          attrs: { 'aria-label': 'Home destinations' },
        },
        [
          button(
            `History${state.home.recordCount ? ` (${state.home.recordCount})` : ''}`,
            () => dispatch({ type: 'navigate', destination: 'history' }),
            {
              icon: 'record',
              disabledReason: state.home.recordCount
                ? undefined
                : 'No completed campaigns yet',
            },
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
        ],
      ),
      state.home.offline
        ? el('p', {
            className: 'vs-offline',
            text: 'Offline · core play remains available',
          })
        : null,
    ],
  );
}

import type { UiIcon } from './types';

const iconUrls: Record<UiIcon, string> = {
  'all-stop': new URL('../../assets/svg/icons/all-stop.svg', import.meta.url)
    .href,
  armour: new URL('../../assets/svg/icons/armour.svg', import.meta.url).href,
  back: new URL('../../assets/svg/icons/back.svg', import.meta.url).href,
  bomb: new URL('../../assets/svg/icons/bomb.svg', import.meta.url).href,
  cargo: new URL('../../assets/svg/icons/cargo.svg', import.meta.url).href,
  center: new URL('../../assets/svg/icons/center.svg', import.meta.url).href,
  close: new URL('../../assets/svg/icons/close.svg', import.meta.url).href,
  credits: new URL('../../assets/svg/icons/credits.svg', import.meta.url).href,
  danger: new URL('../../assets/svg/icons/danger.svg', import.meta.url).href,
  discovery: new URL('../../assets/svg/icons/discovery.svg', import.meta.url)
    .href,
  fuel: new URL('../../assets/svg/icons/fuel.svg', import.meta.url).href,
  home: new URL('../../assets/svg/icons/home.svg', import.meta.url).href,
  hull: new URL('../../assets/svg/icons/hull.svg', import.meta.url).href,
  market: new URL('../../assets/svg/icons/market.svg', import.meta.url).href,
  metal: new URL('../../assets/svg/icons/metal.svg', import.meta.url).href,
  mining: new URL('../../assets/svg/icons/mining.svg', import.meta.url).href,
  objective: new URL('../../assets/svg/icons/objective.svg', import.meta.url)
    .href,
  ore: new URL('../../assets/svg/icons/ore.svg', import.meta.url).href,
  pause: new URL('../../assets/svg/icons/pause.svg', import.meta.url).href,
  planet: new URL('../../assets/svg/icons/planet.svg', import.meta.url).href,
  play: new URL('../../assets/svg/icons/play.svg', import.meta.url).href,
  record: new URL('../../assets/svg/icons/record.svg', import.meta.url).href,
  research: new URL('../../assets/svg/icons/research.svg', import.meta.url)
    .href,
  route: new URL('../../assets/svg/icons/route.svg', import.meta.url).href,
  scanner: new URL('../../assets/svg/icons/scanner.svg', import.meta.url).href,
  settings: new URL('../../assets/svg/icons/settings.svg', import.meta.url)
    .href,
  shield: new URL('../../assets/svg/icons/shield.svg', import.meta.url).href,
  ship: new URL('../../assets/svg/icons/ship.svg', import.meta.url).href,
  shipyard: new URL('../../assets/svg/icons/shipyard.svg', import.meta.url)
    .href,
  'stale-intel': new URL(
    '../../assets/svg/icons/stale-intel.svg',
    import.meta.url,
  ).href,
  timeline: new URL('../../assets/svg/icons/timeline.svg', import.meta.url)
    .href,
  unknown: new URL('../../assets/svg/icons/unknown.svg', import.meta.url).href,
  weapon: new URL('../../assets/svg/icons/weapon.svg', import.meta.url).href,
  'wrapped-route': new URL(
    '../../assets/svg/icons/wrapped-route.svg',
    import.meta.url,
  ).href,
  'zoom-in': new URL('../../assets/svg/icons/zoom-in.svg', import.meta.url)
    .href,
  'zoom-out': new URL('../../assets/svg/icons/zoom-out.svg', import.meta.url)
    .href,
};

export const logoUrl = new URL(
  '../../assets/svg/brand/logo-horizontal.svg',
  import.meta.url,
).href;

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  options: {
    className?: string;
    text?: string;
    attrs?: Record<string, string | number | boolean | undefined>;
  } = {},
  children: Array<Node | string | null | undefined | false> = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (options.className) node.className = options.className;
  if (options.text !== undefined) node.textContent = options.text;
  for (const [name, value] of Object.entries(options.attrs ?? {})) {
    if (value === undefined || value === false) continue;
    if (value === true) node.setAttribute(name, '');
    else node.setAttribute(name, String(value));
  }
  node.append(
    ...children.filter((child): child is Node | string => Boolean(child)),
  );
  return node;
}

export function icon(name: UiIcon, label?: string): HTMLImageElement {
  return el('img', {
    className: 'vs-icon',
    attrs: {
      src: iconUrls[name],
      alt: label ?? '',
      'aria-hidden': label ? undefined : 'true',
    },
  });
}

export function button(
  label: string,
  onActivate: () => void,
  options: {
    icon?: UiIcon | undefined;
    className?: string | undefined;
    disabledReason?: string | undefined;
    pressed?: boolean | undefined;
    title?: string | undefined;
  } = {},
): HTMLButtonElement {
  const node = el(
    'button',
    {
      className: ['vs-button', options.className].filter(Boolean).join(' '),
      attrs: {
        type: 'button',
        disabled: Boolean(options.disabledReason),
        'aria-label': options.disabledReason
          ? `${label}. Unavailable: ${options.disabledReason}`
          : label,
        'aria-pressed': options.pressed,
        title: options.title ?? options.disabledReason,
      },
    },
    [options.icon ? icon(options.icon) : null, el('span', { text: label })],
  );
  node.addEventListener('click', onActivate);
  if (options.disabledReason)
    node.dataset.disabledReason = options.disabledReason;
  return node;
}

export function labeledValue(
  label: string,
  value: string,
  className = '',
): HTMLElement {
  return el('div', { className: `vs-key-value ${className}` }, [
    el('dt', { text: label }),
    el('dd', { text: value }),
  ]);
}

export function formatNumber(value: number, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits }).format(
    value,
  );
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

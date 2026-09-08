import { el } from './dom';
import { renderDock } from './components/dock';
import { renderGalaxy } from './components/galaxy';
import { renderHistory } from './components/history';
import { renderHome } from './components/home';
import { renderHud } from './components/hud';
import { renderOverlay } from './components/overlays';
import type { UiDispatch, UiState } from './types';

export class VentureUi {
  readonly canvasHost: HTMLDivElement;
  private readonly layer: HTMLDivElement;
  private readonly overlayLayer: HTMLDivElement;
  private state: UiState;
  private invoker: HTMLElement | null = null;
  private previousOverlay: UiState['overlay'];

  constructor(
    private readonly root: HTMLElement,
    initialState: UiState,
    private readonly dispatch: UiDispatch,
  ) {
    this.state = initialState;
    this.root.classList.add('vs-app');
    this.canvasHost = el('div', {
      className: 'vs-tactical-canvas-host',
      attrs: { 'aria-hidden': 'true' },
    });
    this.layer = el('div', { className: 'vs-dom-layer' });
    this.overlayLayer = el('div', { className: 'vs-overlay-layer' });
    this.root.replaceChildren(this.canvasHost, this.layer, this.overlayLayer);
    this.root.addEventListener('keydown', this.onKeyDown);
    this.render();
  }

  update(nextState: UiState): void {
    this.state = nextState;
    this.render();
  }

  getCanvasHost(): HTMLDivElement {
    return this.canvasHost;
  }

  destroy(): void {
    this.root.removeEventListener('keydown', this.onKeyDown);
    this.root.replaceChildren();
    this.root.classList.remove('vs-app');
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Tab' && this.state.overlay) {
      const focusable = [
        ...this.overlayLayer.querySelectorAll<HTMLElement>(
          "button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex='-1'])",
        ),
      ];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
      return;
    }
    if (event.key !== 'Escape') return;
    event.preventDefault();
    if (this.state.overlay) this.dispatch({ type: 'close-overlay' });
    else if (this.state.destination === 'flight')
      this.dispatch({ type: 'pause' });
    else if (this.state.destination !== 'home')
      this.dispatch({
        type: 'navigate',
        destination: this.state.destination === 'history' ? 'home' : 'flight',
      });
  };

  private render(): void {
    const openingOverlay = Boolean(this.state.overlay && !this.previousOverlay);
    const closingOverlay = Boolean(!this.state.overlay && this.previousOverlay);
    if (openingOverlay) {
      this.invoker =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      this.previousOverlay = this.state.overlay;
      this.dispatch({ type: 'clear-flight-inputs' });
    }
    this.root.dataset.destination = this.state.destination;
    this.root.dataset.reducedMotion = String(this.state.settings.reducedMotion);
    this.root.dataset.highContrast = String(this.state.settings.highContrast);
    this.root.dataset.touchControls = this.state.settings.touchControls;
    this.root.style.setProperty(
      '--vs-text-scale',
      `${this.state.settings.textScale}%`,
    );
    this.canvasHost.hidden = this.state.destination !== 'flight';
    const screen =
      this.state.destination === 'home'
        ? renderHome(this.state, this.dispatch)
        : this.state.destination === 'flight'
          ? renderHud(this.state, this.dispatch)
          : this.state.destination === 'galaxy'
            ? renderGalaxy(this.state, this.dispatch)
            : this.state.destination === 'management'
              ? renderDock(this.state, this.dispatch)
              : renderHistory(this.state, this.dispatch);
    this.layer.replaceChildren(screen);
    const overlay = renderOverlay(this.state, this.dispatch);
    this.overlayLayer.replaceChildren(...(overlay ? [overlay] : []));
    this.layer.toggleAttribute('inert', Boolean(overlay));
    this.layer.setAttribute('aria-hidden', overlay ? 'true' : 'false');
    if (overlay)
      requestAnimationFrame(() =>
        overlay
          .querySelector<HTMLElement>("[tabindex='-1'], button, input")
          ?.focus(),
      );
    if (closingOverlay)
      requestAnimationFrame(() =>
        (this.invoker?.isConnected
          ? this.invoker
          : this.layer.querySelector<HTMLElement>('h1, h2, button')
        )?.focus(),
      );
    this.previousOverlay = this.state.overlay;
  }
}

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
  private overlaySignature = '';

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
    if (event.key !== 'Escape' || event.defaultPrevented) return;
    event.preventDefault();
    event.stopPropagation();
    if (this.state.overlay) this.dispatch({ type: 'close-overlay' });
    else if (this.state.destination === 'flight')
      this.dispatch({ type: 'pause' });
    else if (this.state.destination !== 'home')
      this.dispatch({
        type: 'navigate',
        destination: this.state.destination === 'history' ? 'home' : 'flight',
      });
  };

  /**
   * Refreshes the flight HUD around the live controls instead of replacing it.
   * The touch controls hold pointer capture and focus, so detaching them - even
   * for an instant - drops a drag in progress and blurs the throttle.
   * Returns false when this is not a flight screen and a full swap is required.
   */
  private refreshFlightInPlace(screen: HTMLElement): boolean {
    const currentHud = this.layer.querySelector('.vs-hud');
    const controls = currentHud?.querySelector('.vs-touch-controls');
    if (this.state.destination !== 'flight' || !currentHud || !controls)
      return false;
    for (const child of [...currentHud.children])
      if (child !== controls) child.remove();
    for (const child of [...screen.children])
      if (!child.classList.contains('vs-touch-controls'))
        currentHud.insertBefore(child, controls);
    const throttle = controls.querySelector<HTMLInputElement>(
      'input[type="range"]',
    );
    if (throttle && document.activeElement !== throttle)
      throttle.value = String(this.state.flight.throttle);
    const throttleLabel = controls.querySelector('.vs-throttle > span');
    if (throttleLabel)
      throttleLabel.textContent = `Throttle ${this.state.flight.throttle}%`;
    return true;
  }

  /**
   * Rebuilds the overlay layer only when its content actually changed, and puts
   * focus and any text selection back where the player left it.
   */
  private renderOverlayLayer(
    previousOverlay: UiState['overlay'],
    closingOverlay: boolean,
  ): void {
    const signature = JSON.stringify([
      this.state.overlay,
      this.state.settings,
      this.state.pauseReasons,
      this.state.timelineFilter,
      this.state.timelineSearch,
      this.state.overlay === 'timeline' ? this.state.flight.timeline : null,
      this.state.selectedRecordId,
      this.state.records,
    ]);
    const overlayChanged = signature !== this.overlaySignature;
    const focusedOverlay = this.overlayLayer.contains(document.activeElement)
      ? (document.activeElement as HTMLElement)
      : null;
    const focusedIndex = focusedOverlay
      ? [
          ...this.overlayLayer.querySelectorAll(
            'button, input, select, [tabindex]',
          ),
        ].indexOf(focusedOverlay)
      : -1;
    const selection =
      focusedOverlay instanceof HTMLInputElement &&
      ['text', 'search'].includes(focusedOverlay.type)
        ? ([
            focusedOverlay.selectionStart,
            focusedOverlay.selectionEnd,
          ] as const)
        : null;
    if (overlayChanged) {
      const nextOverlay = renderOverlay(this.state, this.dispatch);
      this.overlayLayer.replaceChildren(...(nextOverlay ? [nextOverlay] : []));
      this.overlaySignature = signature;
    }
    const overlay = this.overlayLayer.firstElementChild;
    this.overlayLayer.querySelectorAll('.vs-save-state').forEach((node) => {
      node.textContent = this.state.saveState;
    });
    this.layer.toggleAttribute('inert', Boolean(overlay));
    this.layer.setAttribute('aria-hidden', overlay ? 'true' : 'false');
    if (overlay && overlayChanged) {
      const sameOverlay = previousOverlay === this.state.overlay;
      const restore =
        sameOverlay && focusedIndex >= 0
          ? overlay.querySelectorAll<HTMLElement>(
              'button, input, select, [tabindex]',
            )[focusedIndex]
          : null;
      if (restore) {
        restore.focus();
        if (selection && restore instanceof HTMLInputElement)
          restore.setSelectionRange(selection[0], selection[1]);
      } else if (!sameOverlay)
        overlay
          .querySelector<HTMLElement>("[tabindex='-1'], button, input")
          ?.focus();
    }
    if (closingOverlay)
      requestAnimationFrame(() =>
        (this.invoker?.isConnected
          ? this.invoker
          : this.layer.querySelector<HTMLElement>('h1, h2, button')
        )?.focus(),
      );
  }

  private render(): void {
    const previousOverlay = this.previousOverlay;
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
    this.root.dataset.textScale = String(this.state.settings.textScale);
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
    const focusedLabel = this.layer.contains(document.activeElement)
      ? document.activeElement?.getAttribute('aria-label')
      : null;
    const managementBody = this.layer.querySelector<HTMLElement>(
      '.vs-management__body',
    );
    const managementScrollTop =
      this.state.destination === 'management' && managementBody
        ? managementBody.scrollTop
        : 0;
    const focusedId = this.layer.contains(document.activeElement)
      ? document.activeElement?.id || null
      : null;
    if (!this.refreshFlightInPlace(screen)) {
      this.layer.replaceChildren(screen);
      if (this.state.destination === 'management') {
        const nextBody = screen.querySelector<HTMLElement>(
          '.vs-management__body',
        );
        if (nextBody) nextBody.scrollTop = managementScrollTop;
      }
    }
    if (focusedLabel && !this.layer.contains(document.activeElement)) {
      const candidate = focusedId
        ? document.getElementById(focusedId)
        : [...this.layer.querySelectorAll<HTMLElement>('[aria-label]')].find(
            (node) => node.getAttribute('aria-label') === focusedLabel,
          );
      candidate?.focus();
    }
    this.renderOverlayLayer(previousOverlay, closingOverlay);
    this.previousOverlay = this.state.overlay;
  }
}

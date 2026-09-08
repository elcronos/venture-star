import type { GameEngine } from './game/engine';
import type { CampaignOptions, GameCommand, GameState } from './game/types';
import type { SpaceCanvas } from './render/spaceCanvas';

/** Everything the dev-only window hook needs from the running application. */
export interface DevHookPort {
  engine(): GameEngine | null;
  send(command: GameCommand): void;
  render(): void;
  flush(): void;
  createCampaign(options: CampaignOptions): void;
  space: SpaceCanvas;
}

/**
 * Exposes the real engine and renderer to browser tests. Dev and test builds
 * only: production never defines `window.__GAME__`.
 */
export function installTestHook(port: DevHookPort): void {
  if (!import.meta.env.DEV && import.meta.env.MODE !== 'test') return;
  Object.defineProperty(window, '__GAME__', {
    value: Object.freeze({
      get state() {
        return port.engine()?.snapshot() ?? null;
      },
      input(command: GameCommand) {
        port.send(command);
      },
      tick(frames: number) {
        return port.engine()?.stepTicks(frames) ?? null;
      },
      setPaused(paused: boolean) {
        port.send({ type: 'pause', paused });
        port.flush();
      },
      create(options: CampaignOptions) {
        port.createCampaign(options);
      },
      presentation() {
        return port.space.presentation;
      },
    }),
    configurable: false,
  });
}

declare global {
  interface Window {
    __GAME__?: Readonly<{
      readonly state: GameState | null;
      input(command: GameCommand): void;
      tick(frames: number): GameState | null;
      setPaused(paused: boolean): void;
      create(options: CampaignOptions): void;
      presentation(): { frames: number; x: number; y: number };
    }>;
  }
}

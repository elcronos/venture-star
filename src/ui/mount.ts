import { VentureUi } from './VentureUi';
import type { UiDispatch, UiState } from './types';

/**
 * Mounts the state-driven semantic interface. Import `src/styles/index.css` once
 * from the application entry point. The controller keeps ownership of state,
 * actions, simulation pause reasons, and the renderer placed in `canvasHost`.
 */
export function mountVentureUi(
  root: HTMLElement,
  initialState: UiState,
  dispatch: UiDispatch,
): VentureUi {
  return new VentureUi(root, initialState, dispatch);
}

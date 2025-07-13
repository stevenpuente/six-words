import { modalTypes } from "../config";
import { getCurrentState, dispatch } from "../game-state/game-state";


// === BUTTON HANDLERS ===

export function handleSubmitButton() {
  const { currentWord } = getCurrentState();

  dispatch({ type: 'SUBMIT_WORD', payload: { currentWord } });
}
export function handleUndoButton() {
  dispatch({ type: 'UNDO' });
}
export function handleRestartButton() {
  dispatch({ type: 'MODAL_OPEN', payload: { type: modalTypes.CONFIRM_RESET } });
}

import { gameBoardElement, wordGuessWrapper } from "../dom/dom-utils";
import { dispatch } from "../game-state/game-state";


// === CLICK HANDLERS === 

export function handleBoardClick(e) {
  const clickedCard = e.target.closest('.card.top, .card.solo');

  // Ignore clicks outside cards or not on the board
  if (!clickedCard || !gameBoardElement.contains(clickedCard)) return;

  dispatch({ type: 'SELECT_CARD', payload: { id: clickedCard.dataset.cardId } });
}
export function handleWordGuessCardClick(e) {
  const clickedCard = e.target.closest('.card');

  // Ignore clicks not on cards
  if (!clickedCard || !wordGuessWrapper.contains(clickedCard)) return;

  dispatch({ type: 'UNDO_THROUGH_TAPPED_LETTER', payload: { id: clickedCard.dataset.cardId } });
}

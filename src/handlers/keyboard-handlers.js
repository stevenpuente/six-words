import { playButton, alertModalCloseButton, gameOverModalCloseButton, restartButton, alertModalRightButton, gameOverModalPlayAgainButton, submitButton, undoButton } from "../dom/dom-utils";
import { dispatch, getCurrentState } from "../game-state/game-state";


// === KEYBOARD HANDLERS === 

export const keyboardCycleState = {
  currentKey: null,
  currentIndex: 0,
};
export function resetKeyboardCycleState() {
  keyboardCycleState.currentKey = null;
  keyboardCycleState.currentIndex = 0;
}
export function getAvailableTopAndSoloCards(currentState) {
  // Filter out all cards except those that are available to play.
  const availableCards = currentState.cards.filter(c => c.cardStatus === 'AVAILABLE' || c.cardStatus === 'RAISED');

  // this is to ensure that the Math.max function in the next step doesnt run
  // on an empty array which would yeild -infinity
  if (availableCards.length === 0) return;

  // We will need to loop over all the cards, so find the largest index so we have
  // an upper limit for the for loop.
  const maxIndexFromAvailableCards = Math.max(...availableCards.map(c => c.cellIndex));

  // this is the array taht will catch all of our top available cards out of the for loop
  const availableTopAndSoloCards = [];

  // here we need to loop over all of the available cards, using the index to compare
  // cards within a stack
  for (let i = 0; i <= maxIndexFromAvailableCards; i++) {
    const ithCellCardStack = availableCards.filter(c => c.cellIndex === i);
    if (ithCellCardStack.length === 0) continue;
    if (ithCellCardStack.length === 1) availableTopAndSoloCards.push(...ithCellCardStack);
    if (ithCellCardStack.length > 1) availableTopAndSoloCards.push(...ithCellCardStack.filter(c => c.stackIndex === 0));
  }

  // below, this line prioritzies cards that are on top of the stack:
  availableTopAndSoloCards.sort((a,b) => a.stackIndex - b.stackIndex);

  return availableTopAndSoloCards;
}
export function cycleMatchingCards(cards, key) {
  // Filter all the available top and solo cards and find ones that
  // match the key pressed
  const matchingCards = cards?.filter(c => c.letter.toUpperCase() === key.toUpperCase());

  // Bail if no matches found
  if (!matchingCards || matchingCards.length === 0) return;

  // Reset index if the key has changed
  if (keyboardCycleState.currentKey !== key) {
    keyboardCycleState.currentKey = key;
    keyboardCycleState.currentIndex = 0;
  }

  // Cycle to the next matching card
  const index = keyboardCycleState.currentIndex % matchingCards.length;
  dispatch({ type: 'RAISE_CARD', payload: { id: matchingCards[index].id } });
  keyboardCycleState.currentIndex++;
}
export function handleEscKeyPress() {
  const currentState = getCurrentState();
  if (currentState.modal.isOpen && currentState.modal.type === 'WELCOME') playButton?.click();
  if (currentState.modal.isOpen && currentState.modal.type === 'GAME_RESET') alertModalCloseButton?.click();
  if (currentState.modal.isOpen && currentState.modal.type === 'GAME_OVER') gameOverModalCloseButton?.click();

  if (currentState.cards.some(c=> c.cardStatus === 'RAISED')) {
    dispatch({type:'UNRAISE_CARD'});
    return;
  }

  if (!currentState.modal.isOpen) restartButton?.click();
}
export function handleEnterKeyPress() {
  const currentState = getCurrentState();

  // 1. Handle modal-specific actions
  if (currentState.modal.isOpen) {
    switch (currentState.modal.type) {
      case 'WELCOME':
        playButton?.click();
        break;
      case 'GAME_RESET':
        alertModalRightButton?.click();
        break;
      case 'GAME_OVER':
        gameOverModalPlayAgainButton?.click();
        break;
    }
    return;
  }

  // 2. Handle button clicks via keyboard focus
  const activeElement = document.activeElement;

  if (activeElement) {
    if (activeElement.matches('#button-wrapper button')) {
      activeElement?.click();

      // Refocus undo button after click
      if (activeElement.id === 'undo-button') {
        setTimeout(() => {
          activeElement.focus();
        }, 0);
      }

      return;
    }

    // 3. Handle focused card (via tab navigation)
    if (activeElement.matches('.card[tabindex="0"]')) {
      activeElement?.click();
      return;
    }
  }

  // 4. If no focused button/card, click the raised card if it exists
  const currentRaised = document.querySelector('.raised');
  if (currentRaised) {
    resetKeyboardCycleState();
    currentRaised?.click();
    return;
  }

  // 5. Fallback: Try submitting the word if possible
  if (!submitButton.disabled) {
    submitButton?.click();
  }
}
export function handleDeleteKeyPress() {
  resetKeyboardCycleState();
  undoButton?.click();
}
export function handleKeyPress(e) {
  if (!e.key) return;
  const currentState = getCurrentState();

  if (e.key === 'Escape') handleEscKeyPress();
  if (e.key === 'Enter' || e.key === 'Return') handleEnterKeyPress();

  if (currentState.modal.isOpen) return;

  if (e.key === 'Backspace' || e.key === 'Delete') handleDeleteKeyPress();

  // Portion of the handler for letter key presses:
  const key = e.key.toUpperCase();
  const availableTopAndSoloCards = getAvailableTopAndSoloCards(currentState);
  cycleMatchingCards(availableTopAndSoloCards, key);
}

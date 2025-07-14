import { clearAllCardsFromGame, addCardsToGrid, addCardsToWordBuilder, addCardsToSubmittedWords, updateScoreboardText, raiseCards, updateWordGuessWrapperLayout, setAllButtonStates, updateFocusableElements, greyOutCards, unGreyOutCards, banner, displayMessage, incorrectShakeElement } from "../dom/dom-utils";
import { getCurrentState } from "../game-state/game-state";
import { renderModal } from "../dom/modals";
import { modalTypes } from "../config";


export function renderUI() {
    const currentState = getCurrentState();
    clearAllCardsFromGame(currentState);

    addCardsToGrid(currentState);
    addCardsToWordBuilder(currentState);
    addCardsToSubmittedWords(currentState);
    updateScoreboardText(currentState);
    raiseCards(currentState);
    updateMessageUI(currentState);
    renderModal(currentState);
    updateWordGuessWrapperLayout(currentState);
    greyOutController(currentState);
    incorrectShakeController(currentState);

    setAllButtonStates();
    updateFocusableElements();
}
// === CONTROLLER FUNCTIONS ===
function greyOutController(currentState) {
    if (currentState.gameIsOver) greyOutCards();
    if (!currentState.gameIsOver) unGreyOutCards();
}
export function updateMessageUI(currentState) {
    // specifically this is for the copied to clipboard after a share scenario:
    if (currentState.messageBanner.visible &&
        currentState.gameIsOver &&
        currentState.modal.isOpen &&
        currentState.modal.type === modalTypes.GAME_OVER) {
        displayMessage(currentState.messageBanner.text, currentState.messageBanner.type);
        return;
    }

    if (!currentState.messageBanner.visible || currentState.gameIsOver || currentState.modal.isOpen) {
        banner.classList.add('hidden');
        return;
    }
    displayMessage(currentState.messageBanner.text, currentState.messageBanner.type);
}
function incorrectShakeController(currentState) {
    const shakeCardObj = currentState.cards.filter(c => c.cardStatus === 'SHAKE').at(-1);
    if (!shakeCardObj) return;
    const shakeCardId = shakeCardObj.id;
    incorrectShakeElement(shakeCardId);
}

import { modalTypes, textDate, textPuzzleNumber } from "../config";
import { dispatch, getCurrentState } from "../game-state/game-state";
import { getCardObjsFromCardIdArray } from "../game-state/game-state-utils";
import { dateElement, puzzleNumberElement, welcomeModelWrapper, alertModalTitle, alertModalText, alertModalLeftButton, alertModalSubTitle, alertModal, gameOverModalTitle, gameOverModalSubTitle, gameOverModalStats, gameOverModalSummarySection, gameOverModal, displayMessage } from "./dom-utils";


// === GENERIC MODAL FUNCTIONS ===

export const modalIdMap = {
    [modalTypes.WELCOME]: 'welcome-modal-wrapper',
    [modalTypes.LANDSCAPE_WARNING]: 'landscape-warning',
    [modalTypes.GAME_OVER]: 'game-over-modal',
    [modalTypes.CONFIRM_RESET]: 'alert-modal',
    [modalTypes.INSTRUCTIONS]: 'instructions-modal',
    [modalTypes.STATS]: 'stats-modal',
};
export function renderModal(currentState) {
    Object.values(modalIdMap).forEach(modalId => {
        const modalElement = document.getElementById(modalId);
        if (modalElement) modalElement.classList.add('hidden');
    });

    if (currentState.modal.isOpen && currentState.modal.type && modalIdMap[currentState.modal.type]) {
        switch (currentState.modal.type) {
            case modalTypes.WELCOME: {
                showWelcomeModal();
                break;
            }
            case modalTypes.LANDSCAPE_WARNING: {
                showLandscapeWarningModal();
                break;
            }
            case modalTypes.CONFIRM_RESET: {
                showConfirmRestartModal();
                break;
            }
            case modalTypes.GAME_OVER: {
                showGameOverModal();
                break;
            }
        }
    }
}
// === WELCOME MODAL ===

export function showWelcomeModal() {
    dateElement.innerText = textDate;
    puzzleNumberElement.innerText = `No. ${textPuzzleNumber}`;
    welcomeModelWrapper.classList.remove('hidden');
}
// === RESTART CONFIRMATION MODAL ===

export function showConfirmRestartModal() {
    if (alertModalTitle) alertModalTitle.remove();
    if (alertModalText) alertModalText.remove();
    if (alertModalLeftButton) alertModalLeftButton.remove();
    alertModalSubTitle.textContent = `Are you sure you want to restart?`;

    alertModal.classList.remove('hidden');
}
// === GAME OVER MODAL ===

export function showGameOverModal() {
    const currentState = getCurrentState();

    const score = currentState.score;
    const lettersLeft = 32 - score;
    const numWords = currentState.submittedWords.length;

    // Title message
    if (lettersLeft >= 1) {
        gameOverModalTitle.textContent = 'Game Over';
        gameOverModalSubTitle.textContent = `Play again to try for a perfect score!`;
    } else if (score >= 32 && numWords === 6) {
        gameOverModalTitle.textContent = `Perfect in ${numWords}!`;
        gameOverModalSubTitle.textContent = `Can you clear the board in 5?`;
    } else if (score >= 32 && numWords <= 5) {
        gameOverModalTitle.textContent = `Perfect in ${numWords}!`;
        gameOverModalSubTitle.textContent = `Well done! See you tomorrow.`;
    }

    gameOverModalStats.textContent = `Score: ${score} / 32 | Words: ${numWords} / 6`;

    gameOverModalSummarySection.innerHTML = '';

    for (let word of currentState.submittedWordsCardIds) {
        const gameOverSummaryWordEl = createGameOverSummarySectionWord(word);
        gameOverModalSummarySection.appendChild(gameOverSummaryWordEl);
    }
    gameOverModal.classList.remove('hidden');
}
function createGameOverSummarySectionWord(arrayOfCardIds) {
    const cardObjsArray = getCardObjsFromCardIdArray(arrayOfCardIds);

    const summaryWord = document.createElement('div');
    summaryWord.classList.add('summary-section-word');

    for (let i = 0; i < cardObjsArray.length; i++) {
        const letter = cardObjsArray[i].letter;
        const stackIndex = cardObjsArray[i].stackIndex;


        const summaryLetterEl = document.createElement('div');

        summaryLetterEl.classList.add('game-over-card');
        summaryLetterEl.innerHTML = `<span>${letter}</span>`;

        if (stackIndex === 0) summaryLetterEl.classList.add('green');
        if (stackIndex === 1) summaryLetterEl.classList.add('blue');

        summaryWord.appendChild(summaryLetterEl);
    }
    return summaryWord;
}
function createEmojiArray() {
    // fix this. this is expecting card ovjs, but only is getting word ids:
    const currentState = getCurrentState();
    const finalWordsAsWordObjs = currentState.submittedWordsCardIds.map((wordIdArray) => {
        return wordIdArray.map((letterId) => {
            return currentState.cards.find(c => c.id === letterId)
        })
    });

    const emojiArray = [];

    for (let wordObjs of finalWordsAsWordObjs) {
        let emojiWord = '';
        for (let cardObj of wordObjs) {
            if (cardObj.stackIndex === 0) emojiWord += '🟩';
            if (cardObj.stackIndex === 1) emojiWord += '🟦';
        }
        emojiArray.push(emojiWord);
    }
    return emojiArray;
}
function createShareMessage() {
    const currentState = getCurrentState();

    const score = currentState.score;
    const numOfWordsUsed = currentState.submittedWordsCardIds.length;
    const emojiArray = createEmojiArray();
    const emojiLines = emojiArray.join('\n');

    const lines = [
        `Six Words #${textPuzzleNumber}`,
        `I scored ${score} points in ${numOfWordsUsed} words!`,
        emojiLines,
    ];

    return lines.join('\r\n').trim();
}
function createMobileShareMessage() {
    const currentState = getCurrentState();

    const score = currentState.score;
    const numOfWordsUsed = currentState.submittedWordsCardIds.length;
    const emojiArray = createEmojiArray();
    const emojiLines = emojiArray.join('\n');

    const lines = [
        `I scored ${score} points in ${numOfWordsUsed} words!`,
        emojiLines,
    ];

    return lines.join('\r\n').trim();
}
function isMobileDevice() {
    return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}
export function shareResults() {
    const message = createShareMessage();
    const mobileMessage = createMobileShareMessage();

    if (isMobileDevice() && navigator.share) {
        navigator.share({
            title: `Six Words #${textPuzzleNumber}`,
            text: mobileMessage,
        }).then(() => {
            console.log("Shared successfully!");
        }).catch((err) => {
            console.error("Sharing was cancelled or failed:", err);
        });
    } else {
        navigator.clipboard.writeText(message)
            .then(() => {
                // displayMessage('Copied to clipboard', 'success');
                dispatch({ type: 'SHOW_BANNER', payload: { text: 'Copied to clipboard', type: 'success' } })
            })
            .catch((err) => {
                console.error("Failed to copy results to clipboard:", err);
            });
    }
}
// === LANDSCAPE WARNING MODAL ===

export function showLandscapeWarningModal() {
    const landscapeWarningModal = document.getElementById('landscape-warning');

    landscapeWarningModal.classList.toggle('hidden', !shouldShowWarning());
}
function shouldShowWarning() {
    const height = window.innerHeight;
    const width = window.innerWidth;
    const aspectRatio = width / height;

    return (height <= 650 && aspectRatio > 1.8) || (height < 400 && aspectRatio > 1);
}

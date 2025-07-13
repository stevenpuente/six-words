import { dispatch, getCurrentState } from './game-state.js';
import { modalTypes } from './constants.js';
import { showConfirmRestartModal, showGameOverModal, showLandscapeWarningModal, showWelcomeModal } from './modals.js';

// DOM Elements
export const banner = document.getElementById('message-banner');
export const wordGuessWrapper = document.getElementById('word-guess-wrapper');
export const scoreboard = document.getElementById('scoreboard');
export const gameBoardElement = document.getElementById('game-board');
export const scoreCounter = document.getElementById('score-counter-text');
export const wordsSubmittedCounter = document.getElementById('words-submitted-counter-text');

// BUTTON ELEMENTS
export const undoButton = document.getElementById('undo-button');
export const submitButton = document.getElementById('submit-button');
export const restartButton = document.getElementById('restart-button');

// WELCOME MODAL ELEMENTS
export const welcomeModelWrapper = document.getElementById('welcome-modal-wrapper');
export const dateElement = document.getElementById('date');
export const puzzleNumberElement = document.getElementById('puzzle-number');


// ALERT MODAL DOM ELEMENTS
export const alertModal = document.getElementById('alert-modal');
export const alertModalTitle = document.getElementById('alert-modal-title');
export const alertModalSubTitle = document.getElementById('alert-modal-sub-title');
export const alertModalText = document.getElementById('alert-modal-text');
export const alertModalCloseButton = document.getElementById('alert-modal-close-button');
export const alertModalLeftButton = document.getElementById('alert-modal-left-button');
export const alertModalRightButton = document.getElementById('alert-modal-right-button');


// GAME OVER MODAL DOM ELEMENTS
export const gameOverModal = document.getElementById('game-over-modal');
export const gameOverModalTitle = document.getElementById('game-over-title');
export const gameOverModalSubTitle = document.getElementById('game-over-sub-title');
export const gameOverModalStats = document.getElementById('game-over-stats');
export const gameOverModalSummarySection = document.getElementById('game-over-summary-section');
export const gameOverModalCloseButton = document.getElementById('close-modal-button');
export const gameOverModalShareButton = document.getElementById('share-button');
export const gameOverModalPlayAgainButton = document.getElementById('play-again-button');
export const playButton = document.getElementById('play-button');



export const modalIdMap = {
    [modalTypes.WELCOME]: 'welcome-modal-wrapper',
    [modalTypes.LANDSCAPE_WARNING]: 'landscape-warning',
    [modalTypes.GAME_OVER]: 'game-over-modal',
    [modalTypes.CONFIRM_RESET]: 'alert-modal',
    [modalTypes.INSTRUCTIONS]: 'instructions-modal',
    [modalTypes.STATS]: 'stats-modal',
}


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

    setAllButtonStates();
    updateFocusableElements();
}


function renderModal(currentState) {
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

function raiseCards(currentState) {
    // remove any existing raised card:
    const oldRaisedCards = document.querySelectorAll('.raised');
    for (let card of oldRaisedCards) {
        card.classList.remove('raised');
    }

    // read current state to find if there are any new raised cards and raise them
    const raisedCardObj = currentState.cards.find(c => c.cardStatus === 'RAISED');
    if (!raisedCardObj) return;

    const raisedCardElement = document.querySelector(`[data-card-id="${raisedCardObj.id}"]`);
    if (raisedCardElement) {
        raisedCardElement.classList.add('raised');
    }
}

function clearAllCardsFromGame(currentState) {
    // only run this if the last move was not a card raise:
    const lastAction = currentState.actionHistory.at(-1);
    if (lastAction?.type === 'RAISE_CARD') return;

    const allCards = document.querySelectorAll('#main-card .card');
    const allCells = document.querySelectorAll('#main-card .cell');
    const scoreboardWordDivs = document.querySelectorAll('#scoreboard .scoreboard-word')

    for (let card of allCards) {
        card.remove();
    }

    for (let cell of allCells) {
        cell.remove();
    }

    for (let el of scoreboardWordDivs) {
        el.remove();
    }
}

function addCardsToGrid(currentState) {
    // only run this if the last move was not a card raise:
    const lastAction = currentState.actionHistory.at(-1);
    if (lastAction?.type === 'RAISE_CARD') return;

    const cardCellIndices = currentState.cards.map(c => c.cellIndex)
    const maxCellIndex = cardCellIndices.length > 0 ? Math.max(...cardCellIndices) : -1;
    if (maxCellIndex === -1) {
        console.log('Problem Adding Cards to Grid');
        return;
    }

    for (let i = 0; i <= maxCellIndex; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        gameBoardElement.appendChild(cell)
    }

    const cells = document.querySelectorAll('#game-board .cell');

    for (let i = 0; i < cells.length; i++) {
        const cellCards = currentState.cards.filter(card => card.cellIndex === i)
            .sort((a, b) => a.stackIndex - b.stackIndex);

        const availableCellCards = cellCards.filter(card => card.cardStatus === 'AVAILABLE' || card.cardStatus === 'RAISED');

        if (availableCellCards.length === 0) continue;

        for (let availableCard of availableCellCards) {
            const card = createCardElement(availableCard.letter, availableCard.stackIndex, availableCard.id);

            if (availableCellCards.length === 1) {
                card.classList.add('solo');
            } else if (availableCellCards.length > 1) {
                card.classList.add(availableCard.stackIndex === 0 ? 'top' : 'bottom')
            }

            cells[i].appendChild(card);
        }
    }
}

function addCardsToWordBuilder(currentState) {
    // only run this if the last move was not a card raise:
    const lastAction = currentState.actionHistory.at(-1);
    if (lastAction?.type === 'RAISE_CARD') return;

    if (!currentState.currentWord) return;

    // After getting the state, we get the current word's card objects. 
    // this lets us know the letter and the stack index to determine color
    const currentWordCardObjs = currentState.currentWord
        .map(letterId => currentState.cards.find(card => card.id === letterId))
        .filter(cardObj => cardObj);

    // This will create a new array of arrays where each sub array is a letter and stack
    // index to determine color like: [A, 0] => letter A on a Green Card
    const currentWordLetterAndStackIndex = currentWordCardObjs.map((cardObj) =>
        ({ letter: cardObj.letter, stackIndex: cardObj.stackIndex, id: cardObj.id })
    );

    // Loop over cards in current word to create elements in the word builder area
    for (let letterObj of currentWordLetterAndStackIndex) {
        const cardElement = createCardElement(letterObj.letter, letterObj.stackIndex, letterObj.id);
        wordGuessWrapper.appendChild(cardElement);
    }
}

function addCardsToSubmittedWords(currentState) {
    // only run this if the last move was not a card raise:
    const lastAction = currentState.actionHistory.at(-1);
    if (lastAction?.type === 'RAISE_CARD') return;

    const submittedWordsCardObjs = [];

    // After getting the state, we get each of the submitted word's card objects. 
    // this will let us know the letter and the stack index to determine color in the next step.
    for (let submittedWordCardId of currentState.submittedWordsCardIds) {
        const submittedWordCardObj = submittedWordCardId
            .map(letterId => currentState.cards.find(card => card.id === letterId))
            .filter(cardObj => cardObj);
        submittedWordsCardObjs.push(submittedWordCardObj);
    }

    // Now we need to turn our array of arrays of card Objs into an array of arrays of arrays
    // where each sub array represents a submitted word and each sub array of the submitted word has 
    // a letter and stack index to determine color like: [A, 0] => letter A on a Green Card
    const submittedWordsLetterAndStackIndices = submittedWordsCardObjs
        .map(submittedWordCardObj => submittedWordCardObj
            .map(cardObj => ({ letter: cardObj.letter, stackIndex: cardObj.stackIndex, id: cardObj.id }))
        );

    // Loop of a loop: first loop over words and then loop over letters in that word. 
    // For each word, create a new element in the submitted words / scoreboard area.
    for (let submittedWordLetterandStackIndex of submittedWordsLetterAndStackIndices) {
        const scoreboardWordElement = document.createElement('div');
        scoreboardWordElement.classList.add('scoreboard-word');

        for (let letterObj of submittedWordLetterandStackIndex) {

            const cardElement = createCardElement(letterObj.letter, letterObj.stackIndex, letterObj.id);
            scoreboardWordElement.appendChild(cardElement);
        }

        scoreboard.appendChild(scoreboardWordElement);
    }
}

function updateScoreboardText(currentState) {
    const { score, submittedWordsCardIds } = currentState;
    const numWordsSubmitted = submittedWordsCardIds.length;

    scoreCounter.textContent = `Score: ${score}`;
    wordsSubmittedCounter.textContent = `Words: ${numWordsSubmitted}/6`
}

function createCardElement(letter, stackIndex, id) {
    const card = document.createElement('div');
    card.classList.add('card');
    card.dataset.cardId = id;

    card.innerHTML = `<span>${letter}</span>`;

    if (stackIndex === 0) {
        card.classList.add('green');
    } else {
        card.classList.add('blue');
    }

    return card
}

function updateFocusableElements() {
    const topCards = document.querySelectorAll('#game-board .card.top, #game-board .card.solo');
    const guessCards = document.querySelectorAll('#word-guess-wrapper .card');

    const bottomCards = document.querySelectorAll('#game-board .card.bottom');
    const submittedCards = document.querySelectorAll('#scoreboard .card');
    const greyCards = document.querySelectorAll('#game-board .card.game-over')

    for (let card of [...topCards, ...guessCards]) {
        card.setAttribute('tabindex', '0');
    }

    for (let card of [...bottomCards, ...submittedCards, ...greyCards]) {
        card.removeAttribute('tabindex')
    }
}

function setAllButtonStates() {
    const { submittedWordsCardIds, currentWord } = getCurrentState();
    // check if there are undo moves and set undo button
    if (currentWord.length === 0 && submittedWordsCardIds.length === 0) {
        restartButton.disabled = true;
        undoButton.disabled = true;
    } else {
        undoButton.disabled = false;
        restartButton.disabled = false;
    }

    // check if the current board is submittable
    if (currentWord.length < 2 || currentWord.length > 16) {
        submitButton.disabled = true;
    } else submitButton.disabled = false;
}


export function setVH() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

function updateMessageUI(currentState) {
    if (!currentState.messageBanner.visible || currentState.gameIsOver || currentState.modal.isOpen) {
        banner.classList.add('hidden');
        return;
    }
    displayMessage(currentState.messageBanner.text, currentState.messageBanner.type);
}

export function displayMessage(text, type = 'error', duration = 2500) {
    banner.textContent = text;
    banner.className = ''; // reset
    banner.classList.add(type === 'error' ? 'error' : 'success');
    banner.classList.remove('hidden');

    if (type === 'success') {
        banner.classList.add('success') // green
    } else {
        banner.classList.add('error'); // red
    }

    // Hide after duration
    setTimeout(() => {
        dispatch({ type: 'HIDE_BANNER' });
    }, duration);
}

// helper function to remove focus after button click:
export function addBlurredClickListener(element, handler) {
    element.addEventListener('click', (e) => {
        e.currentTarget.blur();
        handler(e);
    });
}

// === HELPER FUNCTIONS === 
async function incorrectShakeElement(el) {
    el.classList.add('incorrect-shake');
    await new Promise(resolve => setTimeout(resolve, 500));
    el.classList.remove('incorrect-shake');
}
async function shakeIfTooManyWords() {
    if (moveHistory.length > 16) {
        const currentGuess = document.querySelectorAll('#word-guess-wrapper .card');
        const lastLetter = currentGuess[currentGuess.length - 1];
        await incorrectShakeElement(lastLetter);
        undoLastLetterPlaced();
    }
}

function greyOutController(currentState) {
    if (currentState.gameIsOver) greyOutCards();
    if (!currentState.gameIsOver) unGreyOutCards();
}

function greyOutCards() {
    const leftOverGreenCards = document.querySelectorAll('#game-board .cell .card.green');
    const leftOverBlueCards = document.querySelectorAll('#game-board .cell .card.blue');

    for (let card of leftOverGreenCards) card.classList.add('game-over');
    for (let card of leftOverBlueCards) card.classList.add('game-over');
}

function unGreyOutCards() {
    const leftOverCards = document.querySelectorAll('#game-board .cell .card.game-over');
    if (leftOverCards.length) {
        for (let card of leftOverCards) {
            card.classList.remove('game-over')
        }
    }
}

function updateWordGuessWrapperLayout(currentState) {
    const lastMove = currentState.actionHistory.at(-1);
    if (!lastMove || lastMove.type !== 'SELECT_CARD') return;
    const isOverflowing = wordGuessWrapper.scrollWidth > wordGuessWrapper.clientWidth;

    if (isOverflowing) {
        wordGuessWrapper.classList.add('scroll-mode');
        wordGuessWrapper.scrollLeft = wordGuessWrapper.scrollWidth;
    } else {
        wordGuessWrapper.classList.remove('scroll-mode');
        wordGuessWrapper.scrollLeft = 0;
    }
}

// This is a good utility function that I imlemented late.
export function getCardObjsFromCardIdArray(arrayOfCardIds) {
    if (arrayOfCardIds.length === 0) return;

    // convert the array of card IDs that reperesent the word to an array
    // of completed card objects.
    const cardObjsArray = arrayOfCardIds.map(id => getCurrentState().cards.find(c => c.id === id));
    return cardObjsArray;
}

import { getCurrentState } from './game-state.js';


// DOM Elements
const banner = document.getElementById('message-banner');
const wordGuessWrapper = document.getElementById('word-guess-wrapper');
const scoreboard = document.getElementById('scoreboard');
const gameBoardElement = document.getElementById('game-board');
const scoreCounter = document.getElementById('score-counter-text');
const wordsSubmittedCounter = document.getElementById('words-submitted-counter-text');



export function renderUI() {
    const currentState = getCurrentState();
    clearAllCardsFromGame();

    addCardsToGrid(currentState);
    addCardsToWordBuilder(currentState);
    addCardsToSubmittedWords(currentState);
    updateScoreboardText(currentState);
    // future modal logic
}


function clearAllCardsFromGame() {
    const allCards = document.querySelectorAll('#main-card .card');
    const allCells = document.querySelectorAll('#main-card .cell');

    for (let card of allCards) {
        card.remove();
    }

    for (let cell of allCells) {
        cell.remove();
    }
}

function addCardsToGrid(currentState) {
    const cardCellIndices = currentState.cards.map(c => c.cellIndex)
    const maxCellIndex = cardCellIndices.length > 0 ? Math.max(...cardCellIndices) : -1;
    if(maxCellIndex === -1) {
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

        const availableCellCards = cellCards.filter(card => card.cardStatus === 'available');

        if (availableCellCards.length === 0) continue;

        for (let availableCard of availableCellCards) {
            const card = createCardElement(availableCard.letter, availableCard.stackIndex);

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
    if (!currentState.currentWord) return;

    // After getting the state, we get the current word's card objects. 
    // this lets us know the letter and the stack index to determine color
    const currentWordCardObjs = currentState.currentWord
        .map(letterId => currentState.cards.find(card => card.id === letterId))
        .filter(cardObj => cardObj);

    // This will create a new array of arrays where each sub array is a letter and stack
    // index to determine color like: [A, 0] => letter A on a Green Card
    const currentWordLetterAndStackIndex = currentWordCardObjs.map((cardObj) =>
        ({ letter: cardObj.letter, stackIndex: cardObj.stackIndex })
    );

    // Loop over cards in current word to create elements in the word builder area
    for (let letterObj of currentWordLetterAndStackIndex) {
        const cardElement = createCardElement(letterObj.letter, letterObj.stackIndex);
        wordGuessWrapper.appendChild(cardElement);
    }
}

function addCardsToSubmittedWords(currentState) {
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
            .map(cardObj => ({ letter: cardObj.letter, stackIndex: cardObj.stackIndex }))
        );

    // Loop of a loop: first loop over words and then loop over letters in that word. 
    // For each word, create a new element in the submitted words / scoreboard area.
    for (let submittedWordLetterandStackIndex of submittedWordsLetterAndStackIndices) {
        const scoreboardWordElement = document.createElement('div');
        scoreboardWordElement.classList.add('scoreboard-word');

        for (let letterObj of submittedWordLetterandStackIndex) {

            const cardElement = createCardElement(letterObj.letter, letterObj.stackIndex);
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


function createCardElement(letter, stackIndex) {
    const card = document.createElement('div');
    card.classList.add('card');
    card.innerHTML = `<span>${letter}</span>`;

    if (stackIndex === 0) {
        card.classList.add('green');
    } else {
        card.classList.add('blue');
    }

    return card
}


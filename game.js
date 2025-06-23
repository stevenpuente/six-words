// Constants
const gameBoard = [];
const moveHistory = [];
const submittedWordsHistory = [];
let score = 0;

const keyboardCycleState = {
  currentKey: null,
  currentIndex: 0,
};

// DOM Elements
const wordGuessWrapper = document.getElementById('word-guess-wrapper');
const undoButton = document.getElementById('undo-button');
const submitButton = document.getElementById('submit-button');
const resetButton = document.getElementById('reset-button');
const scoreboard = document.getElementById('scoreboard');
const gameBoardElement = document.getElementById('game-board');


// === INITIALIZATION === (this listener fires when dom content is loaded, effectively kicking off the game)
document.addEventListener('DOMContentLoaded', async () => {
  submitButton.disabled = true;
  undoButton.disabled = true;   //inactive until first word submitted

  try {
    // Wait for both word lists: validation + generation
    await Promise.all([
      loadWords(),
      generateWords()
    ]);

    // Generate a fresh board
    const { board, wordsUsed } = generateRandomBoard();

    gameBoard.push(...board); // board is 16 pairs like [['A','B'], ...]
    console.log("Game board generated with words:", wordsUsed);       // Remove this once satisfied with game quality

    addCardsAndGrid();          // Adds cards to the DOM
    initializeEventListeners(); // Adds listeners for clicks

    submitButton.disabled = false;
  } catch (error) {
    displayMessage('Failed to load word list. Please reload.', 'error', 5000);
    submitButton.disabled = true;
    console.error(error);
  }
});

// This is called within the initial domcontentloaded event listener and adds 16 cells and 32 cards to the gameboard programatically
function addCardsAndGrid() {

  for (let i = 0; i < 16; i++) {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    gameBoardElement.appendChild(cell)
  }

  const cells = document.querySelectorAll('#game-board .cell');

  // Make sure gameBoard and cells length matches
  if (cells.length !== gameBoard.length) {
    console.error('Mismatch between number of cells and gameBoard data!');
    return;
  }

  // Loop over cells and add top and bottom cards
  for (let i = 0; i < cells.length; i++) {
    const [topLetter, bottomLetter] = gameBoard[i];

    // Create top card div
    const topCard = document.createElement('div');
    topCard.classList.add('card', 'top', 'green');
    topCard.innerHTML = `<span>${topLetter}</span>`;

    // Create bottom card div
    const bottomCard = document.createElement('div');
    bottomCard.classList.add('card', 'bottom', 'blue');
    bottomCard.innerHTML = `<span>${bottomLetter}</span>`;

    // Append cards to cell
    cells[i].appendChild(topCard);
    cells[i].appendChild(bottomCard);
  }
}

// This is called within the initial domcontentloaded event listner and then adds click listeners to all top cards that were generated in addcardsandgrid
function initializeEventListeners() {

  // add event listener to game board
  gameBoardElement.addEventListener('click', handleBoardClick);

  // add event listeners for clicking the undo, submit and reset buttons
  addBlurredClickListener(undoButton, undoSubmittedWord);
  addBlurredClickListener(submitButton, submitWord);
  addBlurredClickListener(resetButton, resetPuzzle);
  wordGuessWrapper.addEventListener('click', handleWordGuessCardClick);
  document.addEventListener('keydown', handleKeyPress);
}

// helper function to remove focus after button click:
function addBlurredClickListener(element, handler) {
  element.addEventListener('click', (e) => {
    e.currentTarget.blur();
    handler(e);
  });
}

// === KEYBOARD MECHANICS === (event liseners for button presses)
function handleKeyPress(e) {
  console.log(e.key);

  if (e.key === 'Backspace' || e.key === 'Delete') {
    resetKeyboardCycleState();
    undoSubmittedWord();
    return;
  }

  if (e.key === 'Enter' || e.key === 'Return') {
    const currentRaised = document.querySelector('.raised');
    resetKeyboardCycleState();

    if (currentRaised) {
      moveCardToGuessArea(currentRaised);
    } else {
      submitWord();
    }
    return;
  }

  const key = e.key.toUpperCase();
  const currentTopCards = document.querySelectorAll('.cell .card.top, .cell .card.solo');

  // Filter to only cards that match the key
  const matchingCards = Array.from(currentTopCards).filter(card =>
    card.innerText.trim().toUpperCase() === key
  );

  // Reset index if the key has changed
  if (keyboardCycleState.currentKey !== key) {
    keyboardCycleState.currentKey = key;
    keyboardCycleState.currentIndex = 0;
  }

  // Remove any currently raised cards
  currentTopCards.forEach(card => card.classList.remove('raised'));

  if (matchingCards.length === 0) return; // no matches found

  // Cycle to the next matching card
  const index = keyboardCycleState.currentIndex % matchingCards.length;
  matchingCards[index].classList.add('raised');
  keyboardCycleState.currentIndex++;
}


function resetKeyboardCycleState() {
  keyboardCycleState.currentKey = null;
  keyboardCycleState.currentIndex = 0;
}

// === GAME MECHANICS === (event liseners for button presses)
function handleBoardClick(e) {
  const clickedCard = e.target.closest('.card.top, .card.solo');

  // Ignore clicks outside cards or not on the board
  if (!clickedCard || !gameBoardElement.contains(clickedCard)) return;

  // Prevent double-moving already moved cards
  if (wordGuessWrapper.contains(clickedCard)) return;

  moveCardToGuessArea(clickedCard); // now passes DOM element, not event
}

function moveCardToGuessArea(topCard) {
  topCard.classList.remove('raised');
  undoButton.disabled = false;
  const cell = topCard.parentElement;
  const bottomCard = cell.querySelector('.card.bottom');

  const move = {
    cell,
    promotedCardInfo: null,
    movedCard: topCard,
    movedCardOriginalClasses: Array.from(topCard.classList),
    movedCardOriginalParent: cell,
  };

  // Move top card to guess area
  cell.removeChild(topCard);
  wordGuessWrapper.appendChild(topCard);

  // Promote bottom card if exists
  if (bottomCard) {
    move.promotedCardInfo = {
      card: bottomCard,
      originalClasses: Array.from(bottomCard.classList),
    };

    cell.removeChild(bottomCard);
    bottomCard.classList.remove('bottom');
    bottomCard.classList.add('solo');

    cell.appendChild(bottomCard);
  }

  moveHistory.push(move);
}

function handleWordGuessCardClick(e) {
  const clickedCard = e.target.closest('.card');
  if (!clickedCard || !wordGuessWrapper.contains(clickedCard)) return;

  const guessCards = Array.from(wordGuessWrapper.children);
  const clickedIndex = guessCards.indexOf(clickedCard);

  if (clickedIndex === -1) return;

  // Undo all cards from the clicked one onward
  const numToUndo = guessCards.length - clickedIndex;
  for (let i = 0; i < numToUndo; i++) {
    undoLastLetterPlaced();
  }
}



function undoLastLetterPlaced() {
  if (moveHistory.length === 0) return;

  const lastMove = moveHistory.pop();

  // Undo moved card
  const movedCard = lastMove.movedCard;
  const originalParent = lastMove.movedCardOriginalParent;
  const originalClasses = lastMove.movedCardOriginalClasses;

  // Remove movedCard from guess area and put back in original cell
  if (movedCard.parentElement === wordGuessWrapper) {
    wordGuessWrapper.removeChild(movedCard);
  }
  originalParent.appendChild(movedCard);

  // Restore classes for movedCard
  movedCard.className = ''; // reset all classes
  originalClasses.forEach(cls => movedCard.classList.add(cls));


  // Undo promotion if any
  if (lastMove.promotedCardInfo) {
    const { card, originalClasses } = lastMove.promotedCardInfo;

    // Remove promoted card from cell
    if (card.parentElement) {
      card.parentElement.removeChild(card);
    }

    // Restore classes 
    card.className = ''; // clear classes
    originalClasses.forEach(cls => card.classList.add(cls));

    // Re-add to original cell
    lastMove.cell.appendChild(card);
  }
}

function submitWord() {
  const cards = Array.from(document.querySelectorAll('#word-guess-wrapper .card'));
  const word = cards.map(card => card.textContent).join('').trim().toUpperCase();

  if (cards.length === 0) {
    displayMessage("Select at least one letter.", 'error');
    return;
  }

  if (!window.VALID_WORDS_BY_LENGTH) {
    displayMessage("Word list not loaded. Please reload the page.", 'error');
    return;
  }

  if (word.length < 2 || word.length > 15) {
    displayMessage("Word must be between 2 and 15 letters.", 'error');
    return;
  }

  const validWords = window.VALID_WORDS_BY_LENGTH[word.length] || [];
  if (!validWords.includes(word)) {
    displayMessage(`"${word}" is not in the word list!`, 'error');
    // if the word is incorrect, remove from the word guess area
    clearGuess();
    return;
  }

  if (word.length === 3) {
    displayMessage(`"${word}" Good!`, 'success');
  } else if (word.length === 4) {
    displayMessage(`"${word}" Nice!`, 'success');
  } else if (word.length === 5) {
    displayMessage(`"${word}" Awesome!`, 'success');
  } else if (word.length >= 6 && word.length <= 7) {
    displayMessage(`"${word}" Incredible!`, 'success');
  } else if (word.length >= 8 && word.length <= 12) {
    displayMessage(`"${word}" Amazing!`, 'success');
  } else if (word.length >= 13 && word.length <= 14) {
    displayMessage(`"${word}" Fantastic!`, 'success');
  } else if (word.length === 15) {
    displayMessage(`"${word}" Superb!`, 'success');
  } else {
    displayMessage(`"${word}" submitted!`, 'success');
  }

  const scoreboardRow = document.createElement('div');
  scoreboardRow.classList.add('scoreboard-word');

  cards.forEach(card => {
    wordGuessWrapper.removeChild(card);
    scoreboardRow.appendChild(card);
  });

  scoreboard.appendChild(scoreboardRow);

  // Pull this word's moves from moveHistory
  const currentWordMoves = moveHistory.splice(-cards.length, cards.length)

  // Track in a new per-word stack
  submittedWordsHistory.push({
    word,
    cards,
    moves: currentWordMoves,
    scoreboardRow
  });

  // Enable Undo
  undoButton.disabled = false;

  // update scoreboard
  updateScoreAndWordSubmissionCount();
}

function undoSubmittedWord() {
  const guessCards = document.querySelectorAll('#word-guess-wrapper .card');
  if (submittedWordsHistory.length === 0 && guessCards.length === 0) return;

  // Step 1: if there are guess cards, remove last card
  if (guessCards.length !== 0) {
    undoLastLetterPlaced();
    return;
  };

  // Step 2: Retrieve last submitted word info
  const lastWord = submittedWordsHistory.pop();
  if (!lastWord || !lastWord.moves || !lastWord.scoreboardRow) return;

  // Remove word row from scoreboard
  if (lastWord.scoreboardRow.parentElement) {
    lastWord.scoreboardRow.parentElement.removeChild(lastWord.scoreboardRow);
  }

  // Step 3: Restore cards
  for (const move of lastWord.moves.reverse()) {
    const { movedCard, movedCardOriginalParent, movedCardOriginalClasses } = move;

    if (movedCard.parentElement) {
      movedCard.parentElement.removeChild(movedCard);
    }

    movedCard.className = '';
    movedCardOriginalClasses.forEach(cls => movedCard.classList.add(cls));
    movedCardOriginalParent.appendChild(movedCard);

    // Restore promoted card, if any
    if (move.promotedCardInfo) {
      const { card, originalClasses } = move.promotedCardInfo;

      if (card.parentElement) {
        card.parentElement.removeChild(card);
      }

      card.className = '';
      originalClasses.forEach(cls => card.classList.add(cls));
      move.cell.appendChild(card);
    }
  }

  // Step 4: Disable undo if no more submitted words
  if (submittedWordsHistory.length === 0 && guessCards.length === 0) {
    undoButton.disabled = true;
  }

  // Step 5 Update Scoreboard
  updateScoreAndWordSubmissionCount();

}

function clearGuess() {
  // Keep undoing until there are no more cards in the guess area
  while (wordGuessWrapper.firstChild) {
    undoLastLetterPlaced();
  }
}

function resetPuzzle() {
  // First, clear any in-progress word
  clearGuess();

  // Then, keep undoing submitted words until none remain
  while (submittedWordsHistory.length > 0) {
    undoSubmittedWord();
  }

  // Also clear any messages, if desired
  displayMessage("Puzzle reset.", 'success');
}


// === HELPER FUNCTIONS === 

function displayMessage(text, type = 'error', duration = 2500) {
  const banner = document.getElementById('message-banner');
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
    banner.classList.add('hidden');
  }, duration);
}

// === UPDATE SCOREBOARD FUNCTIONS

function calculateScore() {
  const score = submittedWordsHistory.reduce((sum, word) => sum + word.cards.length, 0);
  return score;
}

function updateScoreAndWordSubmissionCount() {
  const scoreCounter = document.getElementById('score-counter-nums');
  const wordSubmissionCounter = document.getElementById('words-submitted-counter-nums');
  const wordSubmissionCount = submittedWordsHistory.length;
  const score = calculateScore();

  scoreCounter.textContent = score;
  wordSubmissionCounter.textContent = `${wordSubmissionCount}/6`
}
// Constants
const gameBoard = [];
const moveHistory = [];
const submittedWordsHistory = [];

const keyboardCycleState = {
  currentKey: null,
  currentIndex: 0,
};

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
  undoButton.addEventListener('click', undoSubmittedWord);
  submitButton.addEventListener('click', submitWord);
  resetButton.addEventListener('click', resetPuzzle);
  wordGuessWrapper.addEventListener('click', handleWordGuessCardClick);
  document.addEventListener('keydown', handleKeyPress);
}

// === KEYBOARD MECHANICS === (event liseners for button presses)
function handleKeyPress(e) {
  console.log(e.key);

  if (e.key === 'Backspace' || e.key === 'Delete') {
    undoLastLetterPlaced()
    return;
  }

  if ((e.key === 'Enter' || e.key === 'Return')) {
    const currentRaised = document.querySelector('.raised');
    if (!currentRaised) {
      submitWord();
      return;
    } else {
      moveCardToGuessArea(currentRaised);
      return;
    }
  }

  const key = e.key.toUpperCase();
  let numOfThisKeyOnBoard = 0;
  const currentTopCards = document.querySelectorAll('.cell .card.top');


  // if the last time this ran was not caused by the same key, then reset the current index and current key
  if (keyboardCycleState['currentKey'] !== key) {
    keyboardCycleState['currentKey'] = key;
    keyboardCycleState['currentIndex'] = 0;
  }


  for (let card of currentTopCards) {
    const cardText = card.innerText.trim().toUpperCase();
    card.classList.remove('raised');
    if (cardText === key) {
      numOfThisKeyOnBoard++;
    }
  }


  let cardIndex = 0;
  for (let card of currentTopCards) {
    const cardText = card.innerText.trim().toUpperCase();

    if (keyboardCycleState['currentKey'] !== cardText) {
      continue;
    }

    if (
      keyboardCycleState['currentKey'] === cardText &&
      keyboardCycleState['currentIndex'] !== cardIndex
    ) {
      cardIndex++;
      continue;
    }

    if (
      keyboardCycleState['currentKey'] === cardText &&
      keyboardCycleState['currentIndex'] === cardIndex &&
      (keyboardCycleState['currentIndex'] + 1) % (numOfThisKeyOnBoard) === 0
    ) {
      card.classList.add('raised')
      keyboardCycleState['currentIndex']++;
      keyboardCycleState['currentIndex'] = 0
      break;
    }

    if (
      keyboardCycleState['currentKey'] === cardText &&
      keyboardCycleState['currentIndex'] === cardIndex
    ) {
      card.classList.add('raised')
      keyboardCycleState['currentIndex']++;
      break;
    }
  }
}

// === GAME MECHANICS === (event liseners for button presses)
function handleBoardClick(e) {
  const clickedCard = e.target.closest('.card.top');

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
    bottomCard.classList.add('top');

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
    displayMessage(`"${word}" is not a valid word!`, 'error');
    return;
  }

  displayMessage(`"${word}" submitted!`, 'success');

  const scoreboardRow = document.createElement('div');
  scoreboardRow.classList.add('scoreboard-word');

  const currentWordMoves = []; // ⬅️ collect moves for this word

  cards.forEach(card => {
    wordGuessWrapper.removeChild(card);
    scoreboardRow.appendChild(card);
  });

  scoreboard.appendChild(scoreboardRow);

  // Pull this word's moves from moveHistory
  for (let i = 0; i < cards.length; i++) {
    currentWordMoves.unshift(moveHistory.pop());
  }

  // Track in a new per-word stack
  submittedWordsHistory.push({
    word,
    cards,
    moves: currentWordMoves,
    scoreboardRow
  });

  // Enable Undo
  undoButton.disabled = false;
}

function undoSubmittedWord() {
  const guessCards = document.querySelectorAll('#word-guess-wrapper .card');
  if (submittedWordsHistory.length === 0 && guessCards.length === 0) return;

  // Step 1: Clear any active in-progress guess
  if (guessCards.length !== 0) {
    clearGuess();
    return;
  };

  // Step 2: Retrieve last submitted word info
  const lastWord = submittedWordsHistory.pop();
  if (!lastWord || !lastWord.moves || !lastWord.scoreboardRow) return;

  // Remove word row from scoreboard
  if (lastWord.scoreboardRow.parentElement) {
    lastWord.scoreboardRow.parentElement.removeChild(lastWord.scoreboardRow);
  }

  // Step 3: Restore cards and move history
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

    // Push move back into history in case we want to re-submit it
    moveHistory.push(move);
  }

  // Step 4: Disable undo if no more submitted words
  if (submittedWordsHistory.length === 0 && guessCards.length === 0) {
    undoButton.disabled = true;
  }
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
    banner.style.backgroundColor = 'rgba(25, 135, 84, 0.85)'; // green
  } else {
    banner.style.backgroundColor = 'rgba(255, 0, 0, 0.85)'; // red
  }

  // Hide after duration
  setTimeout(() => {
    banner.classList.add('hidden');
  }, duration);
}

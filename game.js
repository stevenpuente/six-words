// Constants
const gameBoard = [];
const moveHistory = [];
const submittedWordsHistory = [];

const wordGuessWrapper = document.getElementById('word-guess-wrapper');
const undoButton = document.getElementById('undo-button');
const submitButton = document.getElementById('submit-button');
const clearButton = document.getElementById('clear-button');
const scoreboard = document.getElementById('scoreboard');
const gameBoardElement = document.querySelector('#game-board');


// === INITIALIZATION === (this listener fires when dom content is loaded, effectively kicking off the game)
document.addEventListener('DOMContentLoaded', async () => {
  submitButton.disabled = true;

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

  // add event listeners for clicking the undo, submit and clear buttons
  undoButton.addEventListener('click', undoLastLetterPlaced);
  submitButton.addEventListener('click', submitWord);
  clearButton.addEventListener('click', clearGuess);
  wordGuessWrapper.addEventListener('click', handleWordGuessCardClick);
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

    // No need to re-add event listener — we're using delegation now

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

  // Length validation
  if (word.length < 2 || word.length > 15) {
    displayMessage("Word must be between 2 and 15 letters.", 'error');
    return;
  }

  // Lookup valid words by length
  const validWords = window.VALID_WORDS_BY_LENGTH[word.length] || [];

  if (!validWords.includes(word)) {
    displayMessage(`"${word}" is not a valid word!`, 'error');
    return;
  }

  // If valid, show a success message (optional)
  displayMessage(`"${word}" submitted! Maybe Put Points Here!`, 'success');

  // Create a new row in the scoreboard
  const scoreboardRow = document.createElement('div');
  scoreboardRow.classList.add('scoreboard-word');

  cards.forEach(card => {
    // Remove from word-guess area
    wordGuessWrapper.removeChild(card);

    // Add to scoreboard row
    scoreboardRow.appendChild(card);
  });

  // Add word to scoreboard
  scoreboard.appendChild(scoreboardRow);

  // Clear from move history (prevent undoing submitted words)
  moveHistory.splice(-cards.length, cards.length);
}

function clearGuess() {
  // Keep undoing until there are no more cards in the guess area
  while (wordGuessWrapper.firstChild) {
    undoLastLetterPlaced();
  }
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

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
// MODAL DOM ELEMENTS
const gameOverModal = document.getElementById('game-over-modal');
const gameOverModalCloseButton = document.getElementById('close-modal-button');
const gameOverModalShareButton = document.getElementById('share-button');
const gameOverModalPlayAgainButton = document.getElementById('play-again-button');



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

  // Game Over Modal Event Listeners:
  gameOverModalCloseButton.addEventListener('click', () => {
    gameOverModal.classList.add('hidden')
  });
  gameOverModalPlayAgainButton.addEventListener('click', () => {
    gameOverModal.classList.add('hidden');
    resetPuzzle();
  });
  gameOverModalShareButton.addEventListener('click', shareResults);


  // add event listeners for clicking the undo, submit and reset buttons
  addBlurredClickListener(undoButton, undoSubmittedWord);
  addBlurredClickListener(submitButton, submitWord);
  addBlurredClickListener(resetButton, resetPuzzle);
  wordGuessWrapper.addEventListener('click', handleWordGuessCardClick);
  document.addEventListener('keydown', handleKeyPress);
}

// === KEYBOARD MECHANICS === (event liseners for button presses)
function handleKeyPress(e) {
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

  if (gameIsOver()) {
    showGameOverModal();
  }
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

// === SCOREBOARD FUNCTIONS
function updateScoreAndWordSubmissionCount() {
  const scoreCounter = document.getElementById('score-counter-nums');
  const wordSubmissionCounter = document.getElementById('words-submitted-counter-nums');
  const wordSubmissionCount = submittedWordsHistory.length;
  const score = calculateScore();

  scoreCounter.textContent = score;
  wordSubmissionCounter.textContent = `${wordSubmissionCount}/6`
}

function calculateScore() {
  const score = submittedWordsHistory.reduce((sum, word) => sum + word.cards.length, 0);
  return score;
}


// === GAME OVER LOGIC ===
function gameIsOver() {
  // Step 0: the game will not be over after the first turn
  if (submittedWordsHistory.length < 2) return false;

  // Step 1: Check if we have 6 words submitted
  if (submittedWordsHistory.length >= 6) return true;

  // Step 2: Check for a perfect game
  if (score >= 32) return true;


  // Step 3: Check if there are any possible moves left
  const gameBoardLettersToCheck = getCurrentGameBoard();

  for (let i = 2; i <= 15; i++) {
    const iLetterWords = generateAllPossibleWords(gameBoardLettersToCheck, i);
    for (let word of iLetterWords) {
      if (isValidWord(word)) {
        return false;
      }
    }
  }
  return true;
}

function isValidWord(word) {
  const validWords = window.VALID_WORDS_BY_LENGTH[word.length] || [];
  return validWords.includes(word);
}

function getCurrentGameBoard() {
  const cells = document.querySelectorAll('.cell');
  const currentGameBoard = [];

  for (let i = 0; i < cells.length; i++) {
    const topCardLetter = cells[i].querySelector('.top')?.textContent ?? null;
    const bottomCardLetter = cells[i].querySelector('.bottom')?.textContent ?? null;
    const soloCardLetter = cells[i].querySelector('.solo')?.textContent ?? null;

    const lettersInCurrentCell = []

    if (soloCardLetter && !topCardLetter && !bottomCardLetter) {
      lettersInCurrentCell.push(soloCardLetter);
    } else {
      if (topCardLetter) lettersInCurrentCell.push(topCardLetter)
      if (bottomCardLetter) lettersInCurrentCell.push(bottomCardLetter)
    }

    if (lettersInCurrentCell.length > 0) currentGameBoard.push(lettersInCurrentCell);
  }
  return currentGameBoard
}

function generateAllPossibleWords(gameboardLetters, n) {
  const results = [];

  function recursiveWordBuilder(currentWord, availableLetters) {
    if (currentWord.length === n) {
      results.push(currentWord.join(''));
      return;
    }

    for (let i = 0; i < availableLetters.length; i++) {
      if (availableLetters[i].length === 0) continue;

      const availableLettersCopy = availableLetters.map(pairs => [...pairs]);
      const nextLetter = availableLettersCopy[i].shift();

      recursiveWordBuilder([...currentWord, nextLetter], availableLettersCopy);
    }
  }

  recursiveWordBuilder([], gameboardLetters);

  return results;
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

// helper function to remove focus after button click:
function addBlurredClickListener(element, handler) {
  element.addEventListener('click', (e) => {
    e.currentTarget.blur();
    handler(e);
  });
}

// === GAME OVER MODAL ===

function showGameOverModal() {
  const modal = document.getElementById('game-over-modal');
  const title = document.getElementById('game-over-title');
  const subTitle = document.getElementById('game-over-sub-title');
  const stats = document.getElementById('game-over-stats');
  const wordList = document.getElementById('game-over-summary-section');

  const score = calculateScore();
  const wordsUsed = submittedWordsHistory.length;

  // Title message
  if (score >= 32) {
    title.textContent = "Perfect!";
    subTitle.textContent = 'You Cleared The Board!';
  } else if (wordsUsed >= 6) {
    title.textContent = "Game Over!";
    subTitle.textContent = 'You Used All Six Guesses!';
  } else {
    title.textContent = "Game Over!";
    subTitle.textContent = 'No Moves Left!';
  }

  stats.textContent = `Score: ${score} / 32 | Words Submitted: ${wordsUsed} / 6`;

  wordList.innerHTML = '';

  for (let word of submittedWordsHistory) {
    createWordForGameOverSummarySection(word)
  }
  modal.classList.remove('hidden');
}


function createWordForGameOverSummarySection(historyWordObj) {
  if (historyWordObj.word.length !== historyWordObj.cards.length) {
    console.log('error while generating summary word: word length does not match card length');
    return
  }

  const wordList = document.getElementById('game-over-summary-section');
  const summaryWord = document.createElement('div');
  summaryWord.classList.add('summary-section-word');

  for (let i = 0; i < historyWordObj.word.length; i++) {
    const historyCard = historyWordObj.cards[i];
    const historyLetter = historyWordObj.word[i];

    const summaryLetter = document.createElement('div');

    summaryLetter.classList.add('game-over-card');
    summaryLetter.innerHTML = `<span>${historyLetter}</span>`;

    if (historyCard.classList.contains('green')) summaryLetter.classList.add('green');
    if (historyCard.classList.contains('blue')) summaryLetter.classList.add('blue');

    summaryWord.appendChild(summaryLetter);
  }
  wordList.appendChild(summaryWord)
}


function createEmojiArray() {
  const finalWords = document.querySelectorAll('.summary-section-word');
  const emojiArray = [];

  for (let word of finalWords) {
    const squares = word.querySelectorAll('.game-over-card');
    let emojiWord = ''
    for (let square of squares) {
      if (square.classList.contains('green')) emojiWord += '🟩';
      if (square.classList.contains('blue')) emojiWord += '🟦';
    }
    emojiArray.push(emojiWord);
  }

  return emojiArray;
}

function createShareMessage() {
  const score = calculateScore();
  const numOfWordsUsed = submittedWordsHistory.length;
  const emojiArray = createEmojiArray();
  const emojiLines = emojiArray.join('\n');

  const message = `Untitled Word Game #0\nI scored ${score} points in ${numOfWordsUsed} words on today's Untitled Word Game! \n${emojiLines}\n`;

  return message;
}

function shareResults() {
  const message = createShareMessage();

  if (navigator.share) {
    navigator.share({
      text: message,
    }).then(() => {
      console.log("Shared successfully!");
    }).catch((err) => {
      console.error("Sharing was cancelled or failed:", err);
    });
  } else {
    navigator.clipboard.writeText(message)
      .then(() => {
        console.log("Results copied to clipboard.");
      })
      .catch((err) => {
        console.error("Failed to copy results to clipboard:", err);
      });
  }

}
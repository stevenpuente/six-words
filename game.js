// Constants
const gameBoard = [
  ['C', 'B'], ['E', 'T'], ['O', 'N'], ['S', 'I'],
  ['E', 'L'], ['R', 'U'], ['D', 'E'], ['M', 'C'],
  ['H', 'A'], ['Y', 'G'], ['F', 'K'], ['P', 'W'],
  ['O', 'V'], ['L', 'T'], ['J', 'Z'], ['Q', 'N'],
];


const moveHistory = [];

const wordGuessWrapper = document.getElementById('word-guess-wrapper');
const undoButton = document.getElementById('undo-button');
const submitButton = document.getElementById('submit-button');
const clearButton = document.getElementById('clear-button');
const scoreboard = document.getElementById('scoreboard');


function addCardsAndGrid() {
  const gameBoardElement = document.querySelector('#game-board');
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


// Initialize: attach click listeners to all top cards
function initializeEventListeners() {
  const topCards = document.querySelectorAll('.card.top');
  topCards.forEach(card => {
    card.addEventListener('click', handleTopCardClick);
  });

  undoButton.addEventListener('click', undoLastMove);
  submitButton.addEventListener('click', submitWord);
  clearButton.addEventListener('click', clearGuess);

}

function clearGuess() {
  // Keep undoing until there are no more cards in the guess area
  while (wordGuessWrapper.firstChild) {
    undoLastMove();
  }
}

function handleTopCardClick(e) {
  const topCard = e.currentTarget;
  const cell = topCard.parentElement;

  // Get the bottom card in the same cell (if any)
  const bottomCard = cell.querySelector('.card.bottom');

  // Save move details for undo
  const move = {
    cell: cell,
    promotedCardInfo: null,
    movedCard: topCard,
    movedCardOriginalClasses: Array.from(topCard.classList),
    movedCardOriginalParent: topCard.parentElement,
    movedCardOriginalStyles: {
      top: topCard.style.top,
      left: topCard.style.left,
      transform: topCard.style.transform,
      zIndex: topCard.style.zIndex,
    }
  };

  // Remove topCard from cell and add to guess area
  cell.removeChild(topCard);
  // Reset styles for guess area display
  topCard.style.position = 'relative';
  topCard.style.top = 'auto';
  topCard.style.left = 'auto';
  topCard.style.transform = 'none';
  topCard.style.zIndex = 'auto';

  // Add it to guess area
  wordGuessWrapper.appendChild(topCard);

  // If there is a bottom card, promote it to top
  if (bottomCard) {
    move.promotedCardInfo = {
      card: bottomCard,
      originalClasses: Array.from(bottomCard.classList),
      originalStyles: {
        top: bottomCard.style.top,
        left: bottomCard.style.left,
        transform: bottomCard.style.transform,
        zIndex: bottomCard.style.zIndex,
      }
    };

    // Remove bottomCard from cell to re-add as top card
    cell.removeChild(bottomCard);

    // Update classes
    bottomCard.classList.remove('bottom');
    bottomCard.classList.add('top');

    // Reset styles for top card position
    bottomCard.style.top = '50%';
    bottomCard.style.left = '50%';
    bottomCard.style.transform = 'translate(-50%, -50%)';
    bottomCard.style.zIndex = '3';

    // Add click listener to new top card
    bottomCard.addEventListener('click', handleTopCardClick);

    // Append promoted card back into cell
    cell.appendChild(bottomCard);
  }

  // Save move to history
  moveHistory.push(move);
}

function undoLastMove() {
  if (moveHistory.length === 0) return;

  const lastMove = moveHistory.pop();

  // Undo moved card
  const movedCard = lastMove.movedCard;
  const originalParent = lastMove.movedCardOriginalParent;
  const originalClasses = lastMove.movedCardOriginalClasses;
  const originalStyles = lastMove.movedCardOriginalStyles;

  // Remove movedCard from guess area and put back in original cell
  if (movedCard.parentElement === wordGuessWrapper) {
    wordGuessWrapper.removeChild(movedCard);
  }
  originalParent.appendChild(movedCard);

  // Restore classes & styles for movedCard
  movedCard.className = ''; // reset all classes
  originalClasses.forEach(cls => movedCard.classList.add(cls));

  movedCard.style.position = 'absolute';
  movedCard.style.top = originalStyles.top || '';
  movedCard.style.left = originalStyles.left || '';
  movedCard.style.transform = originalStyles.transform || '';
  movedCard.style.zIndex = originalStyles.zIndex || '';

  // Add click listener back if top card
  if (movedCard.classList.contains('top')) {
    movedCard.addEventListener('click', handleTopCardClick);
  } else {
    movedCard.removeEventListener('click', handleTopCardClick);
  }

  // Undo promotion if any
  if (lastMove.promotedCardInfo) {
    const { card, originalClasses, originalStyles } = lastMove.promotedCardInfo;

    // Remove promoted card from cell
    if (card.parentElement) {
      card.parentElement.removeChild(card);
    }

    // Restore classes & styles
    card.className = ''; // clear classes
    originalClasses.forEach(cls => card.classList.add(cls));

    card.style.position = 'absolute';
    card.style.top = originalStyles.top || '';
    card.style.left = originalStyles.left || '';
    card.style.transform = originalStyles.transform || '';
    card.style.zIndex = originalStyles.zIndex || '';

    // Remove click listener if not top
    if (card.classList.contains('top')) {
      card.addEventListener('click', handleTopCardClick);
    } else {
      card.removeEventListener('click', handleTopCardClick);
    }

    // Re-add to original cell
    lastMove.cell.appendChild(card);
  }
}

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

function submitWord() {
  const cards = Array.from(document.querySelectorAll('#word-guess-wrapper .card'));
  const word = cards.map(card => card.innerText).join('').trim().toUpperCase();

  if (cards.length === 0) {
    displayMessage("Select at least one letter.", 'error');
    return;
  }

  if (!VALID_WORDS_BY_LENGTH) {
    displayMessage("Word list not loaded. Please reload the page.", 'error');
    return;
  }

  // Length validation
  if (word.length < 2 || word.length > 15) {
    displayMessage("Word must be between 2 and 15 letters.", 'error');
    return;
  }

  // Lookup valid words by length
  const validWords = VALID_WORDS_BY_LENGTH[word.length] || [];

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

    // Reset styles and remove click behavior
    card.style.position = 'static';
    card.style.top = 'auto';
    card.style.left = 'auto';
    card.style.transform = 'none';
    card.style.zIndex = 'auto';
    card.style.margin = '0';
    card.removeEventListener('click', handleTopCardClick);

    // Add to scoreboard row
    scoreboardRow.appendChild(card);
  });

  // Add word to scoreboard
  scoreboard.appendChild(scoreboardRow);

  // Clear from move history (prevent undoing submitted words)
  moveHistory.splice(-cards.length, cards.length);
}

// Run init on page load
document.addEventListener('DOMContentLoaded', async () => {
  submitButton.disabled = true;

  try {
    await loadWords();
    console.log('Words loaded, game ready');

    addCardsAndGrid();
    initializeEventListeners();

    submitButton.disabled = false;
  } catch (error) {
    displayMessage('Failed to load word list. Please reload.', 'error', 5000);
    submitButton.disabled = true;
    console.error(error);
  }



});

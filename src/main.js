import './style.css';
import { loadWords } from "./word-gen-and-validation/valid-words.js";
import { generateWords, generateRandomBoard } from "./word-gen-and-validation/gen-words.js";
import { initializeGame, dispatch, getCurrentState } from "./game-state/game-state.js";
import { displayMessage, setVH, addBlurredClickListener } from "./dom/dom-utils.js";
import { playButton, gameBoardElement, gameOverModalCloseButton, gameOverModalPlayAgainButton, gameOverModalShareButton, alertModalCloseButton, alertModalRightButton, alertModalLeftButton, undoButton, submitButton, restartButton, wordGuessWrapper } from "./dom/dom-utils.js";
import { handleKeyPress } from "./handlers/keyboard-handlers.js";
import { handleRestartButton, handleSubmitButton, handleUndoButton } from "./handlers/button-handlers.js";
import { handleBoardClick, handleWordGuessCardClick } from "./handlers/click-handlers.js";
import { shareResults, showLandscapeWarningModal } from "./dom/modals.js";

window.getCurrentState = getCurrentState;

// === INITIALIZATION === (this listener fires when dom content is loaded, effectively kicking off the game)
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Wait for both word lists: validation + generation
    await Promise.all([
      loadWords(),
      generateWords()
    ]);

    const { board, wordsUsed} = generateRandomBoard();
    console.log(wordsUsed);
    initializeGame(board);
    setVH();
    initializeEventListeners(); 
  } catch (error) {
    displayMessage('Failed to load.', 'error', 5000);
    console.error(error);
  }
});

// === ATTACH ALL LISTENERS ===
function initializeEventListeners() {

  // 1. START WITH MODALS
  // Welcome Screen play button listener:
  playButton.addEventListener('click', () => {
    dispatch({ type: 'MODAL_CLOSE' });
  });

  // Alert Modal Event Listeners:
  alertModalCloseButton.addEventListener('click', () => {
    dispatch({ type: 'MODAL_CLOSE' });
  });
  alertModalRightButton.addEventListener('click', () => {
    dispatch({ type: 'MODAL_CLOSE' });
    dispatch({ type: 'RESTART' });
  });
  alertModalLeftButton.addEventListener('click', () => {
    dispatch({ type: 'MODAL_CLOSE' });
  });

  // Game Over Modal Event Listeners:
  gameOverModalCloseButton.addEventListener('click', () => {
    dispatch({ type: 'MODAL_CLOSE' });
  });

  gameOverModalPlayAgainButton.addEventListener('click', () => {
    dispatch({ type: 'MODAL_CLOSE' });
    dispatch({ type: 'RESTART' });
  });

  gameOverModalShareButton.addEventListener('click', shareResults);

  // Landscape warning Modal Event Listeners:
  window.addEventListener('load', showLandscapeWarningModal);
  window.addEventListener('resize', showLandscapeWarningModal);
  window.addEventListener('orientationchange', showLandscapeWarningModal);

  // 2. ADD LISTENERS TO USER ACTIONS AND BUTTONS
  // clicks and keypresses:
  gameBoardElement.addEventListener('click', handleBoardClick);
  wordGuessWrapper.addEventListener('click', handleWordGuessCardClick);
  document.addEventListener('keydown', handleKeyPress);
  // buttons:
  addBlurredClickListener(undoButton, handleUndoButton);
  addBlurredClickListener(submitButton, handleSubmitButton);
  addBlurredClickListener(restartButton, handleRestartButton);

  // 3. ADD LISTENERS FOR WINDOW BEHAVIOR
  document.addEventListener('dblclick', (e) => e.preventDefault());
  window.addEventListener('resize', setVH);
}

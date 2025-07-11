import { generateWords, generateRandomBoard } from './generate-words.js';
import { loadWords, wordIsValid, } from './valid-words.js';
import { getWordStringFromWordCardIds, calculateScore } from './reducer-helper-functions.js';
import { isGameOver } from './game-over.js';
import { renderUI } from './render-ui.js';

const minimumWordLength = 2;
const maximumWordLength = 16;

const initialState = {
  cards: [],
  currentWord: [],
  submittedWords: [],
  submittedWordsCardIds: [],
  actionHistory: [],
  score: 0,
  gameIsOver: false,
};

let currentState = { ...initialState };

export function dispatch(action) {
  currentState = reducer(currentState, action);
  renderUI(currentState);
}

function reducer(state, action) {
  switch (action.type) {

    case 'INIT': {
      const initialCards = createCardsFromBoard(action.payload.board);

      return {
        ...initialState,
        cards: initialCards,
      }
    }

    case 'SELECT_CARD': {
      const card = state.cards.find(c => c.id === action.payload.id);
      if (!card || card.cardStatus !== 'available') return state;
      if (state.currentWord.includes(action.payload.id)) return state;

      const updatedCurrentWord = [...state.currentWord, action.payload.id];
      const updatedActionHistory = [...state.actionHistory, action];
      const updatedCards = state.cards.map((c) => {
        if (c.id === action.payload.id) {
          return {
            ...c,
            cardStatus: 'selected',
          }
        } else return c;

      });

      return {
        ...state,
        currentWord: updatedCurrentWord,
        cards: updatedCards,
        actionHistory: updatedActionHistory,
      };
    }

    case 'SUBMIT_WORD': {
      // Don't submit if no word is selected
      if (action.payload.submittedWordCardIds.length < minimumWordLength || action.payload.submittedWordCardIds.length > maximumWordLength) return state;

      const submittedWordString = getWordStringFromWordCardIds(action.payload.submittedWordCardIds, state.cards);

      // Return letters to gameboard if word is invalid
      if (!wordIsValid(submittedWordString)) {
        const updatedCurrentWord = [];
        const returnedLetterIds = action.payload.submittedWordCardIds;
        const updatedActionHistory = [...state.actionHistory, action];
        const updatedCards = state.cards.map((c) => {
          if (returnedLetterIds.includes(c.id)) {
            return {
              ...c,
              cardStatus: 'available',
            };
          } else return c;
        });

        return {
          ...state,
          currentWord: updatedCurrentWord,
          cards: updatedCards,
          actionHistory: updatedActionHistory,
        };
      }

      const updatedSubmittedWords = [...state.submittedWords, submittedWordString];
      const updatedSubmittedWordsCardIds = [...state.submittedWordsCardIds, action.payload.submittedWordCardIds];
      const updatedActionHistory = [...state.actionHistory, action];
      const updatedScore = calculateScore(updatedSubmittedWordsCardIds);
      const updatedCards = state.cards.map((c) => {
        if (action.payload.submittedWordCardIds.includes(c.id)) {
          return {
            ...c,
            cardStatus: 'submitted',
          };
        } else {
          return c;
        }
      });
      const updatedGameIsOver = isGameOver(updatedSubmittedWords, updatedScore, updatedCards);


      return {
        ...state,
        submittedWords: updatedSubmittedWords,
        submittedWordsCardIds: updatedSubmittedWordsCardIds,
        currentWord: [],
        cards: updatedCards,
        actionHistory: updatedActionHistory,
        score: updatedScore,
        gameIsOver: updatedGameIsOver,
      };
    }

    case 'UNDO': {
      // Case 0 where there are submitted words and no cards selected
      // Then we want to return current state because there is nothing to undo
      if (state.submittedWordsCardIds.length === 0 && state.currentWord.length === 0) return state;


      // Case 1 where there are no cards in the current word
      // Then we want to move the last submitted word back into the current Word
      if (state.currentWord.length === 0) {
        const updatedCurrentWord = state.submittedWordsCardIds.at(-1);
        const updatedSubmittedWords = state.submittedWords.slice(0, -1);
        const updatedSubmittedWordsCardIds = state.submittedWordsCardIds.slice(0, -1);
        const updatedActionHistory = [...state.actionHistory, action];
        const updatedScore = calculateScore(updatedSubmittedWordsCardIds)
        const updatedCards = state.cards.map((c) => {
          if (updatedCurrentWord.includes(c.id)) {
            return {
              ...c,
              cardStatus: 'selected',
            };
          } else {
            return c;
          }
        });

        return {
          ...state,
          submittedWords: updatedSubmittedWords,
          submittedWordsCardIds: updatedSubmittedWordsCardIds,
          currentWord: updatedCurrentWord,
          cards: updatedCards,
          actionHistory: updatedActionHistory,
          score: updatedScore,
        };
      }

      // Case 2 where there are cards to undo:
      // Then we want to return the last played card to the board:
      if (state.currentWord.length > 0) {
        const unSelectedCardId = state.currentWord.at(-1);
        const updatedCurrentWord = state.currentWord.slice(0, -1);
        const updatedActionHistory = [...state.actionHistory, action];
        const updatedCards = state.cards.map((c) => {
          if (c.id === unSelectedCardId) {
            return {
              ...c,
              cardStatus: 'available',
            };
          } else return c;
        });

        return {
          ...state,
          currentWord: updatedCurrentWord,
          cards: updatedCards,
          actionHistory: updatedActionHistory,
        };
      }
      // Fall Back in case somehow all of the above conditions fail
      return state;
    }

    case 'UNDO-THROUGH-TAPPED-LETTER': {
      // Action's payload will be an ID that is inside the current word. we want to undo up to and including that id. 
      if (state.currentWord.length === 0) return state;

      const index = state.currentWord.indexOf(action.payload.id);
      if (index === -1) return state;

      const updatedCurrentWord = state.currentWord.slice(0, index);
      const returnedLetterIds = state.currentWord.slice(index);
      const updatedActionHistory = [...state.actionHistory, action];
      const updatedCards = state.cards.map((c) => {
        if (returnedLetterIds.includes(c.id)) {
          return {
            ...c,
            cardStatus: 'available',
          };
        } else return c;
      });

      return {
        ...state,
        currentWord: updatedCurrentWord,
        cards: updatedCards,
        actionHistory: updatedActionHistory,
      };
    }

    case 'RESTART': {
      // Block Restart if nothing to restart:
      if (state.submittedWordsCardIds.length === 0 && state.currentWord.length === 0) return state;

      const updatedCards = state.cards.map((c) => {
        return {
          ...c,
          cardStatus: 'available',
        };
      });

      return {
        ...state,
        cards: updatedCards,
        currentWord: [],
        submittedWords: [],
        submittedWordsCardIds: [],
        actionHistory: [...state.actionHistory, action],
        score: 0,
        gameIsOver: false,
      };
    }
    default: return state
  }
}

function createCardsFromBoard(board) {
  return board.flatMap((pair, cellIndex) =>
    pair.map((letter, stackIndex) => ({
      id: `cell-${cellIndex}_stack-${stackIndex}`,
      letter,
      cellIndex,
      stackIndex,
      cardStatus: 'available'
    }))
  );
}

export function initializeGame(board) {
  if (!board) throw new Error("Board must be provided to initialize the game.");
  dispatch({ type: 'INIT', payload: { board } });
}

export function getCurrentState() {
  return currentState;
}
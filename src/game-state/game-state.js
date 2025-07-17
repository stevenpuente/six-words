import { modalTypes, minimumWordLength, maximumWordLength } from "../config";
import { isGameOver } from "./game-over";
import { getWordStringFromWordCardIds, calculateScore } from "./game-state-utils";
import { renderUI } from "../ui/render-ui";
import { wordIsValid } from "../word-gen-and-validation/valid-words";


// === CENTRALIZED STATE MANAGMENT ===
const initialState = {
  cards: [],
  currentWord: [],
  submittedWords: [],
  submittedWordsCardIds: [],
  actionHistory: [],
  score: 0,
  gameIsOver: false,
  modal: {
    isOpen: true,
    type: modalTypes.WELCOME,
  },
  messageBanner: {
    text: null,
    type: null,
    visible: false,
  },
};
let currentState = { ...initialState };
// === DISPATCH AND REDUCER FUNCTIONS ===

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
      };
    }

    case 'RAISE_CARD': {
      const card = state.cards.find(c => c.id === action.payload.id);
      if (!card || card.cardStatus !== 'AVAILABLE') return state;
      if (state.currentWord.includes(action.payload.id)) return state;

      const updatedActionHistory = [...state.actionHistory, action];
      const updatedCards = state.cards.map((c) => {
        if (c.id === action.payload.id) {
          return {
            ...c,
            cardStatus: 'RAISED',
          };
        } else if (c.cardStatus === 'RAISED') {
          return {
            ...c,
            cardStatus: 'AVAILABLE',
          };
        } else {
          return c;
        }
      });

      return {
        ...state,
        cards: updatedCards,
        actionHistory: updatedActionHistory,
      };
    }

    case 'UNRAISE_CARD': {
      const card = state.cards.find(c => c.cardStatus === 'RAISED');
      if (!card || card.cardStatus !== 'RAISED') return state;

      const updatedActionHistory = [...state.actionHistory, action];
      const updatedCards = state.cards.map((c) => {
        if (c.cardStatus === 'RAISED') {
          return {
            ...c,
            cardStatus: 'AVAILABLE',
          };
        } else {
          return c;
        }
      });

      return {
        ...state,
        cards: updatedCards,
        actionHistory: updatedActionHistory,
      };
    }

    case 'SELECT_CARD': {
      // first, check if game is over and bail if it is:
      if (state.gameIsOver) return state;

      const card = state.cards.find(c => c.id === action.payload.id);
      if (!card ||
        !(card.cardStatus === 'AVAILABLE' || card.cardStatus === 'RAISED')) return state;

      if (state.currentWord.length >= 16) {
        const updatedCurrentWord = [...state.currentWord, action.payload.id];
        const updatedActionHistory = [...state.actionHistory, action];
        const updatedCards = state.cards.map((c) => {
          if (c.id === action.payload.id) {
            return {
              ...c,
              cardStatus: 'SHAKE',
            };
          } else return c;
        });

        return {
          ...state,
          currentWord: updatedCurrentWord,
          cards: updatedCards,
          actionHistory: updatedActionHistory,
          messageBanner: {
            text: null,
            type: null,
            visible: false,
          },
        };
      }

      if (state.currentWord.includes(action.payload.id)) return state;

      const updatedCurrentWord = [...state.currentWord, action.payload.id];
      const updatedActionHistory = [...state.actionHistory, action];
      const updatedCards = state.cards.map((c) => {
        if (c.id === action.payload.id) {
          return {
            ...c,
            cardStatus: 'SELECTED',
          };
        } else if (c.id !== action.payload.id && c.cardStatus === 'RAISED') {
          return {
            ...c,
            cardStatus: 'AVAILABLE',
          };
        } return c;
      });

      return {
        ...state,
        currentWord: updatedCurrentWord,
        cards: updatedCards,
        actionHistory: updatedActionHistory,
        messageBanner: {
          text: null,
          type: null,
          visible: false,
        },
      };
    }

    case 'SUBMIT_WORD': {
      // first, check if game is over and bail if it is:
      if (state.gameIsOver) return state;

      // Don't submit if too long/too short word is selected
      if (action.payload.currentWord.length < minimumWordLength || action.payload.currentWord.length > maximumWordLength) return state;

      const currentWordString = getWordStringFromWordCardIds(action.payload.currentWord, state.cards);

      // Return letters to gameboard if word is invalid
      if (!wordIsValid(currentWordString)) {
        const updatedCurrentWord = [];
        const returnedLetterIds = action.payload.currentWord;
        const updatedActionHistory = [...state.actionHistory, action];
        const updatedCards = state.cards.map((c) => {
          if (returnedLetterIds.includes(c.id)) {
            return {
              ...c,
              cardStatus: 'AVAILABLE',
            };
          } else return c;
        });

        return {
          ...state,
          currentWord: updatedCurrentWord,
          cards: updatedCards,
          actionHistory: updatedActionHistory,
          messageBanner: {
            text: 'Not in word list',
            type: 'error',
            visible: true,
          },
        };
      }

      const updatedSubmittedWords = [...state.submittedWords, currentWordString];
      const updatedSubmittedWordsCardIds = [...state.submittedWordsCardIds, action.payload.currentWord];
      const updatedActionHistory = [...state.actionHistory, action];
      const updatedScore = calculateScore(updatedSubmittedWordsCardIds);
      const updatedCards = state.cards.map((c) => {
        if (action.payload.currentWord.includes(c.id)) {
          return {
            ...c,
            cardStatus: 'SUBMITTED',
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
        messageBanner: {
          text: `Nice! +${state.currentWord.length} points`,
          type: 'success',
          visible: true,
        },
        modal: updatedGameIsOver
          ? {
            isOpen: true,
            type: modalTypes.GAME_OVER,
          }
          : state.modal,
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
        const updatedScore = calculateScore(updatedSubmittedWordsCardIds);
        const updatedCards = state.cards.map((c) => {
          if (updatedCurrentWord.includes(c.id)) {
            return {
              ...c,
              cardStatus: 'SELECTED',
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
          gameIsOver: false,
          messageBanner: {
            text: null,
            type: null,
            visible: false,
          },
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
              cardStatus: 'AVAILABLE',
            };
          } else return c;
        });

        return {
          ...state,
          currentWord: updatedCurrentWord,
          cards: updatedCards,
          actionHistory: updatedActionHistory,
          messageBanner: {
            text: null,
            type: null,
            visible: false,
          },
        };
      }
      // Fall Back in case somehow all of the above conditions fail
      return state;
    }

    case 'UNDO_THROUGH_TAPPED_LETTER': {
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
            cardStatus: 'AVAILABLE',
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
          cardStatus: 'AVAILABLE',
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
        modal: {
          isOpen: false,
          type: null,
        },
        messageBanner: {
          text: null,
          type: null,
          visible: false,
        },
      };
    }

    case 'MODAL_OPEN': {
      console.log(action.payload.type);
      return {
        ...state,
        modal: {
          isOpen: true,
          type: action.payload.type,
        },
        messageBanner: {
          text: null,
          type: null,
          visible: false,
        },
      };

    };

    case 'MODAL_CLOSE': {
      return {
        ...state,
        modal: {
          isOpen: false,
          type: null,
        },
        messageBanner: {
          text: null,
          type: null,
          visible: false,
        },
      };
    }

    case 'SHOW_BANNER': {
      return {
        ...state,
        messageBanner: {
          text: action.payload.text,
          type: action.payload.type,
          visible: true,
        }
      };
    }

    case 'HIDE_BANNER': {
      return {
        ...state,
        messageBanner: {
          text: null,
          type: null,
          visible: false,
        }
      };
    }

    default: return state;
  }
}
// === HELPER FUNCTIONS===
// Call this from main.js to initialize the game state from a board:


export function initializeGame(board) {
  if (!board) throw new Error("Board must be provided to initialize the game.");
  dispatch({ type: 'INIT', payload: { board } });
}
// Call this function to return the current game state from anywhere:

export function getCurrentState() {
  return currentState;
}
// This function is used whenever cards must be generated from
// gameboard within the reducer. primarily to keep the code clean and readable
function createCardsFromBoard(board) {
  return board.flatMap((pair, cellIndex) => pair.map((letter, stackIndex) => ({
    id: `cell-${cellIndex}_stack-${stackIndex}`,
    letter,
    cellIndex,
    stackIndex,
    cardStatus: 'AVAILABLE'
  }))
  );
}

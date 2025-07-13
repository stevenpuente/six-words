import { getCurrentState } from "./game-state";


export function getWordStringFromWordCardIds(currentWordIds, cards) {
  return currentWordIds.map(id => {
    const currentCardObj = cards.find(card => card.id === id);
    return currentCardObj.letter;
  })
    .join('');
}
export function getCardObjsFromCardIdArray(arrayOfCardIds) {
  if (arrayOfCardIds.length === 0) return;

  // convert the array of card IDs that reperesent the word to an array
  // of completed card objects.
  const cardObjsArray = arrayOfCardIds.map(id => getCurrentState().cards.find(c => c.id === id));
  return cardObjsArray;
}
export function calculateScore(submittedWordsCardIds) {
  return submittedWordsCardIds.reduce((sum, word) => sum + word.length, 0);
}

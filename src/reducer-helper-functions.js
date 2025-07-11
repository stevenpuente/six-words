
// === REDUCER HELPER FUNCTIONS ===
export function getWordStringFromWordCardIds(currentWordIds, cards) {
  return currentWordIds.map(id => {
    const currentCardObj = cards.find(card => card.id === id);
    return currentCardObj.letter;
  })
    .join('');
}

export function calculateScore(submittedWordsCardIds) {
  return submittedWordsCardIds.reduce((sum, word) => sum + word.length, 0);
}

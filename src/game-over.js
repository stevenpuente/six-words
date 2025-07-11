// === GAME OVER LOGIC ===
export function isGameOver(submittedWords, score, cards) {
  // Step 0: the game will not be over after the first turn
  if (submittedWords.length < 2) return false;

  // Step 1: Check if we have 6 words submitted
  if (submittedWords.length >= 6) return true;

  // Step 2: Check for a perfect game
  if (score >= 32) return true;

  // Step 3: Check if there are any possible moves left
  const currentCardStacks = getCurrentCardStacks(cards);

  for (let i = minimumWordLength; i <= maximumWordLength; i++) {
    const iLetterWords = generateAllPossibleWords(currentCardStacks, i);
    for (let word of iLetterWords) {
      if (wordIsValid(word)) {
        return false;
      }
    }
  }
  return true;
}

export function getCurrentCardStacks(cards) {
  // Figure out how many cells in the grid there are:
  const maxCellIndex = Math.max(...cards.map(c => c.cellIndex));

  // Stacks will be pushed to the following array:
  const currentStacksOnBoard = [];

  // Itterate to find each of those cells and the stack contained within.
  for (let i = 0; i <= maxCellIndex; i++) {
    const cardsInCurrentCell = cards
      .filter(c => c.cellIndex === i && c.cardStatus !== 'submitted')
      .sort((a, b) => a.stackIndex - b.stackIndex);

    const lettersStacksinCurrentCell = cardsInCurrentCell.map(c => c.letter)
    if (lettersStacksinCurrentCell.length > 0) currentStacksOnBoard.push(lettersStacksinCurrentCell);
  }

  return currentStacksOnBoard;
}

export function generateAllPossibleWords(gameboardLetters, wordLength) {
  const results = [];

  function recursiveWordBuilder(currentWord, availableLetters) {
    if (currentWord.length === wordLength) {
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

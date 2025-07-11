export let validWordsByLength = {};
let wordsLoaded = false;

export async function loadWords() {
  try {
    const response = await fetch('/valid-words-by-length.json');
    if (!response.ok) throw new Error('Failed to load word list');

    const wordData = await response.json();

    // Convert all words to uppercase for consistent checks (optional)
    for (const length in wordData) {
      wordData[length] = wordData[length].map(word => word.toUpperCase());
    }

    validWordsByLength = wordData;
    wordsLoaded = true;
  } catch (error) {
    console.error('Error loading words:', error);
  }
}


export function wordIsValid(word) {
  const validWords = validWordsByLength[word.length] || [];
  return validWords.includes(word.toUpperCase());
}
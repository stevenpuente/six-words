let GENERATE_WORDS_BY_LENGTH = {};

async function generateWords() {
  try {
    const response = await fetch('generate_words_by_length.json');
    if (!response.ok) throw new Error('Failed to load generation words');

    const wordData = await response.json();

    // Normalize to uppercase
    for (const length in wordData) {
      wordData[length] = wordData[length].map(word => word.toUpperCase());
    }

    GENERATE_WORDS_BY_LENGTH = wordData;
    console.log("Generation words loaded:", GENERATE_WORDS_BY_LENGTH);
  } catch (error) {
    console.error("Error loading generation words:", error);
  }
}



// LATEST ADDITIONS:


// Helper: Pick a random word of given length
function pickRandomWord(wordsByLength, length) {
  const list = wordsByLength[length];
  if (!list || list.length === 0) {
    throw new Error(`No words found of length ${length}`);
  }
  return list[Math.floor(Math.random() * list.length)].toUpperCase();
}

// Helper: Shuffle an array in place (Fisher-Yates)
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Main: Generate a random game board
function generateRandomBoard() {
  if (!GENERATE_WORDS_BY_LENGTH || Object.keys(GENERATE_WORDS_BY_LENGTH).length === 0) {
    throw new Error("Word list not loaded");
  }

  // Step 1: Pick 6 total words
  const blueWords = [
    pickRandomWord(GENERATE_WORDS_BY_LENGTH, 5),
    pickRandomWord(GENERATE_WORDS_BY_LENGTH, 5),
  ];

  const greenWords = [
    pickRandomWord(GENERATE_WORDS_BY_LENGTH, 4),
    pickRandomWord(GENERATE_WORDS_BY_LENGTH, 6),
  ];

  const splitWords = [
    pickRandomWord(GENERATE_WORDS_BY_LENGTH, 7),
    pickRandomWord(GENERATE_WORDS_BY_LENGTH, 5),
  ];

  // Step 2: Combine letters from split words and divide evenly
  const combinedSplitLetters = [...splitWords[0], ...splitWords[1]]; // 12 letters total
  shuffle(combinedSplitLetters);

  const splitToBlue = combinedSplitLetters.slice(0, 6);
  const splitToGreen = combinedSplitLetters.slice(6); // remaining 6

  // Step 3: Build final letter arrays
  let blueLetters = [
    ...blueWords[0],
    ...blueWords[1],
    ...splitToBlue
  ];

  let greenLetters = [
    ...greenWords[0],
    ...greenWords[1],
    ...splitToGreen
  ];

  // Validation check
  if (blueLetters.length !== 16 || greenLetters.length !== 16) {
    throw new Error(`Unexpected letter count. Blue: ${blueLetters.length}, Green: ${greenLetters.length}`);
  }

  shuffle(blueLetters);
  shuffle(greenLetters);

  // Step 4: Combine into [top, bottom] card pairs
  const pairs = [];
  for (let i = 0; i < 16; i++) {
    pairs.push([greenLetters[i], blueLetters[i]]);
  }

  return {
    board: shuffle(pairs),
    wordsUsed: {
      green: greenWords,
      blue: blueWords,
      split: splitWords
    }
  };
}
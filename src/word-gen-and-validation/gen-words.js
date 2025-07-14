const base = import.meta.env.BASE_URL;

export let generateWordsByLength = {};
// PSUEDO RANDOM VARIABLES:
const seed = getSeedFromDate();
const rng = mulberry32(seed);

export async function generateWords() {
  try {
    const response = await fetch(base + 'generate-words-by-length.json');
    if (!response.ok) throw new Error('Failed to load generation words');

    const wordData = await response.json();

    // Normalize to uppercase
    for (const length in wordData) {
      wordData[length] = wordData[length].map(word => word.toUpperCase());
    }

    generateWordsByLength = wordData;
  } catch (error) {
    console.error("Error loading generation words:", error);
  }
}
// === HELPERS ===

export function pickRandomWord(wordsByLength, length) {
  const list = wordsByLength[length];
  if (!list || list.length === 0) {
    throw new Error(`No words found of length ${length}`);
  }
  return list[Math.floor(rng() * list.length)].toUpperCase();
}
export function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
export function generateRandomBoard() {
  if (!generateWordsByLength || Object.keys(generateWordsByLength).length === 0) {
    throw new Error("Word list not loaded");
  }

  // Step 1: Pick 6 total words
  const blueWords = [
    pickRandomWord(generateWordsByLength, 5),
    pickRandomWord(generateWordsByLength, 5),
  ];

  const greenWords = [
    pickRandomWord(generateWordsByLength, 4),
    pickRandomWord(generateWordsByLength, 6),
  ];

  const splitWords = [
    pickRandomWord(generateWordsByLength, 7),
    pickRandomWord(generateWordsByLength, 5),
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
export function mulberry32(seed) {
  return function () {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function getSeedFromDate(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return parseInt(`${year}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}`, 10);
}

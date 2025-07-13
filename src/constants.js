export const minimumWordLength = 2;
export const maximumWordLength = 16;

// Date & Puzzle Number Logic
const today = new Date();
const puzzleStartDate = new Date('2025-07-14');
const dayDiff = Math.floor((today - puzzleStartDate) / (1000 * 60 * 60 * 24));
export const textPuzzleNumber = (dayDiff + 1).toString();


export const textDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
});


export const modalTypes = {
    WELCOME: 'WELCOME',
    LANDSCAPE_WARNING: 'LANDSCAPE_WARNING',
    GAME_OVER: 'GAME_OVER',
    CONFIRM_RESET: 'GAME_RESET',
    INSTRUCTIONS: 'INSTRUCTIONS',
    STATS: 'STATS',
}
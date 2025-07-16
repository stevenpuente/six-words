import { getPacificDateString } from "./word-gen-and-validation/gen-words";

// === CONSTANTS ===
export const minimumWordLength = 2;
export const maximumWordLength = 16;

// Date & Puzzle Number Logic
const puzzleStartDate = '2025-07-24';
const [sy, sm, sd] = puzzleStartDate.split('-').map(Number);
const startUTCms = Date.UTC(sy, sm - 1, sd);

const [ty, tm, td] = getPacificDateString().split('-').map(Number);
const todayUTCms = Date.UTC(ty, tm - 1, td);

const msPerDay = 24 * 60 * 60 * 1000;
const dayDiff = Math.floor((todayUTCms - startUTCms) / msPerDay);

export const textPuzzleNumber = String(dayDiff + 1);
export const textDate = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
}).format(new Date());

export const modalTypes = {
    WELCOME: 'WELCOME',
    LANDSCAPE_WARNING: 'LANDSCAPE_WARNING',
    GAME_OVER: 'GAME_OVER',
    CONFIRM_RESET: 'GAME_RESET',
    INSTRUCTIONS: 'INSTRUCTIONS',
    STATS: 'STATS',
};
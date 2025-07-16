// === CONSTANTS ===
export const minimumWordLength = 2;
export const maximumWordLength = 16;

function getPacificDateString(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);

  return parts
    .filter(p => p.type === 'year' || p.type === 'month' || p.type === 'day')
    .map(p => p.value)
    .join('-');
}

const PUZZLE_START = '2025-07-14';
const [sy, sm, sd] = PUZZLE_START.split('-').map(Number);
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

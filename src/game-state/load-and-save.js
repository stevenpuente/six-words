import { getPacificDateString } from "../word-gen-and-validation/gen-words";
import { getCurrentState } from "./game-state";

// Save state to localStorage
export function saveGameState() {
    const currentState = getCurrentState();
    const stateToSave = {
        ...currentState,
    };
    localStorage.setItem('savedGameState', JSON.stringify(stateToSave));
}

// Load state from localStorage
export function loadSavedGameState() {
    const savedRaw = localStorage.getItem('savedGameState');
    if (!savedRaw) return null;
    try {
        const saved = JSON.parse(savedRaw);
        if (saved.puzzleDate !== getPacificDateString()) return null;
        return saved;
    } catch (e) {
        console.error("Failed to parse saved game state:", e);
        return null;
    }
}
import { GamePokemon } from '../data/pokemon';

const SAVE_KEY = 'pokemon-save-v4';

export interface SaveData {
  playerName: string;
  party: GamePokemon[];
  pc: GamePokemon[];
  items: { id: string; count: number }[];
  money: number;
  badges: string[];
  currentMap: string;
  playerX: number;
  playerY: number;
  visitedMaps: string[];
  pokedexSeen: number[];
  pokedexCaught: number[];
}

export function saveGame(data: SaveData): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save game:', e);
  }
}

export function loadGame(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SaveData;
  } catch (e) {
    console.warn('Failed to load save:', e);
    return null;
  }
}

export function hasSaveData(): boolean {
  return localStorage.getItem(SAVE_KEY) !== null;
}

export function deleteSave(): void {
  localStorage.removeItem(SAVE_KEY);
}

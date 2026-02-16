// Pokemon RPG Game Data

export type PokemonType = 'fire' | 'water' | 'grass' | 'normal';

export interface MoveData {
  name: string;
  type: PokemonType;
  power: number;
  accuracy: number;
  learnLevel: number;
}

export interface PokemonSpecies {
  id: number;
  name: string;
  type: PokemonType;
  baseHP: number;
  baseATK: number;
  baseDEF: number;
  baseSPD: number;
  moves: MoveData[];
  encounterRate: number; // weight for wild encounters
  minLevel: number;
  maxLevel: number;
  color: string; // primary sprite color
  color2: string; // secondary sprite color
}

export interface PokemonInstance {
  speciesId: number;
  nickname?: string;
  level: number;
  xp: number;
  currentHP: number;
  maxHP: number;
  atk: number;
  def: number;
  spd: number;
  moves: MoveData[];
}

export interface GameState {
  phase: 'starter' | 'overworld' | 'battle';
  team: PokemonInstance[];
  bag: { potions: number; pokeballs: number };
  playerX: number;
  playerY: number;
  defeatedCount: number;
  caughtCount: number;
}

// Type effectiveness multipliers
export function getTypeMultiplier(atkType: PokemonType, defType: PokemonType): number {
  if (atkType === 'normal' || defType === 'normal') return 1;
  if (atkType === 'fire' && defType === 'grass') return 2;
  if (atkType === 'grass' && defType === 'water') return 2;
  if (atkType === 'water' && defType === 'fire') return 2;
  if (atkType === 'fire' && defType === 'water') return 0.5;
  if (atkType === 'water' && defType === 'grass') return 0.5;
  if (atkType === 'grass' && defType === 'fire') return 0.5;
  return 1;
}

export function xpForLevel(level: number): number {
  return Math.floor(level * level * 10);
}

export function calcStat(base: number, level: number): number {
  return Math.floor(base + (base * level) / 50);
}

export function calcHP(base: number, level: number): number {
  return Math.floor(base + (base * level) / 25 + 10);
}

export function createPokemon(speciesId: number, level: number): PokemonInstance {
  const species = POKEDEX[speciesId];
  const moves = species.moves.filter(m => m.learnLevel <= level).slice(-4);
  const maxHP = calcHP(species.baseHP, level);
  return {
    speciesId,
    level,
    xp: 0,
    currentHP: maxHP,
    maxHP,
    atk: calcStat(species.baseATK, level),
    def: calcStat(species.baseDEF, level),
    spd: calcStat(species.baseSPD, level),
    moves,
  };
}

export function recalcStats(p: PokemonInstance): PokemonInstance {
  const species = POKEDEX[p.speciesId];
  const maxHP = calcHP(species.baseHP, p.level);
  const hpDiff = maxHP - p.maxHP;
  return {
    ...p,
    maxHP,
    currentHP: Math.min(p.currentHP + Math.max(0, hpDiff), maxHP),
    atk: calcStat(species.baseATK, p.level),
    def: calcStat(species.baseDEF, p.level),
    spd: calcStat(species.baseSPD, p.level),
    moves: species.moves.filter(m => m.learnLevel <= p.level).slice(-4),
  };
}

export const POKEDEX: Record<number, PokemonSpecies> = {
  1: {
    id: 1, name: 'Flameling', type: 'fire',
    baseHP: 45, baseATK: 52, baseDEF: 43, baseSPD: 65,
    moves: [
      { name: 'Tackle', type: 'normal', power: 40, accuracy: 100, learnLevel: 1 },
      { name: 'Ember', type: 'fire', power: 40, accuracy: 100, learnLevel: 1 },
      { name: 'Fire Fang', type: 'fire', power: 65, accuracy: 95, learnLevel: 7 },
      { name: 'Inferno', type: 'fire', power: 100, accuracy: 80, learnLevel: 15 },
    ],
    encounterRate: 0, minLevel: 5, maxLevel: 5, color: '#ef4444', color2: '#fbbf24',
  },
  2: {
    id: 2, name: 'Tidalin', type: 'water',
    baseHP: 50, baseATK: 48, baseDEF: 50, baseSPD: 55,
    moves: [
      { name: 'Tackle', type: 'normal', power: 40, accuracy: 100, learnLevel: 1 },
      { name: 'Water Gun', type: 'water', power: 40, accuracy: 100, learnLevel: 1 },
      { name: 'Aqua Jet', type: 'water', power: 60, accuracy: 95, learnLevel: 7 },
      { name: 'Hydro Pump', type: 'water', power: 110, accuracy: 75, learnLevel: 15 },
    ],
    encounterRate: 0, minLevel: 5, maxLevel: 5, color: '#3b82f6', color2: '#93c5fd',
  },
  3: {
    id: 3, name: 'Leafeon', type: 'grass',
    baseHP: 48, baseATK: 49, baseDEF: 55, baseSPD: 51,
    moves: [
      { name: 'Tackle', type: 'normal', power: 40, accuracy: 100, learnLevel: 1 },
      { name: 'Vine Whip', type: 'grass', power: 40, accuracy: 100, learnLevel: 1 },
      { name: 'Razor Leaf', type: 'grass', power: 60, accuracy: 95, learnLevel: 7 },
      { name: 'Solar Beam', type: 'grass', power: 120, accuracy: 85, learnLevel: 15 },
    ],
    encounterRate: 0, minLevel: 5, maxLevel: 5, color: '#22c55e', color2: '#86efac',
  },
  4: {
    id: 4, name: 'Sparkrat', type: 'normal',
    baseHP: 35, baseATK: 40, baseDEF: 30, baseSPD: 70,
    moves: [
      { name: 'Scratch', type: 'normal', power: 35, accuracy: 100, learnLevel: 1 },
      { name: 'Quick Attack', type: 'normal', power: 45, accuracy: 100, learnLevel: 4 },
      { name: 'Slam', type: 'normal', power: 65, accuracy: 90, learnLevel: 10 },
    ],
    encounterRate: 25, minLevel: 2, maxLevel: 6, color: '#a78bfa', color2: '#e9d5ff',
  },
  5: {
    id: 5, name: 'Emberpup', type: 'fire',
    baseHP: 40, baseATK: 50, baseDEF: 35, baseSPD: 60,
    moves: [
      { name: 'Tackle', type: 'normal', power: 40, accuracy: 100, learnLevel: 1 },
      { name: 'Ember', type: 'fire', power: 40, accuracy: 100, learnLevel: 3 },
      { name: 'Flame Charge', type: 'fire', power: 55, accuracy: 100, learnLevel: 8 },
    ],
    encounterRate: 15, minLevel: 3, maxLevel: 7, color: '#f97316', color2: '#fdba74',
  },
  6: {
    id: 6, name: 'Bubblefin', type: 'water',
    baseHP: 42, baseATK: 38, baseDEF: 45, baseSPD: 55,
    moves: [
      { name: 'Tackle', type: 'normal', power: 40, accuracy: 100, learnLevel: 1 },
      { name: 'Bubble', type: 'water', power: 35, accuracy: 100, learnLevel: 2 },
      { name: 'Water Pulse', type: 'water', power: 55, accuracy: 95, learnLevel: 8 },
    ],
    encounterRate: 15, minLevel: 3, maxLevel: 7, color: '#06b6d4', color2: '#67e8f9',
  },
  7: {
    id: 7, name: 'Thornbud', type: 'grass',
    baseHP: 44, baseATK: 42, baseDEF: 48, baseSPD: 45,
    moves: [
      { name: 'Tackle', type: 'normal', power: 40, accuracy: 100, learnLevel: 1 },
      { name: 'Absorb', type: 'grass', power: 30, accuracy: 100, learnLevel: 2 },
      { name: 'Razor Leaf', type: 'grass', power: 60, accuracy: 95, learnLevel: 9 },
    ],
    encounterRate: 15, minLevel: 3, maxLevel: 7, color: '#16a34a', color2: '#4ade80',
  },
  8: {
    id: 8, name: 'Cindermoth', type: 'fire',
    baseHP: 38, baseATK: 55, baseDEF: 32, baseSPD: 72,
    moves: [
      { name: 'Scratch', type: 'normal', power: 35, accuracy: 100, learnLevel: 1 },
      { name: 'Ember', type: 'fire', power: 40, accuracy: 100, learnLevel: 1 },
      { name: 'Fire Spin', type: 'fire', power: 50, accuracy: 90, learnLevel: 6 },
      { name: 'Flame Burst', type: 'fire', power: 70, accuracy: 90, learnLevel: 12 },
    ],
    encounterRate: 10, minLevel: 5, maxLevel: 10, color: '#dc2626', color2: '#fca5a5',
  },
  9: {
    id: 9, name: 'Ripplecrab', type: 'water',
    baseHP: 50, baseATK: 52, baseDEF: 60, baseSPD: 35,
    moves: [
      { name: 'Vice Grip', type: 'normal', power: 50, accuracy: 100, learnLevel: 1 },
      { name: 'Bubble', type: 'water', power: 35, accuracy: 100, learnLevel: 3 },
      { name: 'Crabhammer', type: 'water', power: 75, accuracy: 85, learnLevel: 10 },
    ],
    encounterRate: 10, minLevel: 5, maxLevel: 10, color: '#7c3aed', color2: '#c4b5fd',
  },
  10: {
    id: 10, name: 'Mossquito', type: 'grass',
    baseHP: 36, baseATK: 48, baseDEF: 34, baseSPD: 68,
    moves: [
      { name: 'Tackle', type: 'normal', power: 40, accuracy: 100, learnLevel: 1 },
      { name: 'Absorb', type: 'grass', power: 30, accuracy: 100, learnLevel: 1 },
      { name: 'Mega Drain', type: 'grass', power: 55, accuracy: 100, learnLevel: 7 },
      { name: 'Leaf Blade', type: 'grass', power: 75, accuracy: 95, learnLevel: 13 },
    ],
    encounterRate: 10, minLevel: 5, maxLevel: 10, color: '#65a30d', color2: '#bef264',
  },
  11: {
    id: 11, name: 'Fangpaw', type: 'normal',
    baseHP: 50, baseATK: 55, baseDEF: 45, baseSPD: 55,
    moves: [
      { name: 'Bite', type: 'normal', power: 50, accuracy: 100, learnLevel: 1 },
      { name: 'Quick Attack', type: 'normal', power: 45, accuracy: 100, learnLevel: 4 },
      { name: 'Slash', type: 'normal', power: 65, accuracy: 95, learnLevel: 9 },
      { name: 'Hyper Fang', type: 'normal', power: 80, accuracy: 90, learnLevel: 14 },
    ],
    encounterRate: 12, minLevel: 4, maxLevel: 9, color: '#78716c', color2: '#d6d3d1',
  },
  12: {
    id: 12, name: 'Blazetail', type: 'fire',
    baseHP: 55, baseATK: 65, baseDEF: 50, baseSPD: 70,
    moves: [
      { name: 'Scratch', type: 'normal', power: 35, accuracy: 100, learnLevel: 1 },
      { name: 'Ember', type: 'fire', power: 40, accuracy: 100, learnLevel: 1 },
      { name: 'Fire Fang', type: 'fire', power: 65, accuracy: 95, learnLevel: 8 },
      { name: 'Flamethrower', type: 'fire', power: 90, accuracy: 95, learnLevel: 16 },
    ],
    encounterRate: 5, minLevel: 8, maxLevel: 14, color: '#b91c1c', color2: '#fde047',
  },
  13: {
    id: 13, name: 'Torrenteel', type: 'water',
    baseHP: 55, baseATK: 60, baseDEF: 55, baseSPD: 62,
    moves: [
      { name: 'Tackle', type: 'normal', power: 40, accuracy: 100, learnLevel: 1 },
      { name: 'Water Gun', type: 'water', power: 40, accuracy: 100, learnLevel: 1 },
      { name: 'Aqua Tail', type: 'water', power: 70, accuracy: 90, learnLevel: 9 },
      { name: 'Surf', type: 'water', power: 90, accuracy: 95, learnLevel: 16 },
    ],
    encounterRate: 5, minLevel: 8, maxLevel: 14, color: '#1d4ed8', color2: '#60a5fa',
  },
  14: {
    id: 14, name: 'Vineraptor', type: 'grass',
    baseHP: 52, baseATK: 62, baseDEF: 52, baseSPD: 60,
    moves: [
      { name: 'Scratch', type: 'normal', power: 35, accuracy: 100, learnLevel: 1 },
      { name: 'Vine Whip', type: 'grass', power: 40, accuracy: 100, learnLevel: 1 },
      { name: 'Leaf Blade', type: 'grass', power: 75, accuracy: 95, learnLevel: 9 },
      { name: 'Power Whip', type: 'grass', power: 100, accuracy: 85, learnLevel: 16 },
    ],
    encounterRate: 5, minLevel: 8, maxLevel: 14, color: '#15803d', color2: '#a3e635',
  },
  15: {
    id: 15, name: 'Fluffnugget', type: 'normal',
    baseHP: 60, baseATK: 35, baseDEF: 55, baseSPD: 40,
    moves: [
      { name: 'Tackle', type: 'normal', power: 40, accuracy: 100, learnLevel: 1 },
      { name: 'Headbutt', type: 'normal', power: 55, accuracy: 95, learnLevel: 5 },
      { name: 'Body Slam', type: 'normal', power: 75, accuracy: 90, learnLevel: 11 },
    ],
    encounterRate: 18, minLevel: 2, maxLevel: 6, color: '#fbbf24', color2: '#fef3c7',
  },
  16: {
    id: 16, name: 'Scorchion', type: 'fire',
    baseHP: 48, baseATK: 58, baseDEF: 55, baseSPD: 50,
    moves: [
      { name: 'Sting', type: 'normal', power: 45, accuracy: 100, learnLevel: 1 },
      { name: 'Ember', type: 'fire', power: 40, accuracy: 100, learnLevel: 3 },
      { name: 'Fire Fang', type: 'fire', power: 65, accuracy: 95, learnLevel: 8 },
      { name: 'Lava Plume', type: 'fire', power: 80, accuracy: 95, learnLevel: 14 },
    ],
    encounterRate: 8, minLevel: 6, maxLevel: 11, color: '#ea580c', color2: '#451a03',
  },
};

// Tile types for the map
export const TILE = {
  GRASS_PATH: 0,
  TALL_GRASS: 1,
  WATER: 2,
  TREE: 3,
  BUILDING: 4,
  DOOR: 5,
  PATH: 6,
  FLOWER: 7,
  FENCE: 8,
  SIGN: 9,
} as const;

export const TILE_COLORS: Record<number, string> = {
  [TILE.GRASS_PATH]: '#2d5016',
  [TILE.TALL_GRASS]: '#15803d',
  [TILE.WATER]: '#1e40af',
  [TILE.TREE]: '#14532d',
  [TILE.BUILDING]: '#44403c',
  [TILE.DOOR]: '#92400e',
  [TILE.PATH]: '#a8a29e',
  [TILE.FLOWER]: '#2d5016',
  [TILE.FENCE]: '#78350f',
  [TILE.SIGN]: '#78716c',
};

export const WALKABLE = new Set<number>([TILE.GRASS_PATH, TILE.TALL_GRASS, TILE.PATH, TILE.FLOWER, TILE.DOOR]);

// 30x20 map
// T = town area with buildings/paths
// G = tall grass encounter zone
// W = water decoration
// F = forest/trees
export const GAME_MAP: number[][] = [
  // Row 0
  [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
  // Row 1
  [3,3,2,2,2,2,3,3,3,3,1,1,1,1,1,3,3,3,1,1,1,1,1,1,3,3,3,3,3,3],
  // Row 2
  [3,2,2,2,2,2,2,3,3,1,1,1,1,1,1,1,3,1,1,1,1,1,1,1,1,3,3,3,3,3],
  // Row 3
  [3,2,2,2,2,2,2,3,1,1,1,1,0,0,1,1,1,1,1,0,0,1,1,1,1,1,3,3,3,3],
  // Row 4
  [3,3,2,2,2,2,3,3,1,1,1,0,0,6,0,1,1,1,0,0,6,0,1,1,1,1,1,3,3,3],
  // Row 5
  [3,3,3,2,2,3,3,0,0,1,0,0,6,6,6,0,0,0,0,6,6,6,0,0,1,1,1,1,3,3],
  // Row 6
  [3,3,3,3,0,0,0,0,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,0,1,1,1,3,3],
  // Row 7
  [3,3,4,4,4,4,8,0,6,6,6,4,4,4,4,8,6,6,6,4,4,4,4,6,6,0,1,1,3,3],
  // Row 8
  [3,3,4,4,4,4,8,0,6,6,6,4,4,4,4,8,6,6,6,4,4,4,4,6,6,6,0,3,3,3],
  // Row 9
  [3,3,4,4,4,4,8,0,6,6,6,4,4,5,4,8,6,6,6,4,4,5,4,6,6,6,0,3,3,3],
  // Row 10 - main road
  [3,0,0,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,0,3],
  // Row 11
  [3,0,7,0,0,0,0,0,6,6,6,0,0,0,0,0,6,9,6,0,0,0,0,6,6,6,0,0,0,3],
  // Row 12
  [3,0,0,0,4,4,4,8,0,6,0,0,7,0,7,0,0,6,0,0,7,0,0,0,1,1,1,1,0,3],
  // Row 13
  [3,3,0,0,4,4,4,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,3],
  // Row 14
  [3,3,0,0,4,5,4,8,0,0,7,0,0,7,0,0,7,0,0,0,7,0,1,1,1,1,1,1,3,3],
  // Row 15
  [3,3,3,0,0,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,3,3,3],
  // Row 16
  [3,3,3,3,0,6,0,0,7,0,0,7,0,0,7,0,0,7,0,0,1,1,1,1,1,1,3,3,3,3],
  // Row 17
  [3,3,3,3,3,6,6,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,3,3,3,3,3,3],
  // Row 18
  [3,3,3,3,3,3,3,3,3,0,0,0,0,0,0,0,0,0,3,3,3,3,3,3,3,3,3,3,3,3],
  // Row 19
  [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
];

export const STARTER_POS = { x: 13, y: 10 };

export function getEncounterPool(): { speciesId: number; weight: number }[] {
  return Object.values(POKEDEX)
    .filter(s => s.encounterRate > 0)
    .map(s => ({ speciesId: s.id, weight: s.encounterRate }));
}

export function rollEncounter(): PokemonInstance | null {
  const pool = getEncounterPool();
  const totalWeight = pool.reduce((s, p) => s + p.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const entry of pool) {
    roll -= entry.weight;
    if (roll <= 0) {
      const species = POKEDEX[entry.speciesId];
      const level = species.minLevel + Math.floor(Math.random() * (species.maxLevel - species.minLevel + 1));
      return createPokemon(entry.speciesId, level);
    }
  }
  return null;
}

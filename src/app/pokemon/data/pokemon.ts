export interface PokemonData {
  id: number;
  name: string;
  types: string[];
  baseStats: {
    hp: number;
    atk: number;
    def: number;
    spAtk: number;
    spDef: number;
    speed: number;
  };
  catchRate: number;
  expYield: number;
  levelUpMoves: { level: number; move: string }[];
  evolutionLevel?: number;
  evolvesTo?: number;
}

export const POKEMON_DATA: Record<number, PokemonData> = {
  1: {
    id: 1, name: 'Bulbasaur', types: ['Grass', 'Poison'],
    baseStats: { hp: 45, atk: 49, def: 49, spAtk: 65, spDef: 65, speed: 45 },
    catchRate: 45, expYield: 64,
    levelUpMoves: [
      { level: 1, move: 'Tackle' },
      { level: 1, move: 'Growl' },
      { level: 7, move: 'Vine Whip' },
      { level: 13, move: 'Poison Powder' },
      { level: 15, move: 'Sleep Powder' },
    ],
    evolutionLevel: 16, evolvesTo: 2,
  },
  2: {
    id: 2, name: 'Ivysaur', types: ['Grass', 'Poison'],
    baseStats: { hp: 60, atk: 62, def: 63, spAtk: 80, spDef: 80, speed: 60 },
    catchRate: 45, expYield: 142,
    levelUpMoves: [
      { level: 1, move: 'Tackle' },
      { level: 1, move: 'Growl' },
      { level: 1, move: 'Vine Whip' },
    ],
    evolutionLevel: 32, evolvesTo: 3,
  },
  3: {
    id: 3, name: 'Venusaur', types: ['Grass', 'Poison'],
    baseStats: { hp: 80, atk: 82, def: 83, spAtk: 100, spDef: 100, speed: 80 },
    catchRate: 45, expYield: 236,
    levelUpMoves: [
      { level: 1, move: 'Tackle' },
      { level: 1, move: 'Growl' },
      { level: 1, move: 'Vine Whip' },
    ],
  },
  4: {
    id: 4, name: 'Charmander', types: ['Fire'],
    baseStats: { hp: 39, atk: 52, def: 43, spAtk: 60, spDef: 50, speed: 65 },
    catchRate: 45, expYield: 62,
    levelUpMoves: [
      { level: 1, move: 'Scratch' },
      { level: 1, move: 'Growl' },
      { level: 7, move: 'Ember' },
      { level: 13, move: 'Quick Attack' },
    ],
    evolutionLevel: 16, evolvesTo: 5,
  },
  5: {
    id: 5, name: 'Charmeleon', types: ['Fire'],
    baseStats: { hp: 58, atk: 64, def: 58, spAtk: 80, spDef: 65, speed: 80 },
    catchRate: 45, expYield: 142,
    levelUpMoves: [
      { level: 1, move: 'Scratch' },
      { level: 1, move: 'Growl' },
      { level: 1, move: 'Ember' },
    ],
    evolutionLevel: 36, evolvesTo: 6,
  },
  6: {
    id: 6, name: 'Charizard', types: ['Fire', 'Flying'],
    baseStats: { hp: 78, atk: 84, def: 78, spAtk: 109, spDef: 85, speed: 100 },
    catchRate: 45, expYield: 240,
    levelUpMoves: [
      { level: 1, move: 'Scratch' },
      { level: 1, move: 'Growl' },
      { level: 1, move: 'Ember' },
      { level: 1, move: 'Wing Attack' },
    ],
  },
  7: {
    id: 7, name: 'Squirtle', types: ['Water'],
    baseStats: { hp: 44, atk: 48, def: 65, spAtk: 50, spDef: 64, speed: 43 },
    catchRate: 45, expYield: 63,
    levelUpMoves: [
      { level: 1, move: 'Tackle' },
      { level: 1, move: 'Tail Whip' },
      { level: 7, move: 'Water Gun' },
      { level: 13, move: 'Bite' },
    ],
    evolutionLevel: 16, evolvesTo: 8,
  },
  8: {
    id: 8, name: 'Wartortle', types: ['Water'],
    baseStats: { hp: 59, atk: 63, def: 80, spAtk: 65, spDef: 80, speed: 58 },
    catchRate: 45, expYield: 142,
    levelUpMoves: [
      { level: 1, move: 'Tackle' },
      { level: 1, move: 'Tail Whip' },
      { level: 1, move: 'Water Gun' },
    ],
    evolutionLevel: 36, evolvesTo: 9,
  },
  9: {
    id: 9, name: 'Blastoise', types: ['Water'],
    baseStats: { hp: 79, atk: 83, def: 100, spAtk: 85, spDef: 105, speed: 78 },
    catchRate: 45, expYield: 239,
    levelUpMoves: [
      { level: 1, move: 'Tackle' },
      { level: 1, move: 'Tail Whip' },
      { level: 1, move: 'Water Gun' },
      { level: 1, move: 'Bite' },
    ],
  },
  16: {
    id: 16, name: 'Pidgey', types: ['Normal', 'Flying'],
    baseStats: { hp: 40, atk: 45, def: 40, spAtk: 35, spDef: 35, speed: 56 },
    catchRate: 255, expYield: 50,
    levelUpMoves: [
      { level: 1, move: 'Tackle' },
      { level: 5, move: 'Gust' },
      { level: 9, move: 'Quick Attack' },
    ],
    evolutionLevel: 18, evolvesTo: 17,
  },
  17: {
    id: 17, name: 'Pidgeotto', types: ['Normal', 'Flying'],
    baseStats: { hp: 63, atk: 60, def: 55, spAtk: 50, spDef: 50, speed: 71 },
    catchRate: 120, expYield: 122,
    levelUpMoves: [
      { level: 1, move: 'Tackle' },
      { level: 1, move: 'Gust' },
      { level: 1, move: 'Quick Attack' },
      { level: 21, move: 'Wing Attack' },
    ],
    evolutionLevel: 36, evolvesTo: 18,
  },
  18: {
    id: 18, name: 'Pidgeot', types: ['Normal', 'Flying'],
    baseStats: { hp: 83, atk: 80, def: 75, spAtk: 70, spDef: 70, speed: 101 },
    catchRate: 45, expYield: 216,
    levelUpMoves: [
      { level: 1, move: 'Tackle' },
      { level: 1, move: 'Gust' },
      { level: 1, move: 'Quick Attack' },
      { level: 1, move: 'Wing Attack' },
    ],
  },
  19: {
    id: 19, name: 'Rattata', types: ['Normal'],
    baseStats: { hp: 30, atk: 56, def: 35, spAtk: 25, spDef: 35, speed: 72 },
    catchRate: 255, expYield: 51,
    levelUpMoves: [
      { level: 1, move: 'Tackle' },
      { level: 1, move: 'Tail Whip' },
      { level: 7, move: 'Quick Attack' },
      { level: 14, move: 'Hyper Fang' },
      { level: 10, move: 'Bite' },
    ],
    evolutionLevel: 20, evolvesTo: 20,
  },
  20: {
    id: 20, name: 'Raticate', types: ['Normal'],
    baseStats: { hp: 55, atk: 81, def: 60, spAtk: 50, spDef: 70, speed: 97 },
    catchRate: 127, expYield: 145,
    levelUpMoves: [
      { level: 1, move: 'Tackle' },
      { level: 1, move: 'Tail Whip' },
      { level: 1, move: 'Quick Attack' },
      { level: 1, move: 'Hyper Fang' },
    ],
  },
  21: {
    id: 21, name: 'Spearow', types: ['Normal', 'Flying'],
    baseStats: { hp: 40, atk: 60, def: 30, spAtk: 31, spDef: 31, speed: 70 },
    catchRate: 255, expYield: 52,
    levelUpMoves: [
      { level: 1, move: 'Peck' },
      { level: 1, move: 'Growl' },
      { level: 9, move: 'Quick Attack' },
    ],
    evolutionLevel: 20, evolvesTo: 22,
  },
  22: {
    id: 22, name: 'Fearow', types: ['Normal', 'Flying'],
    baseStats: { hp: 65, atk: 90, def: 65, spAtk: 61, spDef: 61, speed: 100 },
    catchRate: 90, expYield: 155,
    levelUpMoves: [
      { level: 1, move: 'Peck' },
      { level: 1, move: 'Growl' },
      { level: 1, move: 'Quick Attack' },
      { level: 25, move: 'Wing Attack' },
    ],
  },
  25: {
    id: 25, name: 'Pikachu', types: ['Electric'],
    baseStats: { hp: 35, atk: 55, def: 40, spAtk: 50, spDef: 50, speed: 90 },
    catchRate: 190, expYield: 112,
    levelUpMoves: [
      { level: 1, move: 'Thunder Shock' },
      { level: 1, move: 'Growl' },
      { level: 6, move: 'Tail Whip' },
      { level: 11, move: 'Quick Attack' },
    ],
  },
  35: {
    id: 35, name: 'Clefairy', types: ['Normal'],
    baseStats: { hp: 70, atk: 45, def: 48, spAtk: 60, spDef: 65, speed: 35 },
    catchRate: 150, expYield: 68,
    levelUpMoves: [
      { level: 1, move: 'Pound' },
      { level: 1, move: 'Growl' },
    ],
  },
  39: {
    id: 39, name: 'Jigglypuff', types: ['Normal'],
    baseStats: { hp: 115, atk: 45, def: 20, spAtk: 45, spDef: 25, speed: 20 },
    catchRate: 170, expYield: 76,
    levelUpMoves: [
      { level: 1, move: 'Pound' },
      { level: 5, move: 'Growl' },
    ],
  },
  43: {
    id: 43, name: 'Oddish', types: ['Grass', 'Poison'],
    baseStats: { hp: 45, atk: 50, def: 55, spAtk: 75, spDef: 65, speed: 30 },
    catchRate: 255, expYield: 64,
    levelUpMoves: [
      { level: 1, move: 'Tackle' },
      { level: 5, move: 'Poison Powder' },
      { level: 9, move: 'Vine Whip' },
    ],
    evolutionLevel: 21, evolvesTo: 44,
  },
  44: {
    id: 44, name: 'Gloom', types: ['Grass', 'Poison'],
    baseStats: { hp: 60, atk: 65, def: 70, spAtk: 85, spDef: 75, speed: 40 },
    catchRate: 120, expYield: 138,
    levelUpMoves: [
      { level: 1, move: 'Tackle' },
      { level: 1, move: 'Poison Powder' },
      { level: 1, move: 'Vine Whip' },
    ],
  },
  52: {
    id: 52, name: 'Meowth', types: ['Normal'],
    baseStats: { hp: 40, atk: 45, def: 35, spAtk: 40, spDef: 40, speed: 90 },
    catchRate: 255, expYield: 58,
    levelUpMoves: [
      { level: 1, move: 'Scratch' },
      { level: 1, move: 'Growl' },
      { level: 11, move: 'Bite' },
    ],
    evolutionLevel: 28, evolvesTo: 53,
  },
  53: {
    id: 53, name: 'Persian', types: ['Normal'],
    baseStats: { hp: 65, atk: 70, def: 60, spAtk: 65, spDef: 65, speed: 115 },
    catchRate: 90, expYield: 154,
    levelUpMoves: [
      { level: 1, move: 'Scratch' },
      { level: 1, move: 'Growl' },
      { level: 1, move: 'Bite' },
    ],
  },
  54: {
    id: 54, name: 'Psyduck', types: ['Water'],
    baseStats: { hp: 50, atk: 52, def: 48, spAtk: 65, spDef: 50, speed: 55 },
    catchRate: 190, expYield: 64,
    levelUpMoves: [
      { level: 1, move: 'Scratch' },
      { level: 1, move: 'Tail Whip' },
      { level: 10, move: 'Water Gun' },
      { level: 16, move: 'Confusion' },
    ],
    evolutionLevel: 33, evolvesTo: 55,
  },
  55: {
    id: 55, name: 'Golduck', types: ['Water'],
    baseStats: { hp: 80, atk: 82, def: 78, spAtk: 95, spDef: 80, speed: 85 },
    catchRate: 75, expYield: 174,
    levelUpMoves: [
      { level: 1, move: 'Scratch' },
      { level: 1, move: 'Tail Whip' },
      { level: 1, move: 'Water Gun' },
      { level: 1, move: 'Confusion' },
    ],
  },
  56: {
    id: 56, name: 'Mankey', types: ['Fighting'],
    baseStats: { hp: 40, atk: 80, def: 35, spAtk: 35, spDef: 45, speed: 70 },
    catchRate: 190, expYield: 61,
    levelUpMoves: [
      { level: 1, move: 'Scratch' },
      { level: 1, move: 'Growl' },
      { level: 9, move: 'Quick Attack' },
    ],
    evolutionLevel: 28, evolvesTo: 57,
  },
  57: {
    id: 57, name: 'Primeape', types: ['Fighting'],
    baseStats: { hp: 65, atk: 105, def: 60, spAtk: 60, spDef: 70, speed: 95 },
    catchRate: 75, expYield: 159,
    levelUpMoves: [
      { level: 1, move: 'Scratch' },
      { level: 1, move: 'Growl' },
      { level: 1, move: 'Quick Attack' },
    ],
  },
  63: {
    id: 63, name: 'Abra', types: ['Psychic'],
    baseStats: { hp: 25, atk: 20, def: 15, spAtk: 105, spDef: 55, speed: 90 },
    catchRate: 200, expYield: 62,
    levelUpMoves: [
      { level: 1, move: 'Teleport' },
    ],
    evolutionLevel: 16, evolvesTo: 64,
  },
  64: {
    id: 64, name: 'Kadabra', types: ['Psychic'],
    baseStats: { hp: 40, atk: 35, def: 30, spAtk: 120, spDef: 70, speed: 105 },
    catchRate: 100, expYield: 145,
    levelUpMoves: [
      { level: 1, move: 'Teleport' },
      { level: 1, move: 'Confusion' },
    ],
  },
  69: {
    id: 69, name: 'Bellsprout', types: ['Grass', 'Poison'],
    baseStats: { hp: 50, atk: 75, def: 35, spAtk: 70, spDef: 30, speed: 40 },
    catchRate: 255, expYield: 60,
    levelUpMoves: [
      { level: 1, move: 'Vine Whip' },
      { level: 1, move: 'Growl' },
      { level: 13, move: 'Poison Powder' },
      { level: 15, move: 'Sleep Powder' },
    ],
    evolutionLevel: 21, evolvesTo: 70,
  },
  70: {
    id: 70, name: 'Weepinbell', types: ['Grass', 'Poison'],
    baseStats: { hp: 65, atk: 90, def: 50, spAtk: 85, spDef: 45, speed: 55 },
    catchRate: 120, expYield: 151,
    levelUpMoves: [
      { level: 1, move: 'Vine Whip' },
      { level: 1, move: 'Growl' },
      { level: 1, move: 'Poison Powder' },
    ],
  },
};

// Helper to get encounter pool for a route
export const ROUTE_ENCOUNTERS: Record<string, { id: number; minLevel: number; maxLevel: number; weight: number }[]> = {
  route1: [
    { id: 16, minLevel: 2, maxLevel: 5, weight: 45 },  // Pidgey
    { id: 19, minLevel: 2, maxLevel: 4, weight: 55 },  // Rattata
  ],
  route2: [
    { id: 16, minLevel: 3, maxLevel: 6, weight: 30 },  // Pidgey
    { id: 19, minLevel: 3, maxLevel: 6, weight: 25 },  // Rattata
    { id: 21, minLevel: 3, maxLevel: 5, weight: 15 },  // Spearow
    { id: 43, minLevel: 4, maxLevel: 6, weight: 10 },  // Oddish
    { id: 56, minLevel: 4, maxLevel: 6, weight: 10 },  // Mankey
    { id: 63, minLevel: 4, maxLevel: 6, weight: 10 },  // Abra
  ],
};

export interface GamePokemon {
  id: number;
  name: string;
  nickname?: string;
  level: number;
  types: string[];
  currentHp: number;
  maxHp: number;
  stats: {
    hp: number;
    atk: number;
    def: number;
    spAtk: number;
    spDef: number;
    speed: number;
  };
  moves: { name: string; pp: number; maxPp: number }[];
  exp: number;
  expToNext: number;
  status?: 'poison' | 'sleep' | 'paralyze' | 'burn' | 'freeze';
  ivs: {
    hp: number;
    atk: number;
    def: number;
    spAtk: number;
    spDef: number;
    speed: number;
  };
}

export function calculateStat(baseStat: number, iv: number, level: number, isHp: boolean): number {
  if (isHp) {
    return Math.floor(((2 * baseStat + iv) * level) / 100) + level + 10;
  }
  return Math.floor(((2 * baseStat + iv) * level) / 100) + 5;
}

export function expForLevel(level: number): number {
  // Medium-slow growth rate (simplified)
  return Math.floor(level * level * level);
}

export function createPokemon(id: number, level: number): GamePokemon {
  const data = POKEMON_DATA[id];
  if (!data) throw new Error(`Pokemon #${id} not found`);

  const ivs = {
    hp: Math.floor(Math.random() * 32),
    atk: Math.floor(Math.random() * 32),
    def: Math.floor(Math.random() * 32),
    spAtk: Math.floor(Math.random() * 32),
    spDef: Math.floor(Math.random() * 32),
    speed: Math.floor(Math.random() * 32),
  };

  const stats = {
    hp: calculateStat(data.baseStats.hp, ivs.hp, level, true),
    atk: calculateStat(data.baseStats.atk, ivs.atk, level, false),
    def: calculateStat(data.baseStats.def, ivs.def, level, false),
    spAtk: calculateStat(data.baseStats.spAtk, ivs.spAtk, level, false),
    spDef: calculateStat(data.baseStats.spDef, ivs.spDef, level, false),
    speed: calculateStat(data.baseStats.speed, ivs.speed, level, false),
  };

  // Determine moves: get all moves learnable at or below current level
  const learnableMoves = data.levelUpMoves
    .filter(m => m.level <= level)
    .map(m => m.move);

  // Take the last 4 (most recent)
  const moveNames = learnableMoves.slice(-4);
  // Avoid circular import — import dynamically
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  let MOVE_DATA_LOCAL: Record<string, { pp: number }>;
  try {
    MOVE_DATA_LOCAL = require('./moves').MOVE_DATA;
  } catch {
    MOVE_DATA_LOCAL = {};
  }
  const moves = moveNames.map(name => {
    const moveData = MOVE_DATA_LOCAL[name];
    return { name, pp: moveData?.pp || 20, maxPp: moveData?.pp || 20 };
  });

  return {
    id: data.id,
    name: data.name,
    level,
    types: [...data.types],
    currentHp: stats.hp,
    maxHp: stats.hp,
    stats,
    moves,
    exp: expForLevel(level),
    expToNext: expForLevel(level + 1),
    ivs,
  };
}

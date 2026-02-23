// Game constants
export const TILE_SIZE = 16;
export const GAME_WIDTH = typeof window !== 'undefined' ? window.innerWidth : 800;
export const GAME_HEIGHT = typeof window !== 'undefined' ? window.innerHeight : 600;
export const PLAYER_SPEED = 150; // ms per tile movement tween
export const TEXT_SPEED = 30; // ms per character for typewriter
export const FADE_DURATION = 300;

// Colors — Authentic FireRed palette
export const COLORS = {
  // Tiles
  GRASS: 0x78c840,
  GRASS_DARK: 0x5ea832,
  PATH: 0xd4b896,
  TREE_GREEN: 0x2d6b30,
  TREE_DARK: 0x1a4a1d,
  BUILDING_WALL: 0xb8b8b8,
  BUILDING_ROOF: 0xd03030,
  WATER: 0x4888d4,
  WATER_DARK: 0x3070b8,
  TALL_GRASS: 0x48a028,
  TALL_GRASS_DARK: 0x388818,

  // UI — FireRed authentic
  WHITE: 0xffffff,
  BLACK: 0x000000,
  DARK_GRAY: 0x303030,
  LIGHT_GRAY: 0xc0c0c0,
  DIALOG_BG: 0xf8f8f8,
  DIALOG_BORDER: 0x181818,
  PANEL_BG: 0xe8e8e8,
  HP_BAR_BG: 0x383838,

  // HP Bar
  HP_GREEN: 0x20d820,
  HP_YELLOW: 0xf8d020,
  HP_RED: 0xf82020,

  // Status condition pill colors
  STATUS_PSN: 0xa040a0,
  STATUS_SLP: 0x808080,
  STATUS_PAR: 0xf8d030,
  STATUS_BRN: 0xf08030,
  STATUS_FRZ: 0x98d8d8,

  // Types — full authentic map
  FIRE: 0xf08030,
  WATER_TYPE: 0x6890f0,
  GRASS_TYPE: 0x78c850,
  ELECTRIC: 0xf8d030,
  NORMAL: 0xa8a878,
  FIGHTING: 0xc03028,
  POISON: 0xa040a0,
  FLYING: 0xa890f0,
  PSYCHIC: 0xf85888,
  ICE: 0x98d8d8,
  GROUND: 0xe0c068,
  ROCK: 0xb8a038,
  BUG: 0xa8b820,
  GHOST: 0x705898,
  DRAGON: 0x7038f8,
  DARK: 0x705848,
  STEEL: 0xb8b8d0,
  FAIRY: 0xee99ac,

  // Title
  POKEMON_YELLOW: 0xffcb05,
  POKEMON_BLUE: 0x3b4cca,
  TITLE_BG: 0x1a1a2e,

  // Battle
  BATTLE_SKY: 0x88c8e8,
  BATTLE_GROUND: 0x98d868,
  BATTLE_PLATFORM: 0x90c858,
  BATTLE_PLATFORM_DARK: 0x78b848,
  BATTLE_UI_BG: 0xf8f0e0,

  // EXP bar
  EXP_BLUE: 0x40a0f0,
};

// Type effectiveness chart (Gen 1)
export const TYPE_CHART: Record<string, Record<string, number>> = {
  Normal:   { Rock: 0.5, Ghost: 0 },
  Fire:     { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 2, Bug: 2, Rock: 0.5, Dragon: 0.5 },
  Water:    { Fire: 2, Water: 0.5, Grass: 0.5, Ground: 2, Rock: 2, Dragon: 0.5 },
  Electric: { Water: 2, Electric: 0.5, Grass: 0.5, Ground: 0, Flying: 2, Dragon: 0.5 },
  Grass:    { Fire: 0.5, Water: 2, Grass: 0.5, Poison: 0.5, Ground: 2, Flying: 0.5, Bug: 0.5, Rock: 2, Dragon: 0.5 },
  Ice:      { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 0.5, Ground: 2, Flying: 2, Dragon: 2 },
  Fighting: { Normal: 2, Ice: 2, Poison: 0.5, Flying: 0.5, Psychic: 0.5, Bug: 0.5, Rock: 2, Ghost: 0 },
  Poison:   { Grass: 2, Poison: 0.5, Ground: 0.5, Bug: 2, Rock: 0.5, Ghost: 0.5 },
  Ground:   { Fire: 2, Electric: 2, Grass: 0.5, Poison: 2, Flying: 0, Bug: 0.5, Rock: 2 },
  Flying:   { Electric: 0.5, Grass: 2, Fighting: 2, Bug: 2, Rock: 0.5 },
  Psychic:  { Fighting: 2, Poison: 2, Psychic: 0.5 },
  Bug:      { Fire: 0.5, Grass: 2, Fighting: 0.5, Poison: 2, Flying: 0.5, Ghost: 0.5 },
  Rock:     { Fire: 2, Ice: 2, Fighting: 0.5, Ground: 0.5, Flying: 2, Bug: 2 },
  Ghost:    { Normal: 0, Ghost: 2, Psychic: 0 },
  Dragon:   { Dragon: 2 },
};

export function getTypeEffectiveness(attackType: string, defenseTypes: string[]): number {
  let multiplier = 1;
  for (const defType of defenseTypes) {
    const chart = TYPE_CHART[attackType];
    if (chart && chart[defType] !== undefined) {
      multiplier *= chart[defType];
    }
  }
  return multiplier;
}

export const TYPE_COLORS: Record<string, number> = {
  Normal: COLORS.NORMAL,
  Fire: COLORS.FIRE,
  Water: COLORS.WATER_TYPE,
  Grass: COLORS.GRASS_TYPE,
  Electric: COLORS.ELECTRIC,
  Ice: COLORS.ICE,
  Fighting: COLORS.FIGHTING,
  Poison: COLORS.POISON,
  Ground: COLORS.GROUND,
  Flying: COLORS.FLYING,
  Psychic: COLORS.PSYCHIC,
  Bug: COLORS.BUG,
  Rock: COLORS.ROCK,
  Ghost: COLORS.GHOST,
  Dragon: COLORS.DRAGON,
  Dark: COLORS.DARK,
  Steel: COLORS.STEEL,
  Fairy: COLORS.FAIRY,
};

// Font
export const FONT_FAMILY = '"Press Start 2P", monospace';

// Encounter rates
export const ENCOUNTER_RATE = 0.15; // 15% chance per step in tall grass

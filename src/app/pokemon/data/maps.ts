// Map system - each map is a 2D tile grid
// Tile types: 0=grass, 1=path, 2=tallgrass, 3=water, 4=tree, 5=building, 6=door, 7=wall, 
// 8=ledge, 9=sign, 10=flower, 11=fence, 12=counter, 13=shelf, 14=pc, 15=healpad, 16=cuttree

export interface MapTile {
  type: number;
  walkable: boolean;
  encounter?: boolean;  // can trigger wild encounter
  interaction?: string; // NPC id or sign text
  door?: { map: string; x: number; y: number }; // warp to another map
  trainer?: string; // trainer id
}

export interface WildEncounter {
  speciesId: string;
  minLevel: number;
  maxLevel: number;
  weight: number; // relative probability
}

export interface NPCData {
  id: string;
  name: string;
  x: number;
  y: number;
  direction: 'up' | 'down' | 'left' | 'right';
  dialog: string[];
  spriteType: string;
  stationary?: boolean;
}

export interface GameMap {
  id: string;
  name: string;
  width: number;
  height: number;
  tiles: number[][]; // just tile type numbers for compactness
  encounters: WildEncounter[];
  encounterRate: number; // 0-100 chance per step in tall grass
  npcs: NPCData[];
  trainers: string[]; // trainer ids present on this map
  music?: string;
}

// Tile definitions
export const TILE_DEFS: Record<number, { walkable: boolean; encounter?: boolean; color: string; label: string }> = {
  0:  { walkable: true,  color: '#4a7c3f', label: 'grass' },
  1:  { walkable: true,  color: '#c4a86b', label: 'path' },
  2:  { walkable: true,  encounter: true, color: '#2d5a1e', label: 'tallgrass' },
  3:  { walkable: false, color: '#3498db', label: 'water' },
  4:  { walkable: false, color: '#1a5e20', label: 'tree' },
  5:  { walkable: false, color: '#8b4513', label: 'building' },
  6:  { walkable: true,  color: '#654321', label: 'door' },
  7:  { walkable: false, color: '#555', label: 'wall' },
  8:  { walkable: true,  color: '#8b7355', label: 'ledge' },
  9:  { walkable: false, color: '#888', label: 'sign' },
  10: { walkable: true,  color: '#e74c3c', label: 'flower' },
  11: { walkable: false, color: '#795548', label: 'fence' },
  12: { walkable: false, color: '#8d6e63', label: 'counter' },
  13: { walkable: false, color: '#5d4037', label: 'shelf' },
  14: { walkable: false, color: '#2196f3', label: 'pc' },
  15: { walkable: true,  color: '#e91e63', label: 'healpad' },
  16: { walkable: false, color: '#33691e', label: 'cuttree' },
};

// Helper to create a filled 2D array
function fillMap(w: number, h: number, fill: number): number[][] {
  return Array.from({ length: h }, () => Array(w).fill(fill));
}

function setRect(map: number[][], x: number, y: number, w: number, h: number, tile: number) {
  for (let dy = 0; dy < h; dy++)
    for (let dx = 0; dx < w; dx++)
      if (y + dy < map.length && x + dx < map[0].length)
        map[y + dy][x + dx] = tile;
}

function setRow(map: number[][], y: number, x1: number, x2: number, tile: number) {
  for (let x = x1; x <= x2; x++) if (x < map[0].length) map[y][x] = tile;
}

function setCol(map: number[][], x: number, y1: number, y2: number, tile: number) {
  for (let y = y1; y <= y2; y++) if (y < map.length) map[y][x] = tile;
}

// ===== PALLET TOWN =====
function createPalletTown(): GameMap {
  const w = 20, h = 20;
  const tiles = fillMap(w, h, 0);
  
  // Border trees
  setRect(tiles, 0, 0, w, 1, 4);
  setRect(tiles, 0, 0, 1, h, 4);
  setRect(tiles, w-1, 0, 1, h, 4);
  setRect(tiles, 0, h-1, w, 1, 4);
  
  // Paths
  setCol(tiles, 10, 1, 18, 1);
  setRow(tiles, 10, 3, 17, 1);
  setRow(tiles, 5, 5, 15, 1);
  
  // Player's house (top-left area)
  setRect(tiles, 3, 2, 5, 4, 5);
  tiles[5][5] = 6; // door
  
  // Oak's Lab (bottom-right area)
  setRect(tiles, 12, 12, 6, 5, 5);
  tiles[16][15] = 6; // door
  
  // Rival's house
  setRect(tiles, 12, 2, 5, 4, 5);
  tiles[5][14] = 6;
  
  // Flowers
  setRect(tiles, 5, 7, 3, 2, 10);
  setRect(tiles, 14, 7, 3, 2, 10);
  
  // Signs
  tiles[10][8] = 9;
  tiles[16][12] = 9;
  
  // Exit north to Route 1 (gap in trees)
  tiles[0][9] = 1;
  tiles[0][10] = 1;
  tiles[0][11] = 1;

  return {
    id: 'pallet_town',
    name: 'Pallet Town',
    width: w, height: h,
    tiles,
    encounters: [],
    encounterRate: 0,
    npcs: [
      { id: 'mom', name: 'Mom', x: 5, y: 8, direction: 'down', dialog: ['Be careful out there, dear!', 'Come home if you need rest!'], spriteType: 'woman', stationary: true },
      { id: 'oak_outside', name: 'Villager', x: 8, y: 12, direction: 'right', dialog: ['Professor Oak\'s lab is to the east!', 'He studies Pokémon.'], spriteType: 'man' },
      { id: 'sign_pallet', name: 'Sign', x: 8, y: 10, direction: 'down', dialog: ['PALLET TOWN', 'Shades of your journey await!'], spriteType: 'sign', stationary: true },
    ],
    trainers: [],
  };
}

// ===== OAK'S LAB (interior) =====
function createOakLab(): GameMap {
  const w = 12, h = 10;
  const tiles = fillMap(w, h, 1);
  
  // Walls
  setRect(tiles, 0, 0, w, 1, 7);
  setRect(tiles, 0, 0, 1, h, 7);
  setRect(tiles, w-1, 0, 1, h, 7);
  
  // Shelves at top
  setRow(tiles, 1, 1, 4, 13);
  setRow(tiles, 1, 7, 10, 13);
  
  // Table with pokeballs in middle
  setRect(tiles, 4, 3, 4, 2, 12);
  
  // PC
  tiles[2][1] = 14;
  
  // Door at bottom
  tiles[h-1][5] = 6;
  tiles[h-1][6] = 6;
  
  return {
    id: 'oak_lab',
    name: "Oak's Lab",
    width: w, height: h,
    tiles,
    encounters: [],
    encounterRate: 0,
    npcs: [
      { id: 'oak', name: 'Prof. Oak', x: 5, y: 2, direction: 'down', dialog: ['Welcome to the world of Pokémon!'], spriteType: 'oak', stationary: true },
    ],
    trainers: [],
  };
}

// ===== PLAYER'S HOUSE =====
function createPlayerHouse(): GameMap {
  const w = 8, h = 8;
  const tiles = fillMap(w, h, 1);
  setRect(tiles, 0, 0, w, 1, 7);
  setRect(tiles, 0, 0, 1, h, 7);
  setRect(tiles, w-1, 0, 1, h, 7);
  // Furniture
  tiles[1][1] = 13; tiles[1][2] = 13; // shelf
  tiles[2][6] = 14; // TV/PC
  // Door
  tiles[h-1][3] = 6;
  tiles[h-1][4] = 6;
  
  return {
    id: 'player_house',
    name: "Your House",
    width: w, height: h,
    tiles,
    encounters: [],
    encounterRate: 0,
    npcs: [
      { id: 'mom_inside', name: 'Mom', x: 3, y: 3, direction: 'down', 
        dialog: ['Good morning, sweetie!', 'Prof. Oak was looking for you.', 'He\'s in his lab south of here.'], 
        spriteType: 'woman', stationary: true },
    ],
    trainers: [],
  };
}

// ===== ROUTE 1 =====
function createRoute1(): GameMap {
  const w = 20, h = 30;
  const tiles = fillMap(w, h, 0);
  
  // Trees on sides
  setRect(tiles, 0, 0, 3, h, 4);
  setRect(tiles, w-3, 0, 3, h, 4);
  
  // Main path
  setCol(tiles, 9, 0, h-1, 1);
  setCol(tiles, 10, 0, h-1, 1);
  setCol(tiles, 11, 0, h-1, 1);
  
  // Tall grass patches
  setRect(tiles, 4, 3, 4, 4, 2);
  setRect(tiles, 13, 8, 3, 5, 2);
  setRect(tiles, 5, 15, 3, 4, 2);
  setRect(tiles, 13, 18, 3, 4, 2);
  setRect(tiles, 4, 23, 5, 3, 2);
  
  // Ledges
  setRow(tiles, 12, 4, 7, 8);
  setRow(tiles, 22, 13, 15, 8);
  
  // Exit south to Pallet
  tiles[h-1][9] = 1; tiles[h-1][10] = 1; tiles[h-1][11] = 1;
  // Exit north to Viridian
  tiles[0][9] = 1; tiles[0][10] = 1; tiles[0][11] = 1;

  return {
    id: 'route1',
    name: 'Route 1',
    width: w, height: h,
    tiles,
    encounters: [
      { speciesId: 'rattipaw', minLevel: 2, maxLevel: 5, weight: 50 },
      { speciesId: 'pidglit', minLevel: 2, maxLevel: 5, weight: 50 },
    ],
    encounterRate: 20,
    npcs: [
      { id: 'route1_npc', name: 'Youngster', x: 12, y: 15, direction: 'left',
        dialog: ['The tall grass is full of wild Pokémon!', 'Be careful out there!'],
        spriteType: 'youngster' },
    ],
    trainers: [],
  };
}

// ===== VIRIDIAN CITY =====
function createViridianCity(): GameMap {
  const w = 25, h = 20;
  const tiles = fillMap(w, h, 0);
  
  // Border trees
  setRect(tiles, 0, 0, 2, h, 4);
  setRect(tiles, w-2, 0, 2, h, 4);
  setRect(tiles, 0, 0, w, 2, 4);
  setRect(tiles, 0, h-2, w, 2, 4);
  
  // Main roads
  setRow(tiles, 10, 2, w-3, 1);
  setCol(tiles, 12, 2, h-3, 1);
  setCol(tiles, 13, 2, h-3, 1);
  
  // Pokécenter
  setRect(tiles, 4, 4, 5, 4, 5);
  tiles[7][6] = 6; // door
  
  // Pokémart
  setRect(tiles, 16, 4, 5, 4, 5);
  tiles[7][18] = 6;
  
  // Gym (locked until 7 badges)
  setRect(tiles, 4, 12, 6, 4, 5);
  tiles[15][7] = 6;
  
  // Flowers
  setRect(tiles, 10, 3, 2, 2, 10);
  
  // Signs
  tiles[10][5] = 9;
  tiles[10][16] = 9;
  
  // Exits
  // South to Route 1
  tiles[h-2][12] = 1; tiles[h-2][13] = 1; tiles[h-1][12] = 1; tiles[h-1][13] = 1;
  // North to Route 2
  tiles[0][12] = 1; tiles[0][13] = 1; tiles[1][12] = 1; tiles[1][13] = 1;

  return {
    id: 'viridian_city',
    name: 'Viridian City',
    width: w, height: h,
    tiles,
    encounters: [],
    encounterRate: 0,
    npcs: [
      { id: 'viridian_npc1', name: 'Old Man', x: 10, y: 8, direction: 'down',
        dialog: ['The Pokémart sells useful items.', 'Stock up before heading north!'],
        spriteType: 'oldman' },
      { id: 'sign_pokecenter', name: 'Sign', x: 5, y: 10, direction: 'down',
        dialog: ['POKÉMON CENTER', 'Heal your Pokémon for free!'], spriteType: 'sign', stationary: true },
      { id: 'sign_mart', name: 'Sign', x: 16, y: 10, direction: 'down',
        dialog: ['POKÉ MART', 'For all your Pokémon needs!'], spriteType: 'sign', stationary: true },
    ],
    trainers: [],
  };
}

// ===== POKECENTER INTERIOR =====
function createPokecenter(): GameMap {
  const w = 10, h = 8;
  const tiles = fillMap(w, h, 1);
  setRect(tiles, 0, 0, w, 1, 7);
  setRect(tiles, 0, 0, 1, h, 7);
  setRect(tiles, w-1, 0, 1, h, 7);
  
  // Healing counter
  setRow(tiles, 2, 3, 6, 12);
  tiles[2][5] = 15; // heal pad
  
  // PC
  tiles[1][8] = 14;
  
  // Door
  tiles[h-1][4] = 6; tiles[h-1][5] = 6;

  return {
    id: 'pokecenter',
    name: 'Pokémon Center',
    width: w, height: h,
    tiles,
    encounters: [],
    encounterRate: 0,
    npcs: [
      { id: 'nurse', name: 'Nurse Joy', x: 5, y: 1, direction: 'down',
        dialog: ['Welcome to the Pokémon Center!', 'I\'ll heal your Pokémon right up!', '...', 'Your Pokémon are fully healed!'],
        spriteType: 'nurse', stationary: true },
    ],
    trainers: [],
  };
}

// ===== POKEMART INTERIOR =====
function createPokemart(): GameMap {
  const w = 8, h = 8;
  const tiles = fillMap(w, h, 1);
  setRect(tiles, 0, 0, w, 1, 7);
  setRect(tiles, 0, 0, 1, h, 7);
  setRect(tiles, w-1, 0, 1, h, 7);
  
  // Counter
  setRow(tiles, 2, 2, 5, 12);
  
  // Shelves
  tiles[1][1] = 13; tiles[1][6] = 13;
  setRow(tiles, 4, 5, 6, 13);
  
  // Door
  tiles[h-1][3] = 6; tiles[h-1][4] = 6;

  return {
    id: 'pokemart',
    name: 'Poké Mart',
    width: w, height: h,
    tiles,
    encounters: [],
    encounterRate: 0,
    npcs: [
      { id: 'clerk', name: 'Clerk', x: 4, y: 1, direction: 'down',
        dialog: ['Welcome! How may I help you?'],
        spriteType: 'clerk', stationary: true },
    ],
    trainers: [],
  };
}

// ===== ROUTE 2 =====
function createRoute2(): GameMap {
  const w = 20, h = 25;
  const tiles = fillMap(w, h, 0);
  
  setRect(tiles, 0, 0, 3, h, 4);
  setRect(tiles, w-3, 0, 3, h, 4);
  
  setCol(tiles, 9, 0, h-1, 1);
  setCol(tiles, 10, 0, h-1, 1);
  
  // Tall grass
  setRect(tiles, 4, 2, 4, 5, 2);
  setRect(tiles, 13, 6, 3, 6, 2);
  setRect(tiles, 5, 14, 3, 4, 2);
  setRect(tiles, 12, 17, 4, 4, 2);
  
  // Cut tree blocking side path
  tiles[10][5] = 16;
  
  // Exits
  tiles[h-1][9] = 1; tiles[h-1][10] = 1;
  tiles[0][9] = 1; tiles[0][10] = 1;

  return {
    id: 'route2',
    name: 'Route 2',
    width: w, height: h,
    tiles,
    encounters: [
      { speciesId: 'rattipaw', minLevel: 3, maxLevel: 6, weight: 30 },
      { speciesId: 'pidglit', minLevel: 3, maxLevel: 6, weight: 30 },
      { speciesId: 'buglin', minLevel: 3, maxLevel: 5, weight: 25 },
      { speciesId: 'snekil', minLevel: 4, maxLevel: 6, weight: 15 },
    ],
    encounterRate: 25,
    npcs: [],
    trainers: ['route2_bug1'],
  };
}

// ===== PEWTER CITY =====
function createPewterCity(): GameMap {
  const w = 25, h = 22;
  const tiles = fillMap(w, h, 0);
  
  setRect(tiles, 0, 0, 2, h, 4);
  setRect(tiles, w-2, 0, 2, h, 4);
  setRect(tiles, 0, 0, w, 2, 4);
  setRect(tiles, 0, h-2, w, 2, 4);
  
  // Roads
  setRow(tiles, 10, 2, w-3, 1);
  setCol(tiles, 12, 2, h-3, 1);
  
  // Pokécenter
  setRect(tiles, 4, 4, 5, 4, 5);
  tiles[7][6] = 6;
  
  // Gym
  setRect(tiles, 15, 4, 6, 5, 5);
  tiles[8][18] = 6;
  
  // Mart
  setRect(tiles, 4, 12, 5, 4, 5);
  tiles[15][6] = 6;
  
  // Museum
  setRect(tiles, 15, 12, 6, 4, 5);
  tiles[15][18] = 6;
  
  // Exits
  tiles[h-2][12] = 1; tiles[h-1][12] = 1;
  tiles[0][12] = 1; tiles[1][12] = 1;
  // East to Route 3
  tiles[10][w-2] = 1; tiles[10][w-1] = 1;

  return {
    id: 'pewter_city',
    name: 'Pewter City',
    width: w, height: h,
    tiles,
    encounters: [],
    encounterRate: 0,
    npcs: [
      { id: 'pewter_npc', name: 'Hiker', x: 10, y: 8, direction: 'right',
        dialog: ['The Pewter Gym is tough!', 'Brock uses Rock-type Pokémon.', 'Water or Grass types work best!'],
        spriteType: 'hiker' },
    ],
    trainers: [],
  };
}

// ===== GYM INTERIOR (generic, reused) =====
function createGymInterior(gymId: string): GameMap {
  const w = 12, h = 14;
  const tiles = fillMap(w, h, 1);
  
  setRect(tiles, 0, 0, w, 1, 7);
  setRect(tiles, 0, 0, 1, h, 7);
  setRect(tiles, w-1, 0, 1, h, 7);
  
  // Arena markings
  setRect(tiles, 3, 3, 6, 1, 11);
  setRect(tiles, 3, 8, 6, 1, 11);
  setCol(tiles, 3, 3, 8, 11);
  setCol(tiles, 8, 3, 8, 11);
  
  // Path to leader
  setCol(tiles, 5, 8, h-1, 1);
  setCol(tiles, 6, 8, h-1, 1);
  
  // Door
  tiles[h-1][5] = 6; tiles[h-1][6] = 6;

  return {
    id: gymId,
    name: 'Gym',
    width: w, height: h,
    tiles,
    encounters: [],
    encounterRate: 0,
    npcs: [],
    trainers: [],
  };
}

// ===== ROUTE 3 =====
function createRoute3(): GameMap {
  const w = 30, h = 15;
  const tiles = fillMap(w, h, 0);
  
  setRect(tiles, 0, 0, w, 2, 4);
  setRect(tiles, 0, h-2, w, 2, 4);
  
  // Horizontal path
  setRow(tiles, 7, 0, w-1, 1);
  
  // Tall grass
  setRect(tiles, 3, 3, 5, 3, 2);
  setRect(tiles, 12, 9, 5, 3, 2);
  setRect(tiles, 20, 3, 4, 4, 2);
  setRect(tiles, 24, 9, 4, 3, 2);
  
  // Exits
  tiles[7][0] = 1;
  tiles[7][w-1] = 1;

  return {
    id: 'route3',
    name: 'Route 3',
    width: w, height: h,
    tiles,
    encounters: [
      { speciesId: 'geodon', minLevel: 7, maxLevel: 10, weight: 30 },
      { speciesId: 'snekil', minLevel: 7, maxLevel: 10, weight: 25 },
      { speciesId: 'punchub', minLevel: 8, maxLevel: 10, weight: 20 },
      { speciesId: 'zaprat', minLevel: 8, maxLevel: 11, weight: 15 },
      { speciesId: 'meowzy', minLevel: 8, maxLevel: 10, weight: 10 },
    ],
    encounterRate: 25,
    npcs: [],
    trainers: ['route3_youngster1', 'route3_lass1'],
  };
}

// ===== CERULEAN CITY =====
function createCeruleanCity(): GameMap {
  const w = 25, h = 22;
  const tiles = fillMap(w, h, 0);
  
  setRect(tiles, 0, 0, 2, h, 4);
  setRect(tiles, w-2, 0, 2, h, 4);
  setRect(tiles, 0, 0, w, 2, 4);
  setRect(tiles, 0, h-2, w, 2, 4);
  
  setRow(tiles, 10, 2, w-3, 1);
  setCol(tiles, 12, 2, h-3, 1);
  
  // Pokecenter
  setRect(tiles, 4, 4, 5, 4, 5);
  tiles[7][6] = 6;
  
  // Gym
  setRect(tiles, 15, 4, 6, 5, 5);
  tiles[8][18] = 6;
  
  // Mart
  setRect(tiles, 4, 12, 5, 4, 5);
  tiles[15][6] = 6;
  
  // Water
  setRect(tiles, 15, 13, 6, 3, 3);
  
  // Exits
  tiles[h-2][12] = 1; tiles[h-1][12] = 1;
  tiles[10][w-2] = 1; tiles[10][w-1] = 1;
  tiles[0][12] = 1; tiles[1][12] = 1;

  return {
    id: 'cerulean_city',
    name: 'Cerulean City',
    width: w, height: h,
    tiles,
    encounters: [],
    encounterRate: 0,
    npcs: [
      { id: 'cerulean_npc', name: 'Swimmer', x: 10, y: 8, direction: 'down',
        dialog: ['Misty—I mean, the Gym Leader here uses Water-types!', 'Electric and Grass moves are super effective!'],
        spriteType: 'lass' },
    ],
    trainers: [],
  };
}

// ===== ROUTE 4 =====
function createRoute4(): GameMap {
  const w = 25, h = 15;
  const tiles = fillMap(w, h, 0);
  
  setRect(tiles, 0, 0, w, 2, 4);
  setRect(tiles, 0, h-2, w, 2, 4);
  
  setRow(tiles, 7, 0, w-1, 1);
  
  setRect(tiles, 4, 3, 4, 3, 2);
  setRect(tiles, 14, 9, 5, 3, 2);
  setRect(tiles, 20, 3, 3, 4, 2);
  
  tiles[7][0] = 1;
  tiles[7][w-1] = 1;

  return {
    id: 'route4',
    name: 'Route 4',
    width: w, height: h,
    tiles,
    encounters: [
      { speciesId: 'oddling', minLevel: 12, maxLevel: 15, weight: 25 },
      { speciesId: 'psydux', minLevel: 12, maxLevel: 15, weight: 20 },
      { speciesId: 'growlith', minLevel: 12, maxLevel: 14, weight: 20 },
      { speciesId: 'zaprat', minLevel: 11, maxLevel: 14, weight: 20 },
      { speciesId: 'foxflame', minLevel: 12, maxLevel: 14, weight: 15 },
    ],
    encounterRate: 25,
    npcs: [],
    trainers: ['route4_hiker1'],
  };
}

// ===== VERMILION CITY =====
function createVermilionCity(): GameMap {
  const w = 25, h = 22;
  const tiles = fillMap(w, h, 0);
  
  setRect(tiles, 0, 0, 2, h, 4);
  setRect(tiles, w-2, 0, 2, h, 4);
  setRect(tiles, 0, 0, w, 2, 4);
  setRect(tiles, 0, h-2, w, 2, 4);
  
  setRow(tiles, 10, 2, w-3, 1);
  setCol(tiles, 12, 2, h-3, 1);
  
  // Pokecenter
  setRect(tiles, 4, 4, 5, 4, 5);
  tiles[7][6] = 6;
  
  // Gym
  setRect(tiles, 15, 4, 6, 5, 5);
  tiles[8][18] = 6;
  
  // Mart
  setRect(tiles, 4, 12, 5, 4, 5);
  tiles[15][6] = 6;
  
  // Harbor water
  setRect(tiles, 14, 14, 8, 4, 3);
  
  // Exits
  tiles[0][12] = 1; tiles[1][12] = 1;

  return {
    id: 'vermilion_city',
    name: 'Vermilion City',
    width: w, height: h,
    tiles,
    encounters: [],
    encounterRate: 0,
    npcs: [
      { id: 'vermilion_npc', name: 'Sailor', x: 14, y: 12, direction: 'left',
        dialog: ['Lt. Surge runs the gym here!', 'His Electric-types will shock you!'],
        spriteType: 'man' },
      { id: 'hm_cut_npc', name: 'Captain', x: 10, y: 12, direction: 'down',
        dialog: ['I\'m the S.S. Anne captain!', 'Here, take this HM for Cut!', 'Teach it to a Pokémon to chop down small trees!'],
        spriteType: 'man' },
      { id: 'bicycle_npc', name: 'Bike Shop Owner', x: 16, y: 12, direction: 'left',
        dialog: ['I run the bike shop!', 'Here, take this Bicycle! It\'s a promotional giveaway!', 'Press B in the overworld to ride it!'],
        spriteType: 'man' },
    ],
    trainers: [],
  };
}

// ===== CELADON CITY =====
// Large city with department store (expanded mart), Game Corner
function createCeladonCity(): GameMap {
  const w = 25, h = 22;
  const tiles = fillMap(w, h, 0);
  
  // Border trees
  setRect(tiles, 0, 0, 2, h, 4);
  setRect(tiles, w-2, 0, 2, h, 4);
  setRect(tiles, 0, 0, w, 2, 4);
  setRect(tiles, 0, h-2, w, 2, 4);
  
  // Main roads - wider central boulevard
  setRow(tiles, 10, 2, w-3, 1);
  setRow(tiles, 11, 2, w-3, 1);
  setCol(tiles, 12, 2, h-3, 1);
  setCol(tiles, 13, 2, h-3, 1);
  
  // Pokécenter (top-left)
  setRect(tiles, 3, 3, 5, 4, 5);
  tiles[6][5] = 6; // door at 5,6
  
  // Gym (top-right)
  setRect(tiles, 16, 3, 6, 5, 5);
  tiles[7][19] = 6; // door at 19,7
  
  // Department Store (large building, bottom-left) - bigger than normal mart
  setRect(tiles, 3, 13, 7, 5, 5);
  tiles[17][6] = 6; // door at 6,17
  
  // Game Corner building (bottom-right)
  setRect(tiles, 16, 13, 5, 4, 5);
  tiles[16][18] = 6; // door (decorative - no interior)
  
  // Flower garden (center park)
  setRect(tiles, 7, 5, 4, 3, 10);
  tiles[6][8] = 0; tiles[6][9] = 0; // paths through garden
  
  // Decorative pond
  setRect(tiles, 17, 9, 3, 2, 3);
  
  // Signs
  tiles[10][4] = 9; // pokecenter sign
  tiles[12][16] = 9; // game corner sign
  
  // Exits
  tiles[h-2][12] = 1; tiles[h-1][12] = 1; tiles[h-2][13] = 1; tiles[h-1][13] = 1;
  tiles[0][12] = 1; tiles[1][12] = 1; tiles[0][13] = 1; tiles[1][13] = 1;
  // East exit
  tiles[10][w-2] = 1; tiles[10][w-1] = 1; tiles[11][w-2] = 1; tiles[11][w-1] = 1;

  return {
    id: 'celadon_city',
    name: 'Celadon City',
    width: w, height: h,
    tiles,
    encounters: [],
    encounterRate: 0,
    npcs: [
      { id: 'celadon_nurse', name: 'Nurse Joy', x: 5, y: 5, direction: 'down',
        dialog: ['Welcome to Celadon Pokémon Center!', 'Your Pokémon look tired from the journey.'],
        spriteType: 'nurse', stationary: true },
      { id: 'celadon_dept', name: 'Dept. Store Clerk', x: 8, y: 15, direction: 'right',
        dialog: ['Welcome to the Celadon Department Store!', 'We have the largest selection of items in Kanto!', 'TMs, evolution stones, you name it!'],
        spriteType: 'clerk' },
      { id: 'celadon_gamecorner', name: 'Suspicious Man', x: 18, y: 12, direction: 'left',
        dialog: ['Psst... the Game Corner has great prizes!', 'But watch out... Team Rocket runs it behind the scenes.', 'I didn\'t tell you that, though!'],
        spriteType: 'man' },
      { id: 'celadon_gardener', name: 'Gardener', x: 9, y: 8, direction: 'down',
        dialog: ['I tend the flower gardens here in Celadon.', 'This city is known for its beautiful nature!'],
        spriteType: 'woman' },
    ],
    trainers: [],
  };
}

// ===== FUCHSIA CITY =====
// Southern city, Safari Zone entrance, tropical feel
function createFuchsiaCity(): GameMap {
  const w = 25, h = 22;
  const tiles = fillMap(w, h, 0);
  
  // Border trees (thicker on south for tropical feel)
  setRect(tiles, 0, 0, 2, h, 4);
  setRect(tiles, w-2, 0, 2, h, 4);
  setRect(tiles, 0, 0, w, 2, 4);
  setRect(tiles, 0, h-3, w, 3, 4);
  
  // Winding paths (not grid-like, more organic)
  setRow(tiles, 9, 2, 10, 1);
  setRow(tiles, 9, 14, w-3, 1);
  setCol(tiles, 10, 2, 18, 1);
  setRow(tiles, 14, 3, 8, 1);
  setCol(tiles, 18, 5, 14, 1);
  
  // Pokécenter (left side)
  setRect(tiles, 3, 4, 5, 4, 5);
  tiles[7][5] = 6; // door at 5,7
  
  // Gym (right side, further back)
  setRect(tiles, 14, 3, 6, 5, 5);
  tiles[7][17] = 6; // door at 17,7
  
  // Pokémart (bottom area)
  setRect(tiles, 3, 11, 5, 4, 5);
  tiles[14][5] = 6; // door at 5,14
  
  // Safari Zone entrance (large fenced area, top-right)
  setRect(tiles, 19, 3, 3, 4, 11); // fence
  tiles[6][20] = 6; // gate door (decorative)
  
  // Tall grass patches (safari feel)
  setRect(tiles, 12, 10, 3, 3, 2);
  setRect(tiles, 6, 16, 3, 2, 2);
  
  // Small pond
  setRect(tiles, 15, 14, 2, 2, 3);
  
  // Flowers
  setRect(tiles, 11, 5, 2, 2, 10);
  
  // Exits - north
  tiles[0][12] = 1; tiles[1][12] = 1;
  // West exit (row 10 to match route connections)
  tiles[10][0] = 1; tiles[10][1] = 1;

  return {
    id: 'fuchsia_city',
    name: 'Fuchsia City',
    width: w, height: h,
    tiles,
    encounters: [],
    encounterRate: 0,
    npcs: [
      { id: 'fuchsia_nurse', name: 'Nurse Joy', x: 5, y: 5, direction: 'down',
        dialog: ['Welcome to Fuchsia Pokémon Center!', 'Rest up after your Safari Zone adventure!'],
        spriteType: 'nurse', stationary: true },
      { id: 'hm_surf_npc', name: 'Warden', x: 12, y: 8, direction: 'down',
        dialog: ['I\'m the Safari Zone Warden!', 'Here, take this HM for Surf!', 'Teach it to a Pokémon to cross water!'],
        spriteType: 'man' },
      { id: 'fuchsia_safari', name: 'Safari Guide', x: 20, y: 8, direction: 'left',
        dialog: ['The Safari Zone is home to rare Pokémon!', 'Unfortunately, it\'s closed for renovations right now.', 'Come back another time!'],
        spriteType: 'man' },
      { id: 'fuchsia_fisher', name: 'Fisherman', x: 15, y: 16, direction: 'up',
        dialog: ['I love fishing in this pond!', 'Fuchsia has the best spots in Kanto.', 'The Warden knows all about rare Pokémon here.'],
        spriteType: 'man' },
    ],
    trainers: [],
  };
}

// ===== SAFFRON CITY =====
// Biggest city in Kanto, Silph Co headquarters
function createSaffronCity(): GameMap {
  const w = 25, h = 22;
  const tiles = fillMap(w, h, 0);
  
  // Border trees
  setRect(tiles, 0, 0, 2, h, 4);
  setRect(tiles, w-2, 0, 2, h, 4);
  setRect(tiles, 0, 0, w, 2, 4);
  setRect(tiles, 0, h-2, w, 2, 4);
  
  // Grid-like road system (big city feel)
  setRow(tiles, 7, 2, w-3, 1);
  setRow(tiles, 14, 2, w-3, 1);
  setCol(tiles, 7, 2, h-3, 1);
  setCol(tiles, 12, 2, h-3, 1);
  setCol(tiles, 17, 2, h-3, 1);
  
  // Pokécenter (top-left block)
  setRect(tiles, 3, 3, 4, 3, 5);
  tiles[5][5] = 6; // door at 5,5
  
  // Gym (top-right block)
  setRect(tiles, 18, 3, 4, 3, 5);
  tiles[5][20] = 6; // door at 20,5
  
  // Silph Co (large central building)
  setRect(tiles, 8, 8, 9, 5, 5);
  tiles[12][12] = 6; // main entrance (locked)
  
  // Pokémart (bottom-left)
  setRect(tiles, 3, 15, 4, 3, 5);
  tiles[17][5] = 6; // door at 5,17
  
  // Houses/buildings filling city blocks
  setRect(tiles, 13, 3, 3, 3, 5);
  setRect(tiles, 18, 9, 4, 4, 5);
  setRect(tiles, 3, 9, 3, 4, 5);
  setRect(tiles, 13, 15, 4, 3, 5);
  setRect(tiles, 18, 15, 4, 3, 5);
  
  // Signs
  tiles[7][10] = 9; // Silph Co sign
  tiles[14][4] = 9;
  
  // Exits
  tiles[h-2][12] = 1; tiles[h-1][12] = 1; // south
  tiles[0][12] = 1; tiles[1][12] = 1; // north
  // East exit (row 10 to match route connections)
  tiles[10][w-2] = 1; tiles[10][w-1] = 1;
  // Also make row 10 path connect to east
  setRow(tiles, 10, 17, w-3, 1);

  return {
    id: 'saffron_city',
    name: 'Saffron City',
    width: w, height: h,
    tiles,
    encounters: [],
    encounterRate: 0,
    npcs: [
      { id: 'saffron_nurse', name: 'Nurse Joy', x: 4, y: 4, direction: 'down',
        dialog: ['Welcome to Saffron Pokémon Center!', 'Saffron is the biggest city in Kanto!'],
        spriteType: 'nurse', stationary: true },
      { id: 'saffron_silph', name: 'Silph Employee', x: 12, y: 13, direction: 'up',
        dialog: ['Silph Co. is the biggest company in Kanto!', 'They develop Poké Balls and other items.', 'The building is closed to visitors right now...'],
        spriteType: 'man' },
      { id: 'saffron_psychic', name: 'Psychic', x: 15, y: 7, direction: 'left',
        dialog: ['I sense great power in you...', 'The Gym Leader here uses Psychic-type Pokémon.', 'Dark and Ghost types resist psychic powers!'],
        spriteType: 'woman' },
      { id: 'saffron_guard', name: 'Guard', x: 11, y: 12, direction: 'down',
        dialog: ['Silph Co. is on lockdown!', 'No one is allowed inside right now.'],
        spriteType: 'man', stationary: true },
    ],
    trainers: [],
  };
}

// ===== CINNABAR ISLAND =====
// Island surrounded by water
function createCinnabarIsland(): GameMap {
  const w = 25, h = 22;
  const tiles = fillMap(w, h, 3); // Start with all water!
  
  // Island landmass in the center
  setRect(tiles, 4, 4, 17, 14, 0); // grass land
  
  // Beach/path border around island
  setRow(tiles, 4, 4, 20, 1);
  setRow(tiles, 17, 4, 20, 1);
  setCol(tiles, 4, 4, 17, 1);
  setCol(tiles, 20, 4, 17, 1);
  
  // Internal paths
  setRow(tiles, 10, 5, 19, 1);
  setCol(tiles, 12, 5, 16, 1);
  
  // Pokécenter (top area)
  setRect(tiles, 6, 5, 5, 4, 5);
  tiles[8][8] = 6; // door at 8,8
  
  // Gym (right area)
  setRect(tiles, 14, 5, 5, 4, 5);
  tiles[8][17] = 6; // door at 17,8
  
  // Pokémart (bottom area)
  setRect(tiles, 6, 12, 5, 4, 5);
  tiles[15][8] = 6; // door at 8,15
  
  // Lab/Research building
  setRect(tiles, 14, 12, 5, 4, 5);
  tiles[15][16] = 6; // decorative door
  
  // Volcano hint (rocky area)
  setRect(tiles, 9, 6, 3, 2, 7);
  
  // Flowers
  setRect(tiles, 10, 13, 3, 2, 10);
  
  // West exit - path through water for connection (player arrives at x:3,y:10)
  tiles[10][0] = 1; tiles[10][1] = 1; tiles[10][2] = 1; tiles[10][3] = 1;
  // North exit - path through water
  tiles[0][12] = 1; tiles[1][12] = 1; tiles[2][12] = 1; tiles[3][12] = 1;

  return {
    id: 'cinnabar_island',
    name: 'Cinnabar Island',
    width: w, height: h,
    tiles,
    encounters: [],
    encounterRate: 0,
    npcs: [
      { id: 'cinnabar_nurse', name: 'Nurse Joy', x: 8, y: 6, direction: 'down',
        dialog: ['Welcome to Cinnabar Pokémon Center!', 'You must be exhausted from crossing the sea!'],
        spriteType: 'nurse', stationary: true },
      { id: 'cinnabar_scientist', name: 'Scientist', x: 16, y: 14, direction: 'left',
        dialog: ['We research fossil Pokémon here on Cinnabar!', 'The volcano on this island has been dormant for years.', 'But who knows when it might erupt again...'],
        spriteType: 'man' },
      { id: 'cinnabar_surfer', name: 'Surfer', x: 10, y: 9, direction: 'down',
        dialog: ['Dude, the waves around Cinnabar are gnarly!', 'You need Surf to get here by sea.', 'The Gym Leader here is all about Fire-types!'],
        spriteType: 'man' },
    ],
    trainers: [],
  };
}

function createGenericRoute(id: string, name: string, encounters: WildEncounter[]): GameMap {
  const w = 20, h = 20;
  const tiles = fillMap(w, h, 0);
  
  setRect(tiles, 0, 0, 3, h, 4);
  setRect(tiles, w-3, 0, 3, h, 4);
  
  setCol(tiles, 9, 0, h-1, 1);
  setCol(tiles, 10, 0, h-1, 1);
  
  setRect(tiles, 4, 3, 4, 4, 2);
  setRect(tiles, 13, 10, 3, 4, 2);
  setRect(tiles, 5, 14, 3, 3, 2);
  
  tiles[0][9] = 1; tiles[0][10] = 1;
  tiles[h-1][9] = 1; tiles[h-1][10] = 1;

  return {
    id, name, width: w, height: h, tiles,
    encounters, encounterRate: 25,
    npcs: [], trainers: [],
  };
}

// ===== VICTORY ROAD =====
function createVictoryRoad(): GameMap {
  const w = 20, h = 25;
  const tiles = fillMap(w, h, 7);
  
  // Carved path through cave
  setCol(tiles, 10, 0, 8, 1);
  setRow(tiles, 8, 5, 15, 1);
  setCol(tiles, 5, 8, 16, 1);
  setRow(tiles, 16, 5, 15, 1);
  setCol(tiles, 15, 16, h-1, 1);
  
  // Widen paths
  setCol(tiles, 9, 0, 8, 1);
  setCol(tiles, 6, 8, 16, 1);
  setCol(tiles, 14, 16, h-1, 1);
  
  // Encounters in open areas
  setRect(tiles, 7, 4, 3, 3, 2);
  setRect(tiles, 3, 10, 3, 4, 2);
  setRect(tiles, 12, 18, 3, 3, 2);
  
  tiles[0][9] = 1; tiles[0][10] = 1;
  tiles[h-1][14] = 1; tiles[h-1][15] = 1;

  return {
    id: 'victory_road',
    name: 'Victory Road',
    width: w, height: h,
    tiles,
    encounters: [
      { speciesId: 'geodon', minLevel: 35, maxLevel: 40, weight: 20 },
      { speciesId: 'boulderox', minLevel: 38, maxLevel: 42, weight: 15 },
      { speciesId: 'champeon', minLevel: 38, maxLevel: 42, weight: 15 },
      { speciesId: 'ghoulby', minLevel: 36, maxLevel: 40, weight: 20 },
      { speciesId: 'drakelet', minLevel: 35, maxLevel: 40, weight: 10 },
    ],
    encounterRate: 30,
    npcs: [],
    trainers: ['vr_ace1', 'vr_ace2'],
  };
}

// ===== ELITE 4 CHAMBER =====
function createElite4(): GameMap {
  const w = 12, h = 12;
  const tiles = fillMap(w, h, 1);
  
  setRect(tiles, 0, 0, w, 1, 7);
  setRect(tiles, 0, 0, 1, h, 7);
  setRect(tiles, w-1, 0, 1, h, 7);
  
  // Battle area markings
  setRect(tiles, 3, 3, 6, 1, 11);
  setRect(tiles, 3, 7, 6, 1, 11);
  
  tiles[h-1][5] = 6; tiles[h-1][6] = 6;
  tiles[0][5] = 6; tiles[0][6] = 6;

  return {
    id: 'elite4',
    name: 'Pokémon League',
    width: w, height: h,
    tiles,
    encounters: [],
    encounterRate: 0,
    npcs: [],
    trainers: [],
  };
}

// ===== MAP CONNECTIONS =====
export interface MapConnection {
  from: string;
  fromEdge: 'north' | 'south' | 'east' | 'west';
  to: string;
  toX: number;
  toY: number;
}

export const MAP_CONNECTIONS: MapConnection[] = [
  // Pallet ↔ Route 1
  { from: 'pallet_town', fromEdge: 'north', to: 'route1', toX: 10, toY: 28 },
  { from: 'route1', fromEdge: 'south', to: 'pallet_town', toX: 10, toY: 1 },
  
  // Route 1 ↔ Viridian
  { from: 'route1', fromEdge: 'north', to: 'viridian_city', toX: 12, toY: 17 },
  { from: 'viridian_city', fromEdge: 'south', to: 'route1', toX: 10, toY: 1 },
  
  // Viridian ↔ Route 2
  { from: 'viridian_city', fromEdge: 'north', to: 'route2', toX: 9, toY: 23 },
  { from: 'route2', fromEdge: 'south', to: 'viridian_city', toX: 12, toY: 3 },
  
  // Route 2 ↔ Pewter
  { from: 'route2', fromEdge: 'north', to: 'pewter_city', toX: 12, toY: 19 },
  { from: 'pewter_city', fromEdge: 'south', to: 'route2', toX: 9, toY: 1 },
  
  // Pewter ↔ Route 3 (east)
  { from: 'pewter_city', fromEdge: 'east', to: 'route3', toX: 1, toY: 7 },
  { from: 'route3', fromEdge: 'west', to: 'pewter_city', toX: 22, toY: 10 },
  
  // Route 3 ↔ Cerulean (east) 
  { from: 'route3', fromEdge: 'east', to: 'cerulean_city', toX: 3, toY: 10 },
  { from: 'cerulean_city', fromEdge: 'west', to: 'route3', toX: 28, toY: 7 },
  
  // Cerulean ↔ Route 4 (east)
  { from: 'cerulean_city', fromEdge: 'east', to: 'route4', toX: 1, toY: 7 },
  { from: 'route4', fromEdge: 'west', to: 'cerulean_city', toX: 22, toY: 10 },
  
  // Route 4 ↔ Vermilion
  { from: 'route4', fromEdge: 'east', to: 'vermilion_city', toX: 3, toY: 10 },
  { from: 'vermilion_city', fromEdge: 'north', to: 'route4', toX: 12, toY: 13 },
  
  // Vermilion → Route 5 → Celadon
  { from: 'vermilion_city', fromEdge: 'west', to: 'route5', toX: 18, toY: 10 },
  { from: 'route5', fromEdge: 'north', to: 'celadon_city', toX: 12, toY: 19 },
  { from: 'celadon_city', fromEdge: 'south', to: 'route5', toX: 9, toY: 1 },
  { from: 'route5', fromEdge: 'south', to: 'vermilion_city', toX: 12, toY: 3 },
  
  // Celadon → Route 6 → Fuchsia
  { from: 'celadon_city', fromEdge: 'east', to: 'route6', toX: 1, toY: 10 },
  { from: 'route6', fromEdge: 'east', to: 'fuchsia_city', toX: 3, toY: 10 },
  { from: 'fuchsia_city', fromEdge: 'west', to: 'route6', toX: 18, toY: 10 },
  { from: 'route6', fromEdge: 'west', to: 'celadon_city', toX: 22, toY: 10 },
  
  // Fuchsia → Route 7 → Saffron
  { from: 'fuchsia_city', fromEdge: 'north', to: 'route7', toX: 9, toY: 18 },
  { from: 'route7', fromEdge: 'north', to: 'saffron_city', toX: 12, toY: 19 },
  { from: 'saffron_city', fromEdge: 'south', to: 'route7', toX: 9, toY: 1 },
  { from: 'route7', fromEdge: 'south', to: 'fuchsia_city', toX: 12, toY: 3 },
  
  // Saffron → Route 8 → Cinnabar
  { from: 'saffron_city', fromEdge: 'east', to: 'route8', toX: 1, toY: 10 },
  { from: 'route8', fromEdge: 'east', to: 'cinnabar_island', toX: 3, toY: 10 },
  { from: 'cinnabar_island', fromEdge: 'west', to: 'route8', toX: 18, toY: 10 },
  { from: 'route8', fromEdge: 'west', to: 'saffron_city', toX: 22, toY: 10 },
  
  // Cinnabar → Route 9 → back to Viridian (for gym)
  { from: 'cinnabar_island', fromEdge: 'north', to: 'route9', toX: 9, toY: 18 },
  { from: 'route9', fromEdge: 'north', to: 'viridian_city', toX: 12, toY: 17 },
  
  // Viridian north → Victory Road → Elite 4
  { from: 'viridian_city', fromEdge: 'north', to: 'victory_road', toX: 9, toY: 23 },
  { from: 'victory_road', fromEdge: 'south', to: 'viridian_city', toX: 12, toY: 3 },
  { from: 'victory_road', fromEdge: 'north', to: 'elite4', toX: 5, toY: 10 },
];

// Door connections for interiors
export interface DoorConnection {
  fromMap: string;
  fromX: number;
  fromY: number;
  toMap: string;
  toX: number;
  toY: number;
}

export const DOOR_CONNECTIONS: DoorConnection[] = [
  // Pallet Town
  { fromMap: 'pallet_town', fromX: 5, fromY: 5, toMap: 'player_house', toX: 3, toY: 6 },
  { fromMap: 'player_house', fromX: 3, fromY: 7, toMap: 'pallet_town', toX: 5, toY: 6 },
  { fromMap: 'player_house', fromX: 4, fromY: 7, toMap: 'pallet_town', toX: 5, toY: 6 },
  { fromMap: 'pallet_town', fromX: 15, fromY: 16, toMap: 'oak_lab', toX: 5, toY: 8 },
  { fromMap: 'oak_lab', fromX: 5, fromY: 9, toMap: 'pallet_town', toX: 15, toY: 17 },
  { fromMap: 'oak_lab', fromX: 6, fromY: 9, toMap: 'pallet_town', toX: 15, toY: 17 },
  
  // Viridian Pokecenter/Mart
  { fromMap: 'viridian_city', fromX: 6, fromY: 7, toMap: 'pokecenter', toX: 4, toY: 6 },
  { fromMap: 'pokecenter', fromX: 4, fromY: 7, toMap: 'viridian_city', toX: 6, toY: 8 },
  { fromMap: 'pokecenter', fromX: 5, fromY: 7, toMap: 'viridian_city', toX: 6, toY: 8 },
  { fromMap: 'viridian_city', fromX: 18, fromY: 7, toMap: 'pokemart', toX: 3, toY: 6 },
  { fromMap: 'pokemart', fromX: 3, fromY: 7, toMap: 'viridian_city', toX: 18, toY: 8 },
  { fromMap: 'pokemart', fromX: 4, fromY: 7, toMap: 'viridian_city', toX: 18, toY: 8 },
  
  // Gym doors - all cities use same gym interior but different states
  { fromMap: 'pewter_city', fromX: 18, fromY: 8, toMap: 'gym_pewter', toX: 5, toY: 12 },
  { fromMap: 'gym_pewter', fromX: 5, fromY: 13, toMap: 'pewter_city', toX: 18, toY: 9 },
  { fromMap: 'gym_pewter', fromX: 6, fromY: 13, toMap: 'pewter_city', toX: 18, toY: 9 },
  
  { fromMap: 'cerulean_city', fromX: 18, fromY: 8, toMap: 'gym_cerulean', toX: 5, toY: 12 },
  { fromMap: 'gym_cerulean', fromX: 5, fromY: 13, toMap: 'cerulean_city', toX: 18, toY: 9 },
  { fromMap: 'gym_cerulean', fromX: 6, fromY: 13, toMap: 'cerulean_city', toX: 18, toY: 9 },
  
  { fromMap: 'vermilion_city', fromX: 18, fromY: 8, toMap: 'gym_vermilion', toX: 5, toY: 12 },
  { fromMap: 'gym_vermilion', fromX: 5, fromY: 13, toMap: 'vermilion_city', toX: 18, toY: 9 },
  { fromMap: 'gym_vermilion', fromX: 6, fromY: 13, toMap: 'vermilion_city', toX: 18, toY: 9 },

  // Pewter/Cerulean pokecenter/mart doors
  { fromMap: 'pewter_city', fromX: 6, fromY: 7, toMap: 'pokecenter', toX: 4, toY: 6 },
  { fromMap: 'pewter_city', fromX: 6, fromY: 15, toMap: 'pokemart', toX: 3, toY: 6 },
  { fromMap: 'cerulean_city', fromX: 6, fromY: 7, toMap: 'pokecenter', toX: 4, toY: 6 },
  { fromMap: 'cerulean_city', fromX: 6, fromY: 15, toMap: 'pokemart', toX: 3, toY: 6 },
  { fromMap: 'vermilion_city', fromX: 6, fromY: 7, toMap: 'pokecenter', toX: 4, toY: 6 },
  { fromMap: 'vermilion_city', fromX: 6, fromY: 15, toMap: 'pokemart', toX: 3, toY: 6 },
];

// All maps
export function getAllMaps(): Record<string, GameMap> {
  const maps: Record<string, GameMap> = {
    pallet_town: createPalletTown(),
    player_house: createPlayerHouse(),
    oak_lab: createOakLab(),
    route1: createRoute1(),
    viridian_city: createViridianCity(),
    pokecenter: createPokecenter(),
    pokemart: createPokemart(),
    route2: createRoute2(),
    pewter_city: createPewterCity(),
    gym_pewter: createGymInterior('gym_pewter'),
    route3: createRoute3(),
    cerulean_city: createCeruleanCity(),
    gym_cerulean: createGymInterior('gym_cerulean'),
    route4: createRoute4(),
    vermilion_city: createVermilionCity(),
    gym_vermilion: createGymInterior('gym_vermilion'),
    route5: createGenericRoute('route5', 'Route 5', [
      { speciesId: 'oddling', minLevel: 18, maxLevel: 22, weight: 25 },
      { speciesId: 'growlith', minLevel: 18, maxLevel: 22, weight: 20 },
      { speciesId: 'meowzy', minLevel: 18, maxLevel: 22, weight: 20 },
      { speciesId: 'psydux', minLevel: 19, maxLevel: 22, weight: 20 },
      { speciesId: 'magnolt', minLevel: 19, maxLevel: 22, weight: 15 },
    ]),
    celadon_city: createCeladonCity(),
    gym_celadon: createGymInterior('gym_celadon'),
    route6: createGenericRoute('route6', 'Route 6', [
      { speciesId: 'foxflame', minLevel: 22, maxLevel: 26, weight: 20 },
      { speciesId: 'slowpox', minLevel: 23, maxLevel: 27, weight: 20 },
      { speciesId: 'stingbee', minLevel: 22, maxLevel: 26, weight: 20 },
      { speciesId: 'frostkit', minLevel: 23, maxLevel: 27, weight: 20 },
      { speciesId: 'ghoulby', minLevel: 24, maxLevel: 27, weight: 20 },
    ]),
    fuchsia_city: createFuchsiaCity(),
    gym_fuchsia: createGymInterior('gym_fuchsia'),
    route7: createGenericRoute('route7', 'Route 7', [
      { speciesId: 'cobrix', minLevel: 28, maxLevel: 32, weight: 20 },
      { speciesId: 'psyclops', minLevel: 28, maxLevel: 32, weight: 15 },
      { speciesId: 'spectrox', minLevel: 28, maxLevel: 32, weight: 15 },
      { speciesId: 'glacirex', minLevel: 28, maxLevel: 32, weight: 15 },
      { speciesId: 'snorlord', minLevel: 30, maxLevel: 32, weight: 5 },
      { speciesId: 'drakelet', minLevel: 28, maxLevel: 32, weight: 10 },
    ]),
    saffron_city: createSaffronCity(),
    gym_saffron: createGymInterior('gym_saffron'),
    route8: createGenericRoute('route8', 'Route 8', [
      { speciesId: 'fossilon', minLevel: 30, maxLevel: 35, weight: 15 },
      { speciesId: 'jinxia', minLevel: 30, maxLevel: 35, weight: 15 },
      { speciesId: 'draconix', minLevel: 32, maxLevel: 36, weight: 5 },
      { speciesId: 'boulderox', minLevel: 30, maxLevel: 35, weight: 20 },
      { speciesId: 'champeon', minLevel: 30, maxLevel: 35, weight: 20 },
    ]),
    cinnabar_island: createCinnabarIsland(),
    gym_cinnabar: createGymInterior('gym_cinnabar'),
    route9: createGenericRoute('route9', 'Route 9', [
      { speciesId: 'draconix', minLevel: 35, maxLevel: 40, weight: 10 },
      { speciesId: 'spectrox', minLevel: 34, maxLevel: 38, weight: 20 },
      { speciesId: 'champeon', minLevel: 34, maxLevel: 38, weight: 20 },
      { speciesId: 'glacirex', minLevel: 34, maxLevel: 38, weight: 20 },
    ]),
    gym_viridian: createGymInterior('gym_viridian'),
    victory_road: createVictoryRoad(),
    elite4: createElite4(),
  };

  // Celadon doors: pokecenter door at 5,6; gym door at 19,7; dept store (mart) at 6,17
  DOOR_CONNECTIONS.push(
    { fromMap: 'celadon_city', fromX: 5, fromY: 6, toMap: 'pokecenter', toX: 4, toY: 6 },
    { fromMap: 'celadon_city', fromX: 19, fromY: 7, toMap: 'gym_celadon', toX: 5, toY: 12 },
    { fromMap: 'gym_celadon', fromX: 5, fromY: 13, toMap: 'celadon_city', toX: 19, toY: 8 },
    { fromMap: 'gym_celadon', fromX: 6, fromY: 13, toMap: 'celadon_city', toX: 19, toY: 8 },
    { fromMap: 'celadon_city', fromX: 6, fromY: 17, toMap: 'pokemart', toX: 3, toY: 6 },
  );

  // Fuchsia doors: pokecenter door at 5,7; gym door at 17,7; mart at 5,14
  DOOR_CONNECTIONS.push(
    { fromMap: 'fuchsia_city', fromX: 5, fromY: 7, toMap: 'pokecenter', toX: 4, toY: 6 },
    { fromMap: 'fuchsia_city', fromX: 17, fromY: 7, toMap: 'gym_fuchsia', toX: 5, toY: 12 },
    { fromMap: 'gym_fuchsia', fromX: 5, fromY: 13, toMap: 'fuchsia_city', toX: 17, toY: 8 },
    { fromMap: 'gym_fuchsia', fromX: 6, fromY: 13, toMap: 'fuchsia_city', toX: 17, toY: 8 },
    { fromMap: 'fuchsia_city', fromX: 5, fromY: 14, toMap: 'pokemart', toX: 3, toY: 6 },
  );

  // Saffron doors: pokecenter door at 5,5; gym door at 20,5; mart at 5,17
  DOOR_CONNECTIONS.push(
    { fromMap: 'saffron_city', fromX: 5, fromY: 5, toMap: 'pokecenter', toX: 4, toY: 6 },
    { fromMap: 'saffron_city', fromX: 20, fromY: 5, toMap: 'gym_saffron', toX: 5, toY: 12 },
    { fromMap: 'gym_saffron', fromX: 5, fromY: 13, toMap: 'saffron_city', toX: 20, toY: 6 },
    { fromMap: 'gym_saffron', fromX: 6, fromY: 13, toMap: 'saffron_city', toX: 20, toY: 6 },
    { fromMap: 'saffron_city', fromX: 5, fromY: 17, toMap: 'pokemart', toX: 3, toY: 6 },
  );

  // Cinnabar doors: pokecenter door at 8,8; gym door at 17,8; mart at 8,15
  DOOR_CONNECTIONS.push(
    { fromMap: 'cinnabar_island', fromX: 8, fromY: 8, toMap: 'pokecenter', toX: 4, toY: 6 },
    { fromMap: 'cinnabar_island', fromX: 17, fromY: 8, toMap: 'gym_cinnabar', toX: 5, toY: 12 },
    { fromMap: 'gym_cinnabar', fromX: 5, fromY: 13, toMap: 'cinnabar_island', toX: 17, toY: 9 },
    { fromMap: 'gym_cinnabar', fromX: 6, fromY: 13, toMap: 'cinnabar_island', toX: 17, toY: 9 },
    { fromMap: 'cinnabar_island', fromX: 8, fromY: 15, toMap: 'pokemart', toX: 3, toY: 6 },
  );

  return maps;
}

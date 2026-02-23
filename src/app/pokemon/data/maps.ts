// Tile types
export const TILE = {
  GRASS: 0,
  PATH: 1,
  TREE: 2,
  BUILDING_WALL: 3,
  BUILDING_ROOF: 4,
  WATER: 5,
  TALL_GRASS: 6,
  DOOR: 7,
  SIGN: 8,
  LEDGE: 9,
  FENCE: 10,
  FLOWER: 11,
  BUILDING_FLOOR: 12,
  COUNTER: 13,
  HEAL_MACHINE: 14,
  PC_MACHINE: 15,
  SHELF: 16,
  TABLE: 17,
  MAT: 18,
} as const;

export type TileType = (typeof TILE)[keyof typeof TILE];

export interface MapConnection {
  direction: 'north' | 'south' | 'east' | 'west';
  targetMap: string;
  targetX: number;
  targetY: number;
  fromXMin: number;
  fromXMax: number;
  fromY: number;
}

export interface MapSign {
  x: number;
  y: number;
  text: string;
}

export interface MapNPC {
  x: number;
  y: number;
  name: string;
  dialog: string[];
  direction: 'down' | 'up' | 'left' | 'right';
}

export interface MapDoor {
  x: number;
  y: number;
  targetMap: string;
  targetX: number;
  targetY: number;
}

export interface MapData {
  id: string;
  name: string;
  width: number;
  height: number;
  tiles: number[][];
  collision: boolean[][];
  connections: MapConnection[];
  signs: MapSign[];
  npcs: MapNPC[];
  doors: MapDoor[];
  encounterZone?: string; // key into ROUTE_ENCOUNTERS
}

// Pallet Town: 20x18
const palletTownTiles: number[][] = (() => {
  const w = 20, h = 18;
  const tiles: number[][] = [];
  for (let y = 0; y < h; y++) {
    tiles[y] = [];
    for (let x = 0; x < w; x++) {
      tiles[y][x] = TILE.GRASS;
    }
  }

  // Trees border (top, left, right)
  for (let x = 0; x < w; x++) { tiles[0][x] = TILE.TREE; }
  for (let y = 0; y < h; y++) { tiles[y][0] = TILE.TREE; tiles[y][w - 1] = TILE.TREE; }

  // Water at bottom
  for (let x = 0; x < w; x++) { tiles[h - 1][x] = TILE.WATER; tiles[h - 2][x] = TILE.WATER; }

  // Main path (vertical center)
  for (let y = 1; y < h - 2; y++) {
    tiles[y][9] = TILE.PATH;
    tiles[y][10] = TILE.PATH;
  }

  // Horizontal path connecting buildings
  for (let x = 3; x < 17; x++) {
    tiles[7][x] = TILE.PATH;
  }

  // Player's house (left, rows 3-6, cols 3-7)
  for (let y = 3; y <= 4; y++) for (let x = 3; x <= 7; x++) tiles[y][x] = TILE.BUILDING_ROOF;
  for (let y = 5; y <= 6; y++) for (let x = 3; x <= 7; x++) tiles[y][x] = TILE.BUILDING_WALL;
  tiles[6][5] = TILE.DOOR; // door

  // Rival's house (right, rows 3-6, cols 12-16)
  for (let y = 3; y <= 4; y++) for (let x = 12; x <= 16; x++) tiles[y][x] = TILE.BUILDING_ROOF;
  for (let y = 5; y <= 6; y++) for (let x = 12; x <= 16; x++) tiles[y][x] = TILE.BUILDING_WALL;
  tiles[6][14] = TILE.DOOR;

  // Oak's Lab (bottom center, rows 10-14, cols 7-13)
  for (let y = 10; y <= 11; y++) for (let x = 7; x <= 13; x++) tiles[y][x] = TILE.BUILDING_ROOF;
  for (let y = 12; y <= 14; y++) for (let x = 7; x <= 13; x++) tiles[y][x] = TILE.BUILDING_WALL;
  tiles[14][10] = TILE.DOOR;

  // Flowers near houses
  tiles[7][4] = TILE.FLOWER;
  tiles[7][6] = TILE.FLOWER;
  tiles[7][13] = TILE.FLOWER;
  tiles[7][15] = TILE.FLOWER;

  // Fence along south edge above water
  for (let x = 1; x < w - 1; x++) {
    if (tiles[h - 3][x] === TILE.GRASS) tiles[h - 3][x] = TILE.FENCE;
  }

  // North exit path
  tiles[0][9] = TILE.PATH;
  tiles[0][10] = TILE.PATH;

  return tiles;
})();

const palletTownCollision: boolean[][] = palletTownTiles.map(row =>
  row.map(tile => ([TILE.TREE, TILE.BUILDING_WALL, TILE.BUILDING_ROOF, TILE.WATER, TILE.FENCE, TILE.SIGN] as number[]).includes(tile))
);

// Route 1: 20x30
const route1Tiles: number[][] = (() => {
  const w = 20, h = 30;
  const tiles: number[][] = [];
  for (let y = 0; y < h; y++) {
    tiles[y] = [];
    for (let x = 0; x < w; x++) {
      tiles[y][x] = TILE.GRASS;
    }
  }

  // Tree borders
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < 3; x++) tiles[y][x] = TILE.TREE;
    for (let x = w - 3; x < w; x++) tiles[y][x] = TILE.TREE;
  }

  // Main path
  for (let y = 0; y < h; y++) {
    tiles[y][9] = TILE.PATH;
    tiles[y][10] = TILE.PATH;
  }

  // Tall grass patches
  // Patch 1: left side
  for (let y = 4; y <= 8; y++) {
    for (let x = 4; x <= 7; x++) tiles[y][x] = TILE.TALL_GRASS;
  }
  // Patch 2: right side
  for (let y = 10; y <= 14; y++) {
    for (let x = 12; x <= 15; x++) tiles[y][x] = TILE.TALL_GRASS;
  }
  // Patch 3: left side again
  for (let y = 17; y <= 21; y++) {
    for (let x = 4; x <= 8; x++) tiles[y][x] = TILE.TALL_GRASS;
  }
  // Patch 4: right side
  for (let y = 23; y <= 26; y++) {
    for (let x = 11; x <= 15; x++) tiles[y][x] = TILE.TALL_GRASS;
  }

  // Some ledges
  for (let x = 4; x <= 8; x++) tiles[15][x] = TILE.LEDGE;

  // Scattered trees for variety
  tiles[6][11] = TILE.TREE;
  tiles[6][12] = TILE.TREE;
  tiles[16][13] = TILE.TREE;
  tiles[16][14] = TILE.TREE;
  tiles[22][4] = TILE.TREE;
  tiles[22][5] = TILE.TREE;

  return tiles;
})();

const route1Collision: boolean[][] = route1Tiles.map(row =>
  row.map(tile => ([TILE.TREE, TILE.WATER, TILE.LEDGE] as number[]).includes(tile))
);

// Viridian City: 25x22
const viridianCityTiles: number[][] = (() => {
  const w = 25, h = 22;
  const tiles: number[][] = [];
  for (let y = 0; y < h; y++) {
    tiles[y] = [];
    for (let x = 0; x < w; x++) {
      tiles[y][x] = TILE.GRASS;
    }
  }

  // Tree borders
  for (let x = 0; x < w; x++) { tiles[0][x] = TILE.TREE; tiles[h - 1][x] = TILE.TREE; }
  for (let y = 0; y < h; y++) { tiles[y][0] = TILE.TREE; tiles[y][w - 1] = TILE.TREE; }

  // Main paths
  // Vertical path from south entrance
  for (let y = 1; y < h - 1; y++) {
    tiles[y][12] = TILE.PATH;
    tiles[y][13] = TILE.PATH;
  }
  // Horizontal path
  for (let x = 1; x < w - 1; x++) {
    tiles[10][x] = TILE.PATH;
    tiles[11][x] = TILE.PATH;
  }

  // South exit
  tiles[h - 1][12] = TILE.PATH;
  tiles[h - 1][13] = TILE.PATH;

  // Pokémon Center (left side, rows 4-8, cols 3-8)
  for (let y = 4; y <= 5; y++) for (let x = 3; x <= 8; x++) tiles[y][x] = TILE.BUILDING_ROOF;
  for (let y = 6; y <= 8; y++) for (let x = 3; x <= 8; x++) tiles[y][x] = TILE.BUILDING_WALL;
  tiles[8][6] = TILE.DOOR;

  // Poké Mart (right side, rows 4-8, cols 16-21)
  for (let y = 4; y <= 5; y++) for (let x = 16; x <= 21; x++) tiles[y][x] = TILE.BUILDING_ROOF;
  for (let y = 6; y <= 8; y++) for (let x = 16; x <= 21; x++) tiles[y][x] = TILE.BUILDING_WALL;
  tiles[8][19] = TILE.DOOR;

  // Gym (top center, rows 1-3, cols 10-15) - with sign saying locked
  for (let y = 1; y <= 1; y++) for (let x = 9; x <= 15; x++) tiles[y][x] = TILE.BUILDING_ROOF;
  for (let y = 2; y <= 3; y++) for (let x = 9; x <= 15; x++) tiles[y][x] = TILE.BUILDING_WALL;
  tiles[3][12] = TILE.DOOR;

  // Some flowers and trees
  tiles[12][5] = TILE.FLOWER;
  tiles[12][6] = TILE.FLOWER;
  tiles[12][7] = TILE.FLOWER;
  tiles[14][3] = TILE.TREE;
  tiles[14][4] = TILE.TREE;
  tiles[14][20] = TILE.TREE;
  tiles[14][21] = TILE.TREE;

  // Sign
  tiles[9][6] = TILE.SIGN;
  tiles[9][19] = TILE.SIGN;

  return tiles;
})();

const viridianCityCollision: boolean[][] = viridianCityTiles.map(row =>
  row.map(tile => ([TILE.TREE, TILE.BUILDING_WALL, TILE.BUILDING_ROOF, TILE.WATER, TILE.FENCE, TILE.SIGN, TILE.COUNTER, TILE.SHELF] as number[]).includes(tile))
);

// Pokemon Center Interior: 12x10
const pokemonCenterTiles: number[][] = (() => {
  const w = 12, h = 10;
  const tiles: number[][] = [];
  for (let y = 0; y < h; y++) {
    tiles[y] = [];
    for (let x = 0; x < w; x++) {
      tiles[y][x] = TILE.BUILDING_FLOOR;
    }
  }

  // Walls
  for (let x = 0; x < w; x++) { tiles[0][x] = TILE.BUILDING_WALL; }
  for (let y = 0; y < h; y++) { tiles[y][0] = TILE.BUILDING_WALL; tiles[y][w - 1] = TILE.BUILDING_WALL; }

  // Counter
  for (let x = 3; x <= 8; x++) tiles[2][x] = TILE.COUNTER;

  // Healing machine behind counter
  tiles[1][5] = TILE.HEAL_MACHINE;
  tiles[1][6] = TILE.HEAL_MACHINE;

  // PC machine
  tiles[1][9] = TILE.PC_MACHINE;

  // Entrance mat
  tiles[h - 1][5] = TILE.MAT;
  tiles[h - 1][6] = TILE.MAT;

  // Some shelves
  tiles[1][2] = TILE.SHELF;
  tiles[4][1] = TILE.TABLE;
  tiles[4][2] = TILE.TABLE;
  tiles[6][1] = TILE.TABLE;
  tiles[6][2] = TILE.TABLE;

  return tiles;
})();

const pokemonCenterCollision: boolean[][] = pokemonCenterTiles.map(row =>
  row.map(tile => ([TILE.BUILDING_WALL, TILE.COUNTER, TILE.HEAL_MACHINE, TILE.SHELF, TILE.TABLE, TILE.PC_MACHINE] as number[]).includes(tile))
);

// Oak's Lab Interior: 10x12
const oaksLabTiles: number[][] = (() => {
  const w = 10, h = 12;
  const tiles: number[][] = [];
  for (let y = 0; y < h; y++) {
    tiles[y] = [];
    for (let x = 0; x < w; x++) {
      tiles[y][x] = TILE.BUILDING_FLOOR;
    }
  }

  // Walls
  for (let x = 0; x < w; x++) { tiles[0][x] = TILE.BUILDING_WALL; }
  for (let y = 0; y < h; y++) { tiles[y][0] = TILE.BUILDING_WALL; tiles[y][w - 1] = TILE.BUILDING_WALL; }

  // Shelves at top
  for (let x = 1; x <= 3; x++) tiles[1][x] = TILE.SHELF;
  for (let x = 6; x <= 8; x++) tiles[1][x] = TILE.SHELF;

  // Table with pokeballs (center)
  tiles[4][4] = TILE.TABLE;
  tiles[4][5] = TILE.TABLE;

  // Entrance mat
  tiles[h - 1][4] = TILE.MAT;
  tiles[h - 1][5] = TILE.MAT;

  // Machines on sides
  tiles[3][1] = TILE.PC_MACHINE;
  tiles[3][8] = TILE.PC_MACHINE;

  return tiles;
})();

const oaksLabCollision: boolean[][] = oaksLabTiles.map(row =>
  row.map(tile => ([TILE.BUILDING_WALL, TILE.SHELF, TILE.TABLE, TILE.PC_MACHINE] as number[]).includes(tile))
);

// Player's House Interior: 10x10
const playerHouseTiles: number[][] = (() => {
  const w = 10, h = 10;
  const tiles: number[][] = [];
  for (let y = 0; y < h; y++) {
    tiles[y] = [];
    for (let x = 0; x < w; x++) {
      tiles[y][x] = TILE.BUILDING_FLOOR;
    }
  }

  // Walls: top row and left/right columns
  for (let x = 0; x < w; x++) { tiles[0][x] = TILE.BUILDING_WALL; }
  for (let y = 0; y < h; y++) { tiles[y][0] = TILE.BUILDING_WALL; tiles[y][w - 1] = TILE.BUILDING_WALL; }

  // Bed
  tiles[2][3] = TILE.TABLE;
  tiles[2][4] = TILE.TABLE;

  // PC
  tiles[1][7] = TILE.PC_MACHINE;

  // Shelves
  tiles[1][8] = TILE.SHELF;
  tiles[1][9] = TILE.SHELF;

  // TV area
  tiles[4][3] = TILE.TABLE;
  tiles[4][4] = TILE.TABLE;

  // Exit mat
  tiles[9][4] = TILE.MAT;
  tiles[9][5] = TILE.MAT;

  return tiles;
})();

const playerHouseCollision: boolean[][] = playerHouseTiles.map(row =>
  row.map(tile => ([TILE.BUILDING_WALL, TILE.PC_MACHINE, TILE.SHELF, TILE.TABLE] as number[]).includes(tile))
);

// Rival's House Interior: 10x10
const rivalHouseTiles: number[][] = (() => {
  const w = 10, h = 10;
  const tiles: number[][] = [];
  for (let y = 0; y < h; y++) {
    tiles[y] = [];
    for (let x = 0; x < w; x++) {
      tiles[y][x] = TILE.BUILDING_FLOOR;
    }
  }

  // Walls: top row and left/right columns
  for (let x = 0; x < w; x++) { tiles[0][x] = TILE.BUILDING_WALL; }
  for (let y = 0; y < h; y++) { tiles[y][0] = TILE.BUILDING_WALL; tiles[y][w - 1] = TILE.BUILDING_WALL; }

  // Bed
  tiles[2][3] = TILE.TABLE;
  tiles[2][4] = TILE.TABLE;

  // PC
  tiles[1][7] = TILE.PC_MACHINE;

  // Shelves
  tiles[1][8] = TILE.SHELF;
  tiles[1][9] = TILE.SHELF;

  // TV area
  tiles[4][3] = TILE.TABLE;
  tiles[4][4] = TILE.TABLE;

  // Exit mat
  tiles[9][4] = TILE.MAT;
  tiles[9][5] = TILE.MAT;

  return tiles;
})();

const rivalHouseCollision: boolean[][] = rivalHouseTiles.map(row =>
  row.map(tile => ([TILE.BUILDING_WALL, TILE.PC_MACHINE, TILE.SHELF, TILE.TABLE] as number[]).includes(tile))
);

// Poké Mart Interior: 12x10
const pokeMartTiles: number[][] = (() => {
  const w = 12, h = 10;
  const tiles: number[][] = [];
  for (let y = 0; y < h; y++) {
    tiles[y] = [];
    for (let x = 0; x < w; x++) {
      tiles[y][x] = TILE.BUILDING_FLOOR;
    }
  }

  // Walls: top row and side columns
  for (let x = 0; x < w; x++) { tiles[0][x] = TILE.BUILDING_WALL; }
  for (let y = 0; y < h; y++) { tiles[y][0] = TILE.BUILDING_WALL; tiles[y][w - 1] = TILE.BUILDING_WALL; }

  // Counter across x:2-9 at y:2
  for (let x = 2; x <= 9; x++) tiles[2][x] = TILE.COUNTER;

  // Shelves
  tiles[1][1] = TILE.SHELF;
  tiles[1][10] = TILE.SHELF;
  tiles[4][1] = TILE.SHELF;
  tiles[5][1] = TILE.SHELF;
  tiles[4][10] = TILE.SHELF;
  tiles[5][10] = TILE.SHELF;

  // Exit mat
  tiles[9][5] = TILE.MAT;
  tiles[9][6] = TILE.MAT;

  return tiles;
})();

const pokeMartCollision: boolean[][] = pokeMartTiles.map(row =>
  row.map(tile => ([TILE.BUILDING_WALL, TILE.COUNTER, TILE.SHELF] as number[]).includes(tile))
);

export const MAPS: Record<string, MapData> = {
  palletTown: {
    id: 'palletTown',
    name: 'PALLET TOWN',
    width: 20,
    height: 18,
    tiles: palletTownTiles,
    collision: palletTownCollision,
    connections: [
      {
        direction: 'north',
        targetMap: 'route1',
        targetX: 9,
        targetY: 28,
        fromXMin: 9,
        fromXMax: 10,
        fromY: 0,
      },
    ],
    signs: [
      { x: 8, y: 7, text: 'PALLET TOWN\nShades of your journey await!' },
    ],
    npcs: [
      {
        x: 6, y: 9, name: 'Girl',
        dialog: ['Welcome to PALLET TOWN!', 'This is a small, quiet town.'],
        direction: 'down',
      },
    ],
    doors: [
      { x: 10, y: 14, targetMap: 'oaksLab', targetX: 4, targetY: 10 },
      { x: 5, y: 6, targetMap: 'playerHouse', targetX: 4, targetY: 8 },
      { x: 14, y: 6, targetMap: 'rivalHouse', targetX: 4, targetY: 8 },
    ],
  },
  route1: {
    id: 'route1',
    name: 'ROUTE 1',
    width: 20,
    height: 30,
    tiles: route1Tiles,
    collision: route1Collision,
    connections: [
      {
        direction: 'south',
        targetMap: 'palletTown',
        targetX: 9,
        targetY: 1,
        fromXMin: 9,
        fromXMax: 10,
        fromY: 29,
      },
      {
        direction: 'north',
        targetMap: 'viridianCity',
        targetX: 12,
        targetY: 20,
        fromXMin: 9,
        fromXMax: 10,
        fromY: 0,
      },
    ],
    signs: [
      { x: 8, y: 2, text: 'ROUTE 1\nVIRIDIAN CITY ahead.' },
    ],
    npcs: [
      {
        x: 11, y: 16, name: 'Youngster',
        dialog: [
          'If your POKéMON is hurt,',
          'you should heal it at a',
          'POKéMON CENTER.',
        ],
        direction: 'left',
      },
    ],
    doors: [],
    encounterZone: 'route1',
  },
  viridianCity: {
    id: 'viridianCity',
    name: 'VIRIDIAN CITY',
    width: 25,
    height: 22,
    tiles: viridianCityTiles,
    collision: viridianCityCollision,
    connections: [
      {
        direction: 'south',
        targetMap: 'route1',
        targetX: 9,
        targetY: 1,
        fromXMin: 12,
        fromXMax: 13,
        fromY: 21,
      },
    ],
    signs: [
      { x: 6, y: 9, text: 'VIRIDIAN CITY POKéMON CENTER\nHeal your POKéMON!' },
      { x: 19, y: 9, text: 'VIRIDIAN CITY POKé MART' },
    ],
    npcs: [
      {
        x: 14, y: 13, name: 'Old Man',
        dialog: [
          'Ah, VIRIDIAN CITY!',
          'The GYM here is locked.',
          'I wonder when the LEADER',
          'will return...',
        ],
        direction: 'down',
      },
    ],
    doors: [
      { x: 6, y: 8, targetMap: 'pokemonCenter', targetX: 5, targetY: 8 },
      { x: 19, y: 8, targetMap: 'pokeMart', targetX: 5, targetY: 8 },
    ],
  },
  pokemonCenter: {
    id: 'pokemonCenter',
    name: 'POKéMON CENTER',
    width: 12,
    height: 10,
    tiles: pokemonCenterTiles,
    collision: pokemonCenterCollision,
    connections: [],
    signs: [],
    npcs: [
      {
        x: 5, y: 3, name: 'Nurse Joy',
        dialog: [
          'Welcome to our POKéMON CENTER!',
          'We heal your POKéMON back to',
          'perfect health!',
          'Shall I heal your POKéMON?',
        ],
        direction: 'down',
      },
    ],
    doors: [
      { x: 5, y: 9, targetMap: 'viridianCity', targetX: 6, targetY: 9 },
      { x: 6, y: 9, targetMap: 'viridianCity', targetX: 6, targetY: 9 },
    ],
  },
  oaksLab: {
    id: 'oaksLab',
    name: "PROF. OAK'S LAB",
    width: 10,
    height: 12,
    tiles: oaksLabTiles,
    collision: oaksLabCollision,
    connections: [],
    signs: [],
    npcs: [
      {
        x: 5, y: 3, name: 'Prof. Oak',
        dialog: [
          'Welcome to the world of POKéMON!',
          'My name is OAK!',
          'People call me the POKéMON PROF!',
        ],
        direction: 'down',
      },
    ],
    doors: [
      { x: 4, y: 11, targetMap: 'palletTown', targetX: 10, targetY: 15 },
      { x: 5, y: 11, targetMap: 'palletTown', targetX: 10, targetY: 15 },
    ],
  },
  playerHouse: {
    id: 'playerHouse',
    name: "PLAYER'S HOUSE",
    width: 10,
    height: 10,
    tiles: playerHouseTiles,
    collision: playerHouseCollision,
    connections: [],
    signs: [],
    npcs: [
      {
        x: 5, y: 5, name: 'Mom',
        dialog: [
          'You should not run inside!',
          'Have you been to see PROF. OAK?',
          'Your POKeMON journey is just beginning!',
        ],
        direction: 'down',
      },
    ],
    doors: [
      { x: 4, y: 9, targetMap: 'palletTown', targetX: 5, targetY: 7 },
      { x: 5, y: 9, targetMap: 'palletTown', targetX: 5, targetY: 7 },
    ],
  },
  rivalHouse: {
    id: 'rivalHouse',
    name: "RIVAL'S HOUSE",
    width: 10,
    height: 10,
    tiles: rivalHouseTiles,
    collision: rivalHouseCollision,
    connections: [],
    signs: [],
    npcs: [
      {
        x: 5, y: 5, name: 'Sister',
        dialog: [
          'My brother BLUE went to PROF. OAK.',
          'He said something about a POKeMON!',
          'You should go see the PROFESSOR too!',
        ],
        direction: 'down',
      },
    ],
    doors: [
      { x: 4, y: 9, targetMap: 'palletTown', targetX: 14, targetY: 7 },
      { x: 5, y: 9, targetMap: 'palletTown', targetX: 14, targetY: 7 },
    ],
  },
  pokeMart: {
    id: 'pokeMart',
    name: 'POKe MART',
    width: 12,
    height: 10,
    tiles: pokeMartTiles,
    collision: pokeMartCollision,
    connections: [],
    signs: [],
    npcs: [
      {
        x: 5, y: 3, name: 'Clerk',
        dialog: [
          'Welcome to the POKe MART!',
          'We have all your POKeMON needs!',
          'Come back anytime!',
        ],
        direction: 'down',
      },
    ],
    doors: [
      { x: 5, y: 9, targetMap: 'viridianCity', targetX: 19, targetY: 9 },
      { x: 6, y: 9, targetMap: 'viridianCity', targetX: 19, targetY: 9 },
    ],
  },
};

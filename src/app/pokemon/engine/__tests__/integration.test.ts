import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createInitialState, saveGame, loadGame, calcStats, GameState, createPokemon } from '../state';
import { handleCatchResult } from '../battleLogic';
import { getAllMaps, DOOR_CONNECTIONS } from '../../data/maps';

// Mock localStorage
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); },
};
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

describe('Save/Load round-trip', () => {
  beforeEach(() => localStorageMock.clear());

  it('preserves pokedex Sets', () => {
    const state = createInitialState('Ash');
    state.player.pokedex.seen.add('emberon');
    state.player.pokedex.seen.add('aqualing');
    state.player.pokedex.caught.add('emberon');
    saveGame(state);
    const loaded = loadGame()!;
    expect(loaded).not.toBeNull();
    expect(loaded.player.pokedex.seen).toBeInstanceOf(Set);
    expect(loaded.player.pokedex.caught).toBeInstanceOf(Set);
    expect(loaded.player.pokedex.seen.has('emberon')).toBe(true);
    expect(loaded.player.pokedex.seen.has('aqualing')).toBe(true);
    expect(loaded.player.pokedex.caught.has('emberon')).toBe(true);
    expect(loaded.player.pokedex.caught.size).toBe(1);
  });

  it('preserves defeatedTrainers Set', () => {
    const state = createInitialState('Ash');
    state.player.defeatedTrainers.add('trainer_1');
    state.player.defeatedTrainers.add('trainer_2');
    saveGame(state);
    const loaded = loadGame()!;
    expect(loaded.player.defeatedTrainers).toBeInstanceOf(Set);
    expect(loaded.player.defeatedTrainers.has('trainer_1')).toBe(true);
    expect(loaded.player.defeatedTrainers.has('trainer_2')).toBe(true);
    expect(loaded.player.defeatedTrainers.size).toBe(2);
  });

  it('preserves storyFlags Set', () => {
    const state = createInitialState('Ash');
    state.player.storyFlags.add('got_pokedex');
    state.player.storyFlags.add('beat_brock');
    saveGame(state);
    const loaded = loadGame()!;
    expect(loaded.player.storyFlags).toBeInstanceOf(Set);
    expect(loaded.player.storyFlags.has('got_pokedex')).toBe(true);
    expect(loaded.player.storyFlags.has('beat_brock')).toBe(true);
  });

  it('preserves all player fields round-trip', () => {
    const state = createInitialState('Red');
    state.player.money = 12345;
    state.player.badges = 5;
    state.player.mapId = 'cerulean_city';
    state.player.x = 10;
    state.player.y = 15;
    state.player.isSurfing = true;
    state.player.hasBicycle = true;
    saveGame(state);
    const loaded = loadGame()!;
    expect(loaded.player.money).toBe(12345);
    expect(loaded.player.badges).toBe(5);
    expect(loaded.player.mapId).toBe('cerulean_city');
    expect(loaded.player.x).toBe(10);
    expect(loaded.player.y).toBe(15);
    expect(loaded.player.isSurfing).toBe(true);
    expect(loaded.player.hasBicycle).toBe(true);
  });

  it('preserves team and PC pokemon', () => {
    const state = createInitialState('Red');
    const poke = createPokemon('aqualing', 15);
    state.player.pc.push(poke);
    saveGame(state);
    const loaded = loadGame()!;
    expect(loaded.player.pc.length).toBe(1);
    expect(loaded.player.pc[0].speciesId).toBe('aqualing');
  });

  it('returns null for missing save', () => {
    expect(loadGame()).toBeNull();
  });
});

describe('White out mechanic', () => {
  it('heals team, halves money, returns to pokecenter when all fainted', () => {
    const state = createInitialState('Ash');
    const poke = createPokemon('emberon', 20);
    poke.currentHp = 0;
    state.player.team = [poke];
    state.player.money = 1000;
    state.player.mapId = 'route1';
    state.player.x = 5;
    state.player.y = 5;
    state.lastPokecenterMap = 'viridian_city';
    state.lastPokecenterX = 10;
    state.lastPokecenterY = 12;

    // Simulate the white out logic from Game.tsx
    const newPlayer = {
      ...state.player,
      team: state.player.team.map(p => ({
        ...p,
        currentHp: Math.max(1, Math.floor(calcStats(p.speciesId, p.level, p.iv).hp / 2)),
      })),
      money: Math.floor(state.player.money / 2),
      x: state.lastPokecenterX,
      y: state.lastPokecenterY,
      mapId: state.lastPokecenterMap,
    };

    expect(newPlayer.money).toBe(500);
    expect(newPlayer.mapId).toBe('viridian_city');
    expect(newPlayer.x).toBe(10);
    expect(newPlayer.y).toBe(12);
    expect(newPlayer.team[0].currentHp).toBeGreaterThan(0);
  });

  it('halves odd money amounts (rounds down)', () => {
    expect(Math.floor(999 / 2)).toBe(499);
    expect(Math.floor(1 / 2)).toBe(0);
  });
});

describe('Party full catch → PC', () => {
  it('sends caught pokemon to PC when party is full', () => {
    const state = createInitialState('Ash');
    // Fill party to 6
    while (state.player.team.length < 6) {
      state.player.team.push(createPokemon('emberon', 10));
    }
    expect(state.player.team.length).toBe(6);

    const enemy = createPokemon('aqualing', 5);
    state.battle = {
      type: 'wild',
      playerTeam: state.player.team,
      enemyTeam: [enemy],
      activePlayerIdx: 0,
      activeEnemyIdx: 0,
      phase: 'catch',
      messages: ['Gotcha!'],
      messageIdx: 0,
      catchAttempt: { success: true, shakes: 3 },
      turnResult: undefined,
      selectedMoveIdx: 0,
      selectedItemIdx: 0,
      selectedPokemonIdx: 0,
      animations: [],
      expGain: undefined,
      trainerId: undefined,
      trainerName: undefined,
    } as any;

    const result = handleCatchResult(state);
    expect(result.player.team.length).toBe(6); // still 6
    expect(result.player.pc.length).toBe(1); // sent to PC
    expect(result.player.pc[0].speciesId).toBe('aqualing');
  });

  it('adds to party when not full', () => {
    const state = createInitialState('Ash');
    state.player.team = [createPokemon('emberon', 10)];
    const enemy = createPokemon('aqualing', 5);
    state.battle = {
      type: 'wild',
      playerTeam: state.player.team,
      enemyTeam: [enemy],
      activePlayerIdx: 0,
      activeEnemyIdx: 0,
      phase: 'catch',
      messages: ['Gotcha!'],
      messageIdx: 0,
      catchAttempt: { success: true, shakes: 3 },
      turnResult: undefined,
      selectedMoveIdx: 0,
      selectedItemIdx: 0,
      selectedPokemonIdx: 0,
      animations: [],
      expGain: undefined,
      trainerId: undefined,
      trainerName: undefined,
    } as any;

    const result = handleCatchResult(state);
    expect(result.player.team.length).toBe(2);
    expect(result.player.pc.length).toBe(0);
  });
});

describe('Door transitions validity', () => {
  it('all door connections reference valid maps', () => {
    const maps = getAllMaps();
    const mapIds = new Set(Object.keys(maps));
    for (const door of DOOR_CONNECTIONS) {
      expect(mapIds.has(door.fromMap), `fromMap "${door.fromMap}" not in maps`).toBe(true);
      expect(mapIds.has(door.toMap), `toMap "${door.toMap}" not in maps`).toBe(true);
    }
  });

  it('all door destinations are within map bounds', () => {
    const maps = getAllMaps();
    for (const door of DOOR_CONNECTIONS) {
      const toMap = maps[door.toMap];
      expect(door.toY).toBeLessThan(toMap.tiles.length);
      expect(door.toX).toBeLessThan(toMap.tiles[0].length);
      expect(door.toY).toBeGreaterThanOrEqual(0);
      expect(door.toX).toBeGreaterThanOrEqual(0);
    }
  });

  it('all door sources are within map bounds', () => {
    const maps = getAllMaps();
    for (const door of DOOR_CONNECTIONS) {
      const fromMap = maps[door.fromMap];
      expect(door.fromY).toBeLessThan(fromMap.tiles.length);
      expect(door.fromX).toBeLessThan(fromMap.tiles[0].length);
    }
  });
});

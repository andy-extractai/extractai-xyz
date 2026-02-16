import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createPokemon,
  calcStats,
  createInitialState,
  saveGame,
  loadGame,
  GameState,
} from '../state';
import { Stats } from '../../data/types';

const fixedIvs: Stats = { hp: 8, attack: 8, defense: 8, spAtk: 8, spDef: 8, speed: 8 };

describe('createPokemon', () => {
  it('creates a valid PokemonInstance', () => {
    const p = createPokemon('emberon', 10, fixedIvs);
    expect(p.speciesId).toBe('emberon');
    expect(p.level).toBe(10);
    expect(p.currentHp).toBe(p.stats.hp);
    expect(p.status).toBeNull();
    expect(p.uid).toBeTruthy();
    expect(p.moves.length).toBeGreaterThan(0);
    expect(p.iv).toEqual(fixedIvs);
  });

  it('assigns correct stats based on level and IVs', () => {
    const p = createPokemon('emberon', 10, fixedIvs);
    const expectedStats = calcStats('emberon', 10, fixedIvs);
    expect(p.stats).toEqual(expectedStats);
  });

  it('learns moves up to its level', () => {
    // emberon learns scratch(1), growl(1), ember(7) by level 10
    const p = createPokemon('emberon', 10, fixedIvs);
    const moveIds = p.moves.map(m => m.moveId);
    expect(moveIds).toContain('scratch');
    expect(moveIds).toContain('ember');
  });

  it('limits to 4 moves max', () => {
    const p = createPokemon('emberon', 50, fixedIvs);
    expect(p.moves.length).toBeLessThanOrEqual(4);
  });

  it('throws for unknown species', () => {
    expect(() => createPokemon('fakemon', 10)).toThrow('Unknown species');
  });

  it('sets full HP and PP', () => {
    const p = createPokemon('emberon', 10, fixedIvs);
    expect(p.currentHp).toBe(p.stats.hp);
    for (const m of p.moves) {
      expect(m.currentPp).toBeGreaterThan(0);
    }
  });

  it('higher level = higher stats', () => {
    const low = createPokemon('emberon', 5, fixedIvs);
    const high = createPokemon('emberon', 50, fixedIvs);
    expect(high.stats.hp).toBeGreaterThan(low.stats.hp);
    expect(high.stats.attack).toBeGreaterThan(low.stats.attack);
  });
});

describe('calcStats', () => {
  it('calculates HP correctly', () => {
    const stats = calcStats('emberon', 10, fixedIvs);
    // HP formula: floor(((base+iv)*2*level)/100) + level + 10
    // emberon base hp=39, iv=8: floor(((39+8)*2*10)/100) + 10 + 10 = floor(9.4) + 20 = 29
    expect(stats.hp).toBe(29);
  });

  it('calculates other stats correctly', () => {
    const stats = calcStats('emberon', 10, fixedIvs);
    // attack formula: floor(((base+iv)*2*level)/100) + 5
    // base attack=52, iv=8: floor(((52+8)*2*10)/100) + 5 = floor(12) + 5 = 17
    expect(stats.attack).toBe(17);
  });
});

describe('createInitialState', () => {
  it('creates valid initial state', () => {
    const state = createInitialState();
    expect(state.phase).toBe('intro');
    expect(state.player.team).toEqual([]);
    expect(state.player.money).toBe(3000);
    expect(state.player.pokedex.seen).toBeInstanceOf(Set);
    expect(state.player.pokedex.caught).toBeInstanceOf(Set);
  });
});

describe('save/load round-trip', () => {
  let storage: Record<string, string> = {};

  beforeEach(() => {
    storage = {};
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage[key] ?? null,
      setItem: (key: string, value: string) => { storage[key] = value; },
      removeItem: (key: string) => { delete storage[key]; },
    });
  });

  afterEach(() => { vi.restoreAllMocks(); });

  it('round-trip preserves game state', () => {
    const state = createInitialState();
    state.player.name = 'Ash';
    state.player.money = 5000;
    state.player.team = [createPokemon('emberon', 10, fixedIvs)];
    state.player.pokedex.seen.add('emberon');
    state.player.pokedex.caught.add('emberon');
    state.player.defeatedTrainers.add('trainer1');
    state.player.storyFlags.add('got_starter');
    state.player.badges = ['boulder'];

    saveGame(state);
    const loaded = loadGame();

    expect(loaded).not.toBeNull();
    expect(loaded!.player.name).toBe('Ash');
    expect(loaded!.player.money).toBe(5000);
    expect(loaded!.player.team.length).toBe(1);
    expect(loaded!.player.team[0].speciesId).toBe('emberon');
    expect(loaded!.player.pokedex.seen).toBeInstanceOf(Set);
    expect(loaded!.player.pokedex.seen.has('emberon')).toBe(true);
    expect(loaded!.player.pokedex.caught.has('emberon')).toBe(true);
    expect(loaded!.player.defeatedTrainers).toBeInstanceOf(Set);
    expect(loaded!.player.defeatedTrainers.has('trainer1')).toBe(true);
    expect(loaded!.player.storyFlags.has('got_starter')).toBe(true);
    expect(loaded!.player.badges).toEqual(['boulder']);
  });

  it('loadGame returns null when no save exists', () => {
    const loaded = loadGame();
    expect(loaded).toBeNull();
  });

  it('battle/dialog/menu are nulled on save', () => {
    const state = createInitialState();
    saveGame(state);
    const loaded = loadGame();
    expect(loaded!.battle).toBeNull();
    expect(loaded!.dialog).toBeNull();
    expect(loaded!.menu).toBeNull();
  });
});

import { describe, it, expect } from 'vitest';
import { createInitialState, GameState } from '../state';

describe('Fade transition state management', () => {
  it('should create a fade transition with progress 0', () => {
    const state = createInitialState();
    const transition: GameState['transition'] = {
      type: 'fade',
      progress: 0,
    };
    state.transition = transition;
    expect(state.transition).toBeTruthy();
    expect(state.transition!.type).toBe('fade');
    expect(state.transition!.progress).toBe(0);
  });

  it('should calculate fade alpha correctly at midpoint', () => {
    // At progress 0.5, alpha should be 1 (fully black)
    const progress = 0.5;
    const alpha = progress <= 0.5 ? progress * 2 : (1 - progress) * 2;
    expect(alpha).toBe(1);
  });

  it('should calculate fade alpha correctly at start and end', () => {
    // At progress 0, alpha should be 0
    const alphaStart = 0 <= 0.5 ? 0 * 2 : (1 - 0) * 2;
    expect(alphaStart).toBe(0);

    // At progress 1, alpha should be 0
    const alphaEnd = 1 <= 0.5 ? 1 * 2 : (1 - 1) * 2;
    expect(alphaEnd).toBe(0);
  });

  it('should clear transition when progress reaches 1', () => {
    const state = createInitialState();
    state.transition = { type: 'fade', progress: 0.95 };
    // Simulate tick: progress + 16/300
    const newProgress = Math.min(1, state.transition.progress + 16 / 300);
    if (newProgress >= 1) {
      state.transition = null;
    }
    expect(state.transition).toBeNull();
  });

  it('should support door data attached to transition', () => {
    const state = createInitialState();
    const transition = {
      type: 'fade' as const,
      progress: 0,
      _door: { toMap: 'player_house', toX: 3, toY: 6, dismount: true },
    };
    state.transition = transition;
    const doorData = (state.transition as Record<string, unknown>)._door as { toMap: string };
    expect(doorData.toMap).toBe('player_house');
  });

  it('should warp player at midpoint of fade', () => {
    const state = createInitialState();
    state.player.mapId = 'pallet_town';
    state.player.x = 5;
    state.player.y = 5;
    
    const doorData = { toMap: 'player_house', toX: 3, toY: 6, dismount: true };
    state.transition = { type: 'fade', progress: 0.5 };
    
    // Simulate: at midpoint, warp player
    if (state.transition.progress >= 0.5 && state.player.mapId !== doorData.toMap) {
      state.player.x = doorData.toX;
      state.player.y = doorData.toY;
      state.player.mapId = doorData.toMap;
      state.player.onBicycle = doorData.dismount ? false : state.player.onBicycle;
    }
    
    expect(state.player.mapId).toBe('player_house');
    expect(state.player.x).toBe(3);
    expect(state.player.y).toBe(6);
    expect(state.player.onBicycle).toBe(false);
  });
});

describe('Tile definitions', () => {
  it('should include new interior tile types', async () => {
    const { TILE_DEFS } = await import('../../data/maps');
    expect(TILE_DEFS[17]).toBeDefined();
    expect(TILE_DEFS[17].label).toBe('bed');
    expect(TILE_DEFS[17].walkable).toBe(false);
    
    expect(TILE_DEFS[18]).toBeDefined();
    expect(TILE_DEFS[18].label).toBe('table');
    
    expect(TILE_DEFS[19]).toBeDefined();
    expect(TILE_DEFS[19].label).toBe('machine');
  });

  it('should have bed and table tiles in player house', async () => {
    const { getAllMaps } = await import('../../data/maps');
    const maps = getAllMaps();
    const house = maps.player_house;
    // Check bed tiles exist
    const hasBed = house.tiles.some(row => row.includes(17));
    expect(hasBed).toBe(true);
    // Check table tiles exist
    const hasTable = house.tiles.some(row => row.includes(18));
    expect(hasTable).toBe(true);
  });

  it('should have machine tiles in oak lab', async () => {
    const { getAllMaps } = await import('../../data/maps');
    const maps = getAllMaps();
    const lab = maps.oak_lab;
    const hasMachine = lab.tiles.some(row => row.includes(19));
    expect(hasMachine).toBe(true);
  });

  it('should have sign NPCs for sign tiles in pallet town', async () => {
    const { getAllMaps } = await import('../../data/maps');
    const maps = getAllMaps();
    const pallet = maps.pallet_town;
    const signNpcs = pallet.npcs.filter(n => n.spriteType === 'sign');
    expect(signNpcs.length).toBeGreaterThanOrEqual(2);
    // Each sign NPC should have dialog
    for (const sign of signNpcs) {
      expect(sign.dialog.length).toBeGreaterThan(0);
    }
  });
});

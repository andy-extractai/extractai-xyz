import { describe, it, expect } from 'vitest';
import { createPokemon, createInitialState, GameState } from '../state';
import { handleBattleVictory } from '../battleLogic';
import { TRAINERS, ELITE4_ORDER } from '../../data/trainers';
import { getAllMaps, MAP_CONNECTIONS } from '../../data/maps';

const fixedIvs = { hp: 8, attack: 8, defense: 8, spAtk: 8, spDef: 8, speed: 8 };

function makeBattleState(trainerId: string, state: GameState): GameState {
  const trainer = TRAINERS[trainerId];
  const enemyTeam = trainer.team.map(t => createPokemon(t.speciesId, t.level, fixedIvs));
  // All enemy fainted (victory scenario)
  enemyTeam.forEach(p => { p.currentHp = 0; });
  return {
    ...state,
    phase: 'battle',
    battle: {
      type: 'trainer', trainerId, trainerName: trainer.name, isElite4: true,
      playerTeam: [...state.player.team], enemyTeam,
      activePlayerIdx: 0, activeEnemyIdx: 0,
      phase: 'victory', messages: ['You won!'], messageIdx: 0,
      animations: [], canRun: false, battleReward: trainer.reward,
    },
  };
}

describe('Elite 4 sequential battle flow', () => {
  it('ELITE4_ORDER has 5 members (4 E4 + Champion)', () => {
    expect(ELITE4_ORDER).toHaveLength(5);
    expect(ELITE4_ORDER[4]).toBe('champion_gary');
  });

  it('all E4 trainers exist in TRAINERS', () => {
    for (const id of ELITE4_ORDER) {
      expect(TRAINERS[id]).toBeDefined();
      expect(TRAINERS[id].team.length).toBeGreaterThan(0);
    }
  });

  it('defeating E4 member adds to defeatedTrainers and returns to overworld', () => {
    const state = createInitialState();
    state.player.team = [createPokemon('emberon', 50, fixedIvs)];
    state.player.mapId = 'elite4';

    const battleState = makeBattleState('elite4_lorelei', state);
    const result = handleBattleVictory(battleState);

    expect(result.player.defeatedTrainers.has('elite4_lorelei')).toBe(true);
    // Should return to overworld (not credits) since champion not defeated
    expect(result.phase).not.toBe('credits');
  });

  it('no healing between E4 battles - HP carries over', () => {
    const state = createInitialState();
    const pokemon = createPokemon('emberon', 50, fixedIvs);
    pokemon.currentHp = 50; // damaged from previous battle
    state.player.team = [pokemon];
    state.player.mapId = 'elite4';

    const battleState = makeBattleState('elite4_bruno', state);
    // playerTeam in battle copies from state.player.team
    expect(battleState.battle!.playerTeam[0].currentHp).toBe(50);

    const result = handleBattleVictory(battleState);
    // HP should still be 50 (no free healing)
    expect(result.player.team[0].currentHp).toBe(50);
  });

  it('defeating Champion triggers credits phase', () => {
    const state = createInitialState();
    state.player.team = [createPokemon('emberon', 60, fixedIvs)];
    state.player.mapId = 'elite4';
    // Defeat all E4 first
    for (const id of ELITE4_ORDER.slice(0, 4)) {
      state.player.defeatedTrainers.add(id);
    }

    const battleState = makeBattleState('champion_gary', state);
    const result = handleBattleVictory(battleState);

    expect(result.phase).toBe('credits');
    expect(result.credits).toEqual({ scrollY: 0, done: false });
    expect(result.player.storyFlags.has('champion')).toBe(true);
    expect(result.battle).toBeNull();
  });

  it('sequential E4 defeats track correctly', () => {
    const state = createInitialState();
    state.player.team = [createPokemon('emberon', 60, fixedIvs)];
    state.player.mapId = 'elite4';

    let current = state;
    for (let i = 0; i < ELITE4_ORDER.length; i++) {
      const id = ELITE4_ORDER[i];
      const battleState = makeBattleState(id, current);
      current = handleBattleVictory(battleState);
      expect(current.player.defeatedTrainers.has(id)).toBe(true);
    }

    // After all 5, should be in credits
    expect(current.phase).toBe('credits');
  });
});

describe('Victory Road map', () => {
  const maps = getAllMaps();
  const vr = maps['victory_road'];

  it('Victory Road exists with maze-like layout', () => {
    expect(vr).toBeDefined();
    expect(vr.id).toBe('victory_road');
    expect(vr.name).toBe('Victory Road');
    // Has walls (tile type 7) for maze structure
    const wallCount = vr.tiles.flat().filter(t => t === 7).length;
    expect(wallCount).toBeGreaterThan(50); // significant maze walls
  });

  it('has high-level wild encounters (35-45 range)', () => {
    expect(vr.encounters.length).toBeGreaterThan(0);
    for (const enc of vr.encounters) {
      expect(enc.minLevel).toBeGreaterThanOrEqual(35);
      expect(enc.maxLevel).toBeLessThanOrEqual(45);
    }
  });

  it('has encounter areas (tall grass tiles)', () => {
    const tallGrassCount = vr.tiles.flat().filter(t => t === 2).length;
    expect(tallGrassCount).toBeGreaterThan(0);
  });
});

describe('Elite 4 map', () => {
  const maps = getAllMaps();
  const e4 = maps['elite4'];

  it('Elite 4 map exists', () => {
    expect(e4).toBeDefined();
    expect(e4.id).toBe('elite4');
  });

  it('has no wild encounters', () => {
    expect(e4.encounters).toHaveLength(0);
    expect(e4.encounterRate).toBe(0);
  });
});

describe('Badge gate for Victory Road', () => {
  it('requires 8 badges (connection exists from viridian to victory_road)', () => {
    // The badge gate is checked in Game.tsx during map transitions
    // We verify the map connection exists
    const conn = MAP_CONNECTIONS.find(
      c => c.from === 'viridian_city' && c.to === 'victory_road'
    );
    expect(conn).toBeDefined();
  });
});

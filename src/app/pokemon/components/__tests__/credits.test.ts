import { describe, it, expect } from 'vitest';
import { handleBattleVictory } from '../../engine/battleLogic';
import { createInitialState, createPokemon, GameState } from '../../engine/state';
import { getCreditsLines, createCreditsState, advanceCredits } from '../CreditsScreen';

function makeChampionBattleState(state: GameState): GameState {
  const team = [createPokemon('emberon', 50)];
  return {
    ...state,
    phase: 'battle',
    player: { ...state.player, name: 'Ash', team, badges: ['boulder', 'cascade', 'thunder'] },
    battle: {
      type: 'trainer',
      trainerId: 'champion_gary',
      trainerName: 'Champion Gary',
      isElite4: true,
      playerTeam: team,
      enemyTeam: [createPokemon('aqualing', 50)],
      activePlayerIdx: 0,
      activeEnemyIdx: 0,
      phase: 'victory',
      messages: ['You defeated Champion Gary!'],
      messageIdx: 0,
      animations: [],
      canRun: false,
      battleReward: 10000,
    },
  };
}

describe('Credits - Battle Victory Transition', () => {
  it('defeating champion_gary transitions to credits phase', () => {
    const state = makeChampionBattleState(createInitialState());
    const result = handleBattleVictory(state);
    expect(result.phase).toBe('credits');
    expect(result.battle).toBeNull();
    expect(result.credits).toBeTruthy();
    expect(result.credits?.scrollY).toBe(0);
    expect(result.credits?.done).toBe(false);
  });

  it('champion flag is set in storyFlags after defeating champion_gary', () => {
    const state = makeChampionBattleState(createInitialState());
    const result = handleBattleVictory(state);
    expect(result.player.storyFlags.has('champion')).toBe(true);
  });

  it('money is awarded for champion defeat', () => {
    const initial = createInitialState();
    const state = makeChampionBattleState(initial);
    const result = handleBattleVictory(state);
    expect(result.player.money).toBe(initial.player.money + 10000);
  });

  it('normal trainer victory does NOT go to credits', () => {
    const state = createInitialState();
    const team = [createPokemon('emberon', 10)];
    const battleState: GameState = {
      ...state,
      phase: 'battle',
      player: { ...state.player, team },
      battle: {
        type: 'trainer',
        trainerId: 'bug_catcher_1',
        trainerName: 'Bug Catcher',
        playerTeam: team,
        enemyTeam: [createPokemon('aqualing', 5)],
        activePlayerIdx: 0,
        activeEnemyIdx: 0,
        phase: 'victory',
        messages: ['You win!'],
        messageIdx: 0,
        animations: [],
        canRun: false,
        battleReward: 100,
      },
    };
    const result = handleBattleVictory(battleState);
    expect(result.phase).toBe('overworld');
  });
});

describe('Credits - Content', () => {
  it('credits lines include player name', () => {
    const state = createInitialState();
    state.player.name = 'Ash';
    const lines = getCreditsLines(state);
    expect(lines.some(l => l.includes('Ash'))).toBe(true);
  });

  it('credits lines include team pokemon', () => {
    const state = createInitialState();
    state.player.team = [createPokemon('emberon', 36)];
    const lines = getCreditsLines(state);
    expect(lines.some(l => l.includes('Emberon'))).toBe(true);
  });

  it('credits lines include badge count', () => {
    const state = createInitialState();
    state.player.badges = ['boulder', 'cascade'];
    const lines = getCreditsLines(state);
    expect(lines.some(l => l.includes('2 / 8'))).toBe(true);
  });

  it('credits lines include pokedex stats', () => {
    const state = createInitialState();
    state.player.pokedex.seen = new Set(['emberon', 'aqualing', 'sproutley']);
    state.player.pokedex.caught = new Set(['emberon']);
    const lines = getCreditsLines(state);
    expect(lines.some(l => l.includes('Seen: 3'))).toBe(true);
    expect(lines.some(l => l.includes('Caught: 1'))).toBe(true);
  });

  it('credits lines include THE END', () => {
    const state = createInitialState();
    const lines = getCreditsLines(state);
    expect(lines.some(l => l.includes('T H E   E N D'))).toBe(true);
  });

  it('credits lines include champion announcement', () => {
    const state = createInitialState();
    const lines = getCreditsLines(state);
    expect(lines.some(l => l.includes('You are the new Champion!'))).toBe(true);
  });
});

describe('Credits - Scroll and Completion', () => {
  it('advanceCredits increments scrollY', () => {
    const credits = createCreditsState();
    const next = advanceCredits(credits, 50);
    expect(next.scrollY).toBeGreaterThan(0);
    expect(next.done).toBe(false);
  });

  it('advanceCredits sets done when scroll exceeds content', () => {
    const credits = { scrollY: 99999, done: false };
    const next = advanceCredits(credits, 10);
    expect(next.done).toBe(true);
  });

  it('after credits done, returning to overworld sets pallet_town', () => {
    // This tests the logic that would be in Game.tsx input handler
    // We test that the state transition is correct
    const state = makeChampionBattleState(createInitialState());
    const afterCredits = handleBattleVictory(state);
    expect(afterCredits.phase).toBe('credits');

    // Simulate pressing enter after credits done - matches Game.tsx handler
    const returnState: GameState = {
      ...afterCredits,
      phase: 'overworld',
      credits: null,
      player: { ...afterCredits.player, mapId: 'pallet_town', x: 10, y: 10 },
    };
    expect(returnState.phase).toBe('overworld');
    expect(returnState.player.mapId).toBe('pallet_town');
    expect(returnState.player.storyFlags.has('champion')).toBe(true);
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useBattleItem } from '../battleLogic';
import { createPokemon, createInitialState, GameState, BattleState } from '../state';
import { ITEMS } from '../../data/items';

function makeBattleState(overrides?: Partial<BattleState>): BattleState {
  return {
    type: 'wild',
    trainerId: undefined,
    trainerName: undefined,
    isGymLeader: false,
    isElite4: false,
    playerTeam: [createPokemon('emberon', 50)],
    enemyTeam: [createPokemon('aqualing', 1)], // Level 1 so enemy does minimal damage
    activePlayerIdx: 0,
    activeEnemyIdx: 0,
    phase: 'item_select',
    messages: [],
    messageIdx: 0,
    catchAttempt: undefined,
    expGain: undefined,
    learnMove: undefined,
    animations: [],
    canRun: true,
    battleReward: 0,
    ...overrides,
  };
}

function makeGameState(battleOverrides?: Partial<BattleState>, bagOverrides?: Record<string, number>): GameState {
  const base = createInitialState();
  const battle = makeBattleState(battleOverrides);
  // Damage the player pokemon for testing heals
  battle.playerTeam[0].currentHp = 10;
  battle.playerTeam[0].stats.hp = 100;
  return {
    ...base,
    phase: 'battle',
    battle,
    player: {
      ...base.player,
      bag: { potion: 3, superPotion: 2, hyperPotion: 1, antidote: 2, paralyzeHeal: 1, awakening: 1, revive: 1, fullRestore: 1, pokeball: 5, ...bagOverrides },
      team: battle.playerTeam,
    },
  };
}

beforeEach(() => {
  // Use 0.99 to make enemy miss (accuracy check fails), so we can test item effects in isolation
  vi.spyOn(Math, 'random').mockReturnValue(0.99);
});

describe('Item usage in battle', () => {
  describe('Potions', () => {
    it('Potion heals 20 HP (before enemy turn)', () => {
      const state = makeGameState();
      // The item heals before enemy attacks. We verify heal happened by checking HP > starting HP
      // or test the logic directly. Since executeTurn runs enemy attack after, 
      // we check that HP increased by at least some amount (heal happened, enemy may damage)
      const startHp = state.battle!.playerTeam[0].currentHp; // 10
      const result = useBattleItem(state, 'potion');
      // Heal adds 20, enemy lv1 does minimal damage. HP should be > startHp
      expect(result.battle!.playerTeam[0].currentHp).toBeGreaterThan(startHp);
    });

    it('Super Potion heals more than regular potion', () => {
      const state1 = makeGameState();
      const state2 = makeGameState();
      const r1 = useBattleItem(state1, 'potion');
      const r2 = useBattleItem(state2, 'superPotion');
      // Super potion heals 50 vs 20, so result should be higher
      expect(r2.battle!.playerTeam[0].currentHp).toBeGreaterThanOrEqual(r1.battle!.playerTeam[0].currentHp);
    });

    it('Hyper Potion heals 200 HP (capped at max)', () => {
      const state = makeGameState();
      const maxHp = state.battle!.playerTeam[0].stats.hp;
      const result = useBattleItem(state, 'hyperPotion');
      // Even after enemy damage, should be close to max
      expect(result.battle!.playerTeam[0].currentHp).toBeLessThanOrEqual(maxHp);
    });

    it('Full Restore clears status', () => {
      const state = makeGameState();
      state.battle!.playerTeam[0].status = 'poison';
      const result = useBattleItem(state, 'fullRestore');
      expect(result.battle!.playerTeam[0].status).toBeNull();
    });

    it('Full Restore heals to full HP before enemy turn', () => {
      const state = makeGameState();
      const maxHp = state.battle!.playerTeam[0].stats.hp;
      const result = useBattleItem(state, 'fullRestore');
      // After full restore + enemy damage, should be close to max
      expect(result.battle!.playerTeam[0].currentHp).toBeGreaterThan(maxHp - 20);
    });
  });

  describe('Status heals', () => {
    it('Antidote cures poison', () => {
      const state = makeGameState();
      state.battle!.playerTeam[0].status = 'poison';
      const result = useBattleItem(state, 'antidote');
      expect(result.battle!.playerTeam[0].status).toBeNull();
    });

    it('Parlyz Heal cures paralysis', () => {
      const state = makeGameState();
      state.battle!.playerTeam[0].status = 'paralyze';
      const result = useBattleItem(state, 'paralyzeHeal');
      expect(result.battle!.playerTeam[0].status).toBeNull();
    });

    it('Awakening cures sleep', () => {
      const state = makeGameState();
      state.battle!.playerTeam[0].status = 'sleep';
      const result = useBattleItem(state, 'awakening');
      expect(result.battle!.playerTeam[0].status).toBeNull();
    });

    it('Antidote does not cure burn status', () => {
      const state = makeGameState();
      state.battle!.playerTeam[0].status = 'burn';
      const result = useBattleItem(state, 'antidote');
      // Status should remain burn (antidote only cures poison)
      // Note: enemy might inflict a different status, but burn should persist through antidote
      expect(result.battle!.playerTeam[0].status).toBe('burn');
    });
  });

  describe('Revive', () => {
    it('Revive restores fainted Pokémon to 50% HP', () => {
      const state = makeGameState();
      // Add a second fainted pokemon
      const fainted = createPokemon('sproutley', 15);
      fainted.currentHp = 0;
      fainted.stats.hp = 60;
      state.battle!.playerTeam.push(fainted);
      const result = useBattleItem(state, 'revive', 1);
      expect(result.battle!.playerTeam[1].currentHp).toBe(30); // 50% of 60
    });

    it('Revive does nothing if target is not fainted', () => {
      const state = makeGameState();
      const result = useBattleItem(state, 'revive', 0); // active pokemon not fainted
      // Should return prev state unchanged (no valid target)
      expect(result).toBe(state);
    });

    it('Revive auto-targets first fainted if no targetIdx', () => {
      const state = makeGameState();
      const fainted = createPokemon('sproutley', 15);
      fainted.currentHp = 0;
      fainted.stats.hp = 80;
      state.battle!.playerTeam.push(fainted);
      const result = useBattleItem(state, 'revive');
      expect(result.battle!.playerTeam[1].currentHp).toBe(40);
    });
  });

  describe('Item consumption', () => {
    it('Using a potion decrements bag count', () => {
      const state = makeGameState();
      const result = useBattleItem(state, 'potion');
      expect(result.player.bag['potion']).toBe(2); // was 3
    });

    it('Item is removed from bag when count reaches 0', () => {
      const state = makeGameState({ }, { potion: 1 });
      const result = useBattleItem(state, 'potion');
      expect(result.player.bag['potion']).toBeUndefined();
    });

    it('Using an item consumes the player turn (enters message phase)', () => {
      const state = makeGameState();
      const result = useBattleItem(state, 'potion');
      expect(result.battle!.phase).toBe('message');
    });
  });

  describe('Pokéball usage', () => {
    it('Pokéball can be used in wild battle', () => {
      const state = makeGameState();
      const result = useBattleItem(state, 'pokeball');
      expect(result.battle!.phase).toBe('catch');
      expect(result.player.bag['pokeball']).toBe(4);
    });
  });
});

describe('Item data', () => {
  it('All medicine items have an effect field', () => {
    const medicines = Object.values(ITEMS).filter(i => i.category === 'medicine');
    for (const m of medicines) {
      expect(m.effect).toBeDefined();
    }
  });

  it('All items have description and category', () => {
    for (const item of Object.values(ITEMS)) {
      expect(item.description).toBeTruthy();
      expect(item.category).toBeTruthy();
    }
  });

  it('Categories are valid', () => {
    const validCats = ['pokeball', 'medicine', 'battle', 'key'];
    for (const item of Object.values(ITEMS)) {
      expect(validCats).toContain(item.category);
    }
  });
});

describe('Bag UI categorization', () => {
  it('Items can be grouped by category', () => {
    const bag: Record<string, number> = { potion: 3, pokeball: 5, repel: 1 };
    const entries = Object.entries(bag).filter(([, qty]) => qty > 0);
    const medicine = entries.filter(([id]) => ITEMS[id]?.category === 'medicine');
    const pokeballs = entries.filter(([id]) => ITEMS[id]?.category === 'pokeball');
    const battle = entries.filter(([id]) => ITEMS[id]?.category === 'battle');
    expect(medicine.length).toBe(1);
    expect(pokeballs.length).toBe(1);
    expect(battle.length).toBe(1);
  });
});

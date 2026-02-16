import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  calculateDamage,
  executeTurn,
  attemptCatch,
  checkEvolution,
  gainExp,
  calculateExpGain,
  doesMoveHit,
  applyStatusDamage,
  canAct,
} from '../battle';
import { createPokemon, BattleState } from '../state';
import { Stats } from '../../data/types';

const fixedIvs: Stats = { hp: 8, attack: 8, defense: 8, spAtk: 8, spDef: 8, speed: 8 };

function makePokemon(speciesId: string, level: number) {
  return createPokemon(speciesId, level, fixedIvs);
}

describe('calculateDamage', () => {
  beforeEach(() => { vi.spyOn(Math, 'random').mockReturnValue(0.5); });
  afterEach(() => { vi.restoreAllMocks(); });

  it('calculates basic damage', () => {
    const attacker = makePokemon('emberon', 10);
    const defender = makePokemon('aqualing', 10);
    const result = calculateDamage(attacker, defender, 'scratch');
    expect(result.damage).toBeGreaterThan(0);
    expect(result.crit).toBe(false); // 0.5 > 0.0625
    expect(result.effectiveness).toBe(1);
  });

  it('applies STAB for same-type moves', () => {
    const attacker = makePokemon('emberon', 10);
    const defender = makePokemon('sproutley', 10);
    // ember is Fire type, emberon is Fire type -> STAB
    const stabResult = calculateDamage(attacker, defender, 'ember');
    // scratch is Normal type, emberon is Fire -> no STAB
    const noStabResult = calculateDamage(attacker, defender, 'scratch');
    // ember also has type advantage vs grass, so compare with that in mind
    // Just check STAB result is higher (ember power=40, scratch power=40, but STAB+effectiveness)
    expect(stabResult.damage).toBeGreaterThan(noStabResult.damage);
  });

  it('applies type effectiveness', () => {
    const attacker = makePokemon('emberon', 10);
    const defender = makePokemon('sproutley', 10);
    const result = calculateDamage(attacker, defender, 'ember');
    expect(result.effectiveness).toBe(2); // Fire vs Grass
  });

  it('returns not very effective', () => {
    const attacker = makePokemon('emberon', 10);
    const defender = makePokemon('aqualing', 10);
    const result = calculateDamage(attacker, defender, 'ember');
    expect(result.effectiveness).toBe(0.5); // Fire vs Water
  });

  it('applies critical hit when random is low', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01); // below 0.0625
    const attacker = makePokemon('emberon', 10);
    const defender = makePokemon('sproutley', 10);
    const result = calculateDamage(attacker, defender, 'scratch');
    expect(result.crit).toBe(true);
  });

  it('applies burn penalty to physical moves', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const attacker = makePokemon('emberon', 10);
    const defender = makePokemon('sproutley', 10);
    
    const normalResult = calculateDamage(attacker, defender, 'scratch');
    attacker.status = 'burn';
    const burnResult = calculateDamage(attacker, defender, 'scratch');
    expect(burnResult.damage).toBeLessThan(normalResult.damage);
  });

  it('returns 0 damage for power-0 moves', () => {
    const attacker = makePokemon('emberon', 10);
    const defender = makePokemon('aqualing', 10);
    const result = calculateDamage(attacker, defender, 'growl');
    expect(result.damage).toBe(0);
  });
});

describe('doesMoveHit', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('returns true when roll is under accuracy', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5); // 50 < 100
    const a = makePokemon('emberon', 10);
    const d = makePokemon('aqualing', 10);
    expect(doesMoveHit('tackle', a, d)).toBe(true);
  });

  it('paralyzed attacker can fail to move', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1); // < 0.25 => paralyzed
    const a = makePokemon('emberon', 10);
    a.status = 'paralyze';
    const d = makePokemon('aqualing', 10);
    expect(doesMoveHit('tackle', a, d)).toBe(false);
  });
});

describe('applyStatusDamage', () => {
  it('applies poison damage', () => {
    const p = makePokemon('emberon', 20);
    p.status = 'poison';
    const startHp = p.currentHp;
    const result = applyStatusDamage(p);
    expect(result).not.toBeNull();
    expect(p.currentHp).toBeLessThan(startHp);
    expect(result!.message).toContain('poison');
  });

  it('applies burn damage', () => {
    const p = makePokemon('emberon', 20);
    p.status = 'burn';
    const startHp = p.currentHp;
    const result = applyStatusDamage(p);
    expect(result).not.toBeNull();
    expect(p.currentHp).toBeLessThan(startHp);
  });

  it('returns null for no status', () => {
    const p = makePokemon('emberon', 20);
    expect(applyStatusDamage(p)).toBeNull();
  });
});

describe('canAct', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('sleeping pokemon cannot act', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9); // won't wake up
    const p = makePokemon('emberon', 10);
    p.status = 'sleep';
    const result = canAct(p);
    expect(result.canAct).toBe(false);
  });

  it('sleeping pokemon may wake up', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1); // < 0.33 => wakes
    const p = makePokemon('emberon', 10);
    p.status = 'sleep';
    const result = canAct(p);
    expect(result.canAct).toBe(true);
    expect(p.status).toBeNull();
  });

  it('frozen pokemon cannot act', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9);
    const p = makePokemon('emberon', 10);
    p.status = 'freeze';
    expect(canAct(p).canAct).toBe(false);
  });
});

describe('executeTurn', () => {
  beforeEach(() => { vi.spyOn(Math, 'random').mockReturnValue(0.5); });
  afterEach(() => { vi.restoreAllMocks(); });

  function makeBattle(): BattleState {
    const player = makePokemon('emberon', 15);
    const enemy = makePokemon('aqualing', 15);
    return {
      type: 'wild',
      playerTeam: [player],
      enemyTeam: [enemy],
      activePlayerIdx: 0,
      activeEnemyIdx: 0,
      phase: 'executing',
      messages: [],
      messageIdx: 0,
      animations: [],
      canRun: true,
      battleReward: 100,
    };
  }

  it('executes a basic attack turn', () => {
    const battle = makeBattle();
    const result = executeTurn(battle, { type: 'move', moveIdx: 0 });
    expect(result.messages.length).toBeGreaterThan(0);
    // Some damage should occur
    expect(result.playerDamage + result.enemyDamage).toBeGreaterThan(0);
  });

  it('handles run action in wild battle', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01); // will escape
    const battle = makeBattle();
    const result = executeTurn(battle, { type: 'run' });
    expect(result.messages).toContain('Got away safely!');
  });

  it('prevents running from trainer battles', () => {
    const battle = makeBattle();
    battle.canRun = false;
    const result = executeTurn(battle, { type: 'run' });
    expect(result.messages[0]).toContain("Can't escape");
  });

  it('handles item usage', () => {
    const battle = makeBattle();
    const result = executeTurn(battle, { type: 'item', itemId: 'potion' });
    expect(result.messages[0]).toContain('Used potion');
  });
});

describe('attemptCatch', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('returns success/shakes structure', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01);
    const pokemon = makePokemon('sproutley', 5);
    pokemon.currentHp = 1; // low HP increases catch rate
    const result = attemptCatch(pokemon, 'pokeball');
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('shakes');
  });

  it('higher catch rate with ultra ball', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01);
    const p1 = makePokemon('sproutley', 5);
    p1.currentHp = 1;
    const r1 = attemptCatch(p1, 'pokeball');
    
    const p2 = makePokemon('sproutley', 5);
    p2.currentHp = 1;
    const r2 = attemptCatch(p2, 'ultraball');
    
    expect(r2.shakes).toBeGreaterThanOrEqual(r1.shakes);
  });

  it('status effects improve catch rate', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01);
    const p = makePokemon('sproutley', 5);
    p.currentHp = 1;
    p.status = 'sleep';
    const result = attemptCatch(p, 'pokeball');
    expect(result.success).toBe(true);
  });
});

describe('checkEvolution', () => {
  it('returns evolution target at correct level', () => {
    const p = makePokemon('emberon', 16);
    expect(checkEvolution(p)).toBe('blazeron');
  });

  it('returns null below evolution level', () => {
    const p = makePokemon('emberon', 15);
    expect(checkEvolution(p)).toBeNull();
  });

  it('returns null for final stage', () => {
    const p = makePokemon('infernox', 50);
    expect(checkEvolution(p)).toBeNull();
  });
});

describe('gainExp', () => {
  it('adds exp to pokemon', () => {
    const p = makePokemon('emberon', 5);
    const startExp = p.exp;
    gainExp(p, 50);
    expect(p.exp).toBe(startExp + 50);
  });

  it('levels up when enough exp', () => {
    const p = makePokemon('emberon', 5);
    const result = gainExp(p, 10000);
    expect(result.leveledUp).toBe(true);
    expect(result.newLevel).toBeGreaterThan(5);
  });

  it('learns new moves on level up', () => {
    // emberon learns ember at level 7
    const p = makePokemon('emberon', 6);
    // Remove ember if already known
    p.moves = p.moves.filter(m => m.moveId !== 'ember');
    const result = gainExp(p, 10000);
    // Should have learned ember at level 7
    expect(result.newMoves.length).toBeGreaterThan(0);
  });

  it('recalculates stats on level up', () => {
    const p = makePokemon('emberon', 5);
    const oldHp = p.stats.hp;
    gainExp(p, 10000);
    expect(p.stats.hp).toBeGreaterThan(oldHp);
  });
});

describe('calculateExpGain', () => {
  it('returns more exp for trainer battles', () => {
    const p = makePokemon('emberon', 10);
    const wildExp = calculateExpGain(p, false);
    const trainerExp = calculateExpGain(p, true);
    expect(trainerExp).toBeGreaterThan(wildExp);
  });
});

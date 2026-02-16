import { describe, it, expect } from 'vitest';
import {
  createShakeAnimation,
  createFlashAnimation,
  createHpDrainAnimation,
  createFaintAnimation,
  createExpFillAnimation,
  tickAnimations,
  hasAnimation,
  getAnimationProgress,
  buildTurnAnimations,
  getTypeFlashColor,
  createBattleTransition,
  tickBattleTransition,
  renderScreenShake,
  getFaintOpacity,
  getFaintOffset,
  getAnimatedHpRatio,
  getAnimatedExpRatio,
} from '../animations';
import { BattleAnimation } from '../state';

describe('Animation Factories', () => {
  it('creates shake animation with defaults', () => {
    const a = createShakeAnimation('enemy');
    expect(a.type).toBe('shake');
    expect(a.target).toBe('enemy');
    expect(a.progress).toBe(0);
    expect(a.duration).toBe(500);
  });

  it('creates flash animation', () => {
    const a = createFlashAnimation('player', 200);
    expect(a.type).toBe('flash');
    expect(a.duration).toBe(200);
  });

  it('creates hp_drain animation', () => {
    const a = createHpDrainAnimation('enemy');
    expect(a.type).toBe('hp_drain');
    expect(a.duration).toBe(500);
  });

  it('creates faint animation', () => {
    const a = createFaintAnimation('player');
    expect(a.type).toBe('faint');
    expect(a.duration).toBe(600);
  });

  it('creates exp_fill animation', () => {
    const a = createExpFillAnimation(400);
    expect(a.type).toBe('exp_fill');
    expect(a.target).toBe('player');
    expect(a.duration).toBe(400);
  });
});

describe('tickAnimations', () => {
  it('advances animation progress', () => {
    const anims = [createShakeAnimation('enemy', 500)];
    const result = tickAnimations(anims, 250);
    expect(result.length).toBe(1);
    expect(result[0].progress).toBe(0.5);
  });

  it('removes completed animations', () => {
    const anims = [createShakeAnimation('enemy', 100)];
    const result = tickAnimations(anims, 100);
    expect(result.length).toBe(0);
  });

  it('removes animations that exceed duration', () => {
    const anims = [createShakeAnimation('enemy', 100)];
    const result = tickAnimations(anims, 200);
    expect(result.length).toBe(0);
  });

  it('keeps multiple animations at different stages', () => {
    const anims = [
      createShakeAnimation('enemy', 500),
      createFlashAnimation('player', 100),
    ];
    const result = tickAnimations(anims, 200);
    expect(result.length).toBe(1);
    expect(result[0].type).toBe('shake');
    expect(result[0].progress).toBeCloseTo(0.4);
  });
});

describe('hasAnimation', () => {
  it('returns true when animation exists', () => {
    const anims = [createShakeAnimation('enemy')];
    expect(hasAnimation(anims, 'shake')).toBe(true);
  });

  it('returns false when animation does not exist', () => {
    const anims = [createShakeAnimation('enemy')];
    expect(hasAnimation(anims, 'faint')).toBe(false);
  });
});

describe('getAnimationProgress', () => {
  it('returns progress of matching animation', () => {
    const anims: BattleAnimation[] = [{ type: 'hp_drain', target: 'enemy', progress: 0.7, duration: 500 }];
    expect(getAnimationProgress(anims, 'hp_drain', 'enemy')).toBe(0.7);
  });

  it('returns 0 when no match', () => {
    expect(getAnimationProgress([], 'shake')).toBe(0);
  });
});

describe('buildTurnAnimations', () => {
  it('creates flash + hp_drain for enemy damage', () => {
    const anims = buildTurnAnimations(1, false, false, 0, 30);
    expect(anims.some(a => a.type === 'flash' && a.target === 'enemy')).toBe(true);
    expect(anims.some(a => a.type === 'hp_drain' && a.target === 'enemy')).toBe(true);
  });

  it('creates shake for super-effective hits', () => {
    const anims = buildTurnAnimations(2, false, false, 0, 30);
    expect(anims.some(a => a.type === 'shake')).toBe(true);
  });

  it('does not create shake for normal effectiveness', () => {
    const anims = buildTurnAnimations(1, false, false, 0, 30);
    expect(anims.some(a => a.type === 'shake')).toBe(false);
  });

  it('creates faint animation for enemy faint', () => {
    const anims = buildTurnAnimations(1, false, true, 0, 50);
    expect(anims.some(a => a.type === 'faint' && a.target === 'enemy')).toBe(true);
  });

  it('creates faint animation for player faint', () => {
    const anims = buildTurnAnimations(1, true, false, 20, 0);
    expect(anims.some(a => a.type === 'faint' && a.target === 'player')).toBe(true);
  });

  it('creates animations for both sides taking damage', () => {
    const anims = buildTurnAnimations(1, false, false, 15, 20);
    expect(anims.filter(a => a.type === 'flash').length).toBe(2);
    expect(anims.filter(a => a.type === 'hp_drain').length).toBe(2);
  });

  it('creates no damage animations when no damage dealt', () => {
    const anims = buildTurnAnimations(1, false, false, 0, 0);
    expect(anims.filter(a => a.type === 'flash').length).toBe(0);
    expect(anims.filter(a => a.type === 'hp_drain').length).toBe(0);
  });
});

describe('getTypeFlashColor', () => {
  it('returns orange for Fire', () => {
    expect(getTypeFlashColor('Fire')).toContain('240,128,48');
  });

  it('returns blue for Water', () => {
    expect(getTypeFlashColor('Water')).toContain('104,144,240');
  });

  it('returns a color for every type', () => {
    const types = ['Normal', 'Fire', 'Water', 'Grass', 'Electric', 'Ice', 'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon'] as const;
    for (const t of types) {
      expect(getTypeFlashColor(t)).toContain('rgba');
    }
  });
});

describe('Battle Transition', () => {
  it('creates transition with defaults', () => {
    const t = createBattleTransition();
    expect(t.progress).toBe(0);
    expect(t.duration).toBe(800);
  });

  it('ticks transition forward', () => {
    const t = createBattleTransition(1000);
    const next = tickBattleTransition(t, 500);
    expect(next).not.toBeNull();
    expect(next!.progress).toBe(0.5);
  });

  it('returns null when complete', () => {
    const t = createBattleTransition(100);
    const next = tickBattleTransition(t, 200);
    expect(next).toBeNull();
  });
});

describe('renderScreenShake', () => {
  it('returns zero offset with no animations', () => {
    const offset = renderScreenShake([]);
    expect(offset.x).toBe(0);
    expect(offset.y).toBe(0);
  });

  it('returns non-zero offset with shake animation', () => {
    // Mock Math.random to return predictable values
    const origRandom = Math.random;
    Math.random = () => 0.75;
    const anims: BattleAnimation[] = [{ type: 'shake', target: 'enemy', progress: 0.2, duration: 500 }];
    const offset = renderScreenShake(anims);
    expect(offset.x).not.toBe(0);
    expect(offset.y).not.toBe(0);
    Math.random = origRandom;
  });
});

describe('getFaintOpacity', () => {
  it('returns 1 with no faint animation', () => {
    expect(getFaintOpacity([], 'enemy')).toBe(1);
  });

  it('returns decreasing opacity during faint', () => {
    const anims: BattleAnimation[] = [{ type: 'faint', target: 'enemy', progress: 0.5, duration: 600 }];
    expect(getFaintOpacity(anims, 'enemy')).toBe(0.5);
  });
});

describe('getFaintOffset', () => {
  it('returns 0 with no faint animation', () => {
    expect(getFaintOffset([], 'player')).toBe(0);
  });

  it('returns increasing offset during faint', () => {
    const anims: BattleAnimation[] = [{ type: 'faint', target: 'player', progress: 0.5, duration: 600 }];
    expect(getFaintOffset(anims, 'player')).toBe(15);
  });
});

describe('getAnimatedHpRatio', () => {
  it('returns current ratio when no animation', () => {
    expect(getAnimatedHpRatio([], 'enemy', 0.5, 1.0)).toBe(0.5);
  });

  it('interpolates between previous and current', () => {
    const anims: BattleAnimation[] = [{ type: 'hp_drain', target: 'enemy', progress: 0, duration: 500 }];
    // At progress 0, should be at previous ratio
    expect(getAnimatedHpRatio(anims, 'enemy', 0.5, 1.0)).toBe(1.0);
  });
});

describe('getAnimatedExpRatio', () => {
  it('returns current ratio when no animation', () => {
    expect(getAnimatedExpRatio([], 0.8, 0.2)).toBe(0.8);
  });

  it('interpolates during animation', () => {
    const anims: BattleAnimation[] = [{ type: 'exp_fill', target: 'player', progress: 0, duration: 500 }];
    expect(getAnimatedExpRatio(anims, 0.8, 0.2)).toBe(0.2);
  });
});

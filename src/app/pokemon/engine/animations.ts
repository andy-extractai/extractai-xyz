import { BattleAnimation } from './state';
import { PokemonType } from '../data/types';

// ===== ANIMATION FACTORIES =====

export function createShakeAnimation(target: 'player' | 'enemy', duration = 500): BattleAnimation {
  return { type: 'shake', target, progress: 0, duration };
}

export function createFlashAnimation(target: 'player' | 'enemy', duration = 300): BattleAnimation {
  return { type: 'flash', target, progress: 0, duration };
}

export function createHpDrainAnimation(target: 'player' | 'enemy', duration = 500): BattleAnimation {
  return { type: 'hp_drain', target, progress: 0, duration };
}

export function createFaintAnimation(target: 'player' | 'enemy', duration = 600): BattleAnimation {
  return { type: 'faint', target, progress: 0, duration };
}

export function createExpFillAnimation(duration = 500): BattleAnimation {
  return { type: 'exp_fill', target: 'player', progress: 0, duration };
}

// ===== ANIMATION UPDATE =====

/** Advance all animations by deltaMs, return only those still running */
export function tickAnimations(anims: BattleAnimation[], deltaMs: number): BattleAnimation[] {
  return anims
    .map(a => ({ ...a, progress: Math.min(1, a.progress + deltaMs / a.duration) }))
    .filter(a => a.progress < 1);
}

/** Check if a specific animation type is active */
export function hasAnimation(anims: BattleAnimation[], type: BattleAnimation['type']): boolean {
  return anims.some(a => a.type === type);
}

/** Get the progress of a specific animation (0 if not found) */
export function getAnimationProgress(anims: BattleAnimation[], type: BattleAnimation['type'], target?: 'player' | 'enemy'): number {
  const anim = anims.find(a => a.type === type && (!target || a.target === target));
  return anim ? anim.progress : 0;
}

// ===== TYPE-BASED FLASH COLORS =====

const TYPE_FLASH_COLORS: Record<PokemonType, string> = {
  Normal: 'rgba(168,168,120,0.5)',
  Fire: 'rgba(240,128,48,0.6)',
  Water: 'rgba(104,144,240,0.6)',
  Grass: 'rgba(120,200,80,0.6)',
  Electric: 'rgba(248,208,48,0.6)',
  Ice: 'rgba(152,216,216,0.6)',
  Fighting: 'rgba(192,48,40,0.5)',
  Poison: 'rgba(160,64,160,0.5)',
  Ground: 'rgba(224,192,104,0.5)',
  Flying: 'rgba(168,144,240,0.5)',
  Psychic: 'rgba(248,88,136,0.5)',
  Bug: 'rgba(168,184,32,0.5)',
  Rock: 'rgba(184,160,56,0.5)',
  Ghost: 'rgba(112,88,152,0.5)',
  Dragon: 'rgba(112,56,248,0.5)',
};

export function getTypeFlashColor(type: PokemonType): string {
  return TYPE_FLASH_COLORS[type] || 'rgba(255,255,255,0.5)';
}

// ===== BATTLE TRANSITION =====

export interface BattleTransition {
  type: 'flash_wipe';
  progress: number;
  duration: number;
}

export function createBattleTransition(duration = 800): BattleTransition {
  return { type: 'flash_wipe', progress: 0, duration };
}

export function tickBattleTransition(t: BattleTransition, deltaMs: number): BattleTransition | null {
  const next = { ...t, progress: Math.min(1, t.progress + deltaMs / t.duration) };
  return next.progress >= 1 ? null : next;
}

export function renderBattleTransition(ctx: CanvasRenderingContext2D, t: BattleTransition, w: number, h: number) {
  const p = t.progress;
  if (p < 0.3) {
    // Flash white
    const alpha = Math.min(1, p / 0.3);
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fillRect(0, 0, w, h);
  } else if (p < 0.7) {
    // Hold white then horizontal wipe to black
    const wipeP = (p - 0.3) / 0.4;
    ctx.fillStyle = 'rgba(255,255,255,1)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w * wipeP, h);
  } else {
    // Fade from black
    const fadeP = (p - 0.7) / 0.3;
    ctx.fillStyle = `rgba(0,0,0,${1 - fadeP})`;
    ctx.fillRect(0, 0, w, h);
  }
}

// ===== RENDER HELPERS =====

export function renderScreenShake(anims: BattleAnimation[]): { x: number; y: number } {
  const shakeAnim = anims.find(a => a.type === 'shake');
  if (!shakeAnim) return { x: 0, y: 0 };
  const intensity = 6 * (1 - shakeAnim.progress); // fade out
  return {
    x: (Math.random() - 0.5) * intensity * 2,
    y: (Math.random() - 0.5) * intensity * 2,
  };
}

/** Returns opacity 0-1 for faint animation (1=visible, fades to 0) */
export function getFaintOpacity(anims: BattleAnimation[], target: 'player' | 'enemy'): number {
  const anim = anims.find(a => a.type === 'faint' && a.target === target);
  return anim ? 1 - anim.progress : 1;
}

/** Returns vertical offset for faint animation (drops down) */
export function getFaintOffset(anims: BattleAnimation[], target: 'player' | 'enemy'): number {
  const anim = anims.find(a => a.type === 'faint' && a.target === target);
  return anim ? anim.progress * 30 : 0;
}

/** Interpolation helper for HP bar: returns display ratio */
export function getAnimatedHpRatio(
  anims: BattleAnimation[],
  target: 'player' | 'enemy',
  currentRatio: number,
  previousRatio: number
): number {
  const anim = anims.find(a => a.type === 'hp_drain' && a.target === target);
  if (!anim) return currentRatio;
  return previousRatio + (currentRatio - previousRatio) * easeOut(anim.progress);
}

/** Interpolation helper for XP bar */
export function getAnimatedExpRatio(
  anims: BattleAnimation[],
  currentRatio: number,
  previousRatio: number
): number {
  const anim = anims.find(a => a.type === 'exp_fill');
  if (!anim) return currentRatio;
  return previousRatio + (currentRatio - previousRatio) * easeOut(anim.progress);
}

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

// ===== BUILD ANIMATIONS FOR A TURN =====

export function buildTurnAnimations(
  effectiveness: number | undefined,
  playerFainted: boolean,
  enemyFainted: boolean,
  playerDamage: number,
  enemyDamage: number,
): BattleAnimation[] {
  const anims: BattleAnimation[] = [];

  if (enemyDamage > 0) {
    anims.push(createFlashAnimation('enemy', 300));
    anims.push(createHpDrainAnimation('enemy', 500));
  }
  if (playerDamage > 0) {
    anims.push(createFlashAnimation('player', 300));
    anims.push(createHpDrainAnimation('player', 500));
  }

  if (effectiveness !== undefined && effectiveness > 1) {
    anims.push(createShakeAnimation('enemy', 500));
  }

  if (enemyFainted) anims.push(createFaintAnimation('enemy', 600));
  if (playerFainted) anims.push(createFaintAnimation('player', 600));

  return anims;
}

import { GameState } from '../engine/state';
import { renderBattle } from '../engine/renderer';
import { SPECIES, expForLevel, expToNextLevel } from '../data/pokemon';
import { MOVES } from '../data/moves';
import { ITEMS } from '../data/items';
import { drawHPBar, getStatusColor, roundRectPath } from './utils';
import {
  renderScreenShake,
  getFaintOpacity,
  getFaintOffset,
  getAnimationProgress,
  hasAnimation,
} from '../engine/animations';

export function renderBattleScreen(ctx: CanvasRenderingContext2D, s: GameState, w: number, h: number, frame: number) {
  const b = s.battle!;
  const playerPoke = b.playerTeam[b.activePlayerIdx];
  const enemyPoke = b.enemyTeam[b.activeEnemyIdx];

  // Screen shake from animations
  const shakeOffset = renderScreenShake(b.animations);

  ctx.save();
  ctx.translate(shakeOffset.x, shakeOffset.y);

  renderBattle(ctx, playerPoke, enemyPoke, w, h, frame, shakeOffset);

  // Faint animation: fade + drop sprite
  const enemyFaintOpacity = getFaintOpacity(b.animations, 'enemy');
  const playerFaintOpacity = getFaintOpacity(b.animations, 'player');
  const enemyFaintDrop = getFaintOffset(b.animations, 'enemy');
  const playerFaintDrop = getFaintOffset(b.animations, 'player');

  // Overlay faint effect on sprites (darken fading sprites)
  if (enemyFaintOpacity < 1) {
    ctx.fillStyle = `rgba(0,0,0,${1 - enemyFaintOpacity})`;
    ctx.fillRect(w * 0.55, 60 + enemyFaintDrop, w * 0.35, w * 0.35);
  }
  if (playerFaintOpacity < 1) {
    ctx.fillStyle = `rgba(0,0,0,${1 - playerFaintOpacity})`;
    ctx.fillRect(w * 0.05, h * 0.35 + playerFaintDrop, w * 0.35, w * 0.35);
  }

  // Type-colored flash overlay
  const flashAnims = b.animations.filter(a => a.type === 'flash');
  for (const fa of flashAnims) {
    const flashAlpha = 0.5 * (1 - fa.progress);
    const color = fa.color || 'rgba(255,255,255,0.5)';
    // Parse and override alpha
    ctx.fillStyle = color.replace(/[\d.]+\)$/, `${flashAlpha})`);
    if (fa.target === 'enemy') {
      ctx.fillRect(w * 0.5, 0, w * 0.5, h * 0.5);
    } else {
      ctx.fillRect(0, h * 0.3, w * 0.5, h * 0.4);
    }
  }

  ctx.restore();

  // Enemy info box (top-right area)
  const enemySpecies = SPECIES[enemyPoke.speciesId];
  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  roundRectPath(ctx, 10, 10, w * 0.45, 60, 8);
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px monospace';
  ctx.fillText(`${enemySpecies.name}  Lv${enemyPoke.level}`, 20, 30);

  // HP bar with animation support
  const enemyHpRatio = enemyPoke.currentHp / enemyPoke.stats.hp;
  const enemyDrainProgress = getAnimationProgress(b.animations, 'hp_drain', 'enemy');
  const displayEnemyRatio = enemyDrainProgress > 0 ? enemyHpRatio : enemyHpRatio;
  drawHPBar(ctx, 20, 38, w * 0.4, 12, Math.max(0, displayEnemyRatio * enemyPoke.stats.hp), enemyPoke.stats.hp);

  if (enemyPoke.status) {
    ctx.fillStyle = getStatusColor(enemyPoke.status);
    ctx.font = '10px monospace';
    ctx.fillText(enemyPoke.status.toUpperCase(), 20, 62);
  }

  // Player info box (bottom-left area)
  const playerSpecies = SPECIES[playerPoke.speciesId];
  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  roundRectPath(ctx, w * 0.5, h * 0.52, w * 0.47, 70, 8);
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px monospace';
  ctx.fillText(`${playerSpecies.name}  Lv${playerPoke.level}`, w * 0.53, h * 0.52 + 22);

  drawHPBar(ctx, w * 0.53, h * 0.52 + 30, w * 0.4, 12, playerPoke.currentHp, playerPoke.stats.hp);

  // EXP bar with animation support
  const expNeeded = expToNextLevel(playerPoke.level);
  const expProgress = (playerPoke.exp - expForLevel(playerPoke.level)) / Math.max(1, expNeeded);
  const expFillProgress = getAnimationProgress(b.animations, 'exp_fill');
  const displayExpRatio = expFillProgress > 0 ? expProgress * expFillProgress : expProgress;
  ctx.fillStyle = '#333';
  ctx.fillRect(w * 0.53, h * 0.52 + 48, w * 0.4, 6);
  ctx.fillStyle = '#3b82f6';
  ctx.fillRect(w * 0.53, h * 0.52 + 48, w * 0.4 * Math.min(1, displayExpRatio), 6);

  ctx.fillStyle = '#aaa';
  ctx.font = '10px monospace';
  ctx.fillText(`HP: ${playerPoke.currentHp}/${playerPoke.stats.hp}`, w * 0.53, h * 0.52 + 68);

  if (playerPoke.status) {
    ctx.fillStyle = getStatusColor(playerPoke.status);
    ctx.fillText(playerPoke.status.toUpperCase(), w * 0.78, h * 0.52 + 68);
  }

  // Battle UI (bottom section)
  const uiY = h * 0.78;
  ctx.fillStyle = 'rgba(0,0,0,0.9)';
  ctx.fillRect(0, uiY, w, h - uiY);
  ctx.strokeStyle = '#4ade80';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, uiY, w, h - uiY);

  if (b.phase === 'action_select') {
    const actions = ['FIGHT', 'BAG', 'POKÉMON', 'RUN'];
    const cols = 2;
    actions.forEach((action, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const ax = 20 + col * (w / 2 - 20);
      const ay = uiY + 15 + row * 28;
      ctx.fillStyle = i === b.messageIdx ? '#4ade80' : '#fff';
      ctx.font = `${i === b.messageIdx ? 'bold ' : ''}15px monospace`;
      ctx.fillText(`${i === b.messageIdx ? '▸ ' : '  '}${action}`, ax, ay);
    });
  } else if (b.phase === 'move_select') {
    playerPoke.moves.forEach((move, i) => {
      const moveData = MOVES[move.moveId];
      if (!moveData) return;
      const col = i % 2;
      const row = Math.floor(i / 2);
      const mx = 20 + col * (w / 2 - 20);
      const my = uiY + 15 + row * 28;
      const isSelected = i === b.messageIdx;
      ctx.fillStyle = move.currentPp <= 0 ? '#666' : isSelected ? '#4ade80' : '#fff';
      ctx.font = `${isSelected ? 'bold ' : ''}13px monospace`;
      ctx.fillText(`${isSelected ? '▸ ' : '  '}${moveData.name}`, mx, my);
      ctx.fillStyle = '#888';
      ctx.font = '10px monospace';
      ctx.fillText(`${move.currentPp}/${moveData.pp}`, mx + w * 0.22, my);
    });
  } else if (b.phase === 'switch_select' || b.phase === 'fainted') {
    b.playerTeam.forEach((poke, i) => {
      const species = SPECIES[poke.speciesId];
      const my = uiY + 12 + i * 22;
      const isActive = i === b.activePlayerIdx;
      const isFainted = poke.currentHp <= 0;
      ctx.fillStyle = i === b.messageIdx ? '#4ade80' : isFainted ? '#666' : '#fff';
      ctx.font = '12px monospace';
      ctx.fillText(`${i === b.messageIdx ? '▸' : ' '} ${species.name} Lv${poke.level} ${poke.currentHp}/${poke.stats.hp}${isActive ? ' (active)' : ''}`, 20, my);
    });
  } else if (b.phase === 'item_select') {
    const items = Object.entries(s.player.bag).filter(([, qty]) => qty > 0);
    items.forEach(([itemId, qty], i) => {
      const item = ITEMS[itemId];
      if (!item) return;
      const my = uiY + 14 + i * 20;
      ctx.fillStyle = i === b.messageIdx ? '#4ade80' : '#fff';
      ctx.font = '12px monospace';
      ctx.fillText(`${i === b.messageIdx ? '▸' : ' '} ${item.name} x${qty}`, 20, my);
    });
    if (items.length === 0) {
      ctx.fillStyle = '#888';
      ctx.font = '13px monospace';
      ctx.fillText('No items!', 20, uiY + 20);
    }
  } else {
    // Display messages
    ctx.fillStyle = '#fff';
    ctx.font = '14px monospace';
    const msg = b.messages[b.messageIdx] || '';
    ctx.fillText(msg, 20, uiY + 25);

    if (b.messages.length > 1) {
      ctx.fillStyle = '#666';
      ctx.font = '10px monospace';
      ctx.fillText(`${b.messageIdx + 1}/${b.messages.length}  [Z/Enter]`, w - 150, h - 8);
    }
  }
}

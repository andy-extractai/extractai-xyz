import { GameState } from '../engine/state';
import { renderBattle } from '../engine/renderer';
import { SPECIES, expForLevel, expToNextLevel } from '../data/pokemon';
import { MOVES } from '../data/moves';
import { ITEMS } from '../data/items';
import { drawHPBar, getStatusColor, roundRectPath } from './utils';

export function renderBattleScreen(ctx: CanvasRenderingContext2D, s: GameState, w: number, h: number, frame: number) {
  const b = s.battle!;
  const playerPoke = b.playerTeam[b.activePlayerIdx];
  const enemyPoke = b.enemyTeam[b.activeEnemyIdx];

  const shakeOffset = { x: 0, y: 0 };
  if (b.animations.length > 0) {
    shakeOffset.x = (Math.random() - 0.5) * 6;
    shakeOffset.y = (Math.random() - 0.5) * 6;
  }

  renderBattle(ctx, playerPoke, enemyPoke, w, h, frame, shakeOffset);

  // Enemy info box (top-right area)
  const enemySpecies = SPECIES[enemyPoke.speciesId];
  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  roundRectPath(ctx, 10, 10, w * 0.45, 60, 8);
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px monospace';
  ctx.fillText(`${enemySpecies.name}  Lv${enemyPoke.level}`, 20, 30);

  drawHPBar(ctx, 20, 38, w * 0.4, 12, enemyPoke.currentHp, enemyPoke.stats.hp);

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

  // EXP bar
  const expNeeded = expToNextLevel(playerPoke.level);
  const expProgress = (playerPoke.exp - expForLevel(playerPoke.level)) / Math.max(1, expNeeded);
  ctx.fillStyle = '#333';
  ctx.fillRect(w * 0.53, h * 0.52 + 48, w * 0.4, 6);
  ctx.fillStyle = '#3b82f6';
  ctx.fillRect(w * 0.53, h * 0.52 + 48, w * 0.4 * Math.min(1, expProgress), 6);

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

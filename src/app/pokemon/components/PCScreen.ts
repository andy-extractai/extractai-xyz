import { GameState } from '../engine/state';
import { SPECIES } from '../data/pokemon';
import { roundRectPath, drawHPBar } from './utils';

export interface PCState {
  mode: 'main' | 'deposit' | 'withdraw';
  selectedIndex: number;
}

export function renderPCScreen(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  w: number,
  h: number,
): void {
  const pc = state.pcUI;
  if (!pc) return;

  // Background overlay
  ctx.fillStyle = 'rgba(0,0,20,0.92)';
  ctx.fillRect(0, 0, w, h);

  // Title
  ctx.fillStyle = '#4ade80';
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'center';
  ctx.fillText("SOMEONE'S PC", w / 2, 24);
  ctx.textAlign = 'left';

  if (pc.mode === 'main') {
    renderMainMenu(ctx, pc, w, h);
  } else if (pc.mode === 'deposit') {
    renderDeposit(ctx, state, pc, w, h);
  } else if (pc.mode === 'withdraw') {
    renderWithdraw(ctx, state, pc, w, h);
  }

  // Controls hint
  ctx.fillStyle = '#555';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Z/Enter=Select  X/Esc=Back', w / 2, h - 8);
  ctx.textAlign = 'left';
}

function renderMainMenu(ctx: CanvasRenderingContext2D, pc: PCState, w: number, h: number) {
  const options = ['DEPOSIT', 'WITHDRAW', 'CLOSE'];
  const startY = 60;
  for (let i = 0; i < options.length; i++) {
    const y = startY + i * 32;
    const selected = pc.selectedIndex === i;
    if (selected) {
      ctx.fillStyle = 'rgba(74,222,128,0.15)';
      roundRectPath(ctx, w / 2 - 80, y - 10, 160, 28, 6);
      ctx.fill();
    }
    ctx.fillStyle = selected ? '#4ade80' : '#aaa';
    ctx.font = selected ? 'bold 14px monospace' : '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(options[i], w / 2, y + 6);
  }
  ctx.textAlign = 'left';
}

function renderDeposit(ctx: CanvasRenderingContext2D, state: GameState, pc: PCState, w: number, h: number) {
  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('DEPOSIT - Select from Party', 10, 44);

  const team = state.player.team;
  if (team.length <= 1) {
    ctx.fillStyle = '#e74c3c';
    ctx.font = '12px monospace';
    ctx.fillText('Must keep at least 1 Pokémon!', 10, 70);
    return;
  }

  renderPokemonList(ctx, team, pc.selectedIndex, 56, w, h);
}

function renderWithdraw(ctx: CanvasRenderingContext2D, state: GameState, pc: PCState, w: number, h: number) {
  ctx.fillStyle = '#3b82f6';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('WITHDRAW - Select from PC', 10, 44);

  const storage = state.player.pc;
  if (storage.length === 0) {
    ctx.fillStyle = '#888';
    ctx.font = '12px monospace';
    ctx.fillText('No Pokémon in storage.', 10, 70);
    return;
  }

  if (state.player.team.length >= 6) {
    ctx.fillStyle = '#e74c3c';
    ctx.font = '10px monospace';
    ctx.fillText('Party full! Deposit first.', w - 170, 44);
  }

  renderPokemonList(ctx, storage, pc.selectedIndex, 56, w, h);
}

function renderPokemonList(
  ctx: CanvasRenderingContext2D,
  list: import('../data/types').PokemonInstance[],
  selectedIdx: number,
  startY: number,
  w: number,
  _h: number,
) {
  const rowH = 36;
  const maxVisible = 7;
  const scrollOffset = Math.max(0, selectedIdx - maxVisible + 1);

  for (let i = scrollOffset; i < Math.min(list.length, scrollOffset + maxVisible); i++) {
    const poke = list[i];
    const species = SPECIES[poke.speciesId];
    if (!species) continue;
    const y = startY + (i - scrollOffset) * rowH;
    const selected = i === selectedIdx;

    if (selected) {
      ctx.fillStyle = 'rgba(74,222,128,0.12)';
      roundRectPath(ctx, 6, y - 2, w - 12, rowH - 4, 5);
      ctx.fill();
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 1;
      roundRectPath(ctx, 6, y - 2, w - 12, rowH - 4, 5);
      ctx.stroke();
    }

    // Name and level
    ctx.fillStyle = selected ? '#4ade80' : '#ddd';
    ctx.font = selected ? 'bold 12px monospace' : '12px monospace';
    ctx.fillText(`${poke.nickname || species.name}`, 14, y + 13);

    ctx.fillStyle = '#888';
    ctx.font = '10px monospace';
    ctx.fillText(`Lv${poke.level}`, 14, y + 26);

    // Types
    const typeX = 100;
    species.types.forEach((t, ti) => {
      ctx.fillStyle = getTypeColor(t);
      ctx.font = '9px monospace';
      ctx.fillText(t, typeX + ti * 55, y + 26);
    });

    // HP bar
    const hpBarX = w - 140;
    const hpBarW = 80;
    drawHPBar(ctx, hpBarX, y + 5, hpBarW, 8, poke.currentHp, poke.stats.hp);

    ctx.fillStyle = '#888';
    ctx.font = '9px monospace';
    ctx.fillText(`${poke.currentHp}/${poke.stats.hp}`, hpBarX, y + 26);
  }

  if (list.length > maxVisible) {
    ctx.fillStyle = '#555';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${selectedIdx + 1}/${list.length}`, w - 10, startY - 4);
    ctx.textAlign = 'left';
  }
}

function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    Normal: '#a8a878', Fire: '#f08030', Water: '#6890f0', Grass: '#78c850',
    Electric: '#f8d030', Ice: '#98d8d8', Fighting: '#c03028', Poison: '#a040a0',
    Ground: '#e0c068', Flying: '#a890f0', Psychic: '#f85888', Bug: '#a8b820',
    Rock: '#b8a038', Ghost: '#705898', Dragon: '#7038f8',
  };
  return colors[type] || '#888';
}

// ===== PC LOGIC (pure functions for testing) =====

export function canDeposit(teamSize: number): boolean {
  return teamSize > 1;
}

export function canWithdraw(teamSize: number): boolean {
  return teamSize < 6;
}

export function depositPokemon(
  team: import('../data/types').PokemonInstance[],
  pc: import('../data/types').PokemonInstance[],
  index: number,
): { team: import('../data/types').PokemonInstance[]; pc: import('../data/types').PokemonInstance[] } | null {
  if (team.length <= 1) return null;
  if (index < 0 || index >= team.length) return null;
  const pokemon = team[index];
  const newTeam = [...team.slice(0, index), ...team.slice(index + 1)];
  const newPc = [...pc, pokemon];
  return { team: newTeam, pc: newPc };
}

export function withdrawPokemon(
  team: import('../data/types').PokemonInstance[],
  pc: import('../data/types').PokemonInstance[],
  index: number,
): { team: import('../data/types').PokemonInstance[]; pc: import('../data/types').PokemonInstance[] } | null {
  if (team.length >= 6) return null;
  if (index < 0 || index >= pc.length) return null;
  const pokemon = pc[index];
  const newTeam = [...team, pokemon];
  const newPc = [...pc.slice(0, index), ...pc.slice(index + 1)];
  return { team: newTeam, pc: newPc };
}

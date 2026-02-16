import { GameState } from '../engine/state';
import { SPECIES } from '../data/pokemon';
import { drawPokemonSprite } from '../engine/renderer';

export interface CreditsState {
  scrollY: number;
  done: boolean;
}

export function createCreditsState(): CreditsState {
  return { scrollY: 0, done: false };
}

export function getCreditsLines(state: GameState): string[] {
  const lines: string[] = [];
  lines.push('');
  lines.push('');
  lines.push('★ ★ ★ ★ ★ ★ ★ ★ ★');
  lines.push('');
  lines.push('You are the new Champion!');
  lines.push('');
  lines.push('★ ★ ★ ★ ★ ★ ★ ★ ★');
  lines.push('');
  lines.push('');
  lines.push(`Trainer: ${state.player.name}`);
  lines.push('');
  lines.push('— Your Team —');
  for (const poke of state.player.team) {
    const species = SPECIES[poke.speciesId];
    lines.push(`${species?.name ?? poke.speciesId}  Lv.${poke.level}`);
  }
  lines.push('');
  lines.push(`Badges Earned: ${state.player.badges.length} / 8`);
  lines.push('');
  lines.push(`Pokédex Seen: ${state.player.pokedex.seen.size}`);
  lines.push(`Pokédex Caught: ${state.player.pokedex.caught.size}`);
  lines.push('');
  lines.push('');
  lines.push('— — — — — — —');
  lines.push('');
  lines.push('Thank you for playing!');
  lines.push('');
  lines.push('');
  lines.push('T H E   E N D');
  lines.push('');
  lines.push('');
  lines.push('');
  lines.push('[Press Enter]');
  return lines;
}

export function renderCreditsScreen(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  w: number,
  h: number,
  frame: number,
  creditsState: CreditsState
) {
  // Dark background
  ctx.fillStyle = '#0a0a2a';
  ctx.fillRect(0, 0, w, h);

  // Stars
  const starCount = 30;
  for (let i = 0; i < starCount; i++) {
    const sx = ((i * 137 + 51) % w);
    const sy = ((i * 97 + 23 + frame * 0.2) % h);
    const brightness = Math.sin(frame * 0.05 + i) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
    ctx.fillRect(sx, sy, 2, 2);
  }

  const lines = getCreditsLines(state);
  const lineHeight = 28;
  const totalHeight = lines.length * lineHeight;
  const baseY = h - creditsState.scrollY;

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, w, h);
  ctx.clip();

  for (let i = 0; i < lines.length; i++) {
    const y = baseY + i * lineHeight;
    if (y < -30 || y > h + 30) continue;

    const line = lines[i];
    ctx.textAlign = 'center';

    if (line === 'You are the new Champion!') {
      const glow = Math.sin(frame * 0.08) * 0.3 + 0.7;
      ctx.fillStyle = `rgba(255, 215, 0, ${glow})`;
      ctx.font = 'bold 22px monospace';
    } else if (line === 'T H E   E N D') {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 24px monospace';
    } else if (line.startsWith('★')) {
      ctx.fillStyle = '#ffd700';
      ctx.font = '16px monospace';
    } else if (line.startsWith('—')) {
      ctx.fillStyle = '#888';
      ctx.font = '14px monospace';
    } else if (line.startsWith('[')) {
      ctx.fillStyle = creditsState.done ? '#aaa' : 'transparent';
      ctx.font = '12px monospace';
    } else {
      ctx.fillStyle = '#ddd';
      ctx.font = '16px monospace';
    }

    ctx.fillText(line, w / 2, y);
  }

  ctx.restore();
  ctx.textAlign = 'left';
}

export function advanceCredits(credits: CreditsState, lineCount: number): CreditsState {
  const lineHeight = 28;
  const maxScroll = lineCount * lineHeight;
  if (credits.scrollY >= maxScroll) {
    return { ...credits, done: true };
  }
  return { ...credits, scrollY: credits.scrollY + 1.5 };
}

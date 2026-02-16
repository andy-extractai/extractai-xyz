import { drawPokemonSprite } from '../engine/renderer';
import { SPECIES } from '../data/pokemon';

export function renderEvolution(
  ctx: CanvasRenderingContext2D,
  evo: { fromSpecies: string; toSpecies: string; progress: number },
  w: number,
  h: number,
  frame: number
) {
  ctx.fillStyle = '#0a0a2a';
  ctx.fillRect(0, 0, w, h);

  const glow = Math.sin(frame * 0.1) * 0.3 + 0.5;
  ctx.fillStyle = `rgba(74, 222, 128, ${glow})`;
  ctx.beginPath();
  ctx.arc(w / 2, h * 0.4, 80 + glow * 30, 0, Math.PI * 2);
  ctx.fill();

  const species = Math.floor(frame / 15) % 2 === 0 ? evo.fromSpecies : evo.toSpecies;
  drawPokemonSprite(ctx, species, w / 2 - 50, h * 0.25, 100);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 18px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${SPECIES[evo.fromSpecies].name} is evolving!`, w / 2, h * 0.7);

  ctx.fillStyle = '#4ade80';
  ctx.font = '14px monospace';
  ctx.fillText(`→ ${SPECIES[evo.toSpecies].name}!`, w / 2, h * 0.77);

  ctx.fillStyle = '#888';
  ctx.font = '12px monospace';
  ctx.fillText('[Press Enter]', w / 2, h * 0.85);
  ctx.textAlign = 'left';
}

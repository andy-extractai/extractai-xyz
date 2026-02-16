// Draw pixel-art style Pokemon sprites using colored rectangles
import { POKEDEX, PokemonType } from './data';

const TYPE_COLORS: Record<PokemonType, string> = {
  fire: '#ef4444',
  water: '#3b82f6',
  grass: '#22c55e',
  normal: '#a8a29e',
};

export function drawPokemonSprite(
  ctx: CanvasRenderingContext2D,
  speciesId: number,
  x: number,
  y: number,
  size: number,
  flipped = false
) {
  const species = POKEDEX[speciesId];
  if (!species) return;
  const c1 = species.color;
  const c2 = species.color2;
  const u = size / 8; // unit size

  ctx.save();
  if (flipped) {
    ctx.translate(x + size, y);
    ctx.scale(-1, 1);
    x = 0; y = 0;
  }

  // Body (main blob)
  ctx.fillStyle = c1;
  ctx.fillRect(x + u * 2, y + u * 2, u * 4, u * 4);

  // Head
  ctx.fillRect(x + u * 2, y + u, u * 4, u * 2);

  // Legs
  ctx.fillRect(x + u * 2, y + u * 6, u, u * 2);
  ctx.fillRect(x + u * 5, y + u * 6, u, u * 2);

  // Secondary color accent
  ctx.fillStyle = c2;
  ctx.fillRect(x + u * 3, y + u * 3, u * 2, u * 2); // belly

  // Eyes
  ctx.fillStyle = '#fff';
  ctx.fillRect(x + u * 3, y + u * 1.5, u * 0.8, u * 0.8);
  ctx.fillRect(x + u * 4.5, y + u * 1.5, u * 0.8, u * 0.8);
  ctx.fillStyle = '#000';
  ctx.fillRect(x + u * 3.3, y + u * 1.7, u * 0.4, u * 0.4);
  ctx.fillRect(x + u * 4.8, y + u * 1.7, u * 0.4, u * 0.4);

  // Type-specific feature
  if (species.type === 'fire') {
    // Flame tail
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(x + u * 6, y + u * 2, u, u * 2);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(x + u * 6.5, y + u * 1, u * 0.8, u * 1.5);
  } else if (species.type === 'water') {
    // Fin
    ctx.fillStyle = c2;
    ctx.fillRect(x + u * 2, y, u * 2, u);
    ctx.fillRect(x + u * 6, y + u * 3, u * 1.5, u * 0.8);
  } else if (species.type === 'grass') {
    // Leaf on head
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(x + u * 4, y, u * 2, u * 1.2);
    ctx.fillRect(x + u * 5, y - u * 0.5, u * 1.5, u);
  } else {
    // Ears
    ctx.fillStyle = c2;
    ctx.fillRect(x + u * 1.5, y + u * 0.5, u, u * 1.5);
    ctx.fillRect(x + u * 5.5, y + u * 0.5, u, u * 1.5);
  }

  ctx.restore();
}

export function drawPlayerSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tileSize: number,
  frame: number
) {
  const u = tileSize / 8;
  // Hat
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(x + u * 2, y, u * 4, u * 1.5);
  // Head
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(x + u * 2.5, y + u * 1.5, u * 3, u * 2);
  // Eyes
  ctx.fillStyle = '#000';
  ctx.fillRect(x + u * 3, y + u * 2, u * 0.5, u * 0.5);
  ctx.fillRect(x + u * 4.5, y + u * 2, u * 0.5, u * 0.5);
  // Body
  ctx.fillStyle = '#3b82f6';
  ctx.fillRect(x + u * 2.5, y + u * 3.5, u * 3, u * 2.5);
  // Legs (animate)
  ctx.fillStyle = '#1e3a5f';
  const legOffset = frame % 2 === 0 ? 0 : u * 0.3;
  ctx.fillRect(x + u * 2.5, y + u * 6 + legOffset, u * 1.2, u * 2);
  ctx.fillRect(x + u * 4.3, y + u * 6 - legOffset, u * 1.2, u * 2);
}

export function getTypeColor(type: PokemonType): string {
  return TYPE_COLORS[type];
}

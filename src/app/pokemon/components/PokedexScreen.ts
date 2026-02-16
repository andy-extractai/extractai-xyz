import { SPECIES } from '../data/pokemon';
import { drawPokemonSprite } from '../engine/renderer';
import type { GameState } from '../engine/state';

export interface PokedexEntry {
  speciesId: string;
  name: string;
  id: number;
  status: 'caught' | 'seen' | 'unknown';
  types: string[];
  description: string;
  baseStats: { hp: number; attack: number; defense: number; spAtk: number; spDef: number; speed: number };
  spriteColors: string[];
}

/** Get all 50 species as pokedex entries with seen/caught status */
export function getPokedexEntries(pokedex: { seen: Set<string>; caught: Set<string> }): PokedexEntry[] {
  return Object.entries(SPECIES)
    .sort((a, b) => a[1].id - b[1].id)
    .map(([speciesId, sp]) => ({
      speciesId,
      name: sp.name,
      id: sp.id,
      status: pokedex.caught.has(speciesId) ? 'caught' as const
        : pokedex.seen.has(speciesId) ? 'seen' as const
        : 'unknown' as const,
      types: sp.types,
      description: sp.description,
      baseStats: sp.baseStats,
      spriteColors: sp.spriteColors,
    }));
}

/** Get completion stats */
export function getCompletionStats(pokedex: { seen: Set<string>; caught: Set<string> }): { caught: number; total: number; seen: number } {
  const total = Object.keys(SPECIES).length;
  return { caught: pokedex.caught.size, seen: pokedex.seen.size, total };
}

/** Render the Pokédex list screen */
export function renderPokedexList(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  w: number, h: number,
  scrollIndex: number,
  selectedIndex: number
) {
  ctx.fillStyle = 'rgba(0,0,0,0.95)';
  ctx.fillRect(0, 0, w, h);

  const entries = getPokedexEntries(state.player.pokedex);
  const stats = getCompletionStats(state.player.pokedex);

  // Title
  ctx.fillStyle = '#4ade80';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('POKÉDEX', 20, 30);

  // Completion count
  ctx.fillStyle = '#aaa';
  ctx.font = '12px monospace';
  ctx.fillText(`Caught: ${stats.caught}/${stats.total}  Seen: ${stats.seen}`, 20, 52);

  // List
  const maxShow = Math.min(entries.length, Math.floor((h - 100) / 22));
  for (let i = 0; i < maxShow; i++) {
    const entry = entries[scrollIndex + i];
    if (!entry) break;
    const y = 75 + i * 22;
    const isSelected = (scrollIndex + i) === selectedIndex;

    if (isSelected) {
      ctx.fillStyle = 'rgba(74,222,128,0.15)';
      ctx.fillRect(15, y - 14, w - 30, 20);
    }

    const statusIcon = entry.status === 'caught' ? '●' : entry.status === 'seen' ? '○' : '?';
    const displayName = entry.status === 'unknown' ? '???' : entry.name;
    const color = entry.status === 'caught' ? '#4ade80' : entry.status === 'seen' ? '#aaa' : '#444';

    ctx.fillStyle = color;
    ctx.font = '11px monospace';
    ctx.fillText(
      `${String(entry.id).padStart(3, '0')} ${statusIcon} ${displayName}`,
      20, y
    );
  }

  ctx.fillStyle = '#666';
  ctx.font = '11px monospace';
  ctx.fillText('[ESC] Back  [Enter] Detail  [↑↓] Scroll', 20, h - 15);
}

/** Render the Pokédex detail screen for a selected entry */
export function renderPokedexDetail(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  w: number, h: number,
  selectedIndex: number
) {
  ctx.fillStyle = 'rgba(0,0,0,0.95)';
  ctx.fillRect(0, 0, w, h);

  const entries = getPokedexEntries(state.player.pokedex);
  const entry = entries[selectedIndex];
  if (!entry) return;

  // Header
  ctx.fillStyle = '#4ade80';
  ctx.font = 'bold 16px monospace';
  ctx.fillText(`#${String(entry.id).padStart(3, '0')}`, 20, 30);

  if (entry.status === 'unknown') {
    ctx.fillStyle = '#444';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('???', 20, 60);
    ctx.fillStyle = '#666';
    ctx.font = '12px monospace';
    ctx.fillText('No data available.', 20, 90);
  } else if (entry.status === 'seen') {
    // Name + silhouette
    ctx.fillStyle = '#aaa';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(entry.name, 20, 60);

    // Silhouette: draw sprite area as dark shape
    ctx.save();
    ctx.globalAlpha = 0.3;
    drawPokemonSprite(ctx, entry.speciesId, w / 2 - 48, 80, 96);
    ctx.restore();

    ctx.fillStyle = '#666';
    ctx.font = '12px monospace';
    ctx.fillText('Catch this Pokémon for more info.', 20, 200);
  } else {
    // Caught: full detail
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(entry.name, 20, 60);

    // Sprite
    drawPokemonSprite(ctx, entry.speciesId, w / 2 - 48, 75, 96);

    // Types
    const typeY = 185;
    ctx.font = '12px monospace';
    entry.types.forEach((t, i) => {
      ctx.fillStyle = getTypeColor(t);
      ctx.fillRect(20 + i * 80, typeY, 70, 18);
      ctx.fillStyle = '#fff';
      ctx.fillText(t, 28 + i * 80, typeY + 13);
    });

    // Description
    ctx.fillStyle = '#ccc';
    ctx.font = '11px monospace';
    ctx.fillText(entry.description, 20, 220);

    // Base stats
    ctx.fillStyle = '#4ade80';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('Base Stats', 20, 250);

    const statNames = ['HP', 'ATK', 'DEF', 'SPA', 'SPD', 'SPE'];
    const statKeys = ['hp', 'attack', 'defense', 'spAtk', 'spDef', 'speed'] as const;
    const barMaxW = w - 120;

    statKeys.forEach((key, i) => {
      const y = 270 + i * 22;
      const val = entry.baseStats[key];
      ctx.fillStyle = '#aaa';
      ctx.font = '11px monospace';
      ctx.fillText(statNames[i], 20, y);
      ctx.fillText(String(val), 60, y);

      // Bar
      const barW = (val / 150) * barMaxW;
      ctx.fillStyle = '#333';
      ctx.fillRect(90, y - 10, barMaxW, 12);
      ctx.fillStyle = val >= 100 ? '#4ade80' : val >= 60 ? '#fbbf24' : '#ef4444';
      ctx.fillRect(90, y - 10, barW, 12);
    });
  }

  ctx.fillStyle = '#666';
  ctx.font = '11px monospace';
  ctx.fillText('[ESC] Back  [←→] Prev/Next', 20, h - 15);
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

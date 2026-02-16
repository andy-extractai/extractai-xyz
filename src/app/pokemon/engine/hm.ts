import { PokemonInstance } from '../data/types';

/**
 * HM interaction logic for Cut and Surf.
 * Pure functions — no side effects, easy to test.
 */

/** Check if any Pokémon in the team knows a specific move */
export function teamKnowsMove(team: PokemonInstance[], moveId: string): boolean {
  return team.some(p => p.currentHp > 0 && p.moves.some(m => m.moveId === moveId));
}

/** Build the storyFlag key for a cut tree at a given map/position */
export function cutTreeFlag(mapId: string, x: number, y: number): string {
  return `cut_${mapId}_${x}_${y}`;
}

/** Determine whether a cuttree tile has been removed (flag present) */
export function isTreeCut(storyFlags: Set<string>, mapId: string, x: number, y: number): boolean {
  return storyFlags.has(cutTreeFlag(mapId, x, y));
}

/**
 * Given the tile type the player is facing and current state,
 * decide what HM action (if any) is available.
 */
export function getHmAction(
  tileType: number,
  team: PokemonInstance[],
  isSurfing: boolean,
): 'cut' | 'surf' | null {
  // 16 = cuttree
  if (tileType === 16 && teamKnowsMove(team, 'cut')) return 'cut';
  // 3 = water, only if not already surfing
  if (tileType === 3 && !isSurfing && teamKnowsMove(team, 'surf')) return 'surf';
  return null;
}

/** Check if player should exit surf mode (stepping onto a non-water tile) */
export function shouldExitSurf(tileType: number, isSurfing: boolean): boolean {
  return isSurfing && tileType !== 3;
}

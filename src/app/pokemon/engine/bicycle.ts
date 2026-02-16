// ===== BICYCLE LOGIC =====

const INDOOR_MAP_IDS = new Set(['pokecenter', 'pokemart', 'oak_lab', 'elite4']);

export function isIndoorMap(mapId: string): boolean {
  return INDOOR_MAP_IDS.has(mapId) || mapId.startsWith('gym_');
}

export function canToggleBicycle(hasBicycle: boolean, mapId: string, isSurfing: boolean): boolean {
  return hasBicycle && !isIndoorMap(mapId) && !isSurfing;
}

export function toggleBicycle(onBicycle: boolean, hasBicycle: boolean, mapId: string, isSurfing: boolean): boolean {
  if (!canToggleBicycle(hasBicycle, mapId, isSurfing)) return onBicycle;
  return !onBicycle;
}

// Key items that can appear in the bag
export interface KeyItem {
  id: string;
  name: string;
  description: string;
}

export const KEY_ITEMS: KeyItem[] = [
  { id: 'bicycle', name: 'Bicycle', description: 'A folding bike. Press B to ride.' },
];

export function getPlayerKeyItems(hasBicycle: boolean): KeyItem[] {
  const items: KeyItem[] = [];
  if (hasBicycle) items.push(KEY_ITEMS[0]);
  return items;
}

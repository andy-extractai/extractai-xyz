import { ItemData } from './types';

export const ITEMS: Record<string, ItemData> = {
  pokeball:    { id: 'pokeball', name: 'Poké Ball', description: 'A device for catching wild Pokémon.', category: 'pokeball', price: 200 },
  greatball:   { id: 'greatball', name: 'Great Ball', description: 'A good ball with a higher catch rate.', category: 'pokeball', price: 600 },
  ultraball:   { id: 'ultraball', name: 'Ultra Ball', description: 'A high-performance ball.', category: 'pokeball', price: 1200 },
  potion:      { id: 'potion', name: 'Potion', description: 'Restores 20 HP.', category: 'medicine', price: 300, effect: 'heal20' },
  superPotion: { id: 'superPotion', name: 'Super Potion', description: 'Restores 50 HP.', category: 'medicine', price: 700, effect: 'heal50' },
  hyperPotion: { id: 'hyperPotion', name: 'Hyper Potion', description: 'Restores 200 HP.', category: 'medicine', price: 1200, effect: 'heal200' },
  antidote:    { id: 'antidote', name: 'Antidote', description: 'Cures poison.', category: 'medicine', price: 100, effect: 'curePoison' },
  paralyzeHeal:{ id: 'paralyzeHeal', name: 'Parlyz Heal', description: 'Cures paralysis.', category: 'medicine', price: 200, effect: 'cureParalyze' },
  awakening:   { id: 'awakening', name: 'Awakening', description: 'Wakes a sleeping Pokémon.', category: 'medicine', price: 250, effect: 'cureSleep' },
  revive:      { id: 'revive', name: 'Revive', description: 'Revives a fainted Pokémon to half HP.', category: 'medicine', price: 1500, effect: 'revive' },
  fullRestore: { id: 'fullRestore', name: 'Full Restore', description: 'Fully restores HP and status.', category: 'medicine', price: 3000, effect: 'fullRestore' },
  repel:       { id: 'repel', name: 'Repel', description: 'Prevents wild encounters for 100 steps.', category: 'battle', price: 350, effect: 'repel' },
  bicycle:     { id: 'bicycle', name: 'Bicycle', description: 'A folding bike. Doubles movement speed.', category: 'key', price: 0 },
  oldRod:      { id: 'oldRod', name: 'Old Rod', description: 'Use to fish in water.', category: 'key', price: 0 },
};

export interface ShopInventory {
  items: { itemId: string; }[];
}

export const MART_INVENTORY: Record<string, ShopInventory> = {
  viridian: {
    items: [
      { itemId: 'pokeball' }, { itemId: 'potion' }, { itemId: 'antidote' },
      { itemId: 'paralyzeHeal' }, { itemId: 'repel' },
    ],
  },
  pewter: {
    items: [
      { itemId: 'pokeball' }, { itemId: 'greatball' }, { itemId: 'potion' },
      { itemId: 'superPotion' }, { itemId: 'antidote' }, { itemId: 'paralyzeHeal' },
      { itemId: 'awakening' }, { itemId: 'repel' },
    ],
  },
  cerulean: {
    items: [
      { itemId: 'greatball' }, { itemId: 'superPotion' }, { itemId: 'revive' },
      { itemId: 'antidote' }, { itemId: 'repel' },
    ],
  },
  vermilion: {
    items: [
      { itemId: 'greatball' }, { itemId: 'ultraball' }, { itemId: 'superPotion' },
      { itemId: 'hyperPotion' }, { itemId: 'revive' }, { itemId: 'fullRestore' },
    ],
  },
  celadon: {
    items: [
      { itemId: 'ultraball' }, { itemId: 'hyperPotion' }, { itemId: 'fullRestore' },
      { itemId: 'revive' },
    ],
  },
};

export interface ItemData {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'pokeball' | 'potion' | 'status' | 'key';
  effect?: {
    type: 'heal' | 'catch' | 'cureStatus' | 'revive';
    value?: number; // heal amount or catch rate modifier
  };
}

export const ITEM_DATA: Record<string, ItemData> = {
  'poke-ball': {
    id: 'poke-ball', name: 'Poké Ball', price: 200,
    description: 'A device for catching wild Pokémon.',
    category: 'pokeball',
    effect: { type: 'catch', value: 1 },
  },
  'great-ball': {
    id: 'great-ball', name: 'Great Ball', price: 600,
    description: 'A good, high-performance Poké Ball.',
    category: 'pokeball',
    effect: { type: 'catch', value: 1.5 },
  },
  'potion': {
    id: 'potion', name: 'Potion', price: 300,
    description: 'Restores 20 HP.',
    category: 'potion',
    effect: { type: 'heal', value: 20 },
  },
  'super-potion': {
    id: 'super-potion', name: 'Super Potion', price: 700,
    description: 'Restores 50 HP.',
    category: 'potion',
    effect: { type: 'heal', value: 50 },
  },
  'antidote': {
    id: 'antidote', name: 'Antidote', price: 100,
    description: 'Cures a poisoned Pokémon.',
    category: 'status',
    effect: { type: 'cureStatus' },
  },
  'awakening': {
    id: 'awakening', name: 'Awakening', price: 250,
    description: 'Awakens a sleeping Pokémon.',
    category: 'status',
    effect: { type: 'cureStatus' },
  },
  'paralyze-heal': {
    id: 'paralyze-heal', name: 'Paralyze Heal', price: 200,
    description: 'Cures a paralyzed Pokémon.',
    category: 'status',
    effect: { type: 'cureStatus' },
  },
  'revive': {
    id: 'revive', name: 'Revive', price: 1500,
    description: 'Revives a fainted Pokémon with half its max HP.',
    category: 'status',
    effect: { type: 'revive', value: 0.5 },
  },
};

export const SHOP_INVENTORY: Record<string, string[]> = {
  viridian: ['poke-ball', 'potion', 'antidote', 'paralyze-heal', 'awakening'],
};

// Pokemon Type System with full Gen 1 effectiveness chart

export type PokemonType = 
  | 'Normal' | 'Fire' | 'Water' | 'Grass' | 'Electric' | 'Ice'
  | 'Fighting' | 'Poison' | 'Ground' | 'Flying' | 'Psychic'
  | 'Bug' | 'Rock' | 'Ghost' | 'Dragon';

export type StatusEffect = 'poison' | 'burn' | 'paralyze' | 'sleep' | 'freeze' | null;

// Multiplier chart: effectiveness[attacker][defender]
const E: Record<PokemonType, Partial<Record<PokemonType, number>>> = {
  Normal:   { Rock: 0.5, Ghost: 0 },
  Fire:     { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 2, Bug: 2, Rock: 0.5, Dragon: 0.5 },
  Water:    { Fire: 2, Water: 0.5, Grass: 0.5, Ground: 2, Rock: 2, Dragon: 0.5 },
  Grass:    { Fire: 0.5, Water: 2, Grass: 0.5, Poison: 0.5, Ground: 2, Flying: 0.5, Bug: 0.5, Rock: 2, Dragon: 0.5 },
  Electric: { Water: 2, Grass: 0.5, Electric: 0.5, Ground: 0, Flying: 2, Dragon: 0.5 },
  Ice:      { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 0.5, Ground: 2, Flying: 2, Dragon: 2 },
  Fighting: { Normal: 2, Ice: 2, Poison: 0.5, Flying: 0.5, Psychic: 0.5, Bug: 0.5, Rock: 2, Ghost: 0 },
  Poison:   { Grass: 2, Poison: 0.5, Ground: 0.5, Rock: 0.5, Ghost: 0.5 },
  Ground:   { Fire: 2, Electric: 2, Grass: 0.5, Poison: 2, Flying: 0, Bug: 0.5, Rock: 2 },
  Flying:   { Grass: 2, Electric: 0.5, Fighting: 2, Bug: 2, Rock: 0.5 },
  Psychic:  { Fighting: 2, Poison: 2, Psychic: 0.5 },
  Bug:      { Fire: 0.5, Grass: 2, Fighting: 0.5, Poison: 0.5, Flying: 0.5, Psychic: 2, Ghost: 0.5 },
  Rock:     { Fire: 2, Ice: 2, Fighting: 0.5, Ground: 0.5, Flying: 2, Bug: 2 },
  Ghost:    { Normal: 0, Ghost: 2, Psychic: 0 },
  Dragon:   { Dragon: 2 },
};

export function getEffectiveness(atkType: PokemonType, defTypes: PokemonType[]): number {
  let mult = 1;
  for (const dt of defTypes) {
    mult *= E[atkType]?.[dt] ?? 1;
  }
  return mult;
}

export interface Stats {
  hp: number;
  attack: number;
  defense: number;
  spAtk: number;
  spDef: number;
  speed: number;
}

export interface MoveData {
  name: string;
  type: PokemonType;
  power: number; // 0 = status move
  accuracy: number; // 0-100
  pp: number;
  category: 'physical' | 'special' | 'status';
  effect?: 'poison' | 'burn' | 'paralyze' | 'sleep' | 'freeze' | 'heal' | 'stat-up' | 'stat-down' | 'flinch';
  effectChance?: number; // 0-100
  description?: string;
}

export interface LearnableMove {
  level: number;
  moveId: string;
}

export interface SpeciesData {
  id: number;
  name: string;
  types: PokemonType[];
  baseStats: Stats;
  learnset: LearnableMove[];
  evolutionLevel?: number;
  evolvesTo?: string; // species id key
  catchRate: number; // 0-255
  expYield: number;
  spriteColors: string[]; // colors for programmatic sprite
  description: string;
}

export interface PokemonInstance {
  uid: string;
  speciesId: string;
  nickname?: string;
  level: number;
  exp: number;
  currentHp: number;
  stats: Stats;
  moves: { moveId: string; currentPp: number }[];
  status: StatusEffect;
  iv: Stats; // individual values 0-15
  isShiny?: boolean;
}

export interface ItemData {
  id: string;
  name: string;
  description: string;
  category: 'pokeball' | 'medicine' | 'battle' | 'key';
  price: number;
  effect?: string;
}

export interface TrainerData {
  id: string;
  name: string;
  team: { speciesId: string; level: number }[];
  reward: number;
  spriteType: 'youngster' | 'lass' | 'hiker' | 'beauty' | 'scientist' | 'rocket' | 'gymleader' | 'elite4' | 'champion' | 'rival';
  defeatDialog: string[];
  preDialog?: string[];
}

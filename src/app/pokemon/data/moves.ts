export interface MoveData {
  name: string;
  type: string;
  category: 'Physical' | 'Special' | 'Status';
  power: number;
  accuracy: number;
  pp: number;
  description: string;
  effect?: {
    type: 'poison' | 'sleep' | 'paralyze' | 'burn' | 'freeze' | 'lowerStat' | 'raiseStat' | 'flee';
    stat?: string;
    stages?: number;
    chance?: number; // 0-100
  };
}

export const MOVE_DATA: Record<string, MoveData> = {
  'Tackle': {
    name: 'Tackle', type: 'Normal', category: 'Physical',
    power: 40, accuracy: 100, pp: 35,
    description: 'A physical attack in which the user charges and slams into the target.',
  },
  'Scratch': {
    name: 'Scratch', type: 'Normal', category: 'Physical',
    power: 40, accuracy: 100, pp: 35,
    description: 'Hard, pointed, sharp claws rake the target to inflict damage.',
  },
  'Pound': {
    name: 'Pound', type: 'Normal', category: 'Physical',
    power: 40, accuracy: 100, pp: 35,
    description: 'The target is physically pounded with a long tail or foreleg.',
  },
  'Growl': {
    name: 'Growl', type: 'Normal', category: 'Status',
    power: 0, accuracy: 100, pp: 40,
    description: 'The user growls in an endearing way, making opposing Pokémon lower their Attack stat.',
    effect: { type: 'lowerStat', stat: 'atk', stages: -1 },
  },
  'Tail Whip': {
    name: 'Tail Whip', type: 'Normal', category: 'Status',
    power: 0, accuracy: 100, pp: 30,
    description: 'The user wags its tail cutely, making opposing Pokémon lower their Defense stat.',
    effect: { type: 'lowerStat', stat: 'def', stages: -1 },
  },
  'Ember': {
    name: 'Ember', type: 'Fire', category: 'Special',
    power: 40, accuracy: 100, pp: 25,
    description: 'The target is attacked with small flames.',
    effect: { type: 'burn', chance: 10 },
  },
  'Water Gun': {
    name: 'Water Gun', type: 'Water', category: 'Special',
    power: 40, accuracy: 100, pp: 25,
    description: 'The target is blasted with a forceful shot of water.',
  },
  'Vine Whip': {
    name: 'Vine Whip', type: 'Grass', category: 'Physical',
    power: 45, accuracy: 100, pp: 25,
    description: 'The target is struck with slender, whiplike vines.',
  },
  'Thunder Shock': {
    name: 'Thunder Shock', type: 'Electric', category: 'Special',
    power: 40, accuracy: 100, pp: 30,
    description: 'A jolt of electricity crashes down on the target.',
    effect: { type: 'paralyze', chance: 10 },
  },
  'Quick Attack': {
    name: 'Quick Attack', type: 'Normal', category: 'Physical',
    power: 40, accuracy: 100, pp: 30,
    description: 'The user lunges at the target at a speed that makes it almost invisible. This move always goes first.',
  },
  'Bite': {
    name: 'Bite', type: 'Normal', category: 'Physical',
    power: 60, accuracy: 100, pp: 25,
    description: 'The target is bitten with viciously sharp fangs.',
  },
  'Hyper Fang': {
    name: 'Hyper Fang', type: 'Normal', category: 'Physical',
    power: 80, accuracy: 90, pp: 15,
    description: 'The user bites hard on the target with its sharp front fangs.',
  },
  'Peck': {
    name: 'Peck', type: 'Flying', category: 'Physical',
    power: 35, accuracy: 100, pp: 35,
    description: 'The target is jabbed with a sharply pointed beak or horn.',
  },
  'Wing Attack': {
    name: 'Wing Attack', type: 'Flying', category: 'Physical',
    power: 60, accuracy: 100, pp: 35,
    description: 'The target is struck with large, imposing wings spread wide.',
  },
  'Gust': {
    name: 'Gust', type: 'Flying', category: 'Special',
    power: 40, accuracy: 100, pp: 35,
    description: 'A gust of wind is whipped up by wings and launched at the target.',
  },
  'Confusion': {
    name: 'Confusion', type: 'Psychic', category: 'Special',
    power: 50, accuracy: 100, pp: 25,
    description: 'The target is hit by a weak telekinetic force.',
  },
  'Teleport': {
    name: 'Teleport', type: 'Psychic', category: 'Status',
    power: 0, accuracy: 100, pp: 20,
    description: 'Use it to flee from any wild Pokémon.',
    effect: { type: 'flee' },
  },
  'Cut': {
    name: 'Cut', type: 'Normal', category: 'Physical',
    power: 50, accuracy: 95, pp: 30,
    description: 'The target is cut with a scythe or claw.',
  },
  'Poison Powder': {
    name: 'Poison Powder', type: 'Poison', category: 'Status',
    power: 0, accuracy: 75, pp: 35,
    description: 'The user scatters a cloud of poisonous dust that poisons the target.',
    effect: { type: 'poison', chance: 100 },
  },
  'Sleep Powder': {
    name: 'Sleep Powder', type: 'Grass', category: 'Status',
    power: 0, accuracy: 75, pp: 15,
    description: 'The user scatters a big cloud of sleep-inducing dust around the target.',
    effect: { type: 'sleep', chance: 100 },
  },
};

import { SpeciesData } from './types';

// 50 Pokémon species covering all types with evolution chains
export const SPECIES: Record<string, SpeciesData> = {
  // FIRE STARTER LINE
  emberon: {
    id: 1, name: 'Emberon', types: ['Fire'], catchRate: 45, expYield: 64,
    baseStats: { hp: 39, attack: 52, defense: 43, spAtk: 60, spDef: 50, speed: 65 },
    learnset: [
      { level: 1, moveId: 'scratch' }, { level: 1, moveId: 'growl' },
      { level: 7, moveId: 'ember' }, { level: 13, moveId: 'smokescreen' },
      { level: 20, moveId: 'firePunch' }, { level: 28, moveId: 'slash' },
    ],
    evolutionLevel: 16, evolvesTo: 'blazeron',
    spriteColors: ['#e74c3c', '#f39c12', '#fff3e0'], description: 'A small fire lizard with a burning tail.',
  },
  blazeron: {
    id: 2, name: 'Blazeron', types: ['Fire'], catchRate: 45, expYield: 142,
    baseStats: { hp: 58, attack: 64, defense: 58, spAtk: 80, spDef: 65, speed: 80 },
    learnset: [
      { level: 1, moveId: 'scratch' }, { level: 1, moveId: 'ember' },
      { level: 16, moveId: 'firePunch' }, { level: 24, moveId: 'slash' },
      { level: 33, moveId: 'flamethrower' },
    ],
    evolutionLevel: 36, evolvesTo: 'infernox',
    spriteColors: ['#c0392b', '#e74c3c', '#f39c12'], description: 'Its fire burns hotter as it evolves.',
  },
  infernox: {
    id: 3, name: 'Infernox', types: ['Fire', 'Flying'], catchRate: 45, expYield: 240,
    baseStats: { hp: 78, attack: 84, defense: 78, spAtk: 109, spDef: 85, speed: 100 },
    learnset: [
      { level: 1, moveId: 'flamethrower' }, { level: 1, moveId: 'slash' },
      { level: 36, moveId: 'wingAttack' }, { level: 42, moveId: 'fireBlast' },
      { level: 50, moveId: 'fly' },
    ],
    spriteColors: ['#c0392b', '#e67e22', '#f1c40f'], description: 'Its wings let it soar through flames.',
  },

  // WATER STARTER LINE
  aqualing: {
    id: 4, name: 'Aqualing', types: ['Water'], catchRate: 45, expYield: 63,
    baseStats: { hp: 44, attack: 48, defense: 65, spAtk: 50, spDef: 64, speed: 43 },
    learnset: [
      { level: 1, moveId: 'tackle' }, { level: 1, moveId: 'tailWhip' },
      { level: 7, moveId: 'waterGun' }, { level: 13, moveId: 'bite' },
      { level: 20, moveId: 'waterPulse' },
    ],
    evolutionLevel: 16, evolvesTo: 'tidalon',
    spriteColors: ['#3498db', '#2980b9', '#ecf0f1'], description: 'A tiny turtle that loves to swim.',
  },
  tidalon: {
    id: 5, name: 'Tidalon', types: ['Water'], catchRate: 45, expYield: 142,
    baseStats: { hp: 59, attack: 63, defense: 80, spAtk: 65, spDef: 80, speed: 58 },
    learnset: [
      { level: 1, moveId: 'waterGun' }, { level: 1, moveId: 'bite' },
      { level: 16, moveId: 'waterPulse' }, { level: 24, moveId: 'bodySlam' },
      { level: 33, moveId: 'surf' },
    ],
    evolutionLevel: 36, evolvesTo: 'tsunamix',
    spriteColors: ['#2980b9', '#1a5276', '#aed6f1'], description: 'A powerful swimmer with a hard shell.',
  },
  tsunamix: {
    id: 6, name: 'Tsunamix', types: ['Water'], catchRate: 45, expYield: 239,
    baseStats: { hp: 79, attack: 83, defense: 100, spAtk: 85, spDef: 105, speed: 78 },
    learnset: [
      { level: 1, moveId: 'surf' }, { level: 1, moveId: 'bite' },
      { level: 36, moveId: 'iceBeam' }, { level: 42, moveId: 'hydroPump' },
    ],
    spriteColors: ['#1a5276', '#2471a3', '#85c1e9'], description: 'Can create tidal waves with its tail.',
  },

  // GRASS STARTER LINE
  sproutley: {
    id: 7, name: 'Sproutley', types: ['Grass'], catchRate: 45, expYield: 64,
    baseStats: { hp: 45, attack: 49, defense: 49, spAtk: 65, spDef: 65, speed: 45 },
    learnset: [
      { level: 1, moveId: 'tackle' }, { level: 1, moveId: 'growl' },
      { level: 7, moveId: 'vineWhip' }, { level: 13, moveId: 'poisonPowder' },
      { level: 20, moveId: 'razorLeaf' },
    ],
    evolutionLevel: 16, evolvesTo: 'thornox',
    spriteColors: ['#27ae60', '#2ecc71', '#f39c12'], description: 'A seed Pokémon with a bulb on its back.',
  },
  thornox: {
    id: 8, name: 'Thornox', types: ['Grass', 'Poison'], catchRate: 45, expYield: 142,
    baseStats: { hp: 60, attack: 62, defense: 63, spAtk: 80, spDef: 80, speed: 60 },
    learnset: [
      { level: 1, moveId: 'vineWhip' }, { level: 1, moveId: 'poisonPowder' },
      { level: 16, moveId: 'razorLeaf' }, { level: 24, moveId: 'acid' },
      { level: 33, moveId: 'seedBomb' },
    ],
    evolutionLevel: 36, evolvesTo: 'florapex',
    spriteColors: ['#229954', '#27ae60', '#e74c3c'], description: 'Thorns grow from its flowering bulb.',
  },
  florapex: {
    id: 9, name: 'Florapex', types: ['Grass', 'Poison'], catchRate: 45, expYield: 236,
    baseStats: { hp: 80, attack: 82, defense: 83, spAtk: 100, spDef: 100, speed: 80 },
    learnset: [
      { level: 1, moveId: 'seedBomb' }, { level: 1, moveId: 'sludgeBomb' },
      { level: 36, moveId: 'solarBeam' }, { level: 42, moveId: 'sleepPowder' },
    ],
    spriteColors: ['#1e8449', '#e74c3c', '#f1c40f'], description: 'A massive flower blooms on its back.',
  },

  // NORMAL - ROUTE 1
  rattipaw: {
    id: 10, name: 'Rattipaw', types: ['Normal'], catchRate: 255, expYield: 51,
    baseStats: { hp: 30, attack: 56, defense: 35, spAtk: 25, spDef: 35, speed: 72 },
    learnset: [
      { level: 1, moveId: 'tackle' }, { level: 1, moveId: 'tailWhip' },
      { level: 7, moveId: 'quickAttack' }, { level: 14, moveId: 'bite' },
      { level: 20, moveId: 'headbutt' },
    ],
    evolutionLevel: 20, evolvesTo: 'rattifang',
    spriteColors: ['#8e44ad', '#9b59b6', '#ecf0f1'], description: 'A common rodent found everywhere.',
  },
  rattifang: {
    id: 11, name: 'Rattifang', types: ['Normal'], catchRate: 127, expYield: 145,
    baseStats: { hp: 55, attack: 81, defense: 60, spAtk: 50, spDef: 70, speed: 97 },
    learnset: [
      { level: 1, moveId: 'quickAttack' }, { level: 1, moveId: 'bite' },
      { level: 20, moveId: 'headbutt' }, { level: 27, moveId: 'bodySlam' },
    ],
    spriteColors: ['#6c3483', '#8e44ad', '#d5d8dc'], description: 'Its large fangs never stop growing.',
  },

  // FLYING
  pidglit: {
    id: 12, name: 'Pidglit', types: ['Normal', 'Flying'], catchRate: 255, expYield: 50,
    baseStats: { hp: 40, attack: 45, defense: 40, spAtk: 35, spDef: 35, speed: 56 },
    learnset: [
      { level: 1, moveId: 'tackle' }, { level: 1, moveId: 'gust' },
      { level: 9, moveId: 'quickAttack' }, { level: 15, moveId: 'wingAttack' },
    ],
    evolutionLevel: 18, evolvesTo: 'pidgsoar',
    spriteColors: ['#784212', '#a04000', '#f5cba7'], description: 'A small bird that nests in tall grass.',
  },
  pidgsoar: {
    id: 13, name: 'Pidgsoar', types: ['Normal', 'Flying'], catchRate: 120, expYield: 122,
    baseStats: { hp: 63, attack: 60, defense: 55, spAtk: 50, spDef: 50, speed: 71 },
    learnset: [
      { level: 1, moveId: 'wingAttack' }, { level: 1, moveId: 'quickAttack' },
      { level: 18, moveId: 'aerialAce' }, { level: 28, moveId: 'fly' },
    ],
    evolutionLevel: 36, evolvesTo: 'pidgstorm',
    spriteColors: ['#6e2c00', '#a04000', '#fdebd0'], description: 'Soars above the forests searching for food.',
  },
  pidgstorm: {
    id: 14, name: 'Pidgstorm', types: ['Normal', 'Flying'], catchRate: 45, expYield: 216,
    baseStats: { hp: 83, attack: 80, defense: 75, spAtk: 70, spDef: 70, speed: 101 },
    learnset: [
      { level: 1, moveId: 'fly' }, { level: 1, moveId: 'aerialAce' },
      { level: 36, moveId: 'hyperBeam' },
    ],
    spriteColors: ['#5b2c6f', '#a04000', '#f9e79f'], description: 'Creates powerful gusts with its massive wings.',
  },

  // BUG
  buglin: {
    id: 15, name: 'Buglin', types: ['Bug'], catchRate: 255, expYield: 39,
    baseStats: { hp: 45, attack: 30, defense: 35, spAtk: 20, spDef: 20, speed: 45 },
    learnset: [
      { level: 1, moveId: 'tackle' }, { level: 1, moveId: 'stringShot' },
      { level: 9, moveId: 'bugBite' },
    ],
    evolutionLevel: 10, evolvesTo: 'cocoona',
    spriteColors: ['#27ae60', '#f1c40f', '#795548'], description: 'A caterpillar that eats leaves all day.',
  },
  cocoona: {
    id: 16, name: 'Cocoona', types: ['Bug'], catchRate: 120, expYield: 72,
    baseStats: { hp: 50, attack: 20, defense: 55, spAtk: 25, spDef: 25, speed: 30 },
    learnset: [{ level: 1, moveId: 'tackle' }, { level: 1, moveId: 'stringShot' }],
    evolutionLevel: 15, evolvesTo: 'mothara',
    spriteColors: ['#27ae60', '#1e8449', '#d4ac0d'], description: 'It hardens its shell and waits to evolve.',
  },
  mothara: {
    id: 17, name: 'Mothara', types: ['Bug', 'Flying'], catchRate: 45, expYield: 178,
    baseStats: { hp: 60, attack: 45, defense: 50, spAtk: 90, spDef: 80, speed: 70 },
    learnset: [
      { level: 1, moveId: 'gust' }, { level: 1, moveId: 'confusion' },
      { level: 15, moveId: 'sleepPowder' }, { level: 22, moveId: 'psybeam' },
      { level: 30, moveId: 'signalBeam' },
    ],
    spriteColors: ['#8e44ad', '#3498db', '#ecf0f1'], description: 'Beautiful wings scatter hypnotic dust.',
  },

  // ELECTRIC
  zaprat: {
    id: 18, name: 'Zaprat', types: ['Electric'], catchRate: 190, expYield: 112,
    baseStats: { hp: 35, attack: 55, defense: 40, spAtk: 50, spDef: 50, speed: 90 },
    learnset: [
      { level: 1, moveId: 'thunderShock' }, { level: 1, moveId: 'quickAttack' },
      { level: 11, moveId: 'sparkle' }, { level: 18, moveId: 'thunderWave' },
      { level: 26, moveId: 'thunderbolt' },
    ],
    evolutionLevel: 22, evolvesTo: 'voltorex',
    spriteColors: ['#f1c40f', '#f39c12', '#ecf0f1'], description: 'Stores static electricity in its cheeks.',
  },
  voltorex: {
    id: 19, name: 'Voltorex', types: ['Electric'], catchRate: 75, expYield: 218,
    baseStats: { hp: 60, attack: 90, defense: 55, spAtk: 90, spDef: 80, speed: 110 },
    learnset: [
      { level: 1, moveId: 'thunderbolt' }, { level: 1, moveId: 'quickAttack' },
      { level: 22, moveId: 'sparkle' }, { level: 33, moveId: 'thunder' },
    ],
    spriteColors: ['#f39c12', '#e67e22', '#fff'], description: 'Lightning crackles from its powerful tail.',
  },

  // POISON
  snekil: {
    id: 20, name: 'Snekil', types: ['Poison'], catchRate: 255, expYield: 58,
    baseStats: { hp: 35, attack: 60, defense: 44, spAtk: 40, spDef: 54, speed: 55 },
    learnset: [
      { level: 1, moveId: 'poisonSting' }, { level: 1, moveId: 'leer' },
      { level: 10, moveId: 'bite' }, { level: 17, moveId: 'acid' },
      { level: 25, moveId: 'sludgeBomb' },
    ],
    evolutionLevel: 22, evolvesTo: 'cobrix',
    spriteColors: ['#8e44ad', '#6c3483', '#f1c40f'], description: 'Sneaks through grass to ambush prey.',
  },
  cobrix: {
    id: 21, name: 'Cobrix', types: ['Poison'], catchRate: 90, expYield: 157,
    baseStats: { hp: 60, attack: 85, defense: 69, spAtk: 65, spDef: 79, speed: 80 },
    learnset: [
      { level: 1, moveId: 'bite' }, { level: 1, moveId: 'acid' },
      { level: 22, moveId: 'sludgeBomb' }, { level: 30, moveId: 'earthquake' },
    ],
    spriteColors: ['#6c3483', '#512e5f', '#f1c40f'], description: 'Its hood spreads wide to intimidate foes.',
  },

  // GROUND/ROCK
  geodon: {
    id: 22, name: 'Geodon', types: ['Rock', 'Ground'], catchRate: 255, expYield: 60,
    baseStats: { hp: 40, attack: 80, defense: 100, spAtk: 30, spDef: 30, speed: 20 },
    learnset: [
      { level: 1, moveId: 'tackle' }, { level: 1, moveId: 'mudSlap' },
      { level: 11, moveId: 'rockThrow' }, { level: 18, moveId: 'dig' },
      { level: 25, moveId: 'rockSlide' },
    ],
    evolutionLevel: 25, evolvesTo: 'boulderox',
    spriteColors: ['#7f8c8d', '#95a5a6', '#5d6d7e'], description: 'A living boulder often mistaken for rocks.',
  },
  boulderox: {
    id: 23, name: 'Boulderox', types: ['Rock', 'Ground'], catchRate: 45, expYield: 177,
    baseStats: { hp: 80, attack: 110, defense: 130, spAtk: 55, spDef: 65, speed: 45 },
    learnset: [
      { level: 1, moveId: 'rockSlide' }, { level: 1, moveId: 'dig' },
      { level: 25, moveId: 'earthquake' }, { level: 36, moveId: 'bodySlam' },
    ],
    spriteColors: ['#5d6d7e', '#808b96', '#aeb6bf'], description: 'Can cause landslides with a single punch.',
  },

  // FIGHTING
  punchub: {
    id: 24, name: 'Punchub', types: ['Fighting'], catchRate: 180, expYield: 61,
    baseStats: { hp: 50, attack: 75, defense: 35, spAtk: 35, spDef: 45, speed: 35 },
    learnset: [
      { level: 1, moveId: 'pound' }, { level: 1, moveId: 'leer' },
      { level: 7, moveId: 'karateChop' }, { level: 13, moveId: 'lowKick' },
      { level: 25, moveId: 'submission' },
    ],
    evolutionLevel: 28, evolvesTo: 'champeon',
    spriteColors: ['#d35400', '#e67e22', '#f5cba7'], description: 'Trains by punching trees all day.',
  },
  champeon: {
    id: 25, name: 'Champeon', types: ['Fighting'], catchRate: 45, expYield: 227,
    baseStats: { hp: 80, attack: 110, defense: 70, spAtk: 50, spDef: 60, speed: 80 },
    learnset: [
      { level: 1, moveId: 'karateChop' }, { level: 1, moveId: 'submission' },
      { level: 28, moveId: 'crossChop' }, { level: 40, moveId: 'bodySlam' },
    ],
    spriteColors: ['#b7950b', '#d4ac0d', '#f5cba7'], description: 'Its four arms deliver rapid-fire punches.',
  },

  // PSYCHIC
  psydux: {
    id: 26, name: 'Psydux', types: ['Psychic'], catchRate: 150, expYield: 80,
    baseStats: { hp: 40, attack: 35, defense: 45, spAtk: 85, spDef: 60, speed: 50 },
    learnset: [
      { level: 1, moveId: 'confusion' }, { level: 1, moveId: 'growl' },
      { level: 12, moveId: 'psybeam' }, { level: 22, moveId: 'psychic' },
      { level: 30, moveId: 'recover' },
    ],
    evolutionLevel: 26, evolvesTo: 'psyclops',
    spriteColors: ['#8e44ad', '#d2b4de', '#f1c40f'], description: 'Headaches unleash its hidden powers.',
  },
  psyclops: {
    id: 27, name: 'Psyclops', types: ['Psychic'], catchRate: 50, expYield: 196,
    baseStats: { hp: 60, attack: 50, defense: 65, spAtk: 125, spDef: 95, speed: 80 },
    learnset: [
      { level: 1, moveId: 'psychic' }, { level: 1, moveId: 'psybeam' },
      { level: 26, moveId: 'recover' }, { level: 36, moveId: 'hyperBeam' },
    ],
    spriteColors: ['#6c3483', '#a569bd', '#f9e79f'], description: 'Its third eye sees the future.',
  },

  // GHOST
  ghoulby: {
    id: 28, name: 'Ghoulby', types: ['Ghost', 'Poison'], catchRate: 190, expYield: 62,
    baseStats: { hp: 30, attack: 35, defense: 30, spAtk: 100, spDef: 35, speed: 80 },
    learnset: [
      { level: 1, moveId: 'lick' }, { level: 1, moveId: 'nightShade' },
      { level: 15, moveId: 'shadowBall' }, { level: 25, moveId: 'sludgeBomb' },
    ],
    evolutionLevel: 25, evolvesTo: 'spectrox',
    spriteColors: ['#2c3e50', '#8e44ad', '#e74c3c'], description: 'Hides in shadows and licks its prey.',
  },
  spectrox: {
    id: 29, name: 'Spectrox', types: ['Ghost', 'Poison'], catchRate: 45, expYield: 190,
    baseStats: { hp: 60, attack: 65, defense: 60, spAtk: 130, spDef: 75, speed: 110 },
    learnset: [
      { level: 1, moveId: 'shadowBall' }, { level: 1, moveId: 'sludgeBomb' },
      { level: 25, moveId: 'psychic' }, { level: 36, moveId: 'hyperBeam' },
    ],
    spriteColors: ['#1a1a2e', '#6c3483', '#e74c3c'], description: 'Can phase through walls and curse foes.',
  },

  // ICE
  frostkit: {
    id: 30, name: 'Frostkit', types: ['Ice'], catchRate: 150, expYield: 75,
    baseStats: { hp: 50, attack: 45, defense: 55, spAtk: 65, spDef: 70, speed: 45 },
    learnset: [
      { level: 1, moveId: 'tackle' }, { level: 1, moveId: 'iceShard' },
      { level: 11, moveId: 'bite' }, { level: 18, moveId: 'iceBeam' },
    ],
    evolutionLevel: 30, evolvesTo: 'glacirex',
    spriteColors: ['#85c1e9', '#d6eaf8', '#2e86c1'], description: 'Breathes icy mist from its tiny snout.',
  },
  glacirex: {
    id: 31, name: 'Glacirex', types: ['Ice'], catchRate: 50, expYield: 215,
    baseStats: { hp: 75, attack: 70, defense: 80, spAtk: 105, spDef: 100, speed: 65 },
    learnset: [
      { level: 1, moveId: 'iceBeam' }, { level: 1, moveId: 'bite' },
      { level: 30, moveId: 'blizzard' }, { level: 40, moveId: 'bodySlam' },
    ],
    spriteColors: ['#2e86c1', '#85c1e9', '#d6eaf8'], description: 'Can freeze entire lakes with its breath.',
  },

  // DRAGON
  drakelet: {
    id: 32, name: 'Drakelet', types: ['Dragon'], catchRate: 45, expYield: 60,
    baseStats: { hp: 41, attack: 64, defense: 45, spAtk: 50, spDef: 50, speed: 50 },
    learnset: [
      { level: 1, moveId: 'scratch' }, { level: 1, moveId: 'leer' },
      { level: 10, moveId: 'dragonRage' }, { level: 20, moveId: 'bite' },
      { level: 30, moveId: 'dragonClaw' }, { level: 40, moveId: 'flamethrower' },
    ],
    evolutionLevel: 30, evolvesTo: 'draconix',
    spriteColors: ['#2980b9', '#3498db', '#f39c12'], description: 'A rare dragon hatchling with blue scales.',
  },
  draconix: {
    id: 33, name: 'Draconix', types: ['Dragon', 'Flying'], catchRate: 45, expYield: 218,
    baseStats: { hp: 91, attack: 134, defense: 95, spAtk: 100, spDef: 100, speed: 80 },
    learnset: [
      { level: 1, moveId: 'dragonClaw' }, { level: 1, moveId: 'flamethrower' },
      { level: 30, moveId: 'fly' }, { level: 45, moveId: 'hyperBeam' },
    ],
    spriteColors: ['#e67e22', '#f39c12', '#2980b9'], description: 'A fearsome dragon that rules the skies.',
  },

  // WATER extras
  goldish: {
    id: 34, name: 'Goldish', types: ['Water'], catchRate: 225, expYield: 64,
    baseStats: { hp: 45, attack: 67, defense: 60, spAtk: 35, spDef: 50, speed: 63 },
    learnset: [
      { level: 1, moveId: 'tackle' }, { level: 1, moveId: 'waterGun' },
      { level: 12, moveId: 'waterPulse' }, { level: 20, moveId: 'headbutt' },
    ],
    spriteColors: ['#e74c3c', '#f39c12', '#ecf0f1'], description: 'A beautiful fish with an elegant horn.',
  },
  tentacruel: {
    id: 35, name: 'Stingel', types: ['Water', 'Poison'], catchRate: 190, expYield: 100,
    baseStats: { hp: 40, attack: 40, defense: 35, spAtk: 50, spDef: 100, speed: 70 },
    learnset: [
      { level: 1, moveId: 'poisonSting' }, { level: 1, moveId: 'bubble' },
      { level: 12, moveId: 'acid' }, { level: 20, moveId: 'waterPulse' },
      { level: 30, moveId: 'surf' }, { level: 38, moveId: 'sludgeBomb' },
    ],
    spriteColors: ['#3498db', '#8e44ad', '#e74c3c'], description: 'A jellyfish with potent tentacles.',
  },

  // GRASS extras
  oddling: {
    id: 36, name: 'Oddling', types: ['Grass', 'Poison'], catchRate: 255, expYield: 64,
    baseStats: { hp: 45, attack: 50, defense: 55, spAtk: 75, spDef: 65, speed: 30 },
    learnset: [
      { level: 1, moveId: 'absorb' }, { level: 1, moveId: 'poisonPowder' },
      { level: 14, moveId: 'acid' }, { level: 20, moveId: 'megaDrain' },
      { level: 28, moveId: 'sleepPowder' },
    ],
    spriteColors: ['#2980b9', '#27ae60', '#e74c3c'], description: 'A peculiar plant that walks at night.',
  },

  // FIRE extras
  vulpix: {
    id: 37, name: 'Foxflame', types: ['Fire'], catchRate: 190, expYield: 60,
    baseStats: { hp: 38, attack: 41, defense: 40, spAtk: 50, spDef: 65, speed: 65 },
    learnset: [
      { level: 1, moveId: 'ember' }, { level: 1, moveId: 'tailWhip' },
      { level: 12, moveId: 'fireSpin' }, { level: 20, moveId: 'quickAttack' },
      { level: 28, moveId: 'flamethrower' },
    ],
    spriteColors: ['#e74c3c', '#f39c12', '#c0392b'], description: 'A fox with six beautiful flaming tails.',
  },

  // ELECTRIC extras
  magnemite: {
    id: 38, name: 'Magnolt', types: ['Electric'], catchRate: 190, expYield: 65,
    baseStats: { hp: 25, attack: 35, defense: 70, spAtk: 95, spDef: 55, speed: 45 },
    learnset: [
      { level: 1, moveId: 'thunderShock' }, { level: 1, moveId: 'tackle' },
      { level: 15, moveId: 'sparkle' }, { level: 21, moveId: 'thunderWave' },
      { level: 30, moveId: 'thunderbolt' },
    ],
    spriteColors: ['#bdc3c7', '#3498db', '#f1c40f'], description: 'A magnetic creature that floats in the air.',
  },

  // GROUND
  diglett: {
    id: 39, name: 'Digmole', types: ['Ground'], catchRate: 255, expYield: 53,
    baseStats: { hp: 10, attack: 55, defense: 25, spAtk: 35, spDef: 45, speed: 95 },
    learnset: [
      { level: 1, moveId: 'scratch' }, { level: 1, moveId: 'mudSlap' },
      { level: 15, moveId: 'dig' }, { level: 26, moveId: 'slash' },
      { level: 33, moveId: 'earthquake' },
    ],
    spriteColors: ['#784212', '#a04000', '#f5cba7'], description: 'Pops out of the ground unexpectedly.',
  },

  // NORMAL
  meowzy: {
    id: 40, name: 'Meowzy', types: ['Normal'], catchRate: 255, expYield: 58,
    baseStats: { hp: 40, attack: 45, defense: 35, spAtk: 40, spDef: 40, speed: 90 },
    learnset: [
      { level: 1, moveId: 'scratch' }, { level: 1, moveId: 'growl' },
      { level: 12, moveId: 'bite' }, { level: 20, moveId: 'slash' },
      { level: 28, moveId: 'bodySlam' },
    ],
    spriteColors: ['#f5cba7', '#d4ac0d', '#ecf0f1'], description: 'Loves shiny things and collects coins.',
  },

  // WATER + PSYCHIC
  slowpox: {
    id: 41, name: 'Slowpox', types: ['Water', 'Psychic'], catchRate: 190, expYield: 63,
    baseStats: { hp: 90, attack: 65, defense: 65, spAtk: 40, spDef: 40, speed: 15 },
    learnset: [
      { level: 1, moveId: 'tackle' }, { level: 1, moveId: 'confusion' },
      { level: 15, moveId: 'waterGun' }, { level: 22, moveId: 'psybeam' },
      { level: 30, moveId: 'surf' }, { level: 36, moveId: 'psychic' },
    ],
    spriteColors: ['#f1948a', '#f5b7b1', '#ecf0f1'], description: 'Incredibly slow but surprisingly strong.',
  },

  // FIRE + FIGHTING
  growlith: {
    id: 42, name: 'Growlith', types: ['Fire'], catchRate: 190, expYield: 70,
    baseStats: { hp: 55, attack: 70, defense: 45, spAtk: 70, spDef: 50, speed: 60 },
    learnset: [
      { level: 1, moveId: 'bite' }, { level: 1, moveId: 'ember' },
      { level: 12, moveId: 'firePunch' }, { level: 20, moveId: 'flamethrower' },
      { level: 30, moveId: 'bodySlam' },
    ],
    spriteColors: ['#e67e22', '#c0392b', '#f1c40f'], description: 'A loyal pup with a fiery mane.',
  },

  // Normal tank
  snorlord: {
    id: 43, name: 'Snorlord', types: ['Normal'], catchRate: 25, expYield: 189,
    baseStats: { hp: 160, attack: 110, defense: 65, spAtk: 65, spDef: 110, speed: 30 },
    learnset: [
      { level: 1, moveId: 'tackle' }, { level: 1, moveId: 'headbutt' },
      { level: 15, moveId: 'bodySlam' }, { level: 25, moveId: 'rest' },
      { level: 35, moveId: 'earthquake' }, { level: 45, moveId: 'hyperBeam' },
    ],
    spriteColors: ['#2c3e50', '#34495e', '#f5cba7'], description: 'Blocks roads by sleeping on them.',
  },

  // Rock/Water fossil
  fossilon: {
    id: 44, name: 'Fossilon', types: ['Rock', 'Water'], catchRate: 45, expYield: 199,
    baseStats: { hp: 80, attack: 105, defense: 65, spAtk: 65, spDef: 70, speed: 80 },
    learnset: [
      { level: 1, moveId: 'headbutt' }, { level: 1, moveId: 'waterGun' },
      { level: 20, moveId: 'rockSlide' }, { level: 30, moveId: 'surf' },
      { level: 40, moveId: 'hyperBeam' },
    ],
    spriteColors: ['#7f8c8d', '#3498db', '#95a5a6'], description: 'Resurrected from an ancient fossil.',
  },

  // Legendary-ish
  voltbird: {
    id: 45, name: 'Voltbird', types: ['Electric', 'Flying'], catchRate: 3, expYield: 261,
    baseStats: { hp: 90, attack: 90, defense: 85, spAtk: 125, spDef: 90, speed: 100 },
    learnset: [
      { level: 1, moveId: 'thunderbolt' }, { level: 1, moveId: 'fly' },
      { level: 50, moveId: 'thunder' }, { level: 60, moveId: 'hyperBeam' },
    ],
    spriteColors: ['#f1c40f', '#f39c12', '#2c3e50'], description: 'A legendary bird wreathed in lightning.',
  },

  // Normal/Fairy equivalent
  clefairy: {
    id: 46, name: 'Lunara', types: ['Normal'], catchRate: 150, expYield: 113,
    baseStats: { hp: 70, attack: 45, defense: 48, spAtk: 60, spDef: 65, speed: 35 },
    learnset: [
      { level: 1, moveId: 'pound' }, { level: 1, moveId: 'sing' },
      { level: 13, moveId: 'confusion' }, { level: 22, moveId: 'bodySlam' },
      { level: 31, moveId: 'psychic' },
    ],
    spriteColors: ['#f5b7b1', '#fadbd8', '#ecf0f1'], description: 'Dances under the moonlight.',
  },

  // Poison/Bug
  beedril: {
    id: 47, name: 'Stingbee', types: ['Bug', 'Poison'], catchRate: 45, expYield: 159,
    baseStats: { hp: 65, attack: 90, defense: 40, spAtk: 45, spDef: 80, speed: 75 },
    learnset: [
      { level: 1, moveId: 'poisonSting' }, { level: 1, moveId: 'bugBite' },
      { level: 15, moveId: 'acid' }, { level: 25, moveId: 'sludgeBomb' },
      { level: 35, moveId: 'signalBeam' },
    ],
    spriteColors: ['#f1c40f', '#2c3e50', '#ecf0f1'], description: 'Attacks with large poisonous stingers.',
  },

  // Ice/Psychic
  jinxia: {
    id: 48, name: 'Jinxia', types: ['Ice', 'Psychic'], catchRate: 45, expYield: 159,
    baseStats: { hp: 65, attack: 50, defense: 35, spAtk: 115, spDef: 95, speed: 95 },
    learnset: [
      { level: 1, moveId: 'confusion' }, { level: 1, moveId: 'iceShard' },
      { level: 18, moveId: 'psybeam' }, { level: 25, moveId: 'iceBeam' },
      { level: 35, moveId: 'psychic' }, { level: 45, moveId: 'blizzard' },
    ],
    spriteColors: ['#e74c3c', '#8e44ad', '#f1c40f'], description: 'Dances gracefully while freezing the air.',
  },

  // Fire legendary
  phoenixar: {
    id: 49, name: 'Phoenixar', types: ['Fire', 'Flying'], catchRate: 3, expYield: 261,
    baseStats: { hp: 90, attack: 100, defense: 90, spAtk: 125, spDef: 85, speed: 90 },
    learnset: [
      { level: 1, moveId: 'flamethrower' }, { level: 1, moveId: 'fly' },
      { level: 50, moveId: 'fireBlast' }, { level: 60, moveId: 'hyperBeam' },
    ],
    spriteColors: ['#e74c3c', '#f39c12', '#f1c40f'], description: 'A legendary phoenix reborn from ashes.',
  },

  // Ice legendary
  frostara: {
    id: 50, name: 'Frostara', types: ['Ice', 'Flying'], catchRate: 3, expYield: 261,
    baseStats: { hp: 90, attack: 85, defense: 100, spAtk: 95, spDef: 125, speed: 85 },
    learnset: [
      { level: 1, moveId: 'iceBeam' }, { level: 1, moveId: 'fly' },
      { level: 50, moveId: 'blizzard' }, { level: 60, moveId: 'hyperBeam' },
    ],
    spriteColors: ['#85c1e9', '#d6eaf8', '#2c3e50'], description: 'A legendary bird of eternal winter.',
  },
};

// Helper to get exp needed for next level (medium-fast growth)
export function expForLevel(level: number): number {
  return Math.floor(level * level * level);
}

export function expToNextLevel(level: number): number {
  return expForLevel(level + 1) - expForLevel(level);
}

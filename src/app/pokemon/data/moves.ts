import { MoveData } from './types';

export const MOVES: Record<string, MoveData> = {
  // Normal
  tackle:     { name: 'Tackle', type: 'Normal', power: 40, accuracy: 100, pp: 35, category: 'physical' },
  scratch:    { name: 'Scratch', type: 'Normal', power: 40, accuracy: 100, pp: 35, category: 'physical' },
  pound:      { name: 'Pound', type: 'Normal', power: 40, accuracy: 100, pp: 35, category: 'physical' },
  quickAttack:{ name: 'Quick Attack', type: 'Normal', power: 40, accuracy: 100, pp: 30, category: 'physical' },
  bodySlam:   { name: 'Body Slam', type: 'Normal', power: 85, accuracy: 100, pp: 15, category: 'physical', effect: 'paralyze', effectChance: 30 },
  hyperBeam:  { name: 'Hyper Beam', type: 'Normal', power: 150, accuracy: 90, pp: 5, category: 'special' },
  slash:      { name: 'Slash', type: 'Normal', power: 70, accuracy: 100, pp: 20, category: 'physical' },
  cut:        { name: 'Cut', type: 'Normal', power: 50, accuracy: 95, pp: 30, category: 'physical' },
  bite:       { name: 'Bite', type: 'Normal', power: 60, accuracy: 100, pp: 25, category: 'physical', effect: 'flinch', effectChance: 30 },
  headbutt:   { name: 'Headbutt', type: 'Normal', power: 70, accuracy: 100, pp: 15, category: 'physical' },
  
  // Fire
  ember:      { name: 'Ember', type: 'Fire', power: 40, accuracy: 100, pp: 25, category: 'special', effect: 'burn', effectChance: 10 },
  flamethrower:{ name: 'Flamethrower', type: 'Fire', power: 90, accuracy: 100, pp: 15, category: 'special', effect: 'burn', effectChance: 10 },
  firePunch:  { name: 'Fire Punch', type: 'Fire', power: 75, accuracy: 100, pp: 15, category: 'physical', effect: 'burn', effectChance: 10 },
  fireBlast:  { name: 'Fire Blast', type: 'Fire', power: 110, accuracy: 85, pp: 5, category: 'special', effect: 'burn', effectChance: 30 },
  fireSpin:   { name: 'Fire Spin', type: 'Fire', power: 35, accuracy: 85, pp: 15, category: 'special' },

  // Water
  waterGun:   { name: 'Water Gun', type: 'Water', power: 40, accuracy: 100, pp: 25, category: 'special' },
  bubble:     { name: 'Bubble', type: 'Water', power: 40, accuracy: 100, pp: 30, category: 'special' },
  waterPulse: { name: 'Water Pulse', type: 'Water', power: 60, accuracy: 100, pp: 20, category: 'special' },
  surf:       { name: 'Surf', type: 'Water', power: 90, accuracy: 100, pp: 15, category: 'special' },
  hydroPump:  { name: 'Hydro Pump', type: 'Water', power: 110, accuracy: 80, pp: 5, category: 'special' },
  
  // Grass
  vineWhip:   { name: 'Vine Whip', type: 'Grass', power: 45, accuracy: 100, pp: 25, category: 'physical' },
  razorLeaf:  { name: 'Razor Leaf', type: 'Grass', power: 55, accuracy: 95, pp: 25, category: 'physical' },
  seedBomb:   { name: 'Seed Bomb', type: 'Grass', power: 80, accuracy: 100, pp: 15, category: 'physical' },
  solarBeam:  { name: 'Solar Beam', type: 'Grass', power: 120, accuracy: 100, pp: 10, category: 'special' },
  absorb:     { name: 'Absorb', type: 'Grass', power: 20, accuracy: 100, pp: 25, category: 'special', effect: 'heal' },
  megaDrain:  { name: 'Mega Drain', type: 'Grass', power: 40, accuracy: 100, pp: 15, category: 'special', effect: 'heal' },
  
  // Electric
  thunderShock:{ name: 'Thunder Shock', type: 'Electric', power: 40, accuracy: 100, pp: 30, category: 'special', effect: 'paralyze', effectChance: 10 },
  thunderbolt: { name: 'Thunderbolt', type: 'Electric', power: 90, accuracy: 100, pp: 15, category: 'special', effect: 'paralyze', effectChance: 10 },
  thunder:     { name: 'Thunder', type: 'Electric', power: 110, accuracy: 70, pp: 10, category: 'special', effect: 'paralyze', effectChance: 30 },
  sparkle:     { name: 'Spark', type: 'Electric', power: 65, accuracy: 100, pp: 20, category: 'physical', effect: 'paralyze', effectChance: 30 },
  
  // Ice
  iceShard:   { name: 'Ice Shard', type: 'Ice', power: 40, accuracy: 100, pp: 30, category: 'physical' },
  iceBeam:    { name: 'Ice Beam', type: 'Ice', power: 90, accuracy: 100, pp: 10, category: 'special', effect: 'freeze', effectChance: 10 },
  blizzard:   { name: 'Blizzard', type: 'Ice', power: 110, accuracy: 70, pp: 5, category: 'special', effect: 'freeze', effectChance: 10 },
  
  // Fighting  
  karateChop: { name: 'Karate Chop', type: 'Fighting', power: 50, accuracy: 100, pp: 25, category: 'physical' },
  lowKick:    { name: 'Low Kick', type: 'Fighting', power: 50, accuracy: 100, pp: 20, category: 'physical' },
  crossChop:  { name: 'Cross Chop', type: 'Fighting', power: 100, accuracy: 80, pp: 5, category: 'physical' },
  submission: { name: 'Submission', type: 'Fighting', power: 80, accuracy: 80, pp: 20, category: 'physical' },
  
  // Poison
  poisonSting:{ name: 'Poison Sting', type: 'Poison', power: 15, accuracy: 100, pp: 35, category: 'physical', effect: 'poison', effectChance: 30 },
  sludgeBomb: { name: 'Sludge Bomb', type: 'Poison', power: 90, accuracy: 100, pp: 10, category: 'special', effect: 'poison', effectChance: 30 },
  acid:       { name: 'Acid', type: 'Poison', power: 40, accuracy: 100, pp: 30, category: 'special' },
  
  // Ground
  mudSlap:    { name: 'Mud Slap', type: 'Ground', power: 20, accuracy: 100, pp: 10, category: 'special' },
  dig:        { name: 'Dig', type: 'Ground', power: 80, accuracy: 100, pp: 10, category: 'physical' },
  earthquake: { name: 'Earthquake', type: 'Ground', power: 100, accuracy: 100, pp: 10, category: 'physical' },
  
  // Flying
  gust:       { name: 'Gust', type: 'Flying', power: 40, accuracy: 100, pp: 35, category: 'special' },
  wingAttack: { name: 'Wing Attack', type: 'Flying', power: 60, accuracy: 100, pp: 35, category: 'physical' },
  aerialAce:  { name: 'Aerial Ace', type: 'Flying', power: 60, accuracy: 100, pp: 20, category: 'physical' },
  fly:        { name: 'Fly', type: 'Flying', power: 90, accuracy: 95, pp: 15, category: 'physical' },
  
  // Psychic
  confusion:  { name: 'Confusion', type: 'Psychic', power: 50, accuracy: 100, pp: 25, category: 'special' },
  psybeam:    { name: 'Psybeam', type: 'Psychic', power: 65, accuracy: 100, pp: 20, category: 'special' },
  psychic:    { name: 'Psychic', type: 'Psychic', power: 90, accuracy: 100, pp: 10, category: 'special' },
  
  // Bug
  stringShot: { name: 'String Shot', type: 'Bug', power: 0, accuracy: 95, pp: 40, category: 'status', effect: 'stat-down' },
  bugBite:    { name: 'Bug Bite', type: 'Bug', power: 60, accuracy: 100, pp: 20, category: 'physical' },
  signalBeam: { name: 'Signal Beam', type: 'Bug', power: 75, accuracy: 100, pp: 15, category: 'special' },
  
  // Rock
  rockThrow:  { name: 'Rock Throw', type: 'Rock', power: 50, accuracy: 90, pp: 15, category: 'physical' },
  rockSlide:  { name: 'Rock Slide', type: 'Rock', power: 75, accuracy: 90, pp: 10, category: 'physical', effect: 'flinch', effectChance: 30 },
  
  // Ghost
  lick:       { name: 'Lick', type: 'Ghost', power: 30, accuracy: 100, pp: 30, category: 'physical', effect: 'paralyze', effectChance: 30 },
  shadowBall: { name: 'Shadow Ball', type: 'Ghost', power: 80, accuracy: 100, pp: 15, category: 'special' },
  nightShade: { name: 'Night Shade', type: 'Ghost', power: 50, accuracy: 100, pp: 15, category: 'special' },
  
  // Dragon
  dragonRage: { name: 'Dragon Rage', type: 'Dragon', power: 40, accuracy: 100, pp: 10, category: 'special' },
  dragonClaw: { name: 'Dragon Claw', type: 'Dragon', power: 80, accuracy: 100, pp: 15, category: 'physical' },
  
  // Status moves
  growl:      { name: 'Growl', type: 'Normal', power: 0, accuracy: 100, pp: 40, category: 'status', effect: 'stat-down' },
  tailWhip:   { name: 'Tail Whip', type: 'Normal', power: 0, accuracy: 100, pp: 30, category: 'status', effect: 'stat-down' },
  leer:       { name: 'Leer', type: 'Normal', power: 0, accuracy: 100, pp: 30, category: 'status', effect: 'stat-down' },
  smokescreen:{ name: 'Smokescreen', type: 'Normal', power: 0, accuracy: 100, pp: 20, category: 'status', effect: 'stat-down' },
  thunderWave:{ name: 'Thunder Wave', type: 'Electric', power: 0, accuracy: 90, pp: 20, category: 'status', effect: 'paralyze', effectChance: 100 },
  poisonPowder:{ name: 'Poison Powder', type: 'Poison', power: 0, accuracy: 75, pp: 35, category: 'status', effect: 'poison', effectChance: 100 },
  sleepPowder: { name: 'Sleep Powder', type: 'Grass', power: 0, accuracy: 75, pp: 15, category: 'status', effect: 'sleep', effectChance: 100 },
  sing:       { name: 'Sing', type: 'Normal', power: 0, accuracy: 55, pp: 15, category: 'status', effect: 'sleep', effectChance: 100 },
  recover:    { name: 'Recover', type: 'Normal', power: 0, accuracy: 100, pp: 10, category: 'status', effect: 'heal' },
  rest:       { name: 'Rest', type: 'Psychic', power: 0, accuracy: 100, pp: 10, category: 'status', effect: 'heal' },
};

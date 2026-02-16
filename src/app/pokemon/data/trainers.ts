import { TrainerData } from './types';

// Gym leaders, trainers, rival, elite 4
export const TRAINERS: Record<string, TrainerData> = {
  // Route trainers
  route2_bug1: {
    id: 'route2_bug1', name: 'Bug Catcher Tim', spriteType: 'youngster', reward: 100,
    team: [{ speciesId: 'buglin', level: 6 }, { speciesId: 'buglin', level: 7 }],
    preDialog: ['Hey! My bugs are the best!'],
    defeatDialog: ['Aww, my bugs lost...'],
  },
  route3_youngster1: {
    id: 'route3_youngster1', name: 'Youngster Joey', spriteType: 'youngster', reward: 200,
    team: [{ speciesId: 'rattipaw', level: 9 }, { speciesId: 'rattipaw', level: 11 }],
    preDialog: ['My Rattipaw is in the top percentage!'],
    defeatDialog: ['No way! My Rattipaw!'],
  },
  route3_lass1: {
    id: 'route3_lass1', name: 'Lass Emily', spriteType: 'lass', reward: 200,
    team: [{ speciesId: 'oddling', level: 10 }, { speciesId: 'pidglit', level: 10 }],
    preDialog: ['Let\'s battle! I won\'t lose!'],
    defeatDialog: ['Oh no, I lost!'],
  },
  route4_hiker1: {
    id: 'route4_hiker1', name: 'Hiker Dave', spriteType: 'hiker', reward: 350,
    team: [{ speciesId: 'geodon', level: 14 }, { speciesId: 'geodon', level: 14 }, { speciesId: 'punchub', level: 15 }],
    preDialog: ['These mountains are my home turf!'],
    defeatDialog: ['You\'re tougher than these rocks!'],
  },
  vr_ace1: {
    id: 'vr_ace1', name: 'Ace Trainer Rex', spriteType: 'scientist', reward: 2000,
    team: [
      { speciesId: 'champeon', level: 42 }, { speciesId: 'psyclops', level: 42 },
      { speciesId: 'infernox', level: 43 },
    ],
    preDialog: ['Only the strongest make it past Victory Road!'],
    defeatDialog: ['You have what it takes...'],
  },
  vr_ace2: {
    id: 'vr_ace2', name: 'Ace Trainer Luna', spriteType: 'beauty', reward: 2000,
    team: [
      { speciesId: 'glacirex', level: 42 }, { speciesId: 'draconix', level: 43 },
      { speciesId: 'spectrox', level: 43 },
    ],
    preDialog: ['The Elite Four await beyond here!'],
    defeatDialog: ['Good luck with the Elite Four...'],
  },

  // GYM LEADERS
  gym_brock: {
    id: 'gym_brock', name: 'Leader Brock', spriteType: 'gymleader', reward: 1500,
    team: [{ speciesId: 'geodon', level: 12 }, { speciesId: 'boulderox', level: 14 }],
    preDialog: ['I\'m Brock, the Pewter Gym Leader!', 'My rock-hard determination will crush you!'],
    defeatDialog: ['Your skills are solid as a rock!', 'Take the Boulder Badge!'],
  },
  gym_misty: {
    id: 'gym_misty', name: 'Leader Misty', spriteType: 'gymleader', reward: 2000,
    team: [{ speciesId: 'goldish', level: 18 }, { speciesId: 'tidalon', level: 21 }],
    preDialog: ['I\'m Misty! My water Pokémon are unstoppable!'],
    defeatDialog: ['You really are strong!', 'Here\'s the Cascade Badge!'],
  },
  gym_surge: {
    id: 'gym_surge', name: 'Leader Lt. Surge', spriteType: 'gymleader', reward: 2500,
    team: [
      { speciesId: 'magnolt', level: 24 }, { speciesId: 'zaprat', level: 24 },
      { speciesId: 'voltorex', level: 28 },
    ],
    preDialog: ['I\'m Lt. Surge, the Lightning American!', 'Electric Pokémon saved me during the war!'],
    defeatDialog: ['Whoa! You\'re the real deal!', 'Take the Thunder Badge!'],
  },
  gym_erika: {
    id: 'gym_erika', name: 'Leader Erika', spriteType: 'gymleader', reward: 3000,
    team: [
      { speciesId: 'oddling', level: 29 }, { speciesId: 'thornox', level: 30 },
      { speciesId: 'florapex', level: 33 },
    ],
    preDialog: ['Welcome to Celadon Gym.', 'I teach the art of flower arranging... and battling!'],
    defeatDialog: ['Oh! You\'re quite talented!', 'Please accept the Rainbow Badge.'],
  },
  gym_koga: {
    id: 'gym_koga', name: 'Leader Koga', spriteType: 'gymleader', reward: 3500,
    team: [
      { speciesId: 'snekil', level: 34 }, { speciesId: 'cobrix', level: 36 },
      { speciesId: 'stingbee', level: 35 }, { speciesId: 'cobrix', level: 38 },
    ],
    preDialog: ['Fwahaha! Poison is the way of the ninja!', 'Face the invisible toxic threat!'],
    defeatDialog: ['Hmph! You have proven your worth!', 'The Soul Badge is yours!'],
  },
  gym_sabrina: {
    id: 'gym_sabrina', name: 'Leader Sabrina', spriteType: 'gymleader', reward: 4000,
    team: [
      { speciesId: 'psydux', level: 38 }, { speciesId: 'psyclops', level: 40 },
      { speciesId: 'jinxia', level: 42 },
    ],
    preDialog: ['I foresaw your arrival...', 'But I also foresaw your defeat!'],
    defeatDialog: ['Your future... I see great things.', 'Take the Marsh Badge.'],
  },
  gym_blaine: {
    id: 'gym_blaine', name: 'Leader Blaine', spriteType: 'gymleader', reward: 4500,
    team: [
      { speciesId: 'growlith', level: 42 }, { speciesId: 'foxflame', level: 42 },
      { speciesId: 'blazeron', level: 44 }, { speciesId: 'infernox', level: 47 },
    ],
    preDialog: ['Hah! The hot-headed quiz master is here!', 'My flames will consume you!'],
    defeatDialog: ['I\'ve been burned! You win!', 'Here\'s the Volcano Badge!'],
  },
  gym_giovanni: {
    id: 'gym_giovanni', name: 'Leader Giovanni', spriteType: 'gymleader', reward: 5000,
    team: [
      { speciesId: 'cobrix', level: 45 }, { speciesId: 'boulderox', level: 45 },
      { speciesId: 'digmole', level: 44 }, { speciesId: 'draconix', level: 50 },
    ],
    preDialog: ['So, you\'ve made it this far...', 'I am Giovanni, the strongest Gym Leader!'],
    defeatDialog: ['What?! Defeated by a child?!', 'Fine... take the Earth Badge.'],
  },

  // ELITE 4
  elite4_lorelei: {
    id: 'elite4_lorelei', name: 'Elite Four Lorelei', spriteType: 'elite4', reward: 6000,
    team: [
      { speciesId: 'frostkit', level: 52 }, { speciesId: 'glacirex', level: 54 },
      { speciesId: 'slowpox', level: 53 }, { speciesId: 'jinxia', level: 56 },
    ],
    preDialog: ['Welcome to the Pokémon League!', 'I am Lorelei, master of Ice!'],
    defeatDialog: ['My icy strategy... melted!'],
  },
  elite4_bruno: {
    id: 'elite4_bruno', name: 'Elite Four Bruno', spriteType: 'elite4', reward: 6000,
    team: [
      { speciesId: 'punchub', level: 53 }, { speciesId: 'champeon', level: 55 },
      { speciesId: 'boulderox', level: 54 }, { speciesId: 'champeon', level: 58 },
    ],
    preDialog: ['I am Bruno of the Elite Four!', 'Through rigorous training, we will prevail!'],
    defeatDialog: ['My fighting spirit... wasn\'t enough!'],
  },
  elite4_agatha: {
    id: 'elite4_agatha', name: 'Elite Four Agatha', spriteType: 'elite4', reward: 6000,
    team: [
      { speciesId: 'ghoulby', level: 54 }, { speciesId: 'spectrox', level: 56 },
      { speciesId: 'cobrix', level: 55 }, { speciesId: 'spectrox', level: 58 },
    ],
    preDialog: ['I am Agatha!', 'Hehehe... my Ghost Pokémon will haunt you!'],
    defeatDialog: ['You win! But I enjoyed our little game!'],
  },
  elite4_lance: {
    id: 'elite4_lance', name: 'Elite Four Lance', spriteType: 'elite4', reward: 7000,
    team: [
      { speciesId: 'drakelet', level: 56 }, { speciesId: 'draconix', level: 58 },
      { speciesId: 'infernox', level: 57 }, { speciesId: 'draconix', level: 60 },
    ],
    preDialog: ['I am Lance, the Dragon Master!', 'You have no chance against my dragons!'],
    defeatDialog: ['You may be the greatest trainer I\'ve faced!'],
  },

  // CHAMPION (Gary/Rival) - team depends on player starter, this is default
  champion_gary: {
    id: 'champion_gary', name: 'Champion Gary', spriteType: 'champion', reward: 10000,
    team: [
      { speciesId: 'pidgstorm', level: 59 },
      { speciesId: 'voltorex', level: 59 },
      { speciesId: 'boulderox', level: 59 },
      { speciesId: 'spectrox', level: 59 },
      { speciesId: 'glacirex', level: 59 },
      { speciesId: 'infernox', level: 63 }, // changes based on starter
    ],
    preDialog: ['Hey! I was wondering when you\'d show up!', 'I\'m the Champion now!', 'Let\'s see who\'s really the best!'],
    defeatDialog: ['No way! I can\'t believe I lost!', 'You\'re the new Champion!', '...Smell ya later!'],
  },

  // RIVAL BATTLES at story points
  rival_oak_lab: {
    id: 'rival_oak_lab', name: 'Gary', spriteType: 'rival', reward: 500,
    team: [{ speciesId: 'aqualing', level: 5 }], // changes based on player choice
    preDialog: ['Heh, I\'ll show you how it\'s done!'],
    defeatDialog: ['What?! How did I lose?!', 'Smell ya later!'],
  },
  rival_route1: {
    id: 'rival_route1', name: 'Gary', spriteType: 'rival', reward: 800,
    team: [{ speciesId: 'rattipaw', level: 9 }, { speciesId: 'aqualing', level: 12 }],
    preDialog: ['Hey! Ready for round 2?'],
    defeatDialog: ['Grr... I\'ll get stronger! Just wait!'],
  },
  rival_cerulean: {
    id: 'rival_cerulean', name: 'Gary', spriteType: 'rival', reward: 1500,
    team: [
      { speciesId: 'pidgsoar', level: 20 }, { speciesId: 'rattifang', level: 19 },
      { speciesId: 'tidalon', level: 22 },
    ],
    preDialog: ['I\'ve been training hard!', 'You won\'t beat me this time!'],
    defeatDialog: ['No! Not again!'],
  },
};

// Gym order and badge names
export const GYM_ORDER = [
  { gymId: 'gym_pewter', leaderId: 'gym_brock', badge: 'Boulder Badge', type: 'Rock' },
  { gymId: 'gym_cerulean', leaderId: 'gym_misty', badge: 'Cascade Badge', type: 'Water' },
  { gymId: 'gym_vermilion', leaderId: 'gym_surge', badge: 'Thunder Badge', type: 'Electric' },
  { gymId: 'gym_celadon', leaderId: 'gym_erika', badge: 'Rainbow Badge', type: 'Grass' },
  { gymId: 'gym_fuchsia', leaderId: 'gym_koga', badge: 'Soul Badge', type: 'Poison' },
  { gymId: 'gym_saffron', leaderId: 'gym_sabrina', badge: 'Marsh Badge', type: 'Psychic' },
  { gymId: 'gym_cinnabar', leaderId: 'gym_blaine', badge: 'Volcano Badge', type: 'Fire' },
  { gymId: 'gym_viridian', leaderId: 'gym_giovanni', badge: 'Earth Badge', type: 'Ground' },
];

export const ELITE4_ORDER = ['elite4_lorelei', 'elite4_bruno', 'elite4_agatha', 'elite4_lance', 'champion_gary'];

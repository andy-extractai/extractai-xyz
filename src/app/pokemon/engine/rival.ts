// Rival (Gary) battle encounter system
// Manages rival team generation, scaling, and encounter triggers

import { TrainerData } from '../data/types';
import { GameState } from './state';

/** Maps player starter → rival's counter-starter species at each evolution stage */
const COUNTER_STARTERS: Record<string, { base: string; mid: string; final: string }> = {
  emberon:   { base: 'aqualing',  mid: 'tidalon',  final: 'tsunamix' },
  aqualing:  { base: 'sproutley', mid: 'thornox',  final: 'florapex' },
  sproutley: { base: 'emberon',   mid: 'blazeron', final: 'infernox' },
};

/** Gets the rival's starter species at the appropriate evolution stage for a given level */
function getRivalStarter(playerStarterBase: string, level: number): string {
  const chain = COUNTER_STARTERS[playerStarterBase];
  if (!chain) return 'aqualing';
  if (level >= 36) return chain.final;
  if (level >= 16) return chain.mid;
  return chain.base;
}

/** Derives the player's base starter from what they originally picked.
 *  The state stores rival.starterSpecies which is the counter, so we reverse-lookup. */
function getPlayerStarterBase(state: GameState): string {
  const rivalStarter = state.rival.starterSpecies;
  // rival picked counter to player, so find which player starter maps to this rival starter
  for (const [playerBase, chain] of Object.entries(COUNTER_STARTERS)) {
    if (chain.base === rivalStarter || chain.mid === rivalStarter || chain.final === rivalStarter) {
      return playerBase;
    }
  }
  return 'emberon'; // fallback
}

export interface RivalEncounterDef {
  id: string;
  storyFlag: string;        // flag set after defeat to prevent re-trigger
  requiredFlag?: string;     // flag that must be set for trigger
  mapId: string;
  /** If provided, only trigger when player is in this area */
  triggerArea?: { minX: number; maxX: number; minY: number; maxY: number };
  starterLevel: number;
  team: { speciesId: string; level: number }[]; // additional team members (excluding starter)
  reward: number;
  preDialog: string[];
  defeatDialog: string[];
}

/** All rival encounter definitions in story order */
export const RIVAL_ENCOUNTERS: RivalEncounterDef[] = [
  {
    id: 'rival_oak_lab',
    storyFlag: 'rival_defeated_oak_lab',
    requiredFlag: 'got_starter',
    mapId: 'oak_lab',
    starterLevel: 5,
    team: [],
    reward: 500,
    preDialog: ['Gary: Heh, I\'ll show you how it\'s done!', 'Gary: Let\'s see whose starter is stronger!'],
    defeatDialog: ['Gary: What?! How did I lose?!', 'Gary: Smell ya later!'],
  },
  {
    id: 'rival_route3',
    storyFlag: 'rival_defeated_route3',
    requiredFlag: 'rival_defeated_oak_lab',
    mapId: 'route3',
    triggerArea: { minX: 0, maxX: 5, minY: 0, maxY: 14 },
    starterLevel: 12,
    team: [
      { speciesId: 'rattipaw', level: 9 },
      { speciesId: 'pidglit', level: 10 },
    ],
    reward: 800,
    preDialog: ['Gary: Hey! Ready for round 2?', 'Gary: I\'ve been training hard since last time!'],
    defeatDialog: ['Gary: Grr... I\'ll get stronger! Just wait!'],
  },
  {
    id: 'rival_cerulean',
    storyFlag: 'rival_defeated_cerulean',
    requiredFlag: 'rival_defeated_route3',
    mapId: 'cerulean_city',
    triggerArea: { minX: 8, maxX: 16, minY: 6, maxY: 14 },
    starterLevel: 22,
    team: [
      { speciesId: 'pidgsoar', level: 20 },
      { speciesId: 'rattifang', level: 19 },
      { speciesId: 'zaprat', level: 18 },
    ],
    reward: 1500,
    preDialog: ['Gary: I\'ve been training hard!', 'Gary: You won\'t beat me this time!'],
    defeatDialog: ['Gary: No! Not again!', 'Gary: I need to rethink my strategy...'],
  },
  {
    id: 'rival_vermilion',
    storyFlag: 'rival_defeated_vermilion',
    requiredFlag: 'rival_defeated_cerulean',
    mapId: 'vermilion_city',
    triggerArea: { minX: 6, maxX: 18, minY: 6, maxY: 14 },
    starterLevel: 28,
    team: [
      { speciesId: 'pidgsoar', level: 25 },
      { speciesId: 'rattifang', level: 24 },
      { speciesId: 'magnolt', level: 26 },
      { speciesId: 'growlith', level: 25 },
    ],
    reward: 2500,
    preDialog: ['Gary: Well, well, well!', 'Gary: You made it to Vermilion, huh?', 'Gary: Let me show you how much stronger I\'ve gotten!'],
    defeatDialog: ['Gary: Tch! Fine, you win this round!', 'Gary: But I\'ll be Champion before you, just watch!'],
  },
  {
    id: 'rival_elite4',
    storyFlag: 'rival_defeated_elite4',
    requiredFlag: 'rival_defeated_vermilion',
    mapId: 'elite4',
    starterLevel: 55,
    team: [
      { speciesId: 'pidgstorm', level: 53 },
      { speciesId: 'boulderox', level: 52 },
      { speciesId: 'spectrox', level: 53 },
      { speciesId: 'glacirex', level: 52 },
      { speciesId: 'champeon', level: 54 },
    ],
    reward: 5000,
    preDialog: ['Gary: So you made it through Victory Road!', 'Gary: But this is where your journey ends!', 'Gary: I\'ve been waiting for you!'],
    defeatDialog: ['Gary: I can\'t believe it...', 'Gary: You really are the stronger trainer.', 'Gary: Go on... the Elite Four awaits.'],
  },
];

/** Check if any rival encounter should trigger for the current game state.
 *  Returns the encounter def if one should trigger, null otherwise. */
export function checkRivalEncounter(state: GameState): RivalEncounterDef | null {
  if (state.phase !== 'overworld') return null;
  if (state.battle || state.dialog) return null;

  const { mapId, x, y, storyFlags } = state.player;

  for (const enc of RIVAL_ENCOUNTERS) {
    // Already defeated
    if (storyFlags.has(enc.storyFlag)) continue;
    // Required flag not set
    if (enc.requiredFlag && !storyFlags.has(enc.requiredFlag)) continue;
    // Wrong map
    if (enc.mapId !== mapId) continue;
    // Area check
    if (enc.triggerArea) {
      if (x < enc.triggerArea.minX || x > enc.triggerArea.maxX ||
          y < enc.triggerArea.minY || y > enc.triggerArea.maxY) continue;
    }
    return enc;
  }
  return null;
}

/** Build a TrainerData for a rival encounter based on current game state */
export function buildRivalTrainer(enc: RivalEncounterDef, state: GameState): TrainerData {
  const playerStarterBase = getPlayerStarterBase(state);
  const rivalStarterSpecies = getRivalStarter(playerStarterBase, enc.starterLevel);

  const team = [
    ...enc.team.map(t => ({ speciesId: t.speciesId, level: t.level })),
    { speciesId: rivalStarterSpecies, level: enc.starterLevel },
  ];

  return {
    id: enc.id,
    name: 'Gary',
    team,
    reward: enc.reward,
    spriteType: 'rival',
    preDialog: enc.preDialog,
    defeatDialog: enc.defeatDialog,
  };
}

export { getRivalStarter, getPlayerStarterBase, COUNTER_STARTERS };

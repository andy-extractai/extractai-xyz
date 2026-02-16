// Intro sequence state machine for Professor Oak intro
// Phases: intro → oak_speech (3 steps) → naming → mom_house → oak_lab → starter_select → rival_battle

export type IntroStep = 'welcome' | 'oak_lore_1' | 'oak_lore_2' | 'oak_lore_3';

export interface IntroState {
  step: IntroStep;
  charIndex: number; // typewriter position
}

export const OAK_DIALOG: Record<IntroStep, string> = {
  welcome: 'Welcome to the world of Pokémon!',
  oak_lore_1: 'This world is inhabited by creatures called Pokémon. They live alongside humans in harmony — and sometimes in battle!',
  oak_lore_2: 'Some people keep Pokémon as pets, while others train them to compete. As for myself... I study Pokémon as a profession.',
  oak_lore_3: 'Your very own Pokémon adventure is about to begin! But first, tell me — what is your name?',
};

const STEP_ORDER: IntroStep[] = ['welcome', 'oak_lore_1', 'oak_lore_2', 'oak_lore_3'];

export function createIntroState(): IntroState {
  return { step: 'welcome', charIndex: 0 };
}

export function advanceIntroStep(state: IntroState): { next: IntroState | null; transitionToNaming: boolean } {
  const text = OAK_DIALOG[state.step];
  // If typewriter not done, complete it
  if (state.charIndex < text.length) {
    return { next: { ...state, charIndex: text.length }, transitionToNaming: false };
  }
  // Advance to next step
  const idx = STEP_ORDER.indexOf(state.step);
  if (idx < STEP_ORDER.length - 1) {
    return { next: { step: STEP_ORDER[idx + 1], charIndex: 0 }, transitionToNaming: false };
  }
  // Last step done → transition to naming
  return { next: null, transitionToNaming: true };
}

export function tickIntroTypewriter(state: IntroState): IntroState {
  const text = OAK_DIALOG[state.step];
  if (state.charIndex >= text.length) return state;
  return { ...state, charIndex: state.charIndex + 1 };
}

export const COUNTER_STARTERS: Record<string, string> = {
  emberon: 'aqualing',
  aqualing: 'sproutley',
  sproutley: 'emberon',
};

export const MOM_GOODBYE_LINES = [
  'Oh, you\'re heading out already?',
  'Be careful out there, dear! Come home anytime you need rest.',
  'Go see Professor Oak — he has something special for you!',
];

import { describe, it, expect } from 'vitest';
import {
  createIntroState,
  advanceIntroStep,
  tickIntroTypewriter,
  OAK_DIALOG,
  COUNTER_STARTERS,
  MOM_GOODBYE_LINES,
  IntroState,
} from '../intro';

describe('Intro State Machine', () => {
  it('creates initial state at welcome step', () => {
    const state = createIntroState();
    expect(state.step).toBe('welcome');
    expect(state.charIndex).toBe(0);
  });

  it('typewriter ticks advance charIndex', () => {
    const state = createIntroState();
    const next = tickIntroTypewriter(state);
    expect(next.charIndex).toBe(1);
    expect(next.step).toBe('welcome');
  });

  it('typewriter stops at end of text', () => {
    const state: IntroState = { step: 'welcome', charIndex: OAK_DIALOG.welcome.length };
    const next = tickIntroTypewriter(state);
    expect(next.charIndex).toBe(OAK_DIALOG.welcome.length);
  });

  it('advance completes typewriter if not done', () => {
    const state: IntroState = { step: 'welcome', charIndex: 5 };
    const result = advanceIntroStep(state);
    expect(result.transitionToNaming).toBe(false);
    expect(result.next!.charIndex).toBe(OAK_DIALOG.welcome.length);
    expect(result.next!.step).toBe('welcome');
  });

  it('advance moves from welcome to oak_lore_1', () => {
    const state: IntroState = { step: 'welcome', charIndex: OAK_DIALOG.welcome.length };
    const result = advanceIntroStep(state);
    expect(result.transitionToNaming).toBe(false);
    expect(result.next!.step).toBe('oak_lore_1');
    expect(result.next!.charIndex).toBe(0);
  });

  it('advance moves through all lore steps', () => {
    let state: IntroState = { step: 'oak_lore_1', charIndex: OAK_DIALOG.oak_lore_1.length };
    let result = advanceIntroStep(state);
    expect(result.next!.step).toBe('oak_lore_2');

    state = { step: 'oak_lore_2', charIndex: OAK_DIALOG.oak_lore_2.length };
    result = advanceIntroStep(state);
    expect(result.next!.step).toBe('oak_lore_3');
  });

  it('advance from last step transitions to naming', () => {
    const state: IntroState = { step: 'oak_lore_3', charIndex: OAK_DIALOG.oak_lore_3.length };
    const result = advanceIntroStep(state);
    expect(result.transitionToNaming).toBe(true);
    expect(result.next).toBeNull();
  });

  it('full sequence: welcome → lore1 → lore2 → lore3 → naming', () => {
    const steps: string[] = [];
    let state: IntroState = createIntroState();
    steps.push(state.step);

    // Complete each step's text then advance
    for (let i = 0; i < 10; i++) {
      state = { ...state, charIndex: OAK_DIALOG[state.step].length };
      const result = advanceIntroStep(state);
      if (result.transitionToNaming) {
        steps.push('naming');
        break;
      }
      state = result.next!;
      steps.push(state.step);
    }

    expect(steps).toEqual(['welcome', 'oak_lore_1', 'oak_lore_2', 'oak_lore_3', 'naming']);
  });

  it('Oak dialog has welcome message', () => {
    expect(OAK_DIALOG.welcome).toContain('Welcome to the world of Pokémon');
  });

  it('Oak delivers 3 lore dialog screens', () => {
    expect(OAK_DIALOG.oak_lore_1).toBeTruthy();
    expect(OAK_DIALOG.oak_lore_2).toBeTruthy();
    expect(OAK_DIALOG.oak_lore_3).toBeTruthy();
  });

  it('counter starters are correct', () => {
    expect(COUNTER_STARTERS.emberon).toBe('aqualing');
    expect(COUNTER_STARTERS.aqualing).toBe('sproutley');
    expect(COUNTER_STARTERS.sproutley).toBe('emberon');
  });

  it('mom goodbye dialog has multiple lines', () => {
    expect(MOM_GOODBYE_LINES.length).toBeGreaterThanOrEqual(2);
    expect(MOM_GOODBYE_LINES.some(l => l.toLowerCase().includes('oak'))).toBe(true);
  });

  it('all oak dialog texts are non-empty strings', () => {
    Object.values(OAK_DIALOG).forEach(text => {
      expect(typeof text).toBe('string');
      expect(text.length).toBeGreaterThan(10);
    });
  });
});

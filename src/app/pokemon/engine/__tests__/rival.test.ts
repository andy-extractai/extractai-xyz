import { describe, it, expect } from 'vitest';
import {
  checkRivalEncounter,
  buildRivalTrainer,
  getRivalStarter,
  getPlayerStarterBase,
  RIVAL_ENCOUNTERS,
  COUNTER_STARTERS,
} from '../rival';
import { createInitialState, GameState } from '../state';

function makeOverworldState(overrides: Partial<{
  mapId: string; x: number; y: number;
  storyFlags: string[];
  rivalStarter: string;
}>): GameState {
  const state = createInitialState();
  state.phase = 'overworld';
  if (overrides.mapId) state.player.mapId = overrides.mapId;
  if (overrides.x !== undefined) state.player.x = overrides.x;
  if (overrides.y !== undefined) state.player.y = overrides.y;
  if (overrides.storyFlags) {
    for (const f of overrides.storyFlags) state.player.storyFlags.add(f);
  }
  if (overrides.rivalStarter) state.rival.starterSpecies = overrides.rivalStarter;
  return state;
}

describe('Rival Battle System', () => {
  describe('getRivalStarter', () => {
    it('returns base form at low levels', () => {
      expect(getRivalStarter('emberon', 5)).toBe('aqualing');
      expect(getRivalStarter('aqualing', 5)).toBe('sproutley');
      expect(getRivalStarter('sproutley', 5)).toBe('emberon');
    });

    it('returns mid evolution at level 16+', () => {
      expect(getRivalStarter('emberon', 16)).toBe('tidalon');
      expect(getRivalStarter('aqualing', 20)).toBe('thornox');
      expect(getRivalStarter('sproutley', 25)).toBe('blazeron');
    });

    it('returns final evolution at level 36+', () => {
      expect(getRivalStarter('emberon', 36)).toBe('tsunamix');
      expect(getRivalStarter('aqualing', 55)).toBe('florapex');
      expect(getRivalStarter('sproutley', 63)).toBe('infernox');
    });
  });

  describe('getPlayerStarterBase', () => {
    it('derives player starter from rival starter', () => {
      const state = createInitialState();
      state.rival.starterSpecies = 'aqualing';
      expect(getPlayerStarterBase(state)).toBe('emberon');

      state.rival.starterSpecies = 'sproutley';
      expect(getPlayerStarterBase(state)).toBe('aqualing');

      state.rival.starterSpecies = 'emberon';
      expect(getPlayerStarterBase(state)).toBe('sproutley');
    });
  });

  describe('checkRivalEncounter', () => {
    it('triggers oak lab battle after getting starter', () => {
      const state = makeOverworldState({
        mapId: 'oak_lab', x: 5, y: 5,
        storyFlags: ['got_starter'],
      });
      const enc = checkRivalEncounter(state);
      expect(enc).not.toBeNull();
      expect(enc!.id).toBe('rival_oak_lab');
    });

    it('does not trigger oak lab without got_starter flag', () => {
      const state = makeOverworldState({ mapId: 'oak_lab', x: 5, y: 5 });
      expect(checkRivalEncounter(state)).toBeNull();
    });

    it('does not trigger if already defeated', () => {
      const state = makeOverworldState({
        mapId: 'oak_lab', x: 5, y: 5,
        storyFlags: ['got_starter', 'rival_defeated_oak_lab'],
      });
      expect(checkRivalEncounter(state)).toBeNull();
    });

    it('triggers route3 battle with area check', () => {
      const state = makeOverworldState({
        mapId: 'route3', x: 3, y: 7,
        storyFlags: ['got_starter', 'rival_defeated_oak_lab'],
      });
      const enc = checkRivalEncounter(state);
      expect(enc).not.toBeNull();
      expect(enc!.id).toBe('rival_route3');
    });

    it('does not trigger route3 outside trigger area', () => {
      const state = makeOverworldState({
        mapId: 'route3', x: 20, y: 7,
        storyFlags: ['got_starter', 'rival_defeated_oak_lab'],
      });
      expect(checkRivalEncounter(state)).toBeNull();
    });

    it('triggers cerulean battle', () => {
      const state = makeOverworldState({
        mapId: 'cerulean_city', x: 12, y: 10,
        storyFlags: ['got_starter', 'rival_defeated_oak_lab', 'rival_defeated_route3'],
      });
      const enc = checkRivalEncounter(state);
      expect(enc).not.toBeNull();
      expect(enc!.id).toBe('rival_cerulean');
    });

    it('triggers vermilion battle', () => {
      const state = makeOverworldState({
        mapId: 'vermilion_city', x: 12, y: 10,
        storyFlags: ['got_starter', 'rival_defeated_oak_lab', 'rival_defeated_route3', 'rival_defeated_cerulean'],
      });
      const enc = checkRivalEncounter(state);
      expect(enc).not.toBeNull();
      expect(enc!.id).toBe('rival_vermilion');
    });

    it('triggers elite4 battle', () => {
      const state = makeOverworldState({
        mapId: 'elite4', x: 5, y: 5,
        storyFlags: ['got_starter', 'rival_defeated_oak_lab', 'rival_defeated_route3', 'rival_defeated_cerulean', 'rival_defeated_vermilion'],
      });
      const enc = checkRivalEncounter(state);
      expect(enc).not.toBeNull();
      expect(enc!.id).toBe('rival_elite4');
    });

    it('does not trigger during battle phase', () => {
      const state = makeOverworldState({
        mapId: 'oak_lab', x: 5, y: 5,
        storyFlags: ['got_starter'],
      });
      state.phase = 'battle';
      expect(checkRivalEncounter(state)).toBeNull();
    });

    it('each encounter only triggers once', () => {
      const allFlags = RIVAL_ENCOUNTERS.map(e => e.storyFlag);
      expect(new Set(allFlags).size).toBe(allFlags.length);
    });
  });

  describe('buildRivalTrainer', () => {
    it('builds trainer with counter-starter for emberon player', () => {
      const state = makeOverworldState({ rivalStarter: 'aqualing' });
      const enc = RIVAL_ENCOUNTERS[0]; // oak lab, level 5
      const trainer = buildRivalTrainer(enc, state);
      expect(trainer.name).toBe('Gary');
      expect(trainer.spriteType).toBe('rival');
      expect(trainer.team.some(t => t.speciesId === 'aqualing')).toBe(true);
    });

    it('builds trainer with counter-starter for aqualing player', () => {
      const state = makeOverworldState({ rivalStarter: 'sproutley' });
      const enc = RIVAL_ENCOUNTERS[0];
      const trainer = buildRivalTrainer(enc, state);
      expect(trainer.team.some(t => t.speciesId === 'sproutley')).toBe(true);
    });

    it('scales starter evolution for later encounters', () => {
      const state = makeOverworldState({ rivalStarter: 'aqualing' });
      // cerulean encounter has starterLevel 22
      const enc = RIVAL_ENCOUNTERS[2];
      const trainer = buildRivalTrainer(enc, state);
      expect(trainer.team.some(t => t.speciesId === 'tidalon')).toBe(true);
    });

    it('uses final evolution for elite4 encounter', () => {
      const state = makeOverworldState({ rivalStarter: 'aqualing' });
      const enc = RIVAL_ENCOUNTERS[4]; // elite4, level 55
      const trainer = buildRivalTrainer(enc, state);
      expect(trainer.team.some(t => t.speciesId === 'tsunamix')).toBe(true);
    });

    it('includes additional team members', () => {
      const state = makeOverworldState({ rivalStarter: 'aqualing' });
      const enc = RIVAL_ENCOUNTERS[4]; // elite4
      const trainer = buildRivalTrainer(enc, state);
      // 5 additional + 1 starter = 6
      expect(trainer.team.length).toBe(6);
    });
  });

  describe('RIVAL_ENCOUNTERS ordering', () => {
    it('has 5 encounters at all story points', () => {
      expect(RIVAL_ENCOUNTERS.length).toBe(5);
      expect(RIVAL_ENCOUNTERS.map(e => e.mapId)).toEqual([
        'oak_lab', 'route3', 'cerulean_city', 'vermilion_city', 'elite4',
      ]);
    });

    it('each encounter requires previous defeat flag', () => {
      for (let i = 1; i < RIVAL_ENCOUNTERS.length; i++) {
        expect(RIVAL_ENCOUNTERS[i].requiredFlag).toBe(RIVAL_ENCOUNTERS[i - 1].storyFlag);
      }
    });
  });
});

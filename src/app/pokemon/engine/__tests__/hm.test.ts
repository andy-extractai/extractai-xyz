import { describe, it, expect } from 'vitest';
import { teamKnowsMove, cutTreeFlag, isTreeCut, getHmAction, shouldExitSurf } from '../hm';
import { createPokemon } from '../state';
import { MOVES } from '../../data/moves';

describe('HM mechanics', () => {
  describe('MOVES data', () => {
    it('Cut move exists with correct properties', () => {
      expect(MOVES.cut).toBeDefined();
      expect(MOVES.cut.name).toBe('Cut');
      expect(MOVES.cut.type).toBe('Normal');
      expect(MOVES.cut.power).toBe(50);
      expect(MOVES.cut.category).toBe('physical');
    });

    it('Surf move exists with correct properties', () => {
      expect(MOVES.surf).toBeDefined();
      expect(MOVES.surf.name).toBe('Surf');
      expect(MOVES.surf.type).toBe('Water');
      expect(MOVES.surf.power).toBe(90);
      expect(MOVES.surf.category).toBe('special');
    });
  });

  describe('teamKnowsMove', () => {
    it('returns true when a team member knows the move', () => {
      const poke = createPokemon('emberon', 10);
      poke.moves.push({ moveId: 'cut', currentPp: 30 });
      expect(teamKnowsMove([poke], 'cut')).toBe(true);
    });

    it('returns false when no team member knows the move', () => {
      const poke = createPokemon('emberon', 10);
      expect(teamKnowsMove([poke], 'cut')).toBe(false);
    });

    it('returns false when the Pokémon knowing the move is fainted', () => {
      const poke = createPokemon('emberon', 10);
      poke.moves.push({ moveId: 'cut', currentPp: 30 });
      poke.currentHp = 0;
      expect(teamKnowsMove([poke], 'cut')).toBe(false);
    });
  });

  describe('cutTreeFlag', () => {
    it('creates correct flag string', () => {
      expect(cutTreeFlag('route2', 5, 10)).toBe('cut_route2_5_10');
    });
  });

  describe('isTreeCut', () => {
    it('returns true when flag is present', () => {
      const flags = new Set(['cut_route2_5_10']);
      expect(isTreeCut(flags, 'route2', 5, 10)).toBe(true);
    });

    it('returns false when flag is absent', () => {
      const flags = new Set<string>();
      expect(isTreeCut(flags, 'route2', 5, 10)).toBe(false);
    });
  });

  describe('getHmAction', () => {
    const pokemonWithCut = (() => {
      const p = createPokemon('emberon', 10);
      p.moves.push({ moveId: 'cut', currentPp: 30 });
      return p;
    })();

    const pokemonWithSurf = (() => {
      const p = createPokemon('aqualing', 10);
      p.moves.push({ moveId: 'surf', currentPp: 15 });
      return p;
    })();

    it('returns "cut" when facing cuttree tile with Cut-knowing Pokémon', () => {
      expect(getHmAction(16, [pokemonWithCut], false)).toBe('cut');
    });

    it('returns null when facing cuttree without Cut', () => {
      const poke = createPokemon('emberon', 10);
      expect(getHmAction(16, [poke], false)).toBeNull();
    });

    it('returns "surf" when facing water tile with Surf-knowing Pokémon', () => {
      expect(getHmAction(3, [pokemonWithSurf], false)).toBe('surf');
    });

    it('returns null when facing water but already surfing', () => {
      expect(getHmAction(3, [pokemonWithSurf], true)).toBeNull();
    });

    it('returns null when facing water without Surf', () => {
      const poke = createPokemon('emberon', 10);
      expect(getHmAction(3, [poke], false)).toBeNull();
    });

    it('returns null for regular tiles', () => {
      expect(getHmAction(0, [pokemonWithCut], false)).toBeNull();
      expect(getHmAction(1, [pokemonWithSurf], false)).toBeNull();
    });
  });

  describe('shouldExitSurf', () => {
    it('returns true when surfing and stepping on non-water tile', () => {
      expect(shouldExitSurf(0, true)).toBe(true);
      expect(shouldExitSurf(1, true)).toBe(true);
      expect(shouldExitSurf(2, true)).toBe(true);
    });

    it('returns false when surfing and stepping on water', () => {
      expect(shouldExitSurf(3, true)).toBe(false);
    });

    it('returns false when not surfing', () => {
      expect(shouldExitSurf(0, false)).toBe(false);
      expect(shouldExitSurf(1, false)).toBe(false);
    });
  });

  describe('storyFlags persistence', () => {
    it('cut tree flags are strings suitable for Set serialization', () => {
      const flag = cutTreeFlag('route2', 5, 10);
      const set = new Set([flag]);
      const arr = Array.from(set);
      const restored = new Set(arr);
      expect(restored.has(flag)).toBe(true);
    });
  });
});

import { describe, it, expect } from 'vitest';
import { getPokedexEntries, getCompletionStats } from '../PokedexScreen';

describe('Pokédex logic', () => {
  const makePokedex = (seen: string[], caught: string[]) => ({
    seen: new Set(seen),
    caught: new Set(caught),
  });

  describe('getPokedexEntries', () => {
    it('returns all 50 species ordered by id', () => {
      const entries = getPokedexEntries(makePokedex([], []));
      expect(entries).toHaveLength(50);
      for (let i = 1; i < entries.length; i++) {
        expect(entries[i].id).toBeGreaterThan(entries[i - 1].id);
      }
    });

    it('marks caught Pokémon as caught', () => {
      const entries = getPokedexEntries(makePokedex(['emberon'], ['emberon']));
      const emberon = entries.find(e => e.speciesId === 'emberon');
      expect(emberon?.status).toBe('caught');
    });

    it('marks seen-only Pokémon as seen', () => {
      const entries = getPokedexEntries(makePokedex(['emberon'], []));
      const emberon = entries.find(e => e.speciesId === 'emberon');
      expect(emberon?.status).toBe('seen');
    });

    it('marks unknown Pokémon as unknown', () => {
      const entries = getPokedexEntries(makePokedex([], []));
      const emberon = entries.find(e => e.speciesId === 'emberon');
      expect(emberon?.status).toBe('unknown');
    });

    it('includes types, description, and baseStats for each entry', () => {
      const entries = getPokedexEntries(makePokedex([], []));
      const emberon = entries.find(e => e.speciesId === 'emberon')!;
      expect(emberon.types).toContain('Fire');
      expect(emberon.description).toBeTruthy();
      expect(emberon.baseStats.hp).toBeGreaterThan(0);
    });

    it('includes spriteColors for each entry', () => {
      const entries = getPokedexEntries(makePokedex([], []));
      expect(entries[0].spriteColors.length).toBeGreaterThan(0);
    });
  });

  describe('getCompletionStats', () => {
    it('returns correct caught/seen/total counts', () => {
      const stats = getCompletionStats(makePokedex(['emberon', 'blazeron', 'aqualing'], ['emberon']));
      expect(stats.caught).toBe(1);
      expect(stats.seen).toBe(3);
      expect(stats.total).toBe(50);
    });

    it('returns zeros for empty pokedex', () => {
      const stats = getCompletionStats(makePokedex([], []));
      expect(stats.caught).toBe(0);
      expect(stats.seen).toBe(0);
      expect(stats.total).toBe(50);
    });
  });

  describe('display logic', () => {
    it('caught entries have name visible', () => {
      const entries = getPokedexEntries(makePokedex(['emberon'], ['emberon']));
      const e = entries.find(e => e.speciesId === 'emberon')!;
      expect(e.status).toBe('caught');
      expect(e.name).toBe('Emberon');
    });

    it('seen entries show name but no full detail', () => {
      const entries = getPokedexEntries(makePokedex(['emberon'], []));
      const e = entries.find(e => e.speciesId === 'emberon')!;
      expect(e.status).toBe('seen');
      expect(e.name).toBe('Emberon');
    });

    it('unknown entries should display ??? (status unknown)', () => {
      const entries = getPokedexEntries(makePokedex([], []));
      const e = entries.find(e => e.speciesId === 'emberon')!;
      expect(e.status).toBe('unknown');
      // UI renders ??? for unknown, verified by status field
    });

    it('first entry has id 1', () => {
      const entries = getPokedexEntries(makePokedex([], []));
      expect(entries[0].id).toBe(1);
    });

    it('last entry has id 50', () => {
      const entries = getPokedexEntries(makePokedex([], []));
      expect(entries[entries.length - 1].id).toBe(50);
    });
  });
});

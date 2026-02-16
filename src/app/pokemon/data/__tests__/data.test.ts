import { describe, it, expect } from 'vitest';
import { getEffectiveness, PokemonType } from '../types';
import { SPECIES, expForLevel } from '../pokemon';
import { MOVES } from '../moves';

const ALL_TYPES: PokemonType[] = [
  'Normal','Fire','Water','Grass','Electric','Ice',
  'Fighting','Poison','Ground','Flying','Psychic',
  'Bug','Rock','Ghost','Dragon',
];

describe('Type effectiveness', () => {
  it('Fire is super effective against Grass', () => {
    expect(getEffectiveness('Fire', ['Grass'])).toBe(2);
  });

  it('Water is not very effective against Water', () => {
    expect(getEffectiveness('Water', ['Water'])).toBe(0.5);
  });

  it('Normal is immune to Ghost', () => {
    expect(getEffectiveness('Normal', ['Ghost'])).toBe(0);
  });

  it('Electric is immune to Ground', () => {
    expect(getEffectiveness('Electric', ['Ground'])).toBe(0);
  });

  it('handles dual types', () => {
    // Fire vs Grass/Poison = 2 * 1 = 2
    expect(getEffectiveness('Fire', ['Grass', 'Poison'])).toBe(2);
  });

  it('neutral matchup returns 1', () => {
    expect(getEffectiveness('Normal', ['Normal'])).toBe(1);
  });
});

describe('SPECIES data integrity', () => {
  const speciesEntries = Object.entries(SPECIES);

  it('has exactly 50 species', () => {
    expect(speciesEntries.length).toBe(50);
  });

  it('all species have valid types', () => {
    for (const [key, sp] of speciesEntries) {
      for (const t of sp.types) {
        expect(ALL_TYPES, `${key} has invalid type ${t}`).toContain(t);
      }
    }
  });

  it('all learnsets reference existing moves', () => {
    for (const [key, sp] of speciesEntries) {
      for (const lm of sp.learnset) {
        expect(MOVES, `${key} references unknown move ${lm.moveId}`).toHaveProperty(lm.moveId);
      }
    }
  });

  it('all evolution targets exist', () => {
    for (const [key, sp] of speciesEntries) {
      if (sp.evolvesTo) {
        expect(SPECIES, `${key} evolves to unknown ${sp.evolvesTo}`).toHaveProperty(sp.evolvesTo);
      }
    }
  });
});

describe('MOVES data integrity', () => {
  it('all moves have valid types', () => {
    for (const [key, move] of Object.entries(MOVES)) {
      expect(ALL_TYPES, `${key} has invalid type ${move.type}`).toContain(move.type);
    }
  });

  it('all moves have valid categories', () => {
    for (const [key, move] of Object.entries(MOVES)) {
      expect(['physical', 'special', 'status'], `${key} has invalid category`).toContain(move.category);
    }
  });
});

describe('expForLevel', () => {
  it('returns increasing values', () => {
    for (let i = 2; i <= 100; i++) {
      expect(expForLevel(i)).toBeGreaterThan(expForLevel(i - 1));
    }
  });
});

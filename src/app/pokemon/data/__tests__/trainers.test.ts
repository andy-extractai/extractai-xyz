import { describe, it, expect } from 'vitest';
import { TRAINERS, GYM_ORDER } from '../trainers';
import { SPECIES } from '../pokemon';
import { getAllMaps } from '../maps';

const GAME_MAPS = getAllMaps();

describe('Gym trainer data integrity', () => {
  const gymTrainerPrefixes = [
    { prefix: 'pewter_trainer', gym: 'gym_pewter', type: 'Rock', minTrainers: 2 },
    { prefix: 'cerulean_trainer', gym: 'gym_cerulean', type: 'Water', minTrainers: 2 },
    { prefix: 'vermilion_trainer', gym: 'gym_vermilion', type: 'Electric', minTrainers: 2 },
    { prefix: 'celadon_trainer', gym: 'gym_celadon', type: 'Grass', minTrainers: 2 },
    { prefix: 'fuchsia_trainer', gym: 'gym_fuchsia', type: 'Poison', minTrainers: 2 },
    { prefix: 'saffron_trainer', gym: 'gym_saffron', type: 'Psychic', minTrainers: 2 },
    { prefix: 'cinnabar_trainer', gym: 'gym_cinnabar', type: 'Fire', minTrainers: 2 },
    { prefix: 'viridian_trainer', gym: 'gym_viridian', type: 'Ground', minTrainers: 2 },
  ];

  it('all trainer teams reference valid species', () => {
    for (const [id, trainer] of Object.entries(TRAINERS)) {
      for (const member of trainer.team) {
        expect(SPECIES, `Trainer ${id} references unknown species ${member.speciesId}`).toHaveProperty(member.speciesId);
      }
    }
  });

  it('all 8 gyms have at least 2 trainers before the leader', () => {
    for (const { prefix, minTrainers } of gymTrainerPrefixes) {
      const trainers = Object.keys(TRAINERS).filter(k => k.startsWith(prefix));
      expect(trainers.length, `${prefix} should have at least ${minTrainers} trainers`).toBeGreaterThanOrEqual(minTrainers);
    }
  });

  it('gym trainers have type-themed teams matching their gym', () => {
    const typeMap: Record<string, string> = {
      pewter_trainer: 'Rock', cerulean_trainer: 'Water', vermilion_trainer: 'Electric',
      celadon_trainer: 'Grass', fuchsia_trainer: 'Poison', saffron_trainer: 'Psychic',
      cinnabar_trainer: 'Fire', viridian_trainer: 'Ground',
    };
    for (const [prefix, gymType] of Object.entries(typeMap)) {
      const trainerIds = Object.keys(TRAINERS).filter(k => k.startsWith(prefix));
      for (const id of trainerIds) {
        const trainer = TRAINERS[id];
        const hasTypeMatch = trainer.team.some(member => {
          const species = SPECIES[member.speciesId];
          return species && species.types.includes(gymType as any);
        });
        expect(hasTypeMatch, `Trainer ${id} should have at least one ${gymType}-type Pokémon`).toBe(true);
      }
    }
  });

  it('all 8 gym leaders exist in TRAINERS', () => {
    for (const gym of GYM_ORDER) {
      expect(TRAINERS, `Missing gym leader ${gym.leaderId}`).toHaveProperty(gym.leaderId);
    }
  });

  it('all 8 gym interior maps exist', () => {
    const gymIds = GYM_ORDER.map(g => g.gymId);
    for (const gymId of gymIds) {
      expect(GAME_MAPS, `Missing gym map ${gymId}`).toHaveProperty(gymId);
    }
  });

  it('gym maps have unique names', () => {
    const gymIds = GYM_ORDER.map(g => g.gymId);
    const names = gymIds.map(id => GAME_MAPS[id].name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(8);
  });

  it('gym maps reference their trainers', () => {
    for (const { gym } of gymTrainerPrefixes) {
      const map = GAME_MAPS[gym];
      expect(map.trainers.length, `${gym} should have trainers`).toBeGreaterThanOrEqual(3); // 2+ trainers + leader
    }
  });

  it('all trainer IDs in gym maps exist in TRAINERS', () => {
    const gymIds = GYM_ORDER.map(g => g.gymId);
    for (const gymId of gymIds) {
      const map = GAME_MAPS[gymId];
      for (const trainerId of map.trainers) {
        expect(TRAINERS, `Gym map ${gymId} references unknown trainer ${trainerId}`).toHaveProperty(trainerId);
      }
    }
  });

  it('gym leaders have badge reward dialog', () => {
    for (const gym of GYM_ORDER) {
      const leader = TRAINERS[gym.leaderId];
      const mentionsBadge = leader.defeatDialog.some(d => d.toLowerCase().includes('badge'));
      expect(mentionsBadge, `${gym.leaderId} defeat dialog should mention badge`).toBe(true);
    }
  });
});

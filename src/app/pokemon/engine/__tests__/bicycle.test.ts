import { describe, it, expect } from 'vitest';
import { isIndoorMap, canToggleBicycle, toggleBicycle, getPlayerKeyItems, KEY_ITEMS } from '../bicycle';

describe('bicycle', () => {
  describe('isIndoorMap', () => {
    it('pokecenter is indoor', () => expect(isIndoorMap('pokecenter')).toBe(true));
    it('pokemart is indoor', () => expect(isIndoorMap('pokemart')).toBe(true));
    it('gym maps are indoor', () => expect(isIndoorMap('gym_pewter')).toBe(true));
    it('oak_lab is indoor', () => expect(isIndoorMap('oak_lab')).toBe(true));
    it('elite4 is indoor', () => expect(isIndoorMap('elite4')).toBe(true));
    it('cities are outdoor', () => expect(isIndoorMap('vermilion_city')).toBe(false));
    it('routes are outdoor', () => expect(isIndoorMap('route1')).toBe(false));
  });

  describe('canToggleBicycle', () => {
    it('can toggle when has bicycle and outdoors', () => {
      expect(canToggleBicycle(true, 'vermilion_city', false)).toBe(true);
    });
    it('cannot toggle without bicycle', () => {
      expect(canToggleBicycle(false, 'vermilion_city', false)).toBe(false);
    });
    it('cannot toggle indoors', () => {
      expect(canToggleBicycle(true, 'pokecenter', false)).toBe(false);
    });
    it('cannot toggle while surfing', () => {
      expect(canToggleBicycle(true, 'vermilion_city', true)).toBe(false);
    });
    it('cannot toggle in gym', () => {
      expect(canToggleBicycle(true, 'gym_vermilion', false)).toBe(false);
    });
  });

  describe('toggleBicycle', () => {
    it('toggles on when off', () => {
      expect(toggleBicycle(false, true, 'route1', false)).toBe(true);
    });
    it('toggles off when on', () => {
      expect(toggleBicycle(true, true, 'route1', false)).toBe(false);
    });
    it('stays off when cannot toggle', () => {
      expect(toggleBicycle(false, false, 'route1', false)).toBe(false);
    });
    it('stays on when cannot toggle indoors (returns current)', () => {
      expect(toggleBicycle(true, true, 'pokecenter', false)).toBe(true);
    });
  });

  describe('getPlayerKeyItems', () => {
    it('returns bicycle when player has it', () => {
      const items = getPlayerKeyItems(true);
      expect(items).toHaveLength(1);
      expect(items[0].id).toBe('bicycle');
    });
    it('returns empty when no bicycle', () => {
      expect(getPlayerKeyItems(false)).toHaveLength(0);
    });
  });

  describe('KEY_ITEMS', () => {
    it('has bicycle defined', () => {
      expect(KEY_ITEMS[0].id).toBe('bicycle');
      expect(KEY_ITEMS[0].name).toBe('Bicycle');
    });
  });
});

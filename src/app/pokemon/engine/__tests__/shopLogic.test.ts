import { describe, it, expect } from 'vitest';
import { buyItem, sellItem, getSellPrice, getMaxBuyable } from '../shopLogic';
import { ITEMS, MART_INVENTORY } from '../../data/items';

describe('shopLogic', () => {
  describe('buyItem', () => {
    it('buys a single item successfully', () => {
      const result = buyItem('potion', 1, 1000, {});
      expect(result.success).toBe(true);
      expect(result.newMoney).toBe(700); // 1000 - 300
      expect(result.newBag.potion).toBe(1);
    });

    it('buys multiple items at once', () => {
      const result = buyItem('pokeball', 5, 2000, { pokeball: 2 });
      expect(result.success).toBe(true);
      expect(result.newMoney).toBe(1000); // 2000 - 200*5
      expect(result.newBag.pokeball).toBe(7); // 2 + 5
    });

    it('fails when not enough money', () => {
      const result = buyItem('ultraball', 1, 500, {});
      expect(result.success).toBe(false);
      expect(result.newMoney).toBe(500);
      expect(result.error).toBe('Not enough money');
    });

    it('fails for invalid quantity', () => {
      const result = buyItem('potion', 0, 1000, {});
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid quantity');
    });

    it('fails for unknown item', () => {
      const result = buyItem('nonexistent', 1, 1000, {});
      expect(result.success).toBe(false);
      expect(result.error).toBe('Item not found');
    });

    it('fails when total cost exceeds money for multiple items', () => {
      const result = buyItem('ultraball', 3, 2000, {});
      expect(result.success).toBe(false); // 1200 * 3 = 3600 > 2000
    });
  });

  describe('sellItem', () => {
    it('sells a single item for half price', () => {
      const result = sellItem('potion', 1, 500, { potion: 3 });
      expect(result.success).toBe(true);
      expect(result.newMoney).toBe(650); // 500 + 150 (300/2)
      expect(result.newBag.potion).toBe(2);
    });

    it('sells multiple items at once', () => {
      const result = sellItem('greatball', 3, 100, { greatball: 5 });
      expect(result.success).toBe(true);
      expect(result.newMoney).toBe(1000); // 100 + 300*3
      expect(result.newBag.greatball).toBe(2);
    });

    it('removes item from bag when selling all', () => {
      const result = sellItem('antidote', 2, 0, { antidote: 2 });
      expect(result.success).toBe(true);
      expect(result.newMoney).toBe(100); // 0 + 50*2
      expect(result.newBag.antidote).toBeUndefined();
    });

    it('fails when not enough items', () => {
      const result = sellItem('potion', 5, 0, { potion: 2 });
      expect(result.success).toBe(false);
      expect(result.error).toBe('Not enough items');
    });

    it('cannot sell key items', () => {
      const result = sellItem('bicycle', 1, 0, { bicycle: 1 });
      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot sell key items');
    });

    it('fails for invalid quantity', () => {
      const result = sellItem('potion', -1, 0, { potion: 5 });
      expect(result.success).toBe(false);
    });
  });

  describe('getSellPrice', () => {
    it('returns half the buy price', () => {
      expect(getSellPrice('potion')).toBe(150);
      expect(getSellPrice('ultraball')).toBe(600);
      expect(getSellPrice('antidote')).toBe(50);
    });

    it('returns 0 for unknown items', () => {
      expect(getSellPrice('nonexistent')).toBe(0);
    });
  });

  describe('getMaxBuyable', () => {
    it('returns correct max buyable', () => {
      expect(getMaxBuyable('pokeball', 1000)).toBe(5); // 1000/200
      expect(getMaxBuyable('ultraball', 1000)).toBe(0); // floor(1000/1200) = 0
    });

    it('returns 0 for free items', () => {
      expect(getMaxBuyable('bicycle', 5000)).toBe(0);
    });
  });

  describe('MART_INVENTORY', () => {
    it('each city has a unique inventory', () => {
      const cities = Object.keys(MART_INVENTORY);
      expect(cities.length).toBeGreaterThanOrEqual(9);
      expect(cities).toContain('viridian');
      expect(cities).toContain('pewter');
      expect(cities).toContain('cerulean');
      expect(cities).toContain('vermilion');
      expect(cities).toContain('celadon');
      expect(cities).toContain('lavender');
      expect(cities).toContain('fuchsia');
      expect(cities).toContain('saffron');
      expect(cities).toContain('cinnabar');
    });

    it('later cities sell better items than earlier ones', () => {
      const hasItem = (city: string, itemId: string) =>
        MART_INVENTORY[city].items.some(i => i.itemId === itemId);

      // Early city (viridian) has basic items
      expect(hasItem('viridian', 'pokeball')).toBe(true);
      expect(hasItem('viridian', 'potion')).toBe(true);
      expect(hasItem('viridian', 'ultraball')).toBe(false);
      expect(hasItem('viridian', 'hyperPotion')).toBe(false);

      // Late cities have ultra balls and hyper potions
      expect(hasItem('cinnabar', 'ultraball')).toBe(true);
      expect(hasItem('cinnabar', 'hyperPotion')).toBe(true);
      expect(hasItem('saffron', 'fullRestore')).toBe(true);
    });

    it('all inventory items reference valid ITEMS', () => {
      for (const [city, inv] of Object.entries(MART_INVENTORY)) {
        for (const item of inv.items) {
          expect(ITEMS[item.itemId], `${city} has invalid item ${item.itemId}`).toBeDefined();
        }
      }
    });

    it('all items have valid prices', () => {
      for (const inv of Object.values(MART_INVENTORY)) {
        for (const item of inv.items) {
          expect(ITEMS[item.itemId].price).toBeGreaterThan(0);
        }
      }
    });
  });
});

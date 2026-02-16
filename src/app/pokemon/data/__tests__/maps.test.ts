import { describe, it, expect } from 'vitest';
import { getAllMaps, DOOR_CONNECTIONS, MAP_CONNECTIONS, TILE_DEFS } from '../maps';

describe('US-009: Map data integrity', () => {
  const maps = getAllMaps();
  const mapIds = Object.keys(maps);

  it('all door connections reference valid maps', () => {
    for (const door of DOOR_CONNECTIONS) {
      expect(mapIds, `fromMap "${door.fromMap}" not found`).toContain(door.fromMap);
      expect(mapIds, `toMap "${door.toMap}" not found`).toContain(door.toMap);
    }
  });

  it('all door connection coordinates are within map bounds', () => {
    for (const door of DOOR_CONNECTIONS) {
      const fromMap = maps[door.fromMap];
      const toMap = maps[door.toMap];
      expect(door.fromX, `${door.fromMap} fromX out of bounds`).toBeLessThan(fromMap.width);
      expect(door.fromY, `${door.fromMap} fromY out of bounds`).toBeLessThan(fromMap.height);
      expect(door.toX, `${door.toMap} toX out of bounds`).toBeLessThan(toMap.width);
      expect(door.toY, `${door.toMap} toY out of bounds`).toBeLessThan(toMap.height);
    }
  });

  it('all map connections reference valid maps', () => {
    for (const conn of MAP_CONNECTIONS) {
      expect(mapIds, `from "${conn.from}" not found`).toContain(conn.from);
      expect(mapIds, `to "${conn.to}" not found`).toContain(conn.to);
    }
  });

  it('all map connection target coordinates are within bounds', () => {
    for (const conn of MAP_CONNECTIONS) {
      const toMap = maps[conn.to];
      expect(conn.toX, `${conn.to} toX ${conn.toX} >= width ${toMap.width}`).toBeLessThan(toMap.width);
      expect(conn.toY, `${conn.to} toY ${conn.toY} >= height ${toMap.height}`).toBeLessThan(toMap.height);
    }
  });

  it('all maps have valid tile types', () => {
    for (const [id, map] of Object.entries(maps)) {
      expect(map.tiles.length, `${id} height mismatch`).toBe(map.height);
      for (let y = 0; y < map.tiles.length; y++) {
        expect(map.tiles[y].length, `${id} row ${y} width mismatch`).toBe(map.width);
        for (let x = 0; x < map.tiles[y].length; x++) {
          expect(TILE_DEFS, `${id} tile (${x},${y}) type ${map.tiles[y][x]} unknown`).toHaveProperty(String(map.tiles[y][x]));
        }
      }
    }
  });
});

describe('US-009: Unique city layouts', () => {
  const maps = getAllMaps();

  it('Celadon City has unique layout with NPCs', () => {
    const celadon = maps['celadon_city'];
    expect(celadon.name).toBe('Celadon City');
    expect(celadon.npcs.length).toBeGreaterThanOrEqual(2);
    // Has department store NPC
    const deptNpc = celadon.npcs.find(n => n.id === 'celadon_dept');
    expect(deptNpc).toBeDefined();
    // Has game corner NPC
    const gameNpc = celadon.npcs.find(n => n.id === 'celadon_gamecorner');
    expect(gameNpc).toBeDefined();
    // Has nurse
    const nurse = celadon.npcs.find(n => n.id === 'celadon_nurse');
    expect(nurse).toBeDefined();
  });

  it('Fuchsia City has unique layout with Safari Zone reference', () => {
    const fuchsia = maps['fuchsia_city'];
    expect(fuchsia.name).toBe('Fuchsia City');
    expect(fuchsia.npcs.length).toBeGreaterThanOrEqual(2);
    // Has warden NPC
    const warden = fuchsia.npcs.find(n => n.id === 'hm_surf_npc');
    expect(warden).toBeDefined();
    // Has safari guide
    const safari = fuchsia.npcs.find(n => n.id === 'fuchsia_safari');
    expect(safari).toBeDefined();
    expect(safari!.dialog.some(d => d.includes('Safari Zone'))).toBe(true);
    // Has nurse
    const nurse = fuchsia.npcs.find(n => n.id === 'fuchsia_nurse');
    expect(nurse).toBeDefined();
  });

  it('Saffron City has unique layout as largest city', () => {
    const saffron = maps['saffron_city'];
    expect(saffron.name).toBe('Saffron City');
    expect(saffron.npcs.length).toBeGreaterThanOrEqual(2);
    // Has Silph Co NPC
    const silph = saffron.npcs.find(n => n.id === 'saffron_silph');
    expect(silph).toBeDefined();
    expect(silph!.dialog.some(d => d.includes('Silph'))).toBe(true);
    // Has guard (locked door)
    const guard = saffron.npcs.find(n => n.id === 'saffron_guard');
    expect(guard).toBeDefined();
    // Has nurse
    const nurse = saffron.npcs.find(n => n.id === 'saffron_nurse');
    expect(nurse).toBeDefined();
  });

  it('Cinnabar Island is surrounded by water', () => {
    const cinnabar = maps['cinnabar_island'];
    expect(cinnabar.name).toBe('Cinnabar Island');
    expect(cinnabar.npcs.length).toBeGreaterThanOrEqual(2);
    // Check water borders (corners should be water = 3)
    expect(cinnabar.tiles[0][0]).toBe(3);
    expect(cinnabar.tiles[0][cinnabar.width - 1]).toBe(3);
    expect(cinnabar.tiles[cinnabar.height - 1][0]).toBe(3);
    expect(cinnabar.tiles[cinnabar.height - 1][cinnabar.width - 1]).toBe(3);
    // Has nurse
    const nurse = cinnabar.npcs.find(n => n.id === 'cinnabar_nurse');
    expect(nurse).toBeDefined();
  });

  it('each unique city has at least 2 dialog NPCs (excluding nurses)', () => {
    const cities = ['celadon_city', 'fuchsia_city', 'saffron_city', 'cinnabar_island'];
    for (const cityId of cities) {
      const city = maps[cityId];
      const dialogNpcs = city.npcs.filter(n => n.spriteType !== 'nurse' && n.spriteType !== 'sign');
      expect(dialogNpcs.length, `${cityId} needs at least 2 dialog NPCs`).toBeGreaterThanOrEqual(2);
    }
  });

  it('each unique city tiles differ from each other', () => {
    const cities = ['celadon_city', 'fuchsia_city', 'saffron_city', 'cinnabar_island'];
    // Flatten tiles to string for comparison
    const tileStrings = cities.map(id => JSON.stringify(maps[id].tiles));
    // All should be unique
    const unique = new Set(tileStrings);
    expect(unique.size).toBe(cities.length);
  });
});

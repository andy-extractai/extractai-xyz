import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { join } from 'path';

const componentsDir = join(__dirname, '..');

describe('US-003: Extracted components exist', () => {
  it('BattleScreen.ts exists', () => {
    expect(existsSync(join(componentsDir, 'BattleScreen.ts'))).toBe(true);
  });

  it('MenuScreen.ts exists', () => {
    expect(existsSync(join(componentsDir, 'MenuScreen.ts'))).toBe(true);
  });

  it('ShopScreen.ts exists', () => {
    expect(existsSync(join(componentsDir, 'ShopScreen.ts'))).toBe(true);
  });

  it('IntroScreens.ts exists', () => {
    expect(existsSync(join(componentsDir, 'IntroScreens.ts'))).toBe(true);
  });

  it('EvolutionScreen.ts exists', () => {
    expect(existsSync(join(componentsDir, 'EvolutionScreen.ts'))).toBe(true);
  });

  it('utils.ts exists', () => {
    expect(existsSync(join(componentsDir, 'utils.ts'))).toBe(true);
  });
});

describe('US-003: Components export render functions', () => {
  it('BattleScreen exports renderBattleScreen', async () => {
    const mod = await import('../BattleScreen');
    expect(typeof mod.renderBattleScreen).toBe('function');
  });

  it('MenuScreen exports renderMenu', async () => {
    const mod = await import('../MenuScreen');
    expect(typeof mod.renderMenu).toBe('function');
  });

  it('ShopScreen exports renderShop', async () => {
    const mod = await import('../ShopScreen');
    expect(typeof mod.renderShop).toBe('function');
  });

  it('IntroScreens exports renderIntroScreen, renderNamingScreen, renderStarterSelect', async () => {
    const mod = await import('../IntroScreens');
    expect(typeof mod.renderIntroScreen).toBe('function');
    expect(typeof mod.renderNamingScreen).toBe('function');
    expect(typeof mod.renderStarterSelect).toBe('function');
  });

  it('EvolutionScreen exports renderEvolution', async () => {
    const mod = await import('../EvolutionScreen');
    expect(typeof mod.renderEvolution).toBe('function');
  });
});

describe('US-003: Game.tsx is under 800 lines', () => {
  it('Game.tsx line count < 800', async () => {
    const fs = await import('fs');
    const gamePath = join(componentsDir, '..', 'Game.tsx');
    const content = fs.readFileSync(gamePath, 'utf-8');
    const lineCount = content.split('\n').length;
    expect(lineCount).toBeLessThan(800);
  });
});

describe('US-003: Game.tsx imports extracted components', () => {
  it('Game.tsx imports all component modules', async () => {
    const fs = await import('fs');
    const gamePath = join(componentsDir, '..', 'Game.tsx');
    const content = fs.readFileSync(gamePath, 'utf-8');
    expect(content).toContain("from './components/BattleScreen'");
    expect(content).toContain("from './components/MenuScreen'");
    expect(content).toContain("from './components/ShopScreen'");
    expect(content).toContain("from './components/IntroScreens'");
    expect(content).toContain("from './components/EvolutionScreen'");
  });
});

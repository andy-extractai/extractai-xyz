'use client';

import { useEffect, useRef } from 'react';
import { GAME_WIDTH, GAME_HEIGHT } from './constants';

export default function Game() {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gameRef = useRef<any>(null);

  useEffect(() => {
    if (gameRef.current || !containerRef.current) return;

    // Load Press Start 2P font
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Wait for font to load, then initialize game
    const initGame = async () => {
      const PhaserModule = await import('phaser');
      const Phaser = PhaserModule.default || PhaserModule;
      const { BootScene } = await import('./scenes/BootScene');
      const { TitleScene } = await import('./scenes/TitleScene');
      const { StarterSelectScene } = await import('./scenes/StarterSelectScene');
      const { OverworldScene } = await import('./scenes/OverworldScene');
      const { BattleScene } = await import('./scenes/BattleScene');
      const { PokemonCenterScene } = await import('./scenes/PokemonCenterScene');

      // Wait for font to be available
      await document.fonts.ready;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const P = Phaser as any;
      const config = {
        type: P.AUTO,
        parent: containerRef.current!,
        pixelArt: true,
        backgroundColor: '#000000',
        scale: {
          mode: P.Scale.FIT,
          autoCenter: P.Scale.CENTER_BOTH,
          width: GAME_WIDTH,
          height: GAME_HEIGHT,
        },
        scene: [BootScene, TitleScene, StarterSelectScene, OverworldScene, BattleScene, PokemonCenterScene],
      };

      gameRef.current = new P.Game(config);
    };

    initGame();

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        background: '#000',
        overflow: 'hidden',
      }}
    />
  );
}

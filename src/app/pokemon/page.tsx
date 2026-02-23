'use client';

import dynamic from 'next/dynamic';
import MobileGate from './MobileGate';

const PokemonGame = dynamic(() => import('./Game'), { ssr: false });

export default function PokemonPage() {
  return (
    <MobileGate>
      <div style={{ background: '#000', width: '100vw', height: '100vh', overflow: 'hidden' }}>
        <PokemonGame />
      </div>
    </MobileGate>
  );
}

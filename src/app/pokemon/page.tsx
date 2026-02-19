'use client';

import dynamic from 'next/dynamic';
import MobileGate from './MobileGate';

const PokemonGame = dynamic(() => import('./Game'), { ssr: false });

export default function PokemonPage() {
  return (
    <MobileGate>
      <div className="min-h-screen bg-black flex flex-col">
        <div className="flex-1">
          <PokemonGame />
        </div>
      </div>
    </MobileGate>
  );
}

'use client';

import dynamic from 'next/dynamic';

const PokemonGame = dynamic(() => import('./Game'), { ssr: false });

export default function PokemonPage() {
  return <PokemonGame />;
}

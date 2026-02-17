'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';

const PokemonGame = dynamic(() => import('./Game'), { ssr: false });

export default function PokemonPage() {
  return (
    <div className="min-h-screen bg-black flex flex-col">
      <nav className="p-4 flex-shrink-0">
        <Link
          href="/"
          className="text-zinc-500 hover:text-white transition-colors text-sm"
        >
          ← extractai
        </Link>
      </nav>
      <div className="flex-1">
        <PokemonGame />
      </div>
    </div>
  );
}

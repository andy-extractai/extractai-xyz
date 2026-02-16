'use client';

import dynamic from 'next/dynamic';

const PokemonGame = dynamic(() => import('./components'), { ssr: false });

export default function PokemonPage() {
  return (
    <>
      <style jsx global>{`
        .pixelated {
          image-rendering: pixelated;
          image-rendering: crisp-edges;
        }
        .btn-battle {
          @apply px-3 py-2.5 rounded-lg border border-zinc-700 text-sm font-medium transition-all disabled:opacity-40;
        }
        .btn-dpad {
          @apply w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center text-white active:bg-zinc-600 text-lg;
        }
      `}</style>
      <PokemonGame />
    </>
  );
}

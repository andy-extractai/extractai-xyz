"use client";

/**
 * MobileGate.mobile.tsx
 *
 * Wraps any content (typically <PokemonGame />) and detects narrow viewports.
 * On screens < 768 px it shows a friendly warning; the user can still choose
 * to continue.  On ≥ 768 px the children render immediately without any gate.
 *
 * Usage:
 *   import MobileGate from "@/app/pokemon/MobileGate.mobile";
 *   <MobileGate>{children}</MobileGate>
 */

import { useEffect, useState } from "react";

interface MobileGateProps {
  /** The game component (or any content) to render when allowed. */
  children: React.ReactNode;
  /** Breakpoint in px below which the gate appears (default: 768). */
  breakpoint?: number;
}

export default function MobileGate({
  children,
  breakpoint = 768,
}: MobileGateProps) {
  // Three states: "checking" (SSR-safe init), "mobile", "desktop"
  const [viewport, setViewport] = useState<"checking" | "mobile" | "desktop">(
    "checking"
  );
  const [override, setOverride] = useState(false);

  useEffect(() => {
    const check = () => {
      setViewport(window.innerWidth < breakpoint ? "mobile" : "desktop");
    };

    check();

    // Re-check on resize so rotating a device works correctly.
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);

  // SSR / first paint: render nothing to avoid hydration mismatch.
  if (viewport === "checking") return null;

  // Desktop — or user clicked "Play anyway" — just show the game.
  if (viewport === "desktop" || override) return <>{children}</>;

  // Mobile gate screen
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white px-6 text-center">
      {/* Icon */}
      <div className="text-6xl mb-6 select-none" aria-hidden="true">
        🎮
      </div>

      {/* Heading */}
      <h1 className="text-2xl font-bold mb-3 text-white">
        Best experienced on desktop
      </h1>

      {/* Sub-copy */}
      <p className="text-zinc-400 max-w-xs mb-8 leading-relaxed">
        Pokémon uses a keyboard for movement and battles. On a small screen
        things may feel cramped — open this on a laptop or desktop for the
        full experience.
      </p>

      {/* CTA buttons */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        {/* Play anyway */}
        <button
          onClick={() => setOverride(true)}
          className="w-full px-6 py-3 rounded-full bg-emerald-400 text-black font-semibold text-sm hover:bg-emerald-300 active:scale-95 transition-all"
        >
          Play anyway
        </button>

        {/* Go back */}
        <a
          href="/"
          className="w-full px-6 py-3 rounded-full border border-zinc-700 text-zinc-400 font-medium text-sm hover:border-zinc-500 hover:text-white active:scale-95 transition-all"
        >
          ← Back to extractai
        </a>
      </div>

      {/* Fine print */}
      <p className="mt-10 text-xs text-zinc-600">
        Touch controls are available inside the game.
      </p>
    </div>
  );
}

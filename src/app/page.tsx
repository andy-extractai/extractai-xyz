"use client";

import Link from "next/link";
import { useTheme } from "./components/ThemeProvider";

const apps = [
  {
    name: "Mission Control",
    description: "Command center — tasks, agents, schedules",
    href: "/control",
    emoji: "🎛️",
    accent: "emerald",
  },
  {
    name: "Congress Trades",
    description: "Track what politicians are buying & selling",
    href: "/congress",
    emoji: "🏛️",
    accent: "amber",
  },
  {
    name: "Tokenized Agents",
    description: "Live tracker for AI agent tokens on Base",
    href: "/tokens",
    emoji: "🪙",
    accent: "purple",
  },
  {
    name: "World Clock",
    description: "Live time across EST, PST, UTC & ART",
    href: "/clock",
    emoji: "🕐",
    accent: "blue",
  },
  {
    name: "Pokémon RPG",
    description: "Browser-based adventure — 50 species, 8 gyms",
    href: "/pokemon",
    emoji: "⚡",
    accent: "yellow",
  },
];

export default function Home() {
  const { theme } = useTheme();
  const d = theme === "dark";

  return (
    <div className="min-h-screen flex flex-col">
      {/* ─────────────────────────────────────────────
          Hero section
          — px scales: 4 (mobile) → 6 (sm) → 8 (lg)
          — py scales: 10 (mobile) → 14 (sm) → 16 (lg)
          — keeps desktop (lg+) at the original py-16 px-6 feel
      ───────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">

        <div className="max-w-2xl w-full text-center space-y-3 sm:space-y-4">
          {/* ── Headline
              375px  → text-4xl  (36px) — fits "extractai" on one line with room
              640px+ → text-5xl  (48px)
              1024px → text-7xl  (72px) — original desktop size
          */}
          <h1
            className={`
              text-4xl sm:text-5xl lg:text-7xl
              font-bold tracking-tight
              ${d ? "text-white" : "text-zinc-900"}
            `}
          >
            extract<span className="text-emerald-500">ai</span>
          </h1>

          {/* ── Tagline
              Shrinks slightly on mobile so it breathes on narrow screens
          */}
          <p
            className={`
              text-base sm:text-lg lg:text-xl
              max-w-xs sm:max-w-lg mx-auto
              ${d ? "text-zinc-400" : "text-zinc-500"}
            `}
          >
            AI-powered tools that extract signal from noise.
          </p>
        </div>

        {/* ─────────────────────────────────────────────
            App Grid
            — 1 column on mobile  (< 640px)  — full-width cards, easy to tap
            — 2 columns on sm     (≥ 640px)
            — 3 columns on lg     (≥ 1024px) — original desktop layout
            — gap shrinks on mobile: gap-3 → gap-4
            — top margin: mt-8 (mobile) → mt-10 (sm) → mt-14 (lg)
            — max-w keeps cards from stretching too wide on tablets
        ───────────────────────────────────────────── */}
        <div
          className={`
            mt-8 sm:mt-10 lg:mt-14
            grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
            gap-3 sm:gap-4
            max-w-sm sm:max-w-2xl lg:max-w-4xl
            w-full
          `}
        >
          {apps.map((app) => (
            <Link
              key={app.href}
              href={app.href}
              className={`
                group rounded-xl
                p-4 sm:p-5 lg:p-6
                transition-all duration-150
                border
                /* min touch target height — most cards will be taller
                   but explicit min keeps short-content cards tappable */
                min-h-[80px]
                ${d
                  ? "border-zinc-800 hover:border-emerald-500/40 hover:bg-zinc-900/50 active:bg-zinc-900/70"
                  : "border-zinc-200 hover:border-emerald-500/40 hover:bg-emerald-50/30 active:bg-emerald-50/60"
                }
              `}
            >
              {/* Emoji: slightly larger on mobile for quick scanning */}
              <div className="text-3xl sm:text-3xl mb-2 sm:mb-3 leading-none">{app.emoji}</div>

              <h2
                className={`
                  text-base sm:text-lg font-semibold
                  group-hover:text-emerald-500 transition-colors duration-150
                  ${d ? "text-white" : "text-zinc-900"}
                `}
              >
                {app.name}
              </h2>

              <p className={`text-sm mt-1 ${d ? "text-zinc-500" : "text-zinc-500"}`}>
                {app.description}
              </p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

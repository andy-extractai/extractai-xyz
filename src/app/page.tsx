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
      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="max-w-2xl text-center space-y-4">
          <h1 className={`text-5xl sm:text-7xl font-bold tracking-tight ${d ? "text-white" : "text-zinc-900"}`}>
            extract<span className="text-emerald-500">ai</span>
          </h1>
          <p className={`text-lg sm:text-xl max-w-lg mx-auto ${d ? "text-zinc-400" : "text-zinc-500"}`}>
            AI-powered tools that extract signal from noise.
          </p>
        </div>

        {/* App Grid */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl w-full">
          {apps.map((app) => (
            <Link
              key={app.href}
              href={app.href}
              className={`group rounded-xl p-6 transition-all border ${
                d
                  ? "border-zinc-800 hover:border-emerald-500/40 hover:bg-zinc-900/50"
                  : "border-zinc-200 hover:border-emerald-500/40 hover:bg-emerald-50/30"
              }`}
            >
              <div className="text-3xl mb-3">{app.emoji}</div>
              <h2 className={`text-lg font-semibold group-hover:text-emerald-500 transition-colors ${
                d ? "text-white" : "text-zinc-900"
              }`}>
                {app.name}
              </h2>
              <p className={`text-sm mt-1 ${d ? "text-zinc-500" : "text-zinc-500"}`}>{app.description}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

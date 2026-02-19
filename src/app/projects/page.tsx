"use client";

import Link from "next/link";
import { useTheme } from "../components/ThemeProvider";

// ─── Helper: pick dark or light value ─────────────────────────────────────────
const t = <T,>(d: boolean, dark: T, light: T): T => (d ? dark : light);

// ─── Project Data ──────────────────────────────────────────────────────────────
const projects = [
  {
    emoji: "🏛️",
    name: "Congress Trade Tracker",
    href: "/congress",
    description:
      "Track what politicians are buying & selling. 4,658+ trades from House STOCK Act filings.",
    status: "LIVE" as const,
    tags: ["Finance", "Politics", "Data"],
    accent: "emerald",
  },
  {
    emoji: "🪙",
    name: "Tokenized Agents",
    href: "/tokens",
    description:
      "Live tracker for AI agent tokens on Base chain. DexScreener-powered with quality scoring.",
    status: "LIVE" as const,
    tags: ["Crypto", "DeFi", "Analytics"],
    accent: "purple",
  },
  {
    emoji: "🕐",
    name: "World Clock",
    href: "/clock",
    description: "Live time display across EST, PST, UTC & ART timezones.",
    status: "LIVE" as const,
    tags: ["Utility"],
    accent: "blue",
  },
  {
    emoji: "⚡",
    name: "Pokémon RPG",
    href: "/pokemon",
    description:
      "Browser-based adventure — 50 species, 20+ maps, 8 gyms, Elite 4. 11,595 lines of code.",
    status: "LIVE" as const,
    tags: ["Game", "Fun"],
    accent: "yellow",
  },
];

// ─── Accent colour maps ────────────────────────────────────────────────────────
type Accent = "emerald" | "purple" | "blue" | "yellow";

const accentHoverBorderDark: Record<Accent, string> = {
  emerald: "hover:border-emerald-500/50",
  purple: "hover:border-purple-500/50",
  blue: "hover:border-blue-500/50",
  yellow: "hover:border-yellow-400/50",
};
const accentHoverBorderLight: Record<Accent, string> = {
  emerald: "hover:border-emerald-400/60",
  purple: "hover:border-purple-400/60",
  blue: "hover:border-blue-400/60",
  yellow: "hover:border-yellow-400/60",
};
const accentHoverBgDark: Record<Accent, string> = {
  emerald: "hover:bg-emerald-500/5",
  purple: "hover:bg-purple-500/5",
  blue: "hover:bg-blue-500/5",
  yellow: "hover:bg-yellow-400/5",
};
const accentHoverBgLight: Record<Accent, string> = {
  emerald: "hover:bg-emerald-50/60",
  purple: "hover:bg-purple-50/60",
  blue: "hover:bg-blue-50/60",
  yellow: "hover:bg-yellow-50/60",
};
const accentTitleHover: Record<Accent, string> = {
  emerald: "group-hover:text-emerald-500",
  purple: "group-hover:text-purple-400",
  blue: "group-hover:text-blue-400",
  yellow: "group-hover:text-yellow-400",
};
const tagBgDark: Record<Accent, string> = {
  emerald: "bg-emerald-500/10 text-emerald-400",
  purple: "bg-purple-500/10 text-purple-400",
  blue: "bg-blue-500/10 text-blue-400",
  yellow: "bg-yellow-400/10 text-yellow-400",
};
const tagBgLight: Record<Accent, string> = {
  emerald: "bg-emerald-100 text-emerald-700",
  purple: "bg-purple-100 text-purple-700",
  blue: "bg-blue-100 text-blue-700",
  yellow: "bg-yellow-100 text-yellow-700",
};

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function ProjectsPage() {
  const { theme } = useTheme();
  const d = theme === "dark";

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-12 sm:py-16 max-w-5xl mx-auto w-full">

        {/* ── Header ── */}
        <div className="mb-10 sm:mb-14">
          <h1
            className={`text-4xl sm:text-5xl font-bold tracking-tight mb-3 ${
              t(d, "text-white", "text-zinc-900")
            }`}
          >
            🚀 Projects
          </h1>
          <p className={`text-base sm:text-lg ${t(d, "text-zinc-400", "text-zinc-500")}`}>
            Tools and apps built by the extractai team
          </p>
        </div>

        {/* ── Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {projects.map((project) => {
            const accent = project.accent as Accent;
            const hoverBorder = t(d, accentHoverBorderDark[accent], accentHoverBorderLight[accent]);
            const hoverBg = t(d, accentHoverBgDark[accent], accentHoverBgLight[accent]);
            const titleHover = accentTitleHover[accent];
            const tagStyle = t(d, tagBgDark[accent], tagBgLight[accent]);

            return (
              <Link
                key={project.href}
                href={project.href}
                className={`
                  group relative flex flex-col gap-4
                  rounded-2xl border p-6 sm:p-7
                  transition-all duration-200
                  ${t(d, "border-zinc-800 bg-zinc-950", "border-zinc-200 bg-white")}
                  ${hoverBorder} ${hoverBg}
                  hover:shadow-lg hover:-translate-y-[2px]
                  active:translate-y-0 active:shadow-none
                `}
              >
                {/* ── Top row: emoji + status badge ── */}
                <div className="flex items-start justify-between gap-3">
                  <span className="text-5xl sm:text-6xl leading-none select-none">
                    {project.emoji}
                  </span>

                  {/* Status badge */}
                  <span
                    className="
                      inline-flex items-center gap-1.5 mt-1
                      px-2.5 py-1 rounded-full
                      text-xs font-semibold tracking-wide
                      bg-emerald-500/15 text-emerald-400
                      border border-emerald-500/30
                    "
                  >
                    {/* Pulsing dot */}
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                    </span>
                    {project.status}
                  </span>
                </div>

                {/* ── Title ── */}
                <div>
                  <h2
                    className={`
                      text-xl sm:text-2xl font-bold leading-snug
                      transition-colors duration-150
                      ${t(d, "text-white", "text-zinc-900")}
                      ${titleHover}
                    `}
                  >
                    {project.name}
                  </h2>
                </div>

                {/* ── Description ── */}
                <p
                  className={`
                    text-sm sm:text-base leading-relaxed flex-1
                    ${t(d, "text-zinc-400", "text-zinc-500")}
                  `}
                >
                  {project.description}
                </p>

                {/* ── Tags ── */}
                <div className="flex flex-wrap gap-2 mt-auto">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`
                        px-2.5 py-1 rounded-full text-xs font-medium
                        ${tagStyle}
                      `}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* ── Arrow hint (appears on hover) ── */}
                <span
                  className={`
                    absolute bottom-6 right-7
                    text-lg opacity-0 group-hover:opacity-100
                    transition-all duration-200
                    translate-x-0 group-hover:translate-x-1
                    ${t(d, "text-zinc-500", "text-zinc-400")}
                  `}
                >
                  →
                </span>
              </Link>
            );
          })}
        </div>

        {/* ── Footer note ── */}
        <p
          className={`
            mt-12 text-center text-sm
            ${t(d, "text-zinc-600", "text-zinc-400")}
          `}
        >
          More projects coming soon · Built with Next.js & Tailwind
        </p>
      </main>
    </div>
  );
}

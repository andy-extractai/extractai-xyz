"use client";

import Link from "next/link";
import { useTheme } from "../components/ThemeProvider";
import { motion } from "framer-motion";

// ─── Project definitions ───────────────────────────────────────────────────────
const PROJECTS = [
  {
    emoji:       "🏛️",
    name:        "Congress Trade Tracker",
    href:        "/congress",
    description: "Track what politicians are buying and selling. Real-time House STOCK Act filings with searchable history.",
    stat:        "4,658+ trades",
    tags:        ["Finance", "Politics", "Data"],
    accent:      "emerald" as const,
    span:        2 as const,   // bento col-span
    live:        true,
  },
  {
    emoji:       "🪙",
    name:        "Tokenized Agents",
    href:        "/tokens",
    description: "Live tracker for AI agent tokens on Base chain, powered by DexScreener with quality scoring.",
    stat:        "Live chain data",
    tags:        ["Crypto", "DeFi", "Analytics"],
    accent:      "purple" as const,
    span:        1 as const,
    live:        true,
  },
  {
    emoji:       "📡",
    name:        "Consensus",
    href:        "/consensus",
    description: "Signal aggregation and market intelligence from agent perspectives. Spot emerging trends before they break.",
    stat:        "Multi-agent signals",
    tags:        ["Intelligence", "Markets"],
    accent:      "cyan" as const,
    span:        1 as const,
    live:        true,
  },
  {
    emoji:       "📚",
    name:        "Lesson Planner",
    href:        "/lesson-planner",
    description: "AI-powered lesson planning. Fill out a 3-step wizard and get a full curriculum plan with timeline, materials, and assessments.",
    stat:        "AI-generated",
    tags:        ["Education", "AI"],
    accent:      "indigo" as const,
    span:        2 as const,
    live:        true,
  },
  {
    emoji:       "⚡",
    name:        "Pokémon RPG",
    href:        "/pokemon",
    description: "Browser-based adventure — 50 species, 20+ maps, 8 gyms, Elite 4. 11,595 lines of code.",
    stat:        "11,595 LOC",
    tags:        ["Game", "Fun"],
    accent:      "yellow" as const,
    span:        1 as const,
    live:        true,
  },
  {
    emoji:       "🕐",
    name:        "World Clock",
    href:        "/clock",
    description: "Live time across EST, PST, UTC & ART timezones. Minimal, always accurate.",
    stat:        "4 timezones",
    tags:        ["Utility"],
    accent:      "blue" as const,
    span:        1 as const,
    live:        true,
  },
];

// ─── Accent system ─────────────────────────────────────────────────────────────
type Accent = "emerald" | "purple" | "cyan" | "indigo" | "yellow" | "blue";

const GLOW: Record<Accent, string> = {
  emerald: "rgba(16,185,129,0.18)",
  purple:  "rgba(168,85,247,0.18)",
  cyan:    "rgba(6,182,212,0.18)",
  indigo:  "rgba(99,102,241,0.18)",
  yellow:  "rgba(250,204,21,0.18)",
  blue:    "rgba(59,130,246,0.18)",
};

const TOP_BAR: Record<Accent, string> = {
  emerald: "bg-emerald-500",
  purple:  "bg-purple-500",
  cyan:    "bg-cyan-400",
  indigo:  "bg-indigo-500",
  yellow:  "bg-yellow-400",
  blue:    "bg-blue-500",
};

const TAG_STYLE: Record<Accent, { d: string; l: string }> = {
  emerald: { d: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", l: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  purple:  { d: "bg-purple-500/10  text-purple-400  border-purple-500/20",  l: "bg-purple-100  text-purple-700  border-purple-200"  },
  cyan:    { d: "bg-cyan-500/10    text-cyan-400    border-cyan-500/20",    l: "bg-cyan-100    text-cyan-700    border-cyan-200"    },
  indigo:  { d: "bg-indigo-500/10  text-indigo-400  border-indigo-500/20",  l: "bg-indigo-100  text-indigo-700  border-indigo-200"  },
  yellow:  { d: "bg-yellow-400/10  text-yellow-400  border-yellow-400/20",  l: "bg-yellow-100  text-yellow-700  border-yellow-200"  },
  blue:    { d: "bg-blue-500/10    text-blue-400    border-blue-500/20",    l: "bg-blue-100    text-blue-700    border-blue-200"    },
};

const STAT_COLOR: Record<Accent, string> = {
  emerald: "text-emerald-400",
  purple:  "text-purple-400",
  cyan:    "text-cyan-400",
  indigo:  "text-indigo-400",
  yellow:  "text-yellow-400",
  blue:    "text-blue-400",
};

// ─── Card ─────────────────────────────────────────────────────────────────────
function ProjectCard({
  project,
  index,
  d,
}: {
  project: typeof PROJECTS[number];
  index: number;
  d: boolean;
}) {
  const tag    = TAG_STYLE[project.accent];
  const isWide = project.span === 2;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, type: "spring", stiffness: 260, damping: 26 }}
      className={project.span === 2 ? "col-span-3 sm:col-span-2" : "col-span-3 sm:col-span-1"}
    >
      <Link href={project.href} className="group block h-full">
        <motion.div
          whileHover={{
            y: -4,
            boxShadow: `0 20px 60px -10px ${GLOW[project.accent]}`,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          className={`
            relative h-full rounded-2xl overflow-hidden
            border flex flex-col
            transition-colors duration-200
            ${d
              ? "bg-zinc-900/80 border-zinc-800 hover:border-zinc-700"
              : "bg-white border-zinc-200 hover:border-zinc-300 shadow-sm hover:shadow-md"
            }
          `}
        >
          {/* Colored top accent bar */}
          <div className={`h-[3px] w-full flex-shrink-0 ${TOP_BAR[project.accent]}`} />

          <div className={`flex flex-col flex-1 p-6 gap-4 ${isWide ? "sm:flex-row sm:items-start sm:gap-8" : ""}`}>
            {/* Left col (wide cards): emoji + stat */}
            <div className={`flex-shrink-0 ${isWide ? "sm:w-28 flex flex-col items-start gap-3" : ""}`}>
              <span className={`leading-none select-none ${isWide ? "text-6xl sm:text-7xl" : "text-5xl"}`}>
                {project.emoji}
              </span>

              {/* Stat badge */}
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wide ${STAT_COLOR[project.accent]}`}>
                <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${TOP_BAR[project.accent]}`} />
                  <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${TOP_BAR[project.accent]}`} />
                </span>
                {project.stat}
              </span>
            </div>

            {/* Right col: title + desc + tags + arrow */}
            <div className="flex flex-col flex-1 gap-3 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <h2 className={`font-bold tracking-tight leading-snug ${isWide ? "text-xl sm:text-2xl" : "text-xl"} ${d ? "text-white" : "text-zinc-900"}`}>
                  {project.name}
                </h2>
                {/* Arrow */}
                <span className={`flex-shrink-0 text-xl mt-0.5 transition-transform duration-200 group-hover:translate-x-1 ${d ? "text-zinc-600" : "text-zinc-300"}`}>
                  →
                </span>
              </div>

              <p className={`text-sm leading-relaxed flex-1 ${d ? "text-zinc-400" : "text-zinc-500"}`}>
                {project.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mt-auto pt-1">
                {project.tags.map((tag_label) => (
                  <span
                    key={tag_label}
                    className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${d ? tag.d : tag.l}`}
                  >
                    {tag_label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ProjectsPage() {
  const { theme } = useTheme();
  const d = theme === "dark";

  return (
    <div className={`min-h-screen flex flex-col ${d ? "bg-zinc-950" : "bg-zinc-50"}`}>
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-12 sm:py-16 max-w-5xl mx-auto w-full">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 26 }}
          className="mb-10 sm:mb-14"
        >
          <p className={`text-[11px] font-bold tracking-widest uppercase mb-3 ${d ? "text-zinc-600" : "text-zinc-400"}`}>
            extractai · workspace
          </p>
          <h1 className={`text-4xl sm:text-5xl font-bold tracking-tight mb-3 ${d ? "text-white" : "text-zinc-900"}`}>
            Projects
          </h1>
          <p className={`text-base ${d ? "text-zinc-500" : "text-zinc-500"}`}>
            {PROJECTS.length} active · built by Kyle & Andy 🐾
          </p>
        </motion.div>

        {/* ── Bento grid ── */}
        <div className="grid grid-cols-3 gap-4 sm:gap-5">
          {PROJECTS.map((project, i) => (
            <ProjectCard key={project.href} project={project} index={i} d={d} />
          ))}
        </div>

        {/* ── Footer ── */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className={`mt-14 text-center text-xs ${d ? "text-zinc-700" : "text-zinc-400"}`}
        >
          Built with Next.js, Tailwind & Convex · More coming soon
        </motion.p>
      </main>
    </div>
  );
}

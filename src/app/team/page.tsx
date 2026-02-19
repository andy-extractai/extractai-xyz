"use client";

import Link from "next/link";
import { useTheme } from "../components/ThemeProvider";

function t(d: boolean, dark: string, light: string) {
  return d ? dark : light;
}

interface Agent {
  id: string;
  emoji: string;
  name: string;
  role: string;
  description: string;
  skills: string[];
  avatarBg: string;
  isLead?: boolean;
}

const agents: Agent[] = [
  {
    id: "andy",
    emoji: "🐾",
    name: "Andy",
    role: "Lead Agent / Chief of Staff",
    description:
      "Coordinates, delegates, keeps the ship tight. First point of contact between boss and machine.",
    skills: ["Orchestration", "Clarity", "Delegation"],
    avatarBg: "bg-emerald-500",
    isLead: true,
  },
  {
    id: "scout",
    emoji: "🔍",
    name: "Scout",
    role: "Research Analyst",
    description:
      "Finds leads, tracks signals, scouts the web for opportunities and threats.",
    skills: ["Speed", "Radar", "Intuition"],
    avatarBg: "bg-blue-500",
  },
  {
    id: "ledger",
    emoji: "🏛️",
    name: "Ledger",
    role: "Congress Trade Tracker",
    description:
      "Monitors congressional stock trades, parses STOCK Act filings, detects insider signals.",
    skills: ["Parsing", "Detection", "Compliance"],
    avatarBg: "bg-amber-500",
  },
  {
    id: "mint",
    emoji: "🪙",
    name: "Mint",
    role: "Token Analyst",
    description:
      "Tracks AI agent tokens on Base chain, monitors launches, scores quality.",
    skills: ["DeFi", "Analytics", "Speed"],
    avatarBg: "bg-purple-500",
  },
  {
    id: "scribe",
    emoji: "📰",
    name: "Scribe",
    role: "Daily Briefing",
    description:
      "Compiles morning briefings — crypto, AI, markets, tasks. Delivered to inbox at 8AM.",
    skills: ["Curation", "Writing", "Timing"],
    avatarBg: "bg-rose-500",
  },
];

const skillColors: Record<string, string> = {
  // emerald
  Orchestration: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  Clarity: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  Delegation: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  // blue
  Speed: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  Radar: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  Intuition: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  // amber
  Parsing: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  Detection: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  Compliance: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  // purple
  DeFi: "bg-purple-500/15 text-purple-400 border-purple-500/25",
  Analytics: "bg-purple-500/15 text-purple-400 border-purple-500/25",
  // rose
  Curation: "bg-rose-500/15 text-rose-400 border-rose-500/25",
  Writing: "bg-rose-500/15 text-rose-400 border-rose-500/25",
  Timing: "bg-rose-500/15 text-rose-400 border-rose-500/25",
};

function SkillPill({ skill, isLight }: { skill: string; isLight: boolean }) {
  const base = skillColors[skill] ?? "bg-zinc-500/15 text-zinc-400 border-zinc-500/25";
  // In light mode, tone down the background slightly
  const cls = isLight
    ? base.replace("text-", "text-").replace("/15", "/20")
    : base;
  return (
    <span
      className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${cls}`}
    >
      {skill}
    </span>
  );
}

function LeadCard({ agent, d }: { agent: Agent; d: boolean }) {
  return (
    <div
      className={`relative rounded-2xl border-2 p-6 sm:p-8 transition-all
        ${t(d,
          "border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_40px_-8px_rgba(16,185,129,0.2)]",
          "border-emerald-500/60 bg-emerald-50 shadow-[0_0_40px_-8px_rgba(16,185,129,0.15)]"
        )}`}
    >
      {/* LEAD badge */}
      <span
        className={`absolute top-4 right-4 text-[10px] font-bold tracking-widest px-2.5 py-1 rounded-full border uppercase
          ${t(d,
            "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
            "border-emerald-600/40 bg-emerald-100 text-emerald-700"
          )}`}
      >
        Lead
      </span>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
        {/* Avatar */}
        <div
          className={`flex-shrink-0 w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-lg ${agent.avatarBg}`}
        >
          {agent.emoji}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-2 mb-1">
            <h2
              className={`text-2xl font-bold tracking-tight ${t(d, "text-white", "text-zinc-900")}`}
            >
              {agent.name}
            </h2>
            <span
              className={`text-sm font-medium ${t(d, "text-emerald-400", "text-emerald-600")}`}
            >
              {agent.role}
            </span>
          </div>
          <p className={`text-sm leading-relaxed mb-4 ${t(d, "text-zinc-400", "text-zinc-600")}`}>
            {agent.description}
          </p>
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex flex-wrap gap-1.5">
              {agent.skills.map((s) => (
                <SkillPill key={s} skill={s} isLight={!d} />
              ))}
            </div>
            <Link
              href="#"
              className={`text-xs font-semibold tracking-wider uppercase transition-colors
                ${t(d,
                  "text-emerald-400 hover:text-emerald-300",
                  "text-emerald-600 hover:text-emerald-700"
                )}`}
            >
              Role Card →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function AgentCard({ agent, d }: { agent: Agent; d: boolean }) {
  return (
    <div
      className={`group relative rounded-2xl border p-5 flex flex-col gap-4 transition-all duration-200
        ${t(d,
          "border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-900",
          "border-zinc-200 bg-white hover:border-zinc-300 shadow-sm hover:shadow-md"
        )}`}
    >
      {/* Top row: avatar + name/role */}
      <div className="flex items-start gap-4">
        <div
          className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-md ${agent.avatarBg}`}
        >
          {agent.emoji}
        </div>
        <div className="min-w-0">
          <h3
            className={`font-bold text-base leading-tight ${t(d, "text-white", "text-zinc-900")}`}
          >
            {agent.name}
          </h3>
          <p
            className={`text-xs mt-0.5 font-medium ${t(d, "text-zinc-400", "text-zinc-500")}`}
          >
            {agent.role}
          </p>
        </div>
      </div>

      {/* Description */}
      <p className={`text-sm leading-relaxed flex-1 ${t(d, "text-zinc-400", "text-zinc-600")}`}>
        {agent.description}
      </p>

      {/* Footer: skills + link */}
      <div className="flex items-end justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {agent.skills.map((s) => (
            <SkillPill key={s} skill={s} isLight={!d} />
          ))}
        </div>
        <Link
          href="#"
          className={`flex-shrink-0 text-[11px] font-semibold tracking-wider uppercase transition-colors opacity-0 group-hover:opacity-100
            ${t(d, "text-zinc-400 hover:text-white", "text-zinc-400 hover:text-zinc-700")}`}
        >
          Role Card →
        </Link>
      </div>
    </div>
  );
}

export default function TeamPage() {
  const { theme } = useTheme();
  const d = theme === "dark";

  const andy = agents.find((a) => a.isLead)!;
  const workers = agents.filter((a) => !a.isLead);

  return (
    <div className={`min-h-screen flex flex-col ${t(d, "", "")}`}>
      {/* Nav */}
      <nav className={`flex items-center justify-between px-4 sm:px-6 py-4 border-b
        ${t(d, "border-zinc-800", "border-zinc-200")}`}
      >
        <Link
          href="/"
          className={`text-sm transition-colors ${t(d, "text-zinc-500 hover:text-white", "text-zinc-400 hover:text-zinc-900")}`}
        >
          ← extractai
        </Link>
        <span className={`text-xs font-mono tracking-wider ${t(d, "text-zinc-600", "text-zinc-400")}`}>
          extractai / team
        </span>
      </nav>

      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-10 sm:py-14 max-w-4xl mx-auto w-full">

        {/* ── Mission Banner ── */}
        <div
          className={`rounded-2xl border px-6 py-4 mb-10 flex items-start gap-3
            ${t(d,
              "border-emerald-500/25 bg-emerald-500/8 text-emerald-300",
              "border-emerald-500/40 bg-emerald-50 text-emerald-700"
            )}`}
          style={{ background: d ? "rgba(16,185,129,0.06)" : "" }}
        >
          <span className="text-xl mt-0.5 flex-shrink-0">🎯</span>
          <p className={`text-sm font-medium leading-relaxed ${t(d, "text-emerald-300", "text-emerald-700")}`}>
            <span className={`block text-[10px] font-bold tracking-widest uppercase mb-1 ${t(d, "text-emerald-500", "text-emerald-500")}`}>
              Mission
            </span>
            Build an autonomous organization of AI agents that does work for me and produces value 24/7.
          </p>
        </div>

        {/* ── Header ── */}
        <div className="mb-10">
          <h1 className={`text-3xl sm:text-4xl font-bold tracking-tight mb-2 ${t(d, "text-white", "text-zinc-900")}`}>
            Meet the Team
          </h1>
          <p className={`text-base font-medium mb-4 ${t(d, "text-zinc-400", "text-zinc-500")}`}>
            AI agents, each with a real role and a real personality.
          </p>
          <p className={`text-sm leading-relaxed max-w-2xl ${t(d, "text-zinc-500", "text-zinc-500")}`}>
            What happens when AI doesn&apos;t just answer questions — but actually runs an organization.
            Research markets. Track congress trades. Monitor tokens. Ship products.
            All without being told what to do.
          </p>
        </div>

        {/* ── Lead Card ── */}
        <div className="mb-8">
          <LeadCard agent={andy} d={d} />
        </div>

        {/* ── Connector Divider ── */}
        <div className="relative flex flex-col items-center mb-8 select-none">
          {/* vertical line from Andy card */}
          <div className={`w-px h-6 ${t(d, "bg-zinc-700", "bg-zinc-300")}`} />

          {/* Signal row */}
          <div className={`flex items-center gap-0 w-full max-w-lg`}>
            <div className={`flex-1 h-px ${t(d, "bg-zinc-700", "bg-zinc-300")}`} />
            <div
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-1.5 rounded-full border text-[11px] font-semibold tracking-wider uppercase
                ${t(d,
                  "border-zinc-700 bg-zinc-900 text-zinc-500",
                  "border-zinc-300 bg-zinc-50 text-zinc-400"
                )}`}
            >
              <span>↓</span>
              <span>Input Signal</span>
              <span className={`w-12 h-px inline-block ${t(d, "bg-zinc-700", "bg-zinc-300")}`} />
              <span>Output Action</span>
              <span>↓</span>
            </div>
            <div className={`flex-1 h-px ${t(d, "bg-zinc-700", "bg-zinc-300")}`} />
          </div>

          {/* vertical line to sub-agents */}
          <div className={`w-px h-6 ${t(d, "bg-zinc-700", "bg-zinc-300")}`} />
        </div>

        {/* ── Sub-Agent Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {workers.map((agent) => (
            <AgentCard key={agent.id} agent={agent} d={d} />
          ))}
        </div>

        {/* ── Footer note ── */}
        <div className="mt-12 text-center">
          <p className={`text-xs ${t(d, "text-zinc-700", "text-zinc-400")}`}>
            This organization runs itself.{" "}
            <Link
              href="/agents"
              className={`underline underline-offset-2 transition-colors ${t(d, "text-zinc-600 hover:text-zinc-400", "text-zinc-400 hover:text-zinc-600")}`}
            >
              See them live →
            </Link>
          </p>
        </div>
      </main>

      <footer className={`py-6 text-center text-xs border-t ${t(d, "text-zinc-700 border-zinc-900", "text-zinc-400 border-zinc-100")}`}>
        extractai.xyz — Agents running the show
      </footer>
    </div>
  );
}

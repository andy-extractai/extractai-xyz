"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useTheme } from "../components/ThemeProvider";

function t(d: boolean, dark: string, light: string) {
  return d ? dark : light;
}

// Visual config keyed by agent name (purely presentational — not in DB)
const AGENT_VISUAL: Record<string, { avatarBg: string; skillColor: string }> = {
  Andy:   { avatarBg: "bg-emerald-500", skillColor: "emerald" },
  Scout:  { avatarBg: "bg-blue-500",    skillColor: "blue"    },
  Dev:    { avatarBg: "bg-violet-500",  skillColor: "violet"  },
  Canvas: { avatarBg: "bg-pink-500",    skillColor: "pink"    },
  Quill:  { avatarBg: "bg-amber-500",   skillColor: "amber"   },
  Sage:   { avatarBg: "bg-teal-500",    skillColor: "teal"    },
  Ops:    { avatarBg: "bg-orange-500",  skillColor: "orange"  },
};

function skillPillClass(color: string, d: boolean) {
  const map: Record<string, string> = {
    emerald: d ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" : "bg-emerald-100 text-emerald-700 border-emerald-300/50",
    blue:    d ? "bg-blue-500/15 text-blue-400 border-blue-500/25"         : "bg-blue-100 text-blue-700 border-blue-300/50",
    violet:  d ? "bg-violet-500/15 text-violet-400 border-violet-500/25"   : "bg-violet-100 text-violet-700 border-violet-300/50",
    pink:    d ? "bg-pink-500/15 text-pink-400 border-pink-500/25"         : "bg-pink-100 text-pink-700 border-pink-300/50",
    amber:   d ? "bg-amber-500/15 text-amber-400 border-amber-500/25"      : "bg-amber-100 text-amber-700 border-amber-300/50",
    teal:    d ? "bg-teal-500/15 text-teal-400 border-teal-500/25"         : "bg-teal-100 text-teal-700 border-teal-300/50",
    orange:  d ? "bg-orange-500/15 text-orange-400 border-orange-500/25"   : "bg-orange-100 text-orange-700 border-orange-300/50",
  };
  return map[color] ?? (d ? "bg-zinc-500/15 text-zinc-400 border-zinc-500/25" : "bg-zinc-100 text-zinc-500 border-zinc-300/50");
}

function SkillPill({ skill, color, d }: { skill: string; color: string; d: boolean }) {
  return (
    <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${skillPillClass(color, d)}`}>
      {skill}
    </span>
  );
}

interface TeamMember {
  _id: string;
  name: string;
  emoji: string;
  role: string;
  description: string;
  status: string;
  skills?: string[];
  is_lead?: boolean;
}

function LeadCard({ member, d }: { member: TeamMember; d: boolean }) {
  const visual = AGENT_VISUAL[member.name] ?? { avatarBg: "bg-zinc-600", skillColor: "zinc" };
  return (
    <div className={`relative rounded-2xl border-2 p-6 sm:p-8 transition-all ${t(d,
      "border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_40px_-8px_rgba(16,185,129,0.2)]",
      "border-emerald-500/60 bg-emerald-50 shadow-[0_0_40px_-8px_rgba(16,185,129,0.15)]"
    )}`}>
      <span className={`absolute top-4 right-4 text-[10px] font-bold tracking-widest px-2.5 py-1 rounded-full border uppercase ${t(d,
        "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
        "border-emerald-600/40 bg-emerald-100 text-emerald-700"
      )}`}>Lead</span>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div className={`flex-shrink-0 w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-lg ${visual.avatarBg}`}>
          {member.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-2 mb-1">
            <h2 className={`text-2xl font-bold tracking-tight ${t(d, "text-white", "text-zinc-900")}`}>{member.name}</h2>
            <span className={`text-sm font-medium ${t(d, "text-emerald-400", "text-emerald-600")}`}>{member.role}</span>
          </div>
          <p className={`text-sm leading-relaxed mb-4 ${t(d, "text-zinc-400", "text-zinc-600")}`}>{member.description}</p>
          <div className="flex flex-wrap gap-1.5">
            {(member.skills ?? []).map((s) => (
              <SkillPill key={s} skill={s} color={visual.skillColor} d={d} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AgentCard({ member, d }: { member: TeamMember; d: boolean }) {
  const visual = AGENT_VISUAL[member.name] ?? { avatarBg: "bg-zinc-600", skillColor: "zinc" };
  return (
    <div className={`group relative rounded-2xl border p-5 flex flex-col gap-4 transition-all duration-200 ${t(d,
      "border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-900",
      "border-zinc-200 bg-white hover:border-zinc-300 shadow-sm hover:shadow-md"
    )}`}>
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-md ${visual.avatarBg}`}>
          {member.emoji}
        </div>
        <div className="min-w-0">
          <h3 className={`font-bold text-base leading-tight ${t(d, "text-white", "text-zinc-900")}`}>{member.name}</h3>
          <p className={`text-xs mt-0.5 font-medium ${t(d, "text-zinc-400", "text-zinc-500")}`}>{member.role}</p>
        </div>
      </div>
      <p className={`text-sm leading-relaxed flex-1 ${t(d, "text-zinc-400", "text-zinc-600")}`}>{member.description}</p>
      <div className="flex flex-wrap gap-1.5">
        {(member.skills ?? []).map((s) => (
          <SkillPill key={s} skill={s} color={visual.skillColor} d={d} />
        ))}
      </div>
    </div>
  );
}

export default function TeamPage() {
  const { theme } = useTheme();
  const d = theme === "dark";
  const team = useQuery(api.team.list);

  const lead = team?.find((m) => m.is_lead);
  const workers = team?.filter((m) => !m.is_lead) ?? [];

  return (
    <div className={`min-h-screen flex flex-col`}>
      <nav className={`flex items-center justify-between px-4 sm:px-6 py-4 border-b ${t(d, "border-zinc-800", "border-zinc-200")}`}>
        <Link href="/" className={`text-sm transition-colors ${t(d, "text-zinc-500 hover:text-white", "text-zinc-400 hover:text-zinc-900")}`}>
          ← extractai
        </Link>
        <span className={`text-xs font-mono tracking-wider ${t(d, "text-zinc-600", "text-zinc-400")}`}>extractai / team</span>
      </nav>

      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-10 sm:py-14 max-w-4xl mx-auto w-full">

        {/* Mission Banner */}
        <div className={`rounded-2xl border px-6 py-4 mb-10 flex items-start gap-3 ${t(d,
          "border-emerald-500/25 text-emerald-300",
          "border-emerald-500/40 bg-emerald-50 text-emerald-700"
        )}`} style={{ background: d ? "rgba(16,185,129,0.06)" : "" }}>
          <span className="text-xl mt-0.5 flex-shrink-0">🎯</span>
          <p className={`text-sm font-medium leading-relaxed ${t(d, "text-emerald-300", "text-emerald-700")}`}>
            <span className={`block text-[10px] font-bold tracking-widest uppercase mb-1 ${t(d, "text-emerald-500", "text-emerald-500")}`}>Mission</span>
            Build an autonomous organization of AI agents that does work for me and produces value 24/7.
          </p>
        </div>

        {/* Header */}
        <div className="mb-10">
          <h1 className={`text-3xl sm:text-4xl font-bold tracking-tight mb-2 ${t(d, "text-white", "text-zinc-900")}`}>Meet the Team</h1>
          <p className={`text-base font-medium mb-4 ${t(d, "text-zinc-400", "text-zinc-500")}`}>AI agents, each with a real role and a real personality.</p>
          <p className={`text-sm leading-relaxed max-w-2xl ${t(d, "text-zinc-500", "text-zinc-500")}`}>
            What happens when AI doesn&apos;t just answer questions — but actually runs an organization.
            Research markets. Track congress trades. Monitor tokens. Ship products. All without being told what to do.
          </p>
        </div>

        {/* Loading */}
        {team === undefined && (
          <div className={`text-sm text-center py-20 animate-pulse ${t(d, "text-zinc-600", "text-zinc-400")}`}>Loading team…</div>
        )}

        {/* Lead Card */}
        {lead && (
          <div className="mb-8">
            <LeadCard member={lead as TeamMember} d={d} />
          </div>
        )}

        {/* Connector */}
        {workers.length > 0 && (
          <div className="relative flex flex-col items-center mb-8 select-none">
            <div className={`w-px h-6 ${t(d, "bg-zinc-700", "bg-zinc-300")}`} />
            <div className="flex items-center gap-0 w-full max-w-lg">
              <div className={`flex-1 h-px ${t(d, "bg-zinc-700", "bg-zinc-300")}`} />
              <div className={`flex-shrink-0 flex items-center gap-2 px-4 py-1.5 rounded-full border text-[11px] font-semibold tracking-wider uppercase ${t(d,
                "border-zinc-700 bg-zinc-900 text-zinc-500",
                "border-zinc-300 bg-zinc-50 text-zinc-400"
              )}`}>
                <span>↓</span><span>Input Signal</span>
                <span className={`w-12 h-px inline-block ${t(d, "bg-zinc-700", "bg-zinc-300")}`} />
                <span>Output Action</span><span>↓</span>
              </div>
              <div className={`flex-1 h-px ${t(d, "bg-zinc-700", "bg-zinc-300")}`} />
            </div>
            <div className={`w-px h-6 ${t(d, "bg-zinc-700", "bg-zinc-300")}`} />
          </div>
        )}

        {/* Sub-Agent Grid */}
        {workers.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {workers.map((member) => (
              <AgentCard key={member._id} member={member as TeamMember} d={d} />
            ))}
          </div>
        )}

        {/* Footer note */}
        <div className="mt-12 text-center">
          <p className={`text-xs ${t(d, "text-zinc-700", "text-zinc-400")}`}>
            This organization runs itself.{" "}
            <Link href="/agents" className={`underline underline-offset-2 transition-colors ${t(d, "text-zinc-600 hover:text-zinc-400", "text-zinc-400 hover:text-zinc-600")}`}>
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

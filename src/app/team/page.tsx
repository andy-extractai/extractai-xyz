"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useTheme } from "../components/ThemeProvider";

function t(d: boolean, dark: string, light: string) {
  return d ? dark : light;
}

// Desk colour palette per agent
const DESK_CONFIG: Record<string, { accent: string; monitorBg: string; deskBg: string; deskBgL: string }> = {
  Andy:   { accent: "emerald", monitorBg: "#052e16", deskBg: "#18392b", deskBgL: "#d1fae5" },
  Scout:  { accent: "blue",    monitorBg: "#0c1a2e", deskBg: "#1e3a5f", deskBgL: "#dbeafe" },
  Dev:    { accent: "violet",  monitorBg: "#1e1040", deskBg: "#2d1b69", deskBgL: "#ede9fe" },
  Canvas: { accent: "pink",    monitorBg: "#2d0a1a", deskBg: "#5b1a33", deskBgL: "#fce7f3" },
  Quill:  { accent: "amber",   monitorBg: "#1c1400", deskBg: "#3d2e00", deskBgL: "#fef3c7" },
  Sage:   { accent: "teal",    monitorBg: "#002b2b", deskBg: "#0f3737", deskBgL: "#ccfbf1" },
  Ops:    { accent: "orange",  monitorBg: "#1f0d00", deskBg: "#3d1f00", deskBgL: "#ffedd5" },
};

const ACCENT_COLORS: Record<string, { border: string; text: string; bg: string; glow: string }> = {
  emerald: { border: "border-emerald-500/60", text: "text-emerald-400",  bg: "bg-emerald-500/10", glow: "rgba(16,185,129,0.5)"  },
  blue:    { border: "border-blue-500/60",    text: "text-blue-400",     bg: "bg-blue-500/10",    glow: "rgba(59,130,246,0.5)"   },
  violet:  { border: "border-violet-500/60",  text: "text-violet-400",   bg: "bg-violet-500/10",  glow: "rgba(139,92,246,0.5)"  },
  pink:    { border: "border-pink-500/60",    text: "text-pink-400",     bg: "bg-pink-500/10",    glow: "rgba(236,72,153,0.5)"  },
  amber:   { border: "border-amber-500/60",   text: "text-amber-400",    bg: "bg-amber-500/10",   glow: "rgba(245,158,11,0.5)"  },
  teal:    { border: "border-teal-500/60",    text: "text-teal-400",     bg: "bg-teal-500/10",    glow: "rgba(20,184,166,0.5)"  },
  orange:  { border: "border-orange-500/60",  text: "text-orange-400",   bg: "bg-orange-500/10",  glow: "rgba(249,115,22,0.5)"  },
};

interface TeamMember {
  _id: string;
  name: string;
  emoji: string;
  role: string;
  description: string;
  status: string; // derived: "active" | "standby"
  currentTask: string | null; // derived from in_progress tasks
  activeTaskCount: number;
  skills?: string[];
  is_lead?: boolean;
}

function SleepingZzz({ accent }: { accent: string }) {
  const cls = ACCENT_COLORS[accent]?.text ?? "text-zinc-400";
  return (
    <div className="relative flex items-end justify-center h-8 w-10 select-none pointer-events-none">
      <span className={`absolute text-[11px] font-bold zzz-1 ${cls}`} style={{ left: 2, bottom: 0 }}>z</span>
      <span className={`absolute text-[13px] font-bold zzz-2 ${cls}`} style={{ left: 6, bottom: 2 }}>z</span>
      <span className={`absolute text-[15px] font-bold zzz-3 ${cls}`} style={{ left: 10, bottom: 4 }}>z</span>
    </div>
  );
}

function Monitor({ active, accent, d }: { active: boolean; accent: string; d: boolean }) {
  const glow = ACCENT_COLORS[accent]?.glow ?? "rgba(16,185,129,0.4)";
  return (
    <div className="flex flex-col items-center gap-0.5">
      {/* Screen */}
      <div
        className={`rounded-sm border-2 flex items-center justify-center transition-all ${
          active ? "border-emerald-400/80 screen-active" : t(d, "border-zinc-700", "border-zinc-300")
        }`}
        style={{
          width: 44,
          height: 30,
          background: active ? `linear-gradient(135deg, #0a1a0a 0%, #0d2e1a 100%)` : (d ? "#0c0c0f" : "#e4e4e7"),
          boxShadow: active ? `0 0 10px 3px ${glow}` : "none",
        }}
      >
        {active ? (
          <span className="text-[9px] font-mono text-emerald-400 leading-none">▮▮▮</span>
        ) : (
          <span className="text-[9px] text-zinc-600 leading-none">—</span>
        )}
      </div>
      {/* Stand */}
      <div className={`w-4 h-1.5 rounded-b-sm ${t(d, "bg-zinc-700", "bg-zinc-300")}`} />
      <div className={`w-7 h-0.5 rounded-sm ${t(d, "bg-zinc-600", "bg-zinc-400")}`} />
    </div>
  );
}

function DeskCard({ member, d, isLead = false }: { member: TeamMember; d: boolean; isLead?: boolean }) {
  const cfg = DESK_CONFIG[member.name] ?? DESK_CONFIG.Andy;
  const accentCls = ACCENT_COLORS[cfg.accent] ?? ACCENT_COLORS.emerald;
  const isActive = member.status === "active";
  const isSleeping = member.status === "standby" || member.status === "inactive";

  const cardW = isLead ? "w-48" : "w-40";
  const emojiSize = isLead ? "text-5xl" : "text-4xl";

  return (
    <div
      className={`
        relative flex flex-col rounded-xl border-2 overflow-hidden transition-all duration-300 select-none
        ${cardW}
        ${isLead ? "shadow-[0_0_30px_-4px_rgba(16,185,129,0.25)]" : ""}
        ${isActive ? accentCls.border : t(d, "border-zinc-800/80", "border-zinc-200")}
      `}
      style={{ background: d ? "#18181b" : "#fff" }}
    >
      {/* Lead badge */}
      {isLead && (
        <div className="absolute top-2 right-2 z-10">
          <span className={`text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded-full border ${accentCls.border} ${accentCls.bg} ${accentCls.text}`}>
            Lead
          </span>
        </div>
      )}

      {/* Desk surface */}
      <div
        className="flex flex-col items-center justify-center gap-3 px-3 py-4"
        style={{
          background: d ? cfg.deskBg + "33" : cfg.deskBgL + "88",
          minHeight: isLead ? 148 : 128,
        }}
      >
        {/* Monitor */}
        <Monitor active={isActive} accent={cfg.accent} d={d} />

        {/* Agent */}
        <div className="relative flex flex-col items-center">
          <span className={`leading-none ${emojiSize} ${isActive ? "agent-working" : ""}`}>
            {member.emoji}
          </span>
          {isSleeping && (
            <div className="absolute -top-2 -right-3">
              <SleepingZzz accent={cfg.accent} />
            </div>
          )}
        </div>

        {/* Activity line — shows actual task title when active */}
        <div className="h-5 flex items-center">
          {isActive ? (
            <span className={`text-[10px] font-medium ${accentCls.text} text-center leading-tight line-clamp-2 max-w-[120px]`}>
              {member.currentTask ?? member.role}
            </span>
          ) : (
            <span className={`text-[10px] ${t(d, "text-zinc-600", "text-zinc-400")} italic`}>
              off duty
            </span>
          )}
        </div>
      </div>

      {/* Desk front edge */}
      <div
        className={`px-3 py-2.5 border-t ${t(d, "border-zinc-800", "border-zinc-200")}`}
        style={{ background: d ? "#141416" : "#f4f4f5" }}
      >
        <div className={`font-bold text-sm leading-tight ${t(d, "text-white", "text-zinc-900")}`}>
          {member.name}
        </div>
        <div className={`text-[10px] mt-0.5 flex items-center gap-1.5`}>
          <span
            className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${
              isActive ? "bg-emerald-400 animate-pulse" : t(d, "bg-zinc-600", "bg-zinc-400")
            }`}
          />
          <span className={isActive ? accentCls.text : t(d, "text-zinc-500", "text-zinc-500")}>
            {isActive ? `${member.activeTaskCount} task${member.activeTaskCount !== 1 ? "s" : ""}` : "idle"}
          </span>
          <span className={`mx-0.5 ${t(d, "text-zinc-700", "text-zinc-300")}`}>·</span>
          <span className={t(d, "text-zinc-600", "text-zinc-400")}>{member.role}</span>
        </div>
      </div>
    </div>
  );
}

export default function TeamPage() {
  const { theme } = useTheme();
  const d = theme === "dark";
  const team = useQuery(api.team.listWithTaskStatus);

  const lead = team?.find((m) => m.is_lead);
  const workers = team?.filter((m) => !m.is_lead) ?? [];

  const activeCount = team?.filter((m) => m.status === "active").length ?? 0;

  // Office floor tile pattern
  const floorStyle = d
    ? {
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
        backgroundColor: "#09090b",
      }
    : {
        backgroundImage:
          "linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
        backgroundColor: "#f4f4f5",
      };

  return (
    <div className="min-h-screen flex flex-col" style={floorStyle}>
      {/* Office header */}
      <div className={`border-b px-6 py-4 flex items-center justify-between ${t(d, "border-zinc-800/80 bg-zinc-950/60", "border-zinc-200 bg-white/60")} backdrop-blur-sm`}>
        <div>
          <h1 className={`text-lg font-bold tracking-tight ${t(d, "text-white", "text-zinc-900")}`}>
            🏢 The Office
          </h1>
          <p className={`text-xs mt-0.5 ${t(d, "text-zinc-500", "text-zinc-500")}`}>
            extractai.xyz HQ · {team?.length ?? "—"} agents
          </p>
        </div>
        <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border ${
          activeCount > 0
            ? t(d, "border-emerald-500/40 bg-emerald-500/10 text-emerald-400", "border-emerald-500/40 bg-emerald-50 text-emerald-700")
            : t(d, "border-zinc-800 bg-zinc-900/50 text-zinc-500", "border-zinc-200 bg-zinc-50 text-zinc-500")
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${activeCount > 0 ? "bg-emerald-400" : t(d, "bg-zinc-600", "bg-zinc-400")}`} />
          {activeCount > 0 ? `${activeCount} active` : "all idle"}
        </div>
      </div>

      {/* Floor */}
      <div className="flex-1 p-8 md:p-12">
        {team === undefined ? (
          <div className={`text-sm text-center py-20 animate-pulse ${t(d, "text-zinc-600", "text-zinc-400")}`}>
            Loading office…
          </div>
        ) : (
          <div className="flex flex-col items-center gap-10">

            {/* Corner office — Lead */}
            {lead && (
              <div className="flex flex-col items-center gap-3">
                <div className={`text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full border ${t(d, "border-zinc-800 text-zinc-600", "border-zinc-200 text-zinc-400")}`}>
                  Corner Office
                </div>
                <DeskCard member={lead as TeamMember} d={d} isLead />
              </div>
            )}

            {/* Divider */}
            {workers.length > 0 && (
              <div className="flex items-center gap-4 w-full max-w-xl">
                <div className={`flex-1 h-px ${t(d, "bg-zinc-800", "bg-zinc-300")}`} />
                <span className={`text-[10px] tracking-widest uppercase font-medium ${t(d, "text-zinc-700", "text-zinc-400")}`}>
                  Open floor
                </span>
                <div className={`flex-1 h-px ${t(d, "bg-zinc-800", "bg-zinc-300")}`} />
              </div>
            )}

            {/* Open floor — grid of desks */}
            {workers.length > 0 && (
              <div className="flex flex-wrap justify-center gap-6">
                {workers.map((member) => (
                  <DeskCard key={member._id} member={member as TeamMember} d={d} />
                ))}
              </div>
            )}

            {/* Floor sign */}
            <div className={`mt-4 text-center text-[11px] ${t(d, "text-zinc-800", "text-zinc-300")}`}>
              🎯 Mission: Build an autonomous org of AI agents that produces value 24/7
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

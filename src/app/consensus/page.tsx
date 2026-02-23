"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useTheme } from "../components/ThemeProvider";
import { motion, AnimatePresence } from "framer-motion";

function t(d: boolean, dark: string, light: string) {
  return d ? dark : light;
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface Signal {
  _id: string;
  topicId: string;
  topicName: string;
  timestamp: string;
  socialScore: number;
  socialSummary: string;
  newsScore: number;
  newsSummary: string;
  momentumScore: number;
  momentumSummary: string;
  consensusScore: number;
  direction: string;
  strength: string;
  explanation: string;
}

interface Topic {
  _id: string;
  name: string;
  description?: string;
  status: string;
  addedAt: string;
}

interface TopicWithSignal { topic: Topic; latest: Signal | null }

// ── Sage's algorithm helpers ──────────────────────────────────────────────────
function directionColor(direction: string): { bg: string; text: string; glow: string; bar: string } {
  switch (direction) {
    case "bullish":  return { bg: "bg-emerald-500/10", text: "text-emerald-400", glow: "rgba(16,185,129,0.4)", bar: "bg-emerald-500" };
    case "bearish":  return { bg: "bg-red-500/10",     text: "text-red-400",     glow: "rgba(239,68,68,0.4)",  bar: "bg-red-500"     };
    case "mixed":    return { bg: "bg-amber-500/10",   text: "text-amber-400",   glow: "rgba(245,158,11,0.4)", bar: "bg-amber-500"   };
    default:         return { bg: "bg-zinc-700/20",    text: "text-zinc-400",    glow: "rgba(113,113,122,0.3)",bar: "bg-zinc-500"    };
  }
}

function strengthLabel(strength: string, score: number): string {
  if (strength === "strong")   return `Strong · ${score}`;
  if (strength === "moderate") return `Moderate · ${score}`;
  return `Weak · ${score}`;
}

// ── SVG Gauge (Canvas) ────────────────────────────────────────────────────────
function ConsensusGauge({ score, direction, d }: { score: number; direction: string; d: boolean }) {
  const R = 80;
  const cx = 100;
  const cy = 100;
  const stroke = 18;

  // Gauge is a semicircle from 180° to 0° (left → right)
  // Map direction + score to needle position
  // Center = 90° (pointing up), bullish goes right (+), bearish goes left (-)
  const rawPct = score / 100; // 0–1 strength
  const angleFromCenter =
    direction === "bullish" ? rawPct * 90
    : direction === "bearish" ? -rawPct * 90
    : direction === "mixed" ? (rawPct * 20) // slight wobble
    : 0;

  // Convert to SVG degrees (0° = 3 o'clock)
  // Gauge center is at 270° (top, 12 o'clock), which is -90° in math
  const needleAngleDeg = 90 + angleFromCenter; // SVG: 180=left, 90=center, 0=right
  const needleRad = (needleAngleDeg * Math.PI) / 180;
  const needleX = cx + (R - 8) * Math.cos(Math.PI - needleRad);
  const needleY = cy - (R - 8) * Math.sin(Math.PI - needleRad);

  // Arc path for background track (left half to right half = 180°)
  function arcPath(startDeg: number, endDeg: number, radius: number): string {
    const s = ((180 - startDeg) * Math.PI) / 180;
    const e = ((180 - endDeg) * Math.PI) / 180;
    const x1 = cx + radius * Math.cos(s);
    const y1 = cy - radius * Math.sin(s);
    const x2 = cx + radius * Math.cos(e);
    const y2 = cy - radius * Math.sin(e);
    return `M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`;
  }

  const colors = directionColor(direction);
  const trackColor   = d ? "#27272a" : "#e4e4e7";
  const fillColorMap: Record<string, string> = {
    bullish: "#10b981", bearish: "#ef4444", mixed: "#f59e0b", neutral: "#71717a",
  };
  const fillColor = fillColorMap[direction] ?? "#71717a";

  // Fill arc: from center (90°) outward based on direction
  const fillStart = direction === "bearish" ? 90 - angleFromCenter : 90;
  const fillEnd   = direction === "bearish" ? 90 : 90 + angleFromCenter;

  return (
    <div className="flex flex-col items-center">
      <svg width="200" height="115" viewBox="0 0 200 115">
        {/* Track */}
        <path d={arcPath(0, 180, R)} fill="none" stroke={trackColor} strokeWidth={stroke} strokeLinecap="round" />
        {/* Labels */}
        <text x="14" y="108" fontSize="9" fill={d ? "#52525b" : "#a1a1aa"} textAnchor="middle">BEAR</text>
        <text x="100" y="22"  fontSize="9" fill={d ? "#52525b" : "#a1a1aa"} textAnchor="middle">NEUTRAL</text>
        <text x="186" y="108" fontSize="9" fill={d ? "#52525b" : "#a1a1aa"} textAnchor="middle">BULL</text>

        {/* Fill arc */}
        {score > 2 && (
          <motion.path
            d={arcPath(Math.min(fillStart, fillEnd), Math.max(fillStart, fillEnd), R)}
            fill="none"
            stroke={fillColor}
            strokeWidth={stroke}
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
          />
        )}

        {/* Center dot */}
        <circle cx={cx} cy={cy} r="3" fill={d ? "#3f3f46" : "#d4d4d8"} />

        {/* Needle */}
        <motion.line
          x1={cx} y1={cy}
          x2={needleX} y2={needleY}
          stroke={fillColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={{ rotate: 0 }}
          animate={{ rotate: 0 }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
        />
        {/* Needle hub */}
        <circle cx={cx} cy={cy} r="5" fill={fillColor} opacity={0.9} />

        {/* Glow under needle tip */}
        <circle cx={needleX} cy={needleY} r="4" fill={fillColor} opacity={0.3} />
      </svg>

      {/* Score number */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="text-center -mt-2"
      >
        <span className={`text-4xl font-black tabular-nums ${colors.text}`}>{score}</span>
        <span className={`text-sm font-medium ml-1 ${t(d, "text-zinc-600", "text-zinc-400")}`}>/100</span>
        <div className={`text-[10px] font-bold tracking-widest uppercase mt-1 ${colors.text}`}>
          {direction} · {strengthLabel("", 0).split(" · ")[0]}
        </div>
      </motion.div>
    </div>
  );
}

// ── Source card (Canvas) ──────────────────────────────────────────────────────
const SOURCE_META = {
  social:   { label: "Social Sentiment", icon: "𝕏", desc: "X/Twitter discourse" },
  news:     { label: "News Coverage",    icon: "📰", desc: "Media narrative"     },
  momentum: { label: "Momentum",         icon: "📈", desc: "Price & volume trend" },
};

function SourceCard({
  type, score, summary, d, index,
}: { type: "social" | "news" | "momentum"; score: number; summary: string; d: boolean; index: number }) {
  const meta = SOURCE_META[type];
  const pct = ((score + 100) / 200) * 100; // -100..100 → 0..100
  const barColor = score >= 20 ? "bg-emerald-500" : score <= -20 ? "bg-red-500" : "bg-amber-500";
  const scoreLabel = score >= 20 ? "bullish" : score <= -20 ? "bearish" : "neutral";
  const scoreColor = score >= 20 ? "text-emerald-400" : score <= -20 ? "text-red-400" : "text-amber-400";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * index + 0.6, type: "spring", stiffness: 260, damping: 24 }}
      className={`rounded-xl border p-4 flex flex-col gap-3 ${t(
        d, "bg-zinc-900/50 border-zinc-800", "bg-white border-zinc-200 shadow-sm"
      )}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base leading-none">{meta.icon}</span>
          <div>
            <div className={`text-xs font-bold ${t(d, "text-white", "text-zinc-900")}`}>{meta.label}</div>
            <div className={`text-[10px] ${t(d, "text-zinc-600", "text-zinc-400")}`}>{meta.desc}</div>
          </div>
        </div>
        <span className={`text-xs font-bold uppercase tracking-wide ${scoreColor}`}>{scoreLabel}</span>
      </div>

      {/* Score bar — centered, -100..+100 */}
      <div className={`relative h-1.5 rounded-full overflow-hidden ${t(d, "bg-zinc-800", "bg-zinc-100")}`}>
        {/* Center line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-zinc-600/50" />
        {/* Fill */}
        <motion.div
          className={`absolute top-0 bottom-0 ${barColor}`}
          style={{ left: score >= 0 ? "50%" : `${pct}%`, width: "0%" }}
          animate={{ width: `${Math.abs(score) / 2}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 * index + 0.7 }}
        />
      </div>

      <p className={`text-[11px] leading-relaxed ${t(d, "text-zinc-400", "text-zinc-600")}`}>
        {summary || "No data yet."}
      </p>
    </motion.div>
  );
}

// ── Topic pill (sidebar) ──────────────────────────────────────────────────────
function TopicPill({
  item, active, onClick, d,
}: { item: TopicWithSignal; active: boolean; onClick: () => void; d: boolean }) {
  const dir = item.latest?.direction ?? "neutral";
  const score = item.latest?.consensusScore ?? 0;
  const colors = directionColor(dir);
  const dotColor = dir === "bullish" ? "bg-emerald-400" : dir === "bearish" ? "bg-red-400" : dir === "mixed" ? "bg-amber-400" : t(d, "bg-zinc-600", "bg-zinc-400");

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 transition-all ${
        active
          ? t(d, "bg-zinc-800 text-white", "bg-indigo-50 text-indigo-900")
          : t(d, "text-zinc-400 hover:text-white hover:bg-zinc-800/50", "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100")
      }`}
    >
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${item.latest ? dotColor : t(d, "bg-zinc-700", "bg-zinc-300")}`} />
      <span className="text-sm font-medium flex-1 truncate">{item.topic.name}</span>
      {item.latest && (
        <span className={`text-[10px] font-bold tabular-nums ${colors.text}`}>{score}</span>
      )}
    </button>
  );
}

// ── Add topic form ────────────────────────────────────────────────────────────
function AddTopicForm({ d, onAdd }: { d: boolean; onAdd: (name: string) => Promise<void> }) {
  const [val, setVal] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!val.trim()) return;
    setLoading(true);
    try {
      await onAdd(val.trim());
      setVal("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex gap-1.5 px-2 pt-2 pb-1">
      <input
        type="text"
        placeholder="Add topic…"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        className={`flex-1 text-xs rounded-md border px-2 py-1.5 outline-none transition ${t(
          d,
          "bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-indigo-500",
          "bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-400"
        )}`}
      />
      <button
        type="submit"
        disabled={loading || !val.trim()}
        className={`text-xs px-2.5 py-1.5 rounded-md font-bold transition ${
          val.trim() && !loading
            ? "bg-indigo-500 hover:bg-indigo-600 text-white"
            : t(d, "bg-zinc-800 text-zinc-600 cursor-not-allowed", "bg-zinc-200 text-zinc-400 cursor-not-allowed")
        }`}
      >
        +
      </button>
    </form>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ConsensusPage() {
  const { theme } = useTheme();
  const d = theme === "dark";
  const data = useQuery(api.signals.latestAll) as TopicWithSignal[] | undefined;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const selected = data?.find((r) => r.topic._id === selectedId) ?? data?.[0] ?? null;

  async function handleAdd(name: string) {
    setAdding(true);
    try {
      const res = await fetch("https://fearless-gazelle-923.convex.site/consensus/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const body = await res.json() as { id: string };
      setSelectedId(body.id);
    } finally {
      setAdding(false);
    }
  }

  const sig = selected?.latest;
  const colors = directionColor(sig?.direction ?? "neutral");

  return (
    <div className={`min-h-screen flex flex-col ${t(d, "bg-zinc-950", "bg-zinc-50")}`}>
      {/* Header */}
      <header className={`border-b px-6 py-4 flex items-center justify-between ${t(d, "border-zinc-800/80", "border-zinc-200")}`}>
        <div>
          <p className={`text-[10px] font-bold tracking-widest uppercase ${t(d, "text-indigo-400", "text-indigo-500")}`}>extractai · intelligence</p>
          <h1 className={`text-xl font-bold tracking-tight ${t(d, "text-white", "text-zinc-900")}`}>Consensus Signal Detector</h1>
        </div>
        <div className={`text-xs ${t(d, "text-zinc-600", "text-zinc-400")}`}>
          {data ? `${data.length} topic${data.length !== 1 ? "s" : ""} tracked` : "Loading…"}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <div className={`w-52 shrink-0 border-r flex flex-col ${t(d, "border-zinc-800", "border-zinc-200")}`}>
          <div className={`px-3 py-2 text-[10px] font-bold tracking-widest uppercase ${t(d, "text-zinc-600", "text-zinc-500")}`}>
            Topics
          </div>
          <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
            {data === undefined && (
              <div className="space-y-1 p-2">
                {[1,2,3].map(i => <div key={i} className={`h-8 rounded-lg animate-pulse ${t(d, "bg-zinc-900", "bg-zinc-100")}`} />)}
              </div>
            )}
            {data?.map((item) => (
              <TopicPill
                key={item.topic._id}
                item={item}
                active={selected?.topic._id === item.topic._id}
                onClick={() => setSelectedId(item.topic._id)}
                d={d}
              />
            ))}
            {data?.length === 0 && (
              <p className={`px-3 py-4 text-xs ${t(d, "text-zinc-600", "text-zinc-400")}`}>No topics yet.</p>
            )}
          </div>
          <div className={`border-t ${t(d, "border-zinc-800", "border-zinc-200")}`}>
            <AddTopicForm d={d} onAdd={handleAdd} />
          </div>
        </div>

        {/* ── Main panel ───────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {!selected && data !== undefined && (
            <div className={`flex-1 flex items-center justify-center h-full text-sm ${t(d, "text-zinc-600", "text-zinc-400")}`}>
              Add a topic to start detecting signals.
            </div>
          )}

          {selected && (
            <AnimatePresence mode="wait">
              <motion.div
                key={selected.topic._id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ type: "spring", stiffness: 280, damping: 28 }}
                className="p-6 md:p-8 max-w-2xl"
              >
                {/* Topic name */}
                <div className="mb-6">
                  <h2 className={`text-3xl font-black tracking-tight ${t(d, "text-white", "text-zinc-900")}`}>
                    {selected.topic.name}
                  </h2>
                  {selected.topic.description && (
                    <p className={`text-sm mt-1 ${t(d, "text-zinc-500", "text-zinc-400")}`}>{selected.topic.description}</p>
                  )}
                </div>

                {/* No signal yet */}
                {!sig && (
                  <div className={`rounded-xl border border-dashed p-12 text-center ${t(d, "border-zinc-800", "border-zinc-200")}`}>
                    <div className="flex justify-center gap-1.5 mb-4">
                      {[0,1,2].map(i => (
                        <span key={i} className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                      ))}
                    </div>
                    <p className={`text-sm font-medium ${t(d, "text-zinc-400", "text-zinc-600")}`}>
                      Awaiting first scan…
                    </p>
                    <p className={`text-xs mt-1.5 ${t(d, "text-zinc-600", "text-zinc-400")}`}>
                      Scout is queuing this topic for analysis. Check back shortly.
                    </p>
                  </div>
                )}

                {sig && (
                  <>
                    {/* Gauge */}
                    <div className={`rounded-2xl border p-6 flex flex-col items-center mb-6 ${colors.bg} ${t(d, "border-zinc-800", "border-zinc-200")}`}
                      style={{ boxShadow: `0 0 40px -8px ${colors.glow}` }}>
                      <ConsensusGauge score={sig.consensusScore} direction={sig.direction} d={d} />

                      {/* Strength chips */}
                      <div className="flex items-center gap-2 mt-4">
                        <span className={`text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full border ${colors.bg} ${colors.text} border-current/30`}>
                          {sig.direction}
                        </span>
                        <span className={`text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full ${t(d, "bg-zinc-800 text-zinc-500 border border-zinc-700", "bg-zinc-100 text-zinc-500 border border-zinc-200")}`}>
                          {sig.strength} signal
                        </span>
                      </div>

                      {/* Explanation (Quill's copy) */}
                      <p className={`mt-4 text-sm text-center leading-relaxed max-w-sm ${t(d, "text-zinc-300", "text-zinc-600")}`}>
                        {sig.explanation}
                      </p>

                      <p className={`text-[10px] mt-3 ${t(d, "text-zinc-700", "text-zinc-400")}`}>
                        Last scanned {new Date(sig.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                      </p>
                    </div>

                    {/* Source breakdown cards */}
                    <div className={`text-[10px] font-bold tracking-widest uppercase mb-3 ${t(d, "text-zinc-600", "text-zinc-400")}`}>
                      Signal breakdown
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <SourceCard type="social"   score={sig.socialScore}   summary={sig.socialSummary}   d={d} index={0} />
                      <SourceCard type="news"     score={sig.newsScore}     summary={sig.newsSummary}     d={d} index={1} />
                      <SourceCard type="momentum" score={sig.momentumScore} summary={sig.momentumSummary} d={d} index={2} />
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}

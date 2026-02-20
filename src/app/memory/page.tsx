"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useTheme } from "../components/ThemeProvider";

function t(d: boolean, dark: string, light: string) {
  return d ? dark : light;
}

interface Task {
  _id: string;
  title: string;
  description: string;
  status: string;
  assigned: string;
  priority: string;
  created: string;
  completed?: string;
}

// ── Key Facts ────────────────────────────────────────────────────────────────

const KEY_FACTS = [
  { icon: "👤", label: "Kyle's timezone",  value: "EST (America/New_York)" },
  { icon: "📧", label: "Kyle's email",     value: "kaplankyle5@gmail.com" },
  { icon: "🐾", label: "Andy's email",     value: "andrewkeen321@gmail.com" },
  { icon: "📅", label: "First day",        value: "February 15, 2026" },
  { icon: "🛠️", label: "Stack",           value: "Next.js + Tailwind on Vercel, Cloudflare DNS" },
  { icon: "🔑", label: "Auth",             value: "Claude subscription (primary) + API key (fallback)" },
  { icon: "💰", label: "Bankr wallets",    value: "EVM + SOL (unfunded)" },
  { icon: "🐙", label: "GitHub",           value: "andy-extractai" },
];

function FactCard({ icon, label, value, d }: { icon: string; label: string; value: string; d: boolean }) {
  return (
    <div
      className={`rounded-xl border p-4 flex gap-3 items-start transition-all ${t(
        d,
        "bg-zinc-900 border-zinc-800 hover:border-zinc-600 hover:shadow-lg hover:shadow-black/40",
        "bg-white border-zinc-200 hover:border-zinc-300 shadow-sm hover:shadow-md"
      )}`}
    >
      <span className="text-xl shrink-0 mt-0.5">{icon}</span>
      <div className="min-w-0">
        <div className={`text-[11px] font-semibold uppercase tracking-widest mb-1 ${t(d, "text-zinc-500", "text-zinc-400")}`}>
          {label}
        </div>
        <div className={`text-sm font-medium break-words ${t(d, "text-zinc-100", "text-zinc-800")}`}>
          {value}
        </div>
      </div>
    </div>
  );
}

// ── Activity Log (timeline) ───────────────────────────────────────────────────

function TimelineEntry({
  task,
  d,
  isLast,
}: {
  task: Task;
  d: boolean;
  isLast: boolean;
}) {
  return (
    <div className="flex gap-4">
      {/* Spine */}
      <div className="flex flex-col items-center shrink-0">
        {/* Green dot */}
        <div className="w-3 h-3 rounded-full bg-green-500 ring-4 ring-offset-0 mt-1 shrink-0"
          style={{ boxShadow: "0 0 0 3px " + (d ? "#18181b" : "#ffffff") }}
        />
        {/* Vertical line */}
        {!isLast && (
          <div className={`w-px flex-1 mt-1 ${t(d, "bg-zinc-800", "bg-zinc-200")}`} />
        )}
      </div>

      {/* Content */}
      <div className={`pb-6 flex-1 ${isLast ? "pb-0" : ""}`}>
        <div className={`text-[11px] font-semibold uppercase tracking-wider mb-1 ${t(d, "text-green-500", "text-green-600")}`}>
          {task.completed ?? task.created}
        </div>
        <div className={`text-sm font-semibold mb-0.5 ${t(d, "text-white", "text-zinc-900")}`}>
          {task.title}
        </div>
        <div className={`text-xs leading-relaxed ${t(d, "text-zinc-500", "text-zinc-500")}`}>
          {task.description}
        </div>
      </div>
    </div>
  );
}

// ── Memory File Tree ──────────────────────────────────────────────────────────

const MEMORY_FILES = [
  { name: "MEMORY.md",            indent: 0, desc: "Long-term curated memory",   icon: "📄" },
  { name: "memory/",              indent: 0, desc: "",                            icon: "📁" },
  { name: "2025-07-25.md",        indent: 1, desc: "Daily log",                  icon: "📝" },
  { name: "2025-07-26.md",        indent: 1, desc: "Daily log",                  icon: "📝" },
  { name: "AGENTS.md",            indent: 0, desc: "Operating instructions",     icon: "📄" },
  { name: "SOUL.md",              indent: 0, desc: "Personality",                icon: "📄" },
  { name: "USER.md",              indent: 0, desc: "About Kyle",                 icon: "📄" },
];

function FileTreeRow({
  file,
  d,
}: {
  file: typeof MEMORY_FILES[0];
  d: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 py-1.5 px-3 rounded-lg text-sm transition ${t(
        d,
        "hover:bg-zinc-800/60",
        "hover:bg-zinc-100"
      )}`}
      style={{ paddingLeft: `${12 + file.indent * 20}px` }}
    >
      <span className="shrink-0">{file.icon}</span>
      <span className={`font-mono font-semibold ${t(d, "text-zinc-200", "text-zinc-700")}`}>
        {file.name}
      </span>
      {file.desc && (
        <>
          <span className={`mx-1 ${t(d, "text-zinc-700", "text-zinc-300")}`}>—</span>
          <span className={`text-xs ${t(d, "text-zinc-500", "text-zinc-500")}`}>{file.desc}</span>
        </>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MemoryPage() {
  const { theme } = useTheme();
  const d = theme === "dark";

  const tasks = useQuery(api.tasks.list);
  const loading = tasks === undefined;

  // Completed tasks, reverse-chronological
  const completed = (tasks ?? [])
    .filter((tk) => tk.status === "done" && (tk.completed || tk.created))
    .sort((a, b) => {
      const da = a.completed ?? a.created;
      const db = b.completed ?? b.created;
      return db.localeCompare(da);
    }) as Task[];

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Header ── */}
      <header className={`border-b px-4 md:px-8 py-5 ${t(d, "border-zinc-800", "border-zinc-200")}`}>
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className={`text-2xl font-bold tracking-tight ${t(d, "text-white", "text-zinc-900")}`}>
              🧠 Memory
            </h1>
            <p className={`text-sm mt-0.5 ${t(d, "text-zinc-500", "text-zinc-500")}`}>
              What Andy knows and remembers
            </p>
          </div>
          <Link
            href="/control"
            className={`text-xs px-3 py-1.5 rounded-lg border transition ${t(
              d,
              "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white",
              "border-zinc-300 text-zinc-500 hover:border-zinc-400 hover:text-zinc-900"
            )}`}
          >
            ← Control
          </Link>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex-1 px-4 md:px-8 py-8">
        <div className="max-w-4xl mx-auto space-y-12">

          {/* ── Section 1: Key Facts ── */}
          <section>
            <SectionHeading icon="📌" title="Key Facts" d={d} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {KEY_FACTS.map((f) => (
                <FactCard key={f.label} {...f} d={d} />
              ))}
            </div>
          </section>

          {/* ── Section 2: Activity Log ── */}
          <section>
            <SectionHeading icon="📜" title="Activity Log" d={d} />
            <div
              className={`rounded-xl border p-5 md:p-6 ${t(
                d,
                "bg-zinc-900 border-zinc-800",
                "bg-white border-zinc-200 shadow-sm"
              )}`}
            >
              {loading ? (
                <div className={`text-sm text-center py-8 animate-pulse ${t(d, "text-zinc-600", "text-zinc-400")}`}>
                  Loading activity…
                </div>
              ) : completed.length === 0 ? (
                <div className={`text-sm text-center py-8 ${t(d, "text-zinc-600", "text-zinc-400")}`}>
                  No completed tasks yet.
                </div>
              ) : (
                <div>
                  {completed.map((task, i) => (
                    <TimelineEntry
                      key={task._id}
                      task={task}
                      d={d}
                      isLast={i === completed.length - 1}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* ── Section 3: Memory Files ── */}
          <section>
            <SectionHeading icon="🗂️" title="Memory Files" d={d} />
            <div
              className={`rounded-xl border overflow-hidden ${t(
                d,
                "bg-zinc-900 border-zinc-800",
                "bg-white border-zinc-200 shadow-sm"
              )}`}
            >
              {/* Fake terminal bar */}
              <div className={`flex items-center gap-1.5 px-4 py-2.5 border-b ${t(d, "bg-zinc-800/60 border-zinc-700", "bg-zinc-50 border-zinc-200")}`}>
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                <span className={`ml-3 text-xs font-mono ${t(d, "text-zinc-500", "text-zinc-400")}`}>
                  ~/.openclaw/workspace/
                </span>
              </div>
              <div className="py-2">
                {MEMORY_FILES.map((f) => (
                  <FileTreeRow key={`${f.indent}-${f.name}`} file={f} d={d} />
                ))}
              </div>
            </div>

            {/* Descriptive footer */}
            <p className={`mt-3 text-xs leading-relaxed ${t(d, "text-zinc-600", "text-zinc-400")}`}>
              These files persist across sessions and form Andy&apos;s memory. Daily logs capture raw notes;{" "}
              <span className="font-mono">MEMORY.md</span> holds curated long-term knowledge.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}

// ── Shared section heading ────────────────────────────────────────────────────

function SectionHeading({ icon, title, d }: { icon: string; title: string; d: boolean }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-lg">{icon}</span>
      <h2 className={`text-base font-bold tracking-tight ${t(d, "text-white", "text-zinc-900")}`}>
        {title}
      </h2>
      <div className={`flex-1 h-px ml-2 ${t(d, "bg-zinc-800", "bg-zinc-200")}`} />
    </div>
  );
}

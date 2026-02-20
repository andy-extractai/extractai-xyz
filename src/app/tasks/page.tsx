"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";
import { useTheme } from "../components/ThemeProvider";

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

const COLUMNS = ["backlog", "in_progress", "review", "done"];

const COLUMN_CONFIG: Record<string, { label: string; dColor: string; lColor: string; icon: string; accent: string }> = {
  backlog:     { label: "Backlog",     dColor: "border-zinc-700",   lColor: "border-zinc-400",   icon: "📋", accent: "text-zinc-400" },
  in_progress: { label: "In Progress", dColor: "border-blue-500",   lColor: "border-blue-500",   icon: "🔨", accent: "text-blue-400" },
  review:      { label: "Review",      dColor: "border-amber-500",  lColor: "border-amber-500",  icon: "👀", accent: "text-amber-400" },
  done:        { label: "Done",        dColor: "border-green-500",  lColor: "border-green-500",  icon: "✅", accent: "text-green-400" },
};

function t(d: boolean, dark: string, light: string) {
  return d ? dark : light;
}

function priChip(priority: string, d: boolean) {
  const map: Record<string, string> = {
    high:   d ? "text-red-400 bg-red-500/10 border border-red-500/20"     : "text-red-600 bg-red-50 border border-red-200",
    medium: d ? "text-amber-400 bg-amber-500/10 border border-amber-500/20" : "text-amber-600 bg-amber-50 border border-amber-200",
    low:    d ? "text-zinc-400 bg-zinc-700/50 border border-zinc-700"      : "text-zinc-500 bg-zinc-100 border border-zinc-200",
  };
  return map[priority] ?? "";
}

function TaskCard({ task, d }: { task: Task; d: boolean }) {
  return (
    <div
      className={`border rounded-xl p-3.5 transition-all ${t(
        d,
        "bg-zinc-900 border-zinc-800 hover:border-zinc-600 hover:shadow-lg hover:shadow-black/40",
        "bg-white border-zinc-200 hover:border-zinc-300 shadow-sm hover:shadow-md"
      )}`}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className={`text-sm font-semibold leading-snug ${t(d, "text-white", "text-zinc-900")}`}>
          {task.title}
        </div>
        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold shrink-0 tracking-wide ${priChip(task.priority, d)}`}>
          {task.priority.toUpperCase()}
        </span>
      </div>
      <div className={`text-xs leading-relaxed mb-3 ${t(d, "text-zinc-500", "text-zinc-500")}`}>
        {task.description}
      </div>
      <div className={`flex items-center justify-between border-t pt-2 ${t(d, "border-zinc-800", "border-zinc-100")}`}>
        <span className={`text-[10px] font-medium ${t(d, "text-zinc-500", "text-zinc-500")}`}>
          {task.assigned === "andy" ? "🐾" : "👤"} {task.assigned}
        </span>
        <div className="flex items-center gap-1.5">
          {task.completed && (
            <span className="text-[10px] text-green-500">✓ {task.completed}</span>
          )}
          {!task.completed && (
            <span className={`text-[10px] ${t(d, "text-zinc-700", "text-zinc-400")}`}>
              {task.created}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function MobileColumnSection({ col, items, d }: { col: string; items: Task[]; d: boolean }) {
  const cfg = COLUMN_CONFIG[col] ?? { label: col, dColor: "border-zinc-700", lColor: "border-zinc-300", icon: "📌", accent: "text-zinc-400" };
  const [open, setOpen] = useState(col === "in_progress" || col === "review");

  return (
    <div className={`border rounded-xl overflow-hidden ${t(d, "border-zinc-800", "border-zinc-200")}`}>
      <button
        type="button"
        className={`w-full text-left px-4 py-3 flex items-center justify-between gap-2 transition border-l-4 ${d ? cfg.dColor : cfg.lColor} ${t(
          d,
          "bg-zinc-900/60 hover:bg-zinc-800/60",
          "bg-zinc-50 hover:bg-zinc-100"
        )}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <span className="text-base">{cfg.icon}</span>
          <span className={`text-sm font-semibold ${t(d, "text-white", "text-zinc-800")}`}>{cfg.label}</span>
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${t(d, "bg-zinc-800 text-zinc-400", "bg-zinc-200 text-zinc-500")}`}>
            {items.length}
          </span>
        </div>
        <span className={`text-sm transition-transform ${open ? "rotate-180" : ""} ${t(d, "text-zinc-600", "text-zinc-400")}`}>▾</span>
      </button>
      {open && (
        <div className="p-3 space-y-2">
          {items.length === 0 ? (
            <div className={`text-xs text-center py-6 ${t(d, "text-zinc-700", "text-zinc-400")}`}>No tasks here</div>
          ) : (
            items.map((task) => <TaskCard key={task._id} task={task} d={d} />)
          )}
        </div>
      )}
    </div>
  );
}

function DesktopColumn({ col, items, d }: { col: string; items: Task[]; d: boolean }) {
  const cfg = COLUMN_CONFIG[col] ?? { label: col, dColor: "border-zinc-700", lColor: "border-zinc-300", icon: "📌", accent: "text-zinc-400" };
  return (
    <div className={`flex flex-col border rounded-xl overflow-hidden ${t(d, "border-zinc-800", "border-zinc-200")}`}>
      <div className={`px-4 py-3 border-b-2 flex items-center gap-2 ${d ? cfg.dColor : cfg.lColor} ${t(d, "bg-zinc-900/60", "bg-zinc-50")}`}>
        <span className="text-base">{cfg.icon}</span>
        <span className={`text-sm font-semibold ${t(d, "text-white", "text-zinc-800")}`}>{cfg.label}</span>
        <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ml-auto ${t(d, "bg-zinc-800 text-zinc-400", "bg-zinc-200 text-zinc-500")}`}>
          {items.length}
        </span>
      </div>
      <div className="flex-1 p-3 space-y-2 overflow-y-auto">
        {items.length === 0 ? (
          <div className={`text-xs text-center py-8 ${t(d, "text-zinc-700", "text-zinc-400")}`}>No tasks</div>
        ) : (
          items.map((task) => <TaskCard key={task._id} task={task} d={d} />)
        )}
      </div>
    </div>
  );
}

export default function TasksPage() {
  const tasks = useQuery(api.tasks.list);
  const { theme } = useTheme();
  const d = theme === "dark";

  const tasksByColumn = useMemo(() => {
    if (!tasks) return {};
    const map: Record<string, Task[]> = {};
    COLUMNS.forEach((col) => { map[col] = []; });
    tasks.forEach((tk) => {
      if (map[tk.status]) map[tk.status].push(tk as Task);
    });
    return map;
  }, [tasks]);

  if (tasks === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className={`text-sm animate-pulse ${t(d, "text-zinc-500", "text-zinc-400")}`}>Loading tasks…</div>
      </div>
    );
  }

  if (tasks === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <div className="text-4xl">📋</div>
        <div className={t(d, "text-zinc-500", "text-zinc-400")}>Task data unavailable</div>
        <Link href="/" className={`text-sm ${t(d, "text-zinc-600 hover:text-white", "text-zinc-400 hover:text-zinc-900")}`}>← back</Link>
      </div>
    );
  }

  const total = tasks.length;
  const done = tasks.filter((tk) => tk.status === "done").length;
  const inProg = tasks.filter((tk) => tk.status === "in_progress").length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col">
      <header className={`border-b px-4 md:px-6 py-4 ${t(d, "border-zinc-800", "border-zinc-200")}`}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className={`text-xl font-bold tracking-tight ${t(d, "text-white", "text-zinc-900")}`}>📋 Task Board</h1>
            <p className={`text-xs mt-0.5 ${t(d, "text-zinc-500", "text-zinc-500")}`}>
              {total} tasks · {inProg} in progress · {done} done
            </p>
          </div>
          <div className="flex items-center gap-3 min-w-[160px]">
            <div className={`flex-1 h-2 rounded-full overflow-hidden ${t(d, "bg-zinc-800", "bg-zinc-200")}`}>
              <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className={`text-xs font-bold tabular-nums ${t(d, "text-zinc-400", "text-zinc-600")}`}>{pct}%</span>
          </div>
        </div>
      </header>

      <div className="flex-1 p-4 md:p-6">
        <div className="md:hidden space-y-3">
          {COLUMNS.map((col) => (
            <MobileColumnSection key={col} col={col} items={tasksByColumn[col] ?? []} d={d} />
          ))}
        </div>
        <div className="hidden md:grid gap-4" style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
          {COLUMNS.map((col) => (
            <DesktopColumn key={col} col={col} items={tasksByColumn[col] ?? []} d={d} />
          ))}
        </div>
      </div>
    </div>
  );
}

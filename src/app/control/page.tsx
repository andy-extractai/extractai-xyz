"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useTheme } from "../components/ThemeProvider";

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  assigned: string;
  priority: string;
  created: string;
  completed?: string;
}

interface CronJob {
  name: string;
  schedule: string;
  description: string;
  status: string;
  last_run: string;
  last_status: string;
}

interface Project {
  name: string;
  url: string;
  repo: string;
  status: string;
  pages: { path: string; name: string; status: string }[];
}

interface TeamMember {
  name: string;
  role: string;
  emoji: string;
  description: string;
  status: string;
}

interface Contact {
  name: string;
  status: string;
  last_contact: string;
}

interface MCData {
  last_updated: string;
  agent: {
    name: string;
    emoji: string;
    status: string;
    current_task: string;
    model: string;
    uptime_since: string;
  };
  tasks: { columns: string[]; items: Task[] };
  cron_jobs: CronJob[];
  projects: Project[];
  team: TeamMember[];
  contacts: Contact[];
}

const COLUMN_CONFIG: Record<string, { label: string; dColor: string; lColor: string; icon: string }> = {
  backlog: { label: "Backlog", dColor: "border-zinc-700", lColor: "border-zinc-300", icon: "📋" },
  in_progress: { label: "In Progress", dColor: "border-blue-500", lColor: "border-blue-500", icon: "🔨" },
  review: { label: "Review", dColor: "border-amber-500", lColor: "border-amber-500", icon: "👀" },
  done: { label: "Done", dColor: "border-green-500", lColor: "border-green-500", icon: "✅" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// Theme-aware class helper
function t(d: boolean, dark: string, light: string) {
  return d ? dark : light;
}

// --- COMPONENTS ---

function AgentStatus({ agent, d }: { agent: MCData["agent"]; d: boolean }) {
  return (
    <div className={`border rounded-xl p-4 w-full ${t(d, "border-zinc-800 bg-zinc-900/50", "border-zinc-200 bg-zinc-50")}`}>
      {/* Mobile: stack vertically; md+: single row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
        {/* Emoji + name + status row — always a row */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="text-3xl shrink-0">{agent.emoji}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-bold text-lg leading-tight ${t(d, "text-white", "text-zinc-900")}`}>{agent.name}</span>
              <span className={`w-2 h-2 rounded-full shrink-0 ${agent.status === "online" ? "bg-green-500 animate-pulse" : "bg-zinc-400"}`} />
              <span className={`text-xs ${t(d, "text-zinc-500", "text-zinc-500")}`}>{agent.status}</span>
            </div>
            {/* Current task: wraps on mobile */}
            <div className={`text-sm mt-0.5 break-words ${t(d, "text-zinc-400", "text-zinc-600")}`}>{agent.current_task}</div>
          </div>
        </div>
        {/* Model + uptime: right-aligned on md+, left-aligned on mobile */}
        <div className="flex flex-row gap-6 sm:flex-col sm:gap-0 sm:text-right shrink-0">
          <div>
            <div className={`text-[10px] ${t(d, "text-zinc-600", "text-zinc-400")}`}>MODEL</div>
            <div className={`text-xs font-mono ${t(d, "text-zinc-400", "text-zinc-600")}`}>{agent.model}</div>
          </div>
          <div>
            <div className={`text-[10px] mt-0 sm:mt-1 ${t(d, "text-zinc-600", "text-zinc-400")}`}>SINCE</div>
            <div className={`text-xs ${t(d, "text-zinc-400", "text-zinc-600")}`}>{agent.uptime_since}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskCard({ task, d }: { task: Task; d: boolean }) {
  const priColors: Record<string, string> = {
    high: d ? "text-red-400 bg-red-500/10" : "text-red-600 bg-red-50",
    medium: d ? "text-amber-400 bg-amber-500/10" : "text-amber-600 bg-amber-50",
    low: d ? "text-zinc-400 bg-zinc-700/50" : "text-zinc-500 bg-zinc-100",
  };
  return (
    <div className={`border rounded-lg p-3 transition ${t(d, "bg-zinc-900 border-zinc-800 hover:border-zinc-700", "bg-white border-zinc-200 hover:border-zinc-300 shadow-sm")}`}>
      <div className="flex items-start justify-between gap-2">
        <div className={`text-sm font-medium leading-tight ${t(d, "text-white", "text-zinc-900")}`}>{task.title}</div>
        <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium shrink-0 ${priColors[task.priority] || ""}`}>
          {task.priority.toUpperCase()}
        </span>
      </div>
      <div className={`text-xs mt-1.5 leading-relaxed ${t(d, "text-zinc-500", "text-zinc-500")}`}>{task.description}</div>
      <div className="flex items-center justify-between mt-2.5">
        <span className={`text-[10px] ${t(d, "text-zinc-600", "text-zinc-400")}`}>
          {task.assigned === "andy" ? "🐾" : "👤"} {task.assigned}
        </span>
        <span className={`text-[10px] ${t(d, "text-zinc-700", "text-zinc-400")}`}>{task.created}</span>
      </div>
    </div>
  );
}

/** Mobile column section — collapsible on <md, always open on md+ */
function TaskColumnSection({
  col,
  items,
  d,
}: {
  col: string;
  items: Task[];
  d: boolean;
}) {
  const cfg = COLUMN_CONFIG[col] || { label: col, dColor: "border-zinc-700", lColor: "border-zinc-300", icon: "📌" };
  const [open, setOpen] = useState(col === "in_progress" || col === "review"); // open active cols by default

  return (
    <div className={`border-t-2 ${d ? cfg.dColor : cfg.lColor}`}>
      {/* Header — tappable on mobile to collapse */}
      <button
        type="button"
        className={`w-full text-left px-3 py-2 flex items-center justify-between gap-2 md:cursor-default ${t(d, "bg-zinc-900/30 hover:bg-zinc-800/30", "bg-zinc-50/50 hover:bg-zinc-100/50")} md:hover:bg-transparent transition`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className={`text-xs font-medium ${t(d, "text-zinc-400", "text-zinc-600")}`}>
          {cfg.icon} {cfg.label}
          <span className={`ml-1.5 ${t(d, "text-zinc-600", "text-zinc-400")}`}>{items.length}</span>
        </span>
        {/* Chevron only visible on mobile */}
        <span className={`text-xs transition-transform md:hidden ${open ? "rotate-180" : ""} ${t(d, "text-zinc-600", "text-zinc-400")}`}>▾</span>
      </button>

      {/* Task list — hide when collapsed on mobile, always shown on md+ */}
      <div className={`${open ? "block" : "hidden"} md:block`}>
        <div className="p-2 space-y-2">
          {items.length === 0 && (
            <div className={`text-[10px] text-center py-4 ${t(d, "text-zinc-700", "text-zinc-400")}`}>No tasks</div>
          )}
          {items.map((task) => (
            <TaskCard key={task.id} task={task} d={d} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TaskBoard({ tasks, d }: { tasks: MCData["tasks"]; d: boolean }) {
  const columns = tasks.columns;
  const tasksByColumn = useMemo(() => {
    const map: Record<string, Task[]> = {};
    columns.forEach((col) => { map[col] = []; });
    tasks.items.forEach((tk) => {
      if (map[tk.status]) map[tk.status].push(tk);
    });
    return map;
  }, [tasks, columns]);

  return (
    <div className={`border rounded-xl overflow-hidden ${t(d, "border-zinc-800", "border-zinc-200")}`}>
      {/* Panel header */}
      <div className={`px-4 py-3 border-b ${t(d, "bg-zinc-900/70 border-zinc-800", "bg-zinc-50 border-zinc-200")}`}>
        <h2 className={`text-sm font-bold ${t(d, "text-white", "text-zinc-900")}`}>📋 Tasks</h2>
        <p className={`text-[10px] ${t(d, "text-zinc-600", "text-zinc-400")}`}>
          {tasks.items.length} total • {tasks.items.filter((tk) => tk.status === "done").length} completed
        </p>
      </div>

      {/*
        Mobile (<md): vertical stack of collapsible column sections
        Desktop (md+): 4-col horizontal grid with horizontal scroll, matching original exactly
      */}

      {/* Mobile view */}
      <div className="md:hidden divide-y divide-transparent">
        {columns.map((col) => (
          <TaskColumnSection
            key={col}
            col={col}
            items={tasksByColumn[col] || []}
            d={d}
          />
        ))}
      </div>

      {/* Desktop view — original layout, untouched */}
      <div
        className={`hidden md:grid gap-0 divide-x overflow-x-auto ${t(d, "divide-zinc-800", "divide-zinc-200")}`}
        style={{ gridTemplateColumns: "repeat(4, minmax(220px, 1fr))" }}
      >
        {columns.map((col) => {
          const cfg = COLUMN_CONFIG[col] || { label: col, dColor: "border-zinc-700", lColor: "border-zinc-300", icon: "📌" };
          const items = tasksByColumn[col] || [];
          return (
            <div key={col} className="min-h-[300px]">
              <div className={`px-3 py-2 border-t-2 ${d ? cfg.dColor : cfg.lColor} ${t(d, "bg-zinc-900/30", "bg-zinc-50/50")}`}>
                <span className={`text-xs font-medium ${t(d, "text-zinc-400", "text-zinc-600")}`}>
                  {cfg.icon} {cfg.label}
                  <span className={`ml-1.5 ${t(d, "text-zinc-600", "text-zinc-400")}`}>{items.length}</span>
                </span>
              </div>
              <div className="p-2 space-y-2">
                {items.map((task) => (
                  <TaskCard key={task.id} task={task} d={d} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CronPanel({ jobs, d }: { jobs: CronJob[]; d: boolean }) {
  return (
    <div className={`border rounded-xl overflow-hidden ${t(d, "border-zinc-800", "border-zinc-200")}`}>
      <div className={`px-4 py-3 border-b ${t(d, "bg-zinc-900/70 border-zinc-800", "bg-zinc-50 border-zinc-200")}`}>
        <h2 className={`text-sm font-bold ${t(d, "text-white", "text-zinc-900")}`}>⏰ Scheduled Jobs</h2>
      </div>
      <div className={`divide-y ${t(d, "divide-zinc-800/50", "divide-zinc-100")}`}>
        {jobs.map((job) => (
          <div key={job.name} className="px-4 py-3 flex items-start gap-3">
            <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${job.status === "active" ? "bg-green-500" : "bg-zinc-400"}`} />
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-medium ${t(d, "text-white", "text-zinc-900")}`}>{job.name}</div>
              <div className={`text-xs ${t(d, "text-zinc-500", "text-zinc-500")}`}>{job.description}</div>
              {/* On mobile, schedule + status drop below description */}
              <div className={`text-xs font-mono mt-0.5 md:hidden ${t(d, "text-zinc-400", "text-zinc-600")}`}>{job.schedule}</div>
              <div className={`text-[10px] md:hidden ${job.last_status === "success" ? "text-green-500" : job.last_status === "timeout" ? "text-amber-500" : "text-red-500"}`}>
                {job.last_status} • {timeAgo(job.last_run)}
              </div>
            </div>
            {/* On md+, keep right-aligned metadata */}
            <div className="text-right shrink-0 hidden md:block">
              <div className={`text-xs font-mono ${t(d, "text-zinc-400", "text-zinc-600")}`}>{job.schedule}</div>
              <div className={`text-[10px] mt-0.5 ${job.last_status === "success" ? "text-green-500" : job.last_status === "timeout" ? "text-amber-500" : "text-red-500"}`}>
                {job.last_status} • {timeAgo(job.last_run)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProjectsPanel({ projects, d }: { projects: Project[]; d: boolean }) {
  return (
    <div className={`border rounded-xl overflow-hidden ${t(d, "border-zinc-800", "border-zinc-200")}`}>
      <div className={`px-4 py-3 border-b ${t(d, "bg-zinc-900/70 border-zinc-800", "bg-zinc-50 border-zinc-200")}`}>
        <h2 className={`text-sm font-bold ${t(d, "text-white", "text-zinc-900")}`}>🚀 Projects</h2>
      </div>
      {projects.map((project) => (
        <div key={project.name} className="px-4 py-3">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <a href={project.url} target="_blank" rel="noopener noreferrer" className={`text-sm font-bold transition ${t(d, "text-white hover:text-blue-400", "text-zinc-900 hover:text-blue-600")}`}>
              {project.name} ↗
            </a>
            <span className="text-[9px] bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded font-medium">{project.status.toUpperCase()}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {project.pages.map((page) => (
              <a
                key={page.path}
                href={`${project.url}${page.path}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-[10px] px-2 py-1 rounded border transition ${
                  page.status === "live"
                    ? t(d, "border-zinc-700 text-zinc-300 hover:border-zinc-500 bg-zinc-900", "border-zinc-200 text-zinc-600 hover:border-zinc-400 bg-white")
                    : "border-amber-500/30 text-amber-500 bg-amber-500/5"
                }`}
              >
                {page.name}
                <span className={`ml-1 ${t(d, "text-zinc-600", "text-zinc-400")}`}>{page.path}</span>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TeamPanel({ team, d }: { team: TeamMember[]; d: boolean }) {
  return (
    <div className={`border rounded-xl overflow-hidden ${t(d, "border-zinc-800", "border-zinc-200")}`}>
      <div className={`px-4 py-3 border-b ${t(d, "bg-zinc-900/70 border-zinc-800", "bg-zinc-50 border-zinc-200")}`}>
        <h2 className={`text-sm font-bold ${t(d, "text-white", "text-zinc-900")}`}>👥 Team</h2>
      </div>
      {/* Mobile: single-column stack; md+: flex-wrap (original behavior) */}
      <div className="p-4 flex flex-col gap-3 md:flex-row md:flex-wrap">
        {team.map((member) => (
          <div key={member.name} className={`border rounded-lg p-3 w-full md:min-w-[200px] md:flex-1 ${t(d, "bg-zinc-900 border-zinc-800", "bg-white border-zinc-200 shadow-sm")}`}>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{member.emoji}</span>
              <div>
                <div className={`text-sm font-bold ${t(d, "text-white", "text-zinc-900")}`}>{member.name}</div>
                <div className={`text-xs ${t(d, "text-zinc-500", "text-zinc-500")}`}>{member.role}</div>
              </div>
              <span className={`w-2 h-2 rounded-full ml-auto ${member.status === "active" ? "bg-green-500 animate-pulse" : "bg-zinc-400"}`} />
            </div>
            <div className={`text-xs mt-2 ${t(d, "text-zinc-600", "text-zinc-500")}`}>{member.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContactsPanel({ contacts, d }: { contacts: Contact[]; d: boolean }) {
  return (
    <div className={`border rounded-xl overflow-hidden ${t(d, "border-zinc-800", "border-zinc-200")}`}>
      <div className={`px-4 py-3 border-b ${t(d, "bg-zinc-900/70 border-zinc-800", "bg-zinc-50 border-zinc-200")}`}>
        <h2 className={`text-sm font-bold ${t(d, "text-white", "text-zinc-900")}`}>📇 Contacts</h2>
      </div>
      <div className={`divide-y ${t(d, "divide-zinc-800/50", "divide-zinc-100")}`}>
        {contacts.map((c) => (
          <div key={c.name} className="px-4 py-2.5 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className={`text-sm font-medium ${t(d, "text-white", "text-zinc-900")}`}>{c.name}</span>
              <span className={`text-xs ml-2 ${t(d, "text-zinc-500", "text-zinc-500")}`}>{c.status}</span>
            </div>
            <span className={`text-[10px] shrink-0 ${t(d, "text-zinc-700", "text-zinc-400")}`}>{c.last_contact}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- MAIN ---

type Tab = "overview" | "tasks" | "schedule" | "projects";

const TABS: [Tab, string][] = [
  ["overview", "Overview"],
  ["tasks", "Tasks"],
  ["schedule", "Schedule"],
  ["projects", "Projects"],
];

export default function MissionControlPage() {
  const [data, setData] = useState<MCData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const { theme } = useTheme();
  const d = theme === "dark";

  useEffect(() => {
    fetch("/data/mission-control.json")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className={`text-sm animate-pulse ${t(d, "text-zinc-500", "text-zinc-400")}`}>Loading Mission Control...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-4xl mb-3">🎛️</div>
        <div className={t(d, "text-zinc-500", "text-zinc-500")}>Mission Control data unavailable</div>
        <Link href="/" className={`text-sm mt-4 ${t(d, "text-zinc-600 hover:text-white", "text-zinc-400 hover:text-zinc-900")}`}>← back</Link>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className={`border-b shrink-0 ${t(d, "border-zinc-800", "border-zinc-200")}`}>
        {/* Top row: title + last-updated */}
        <div className={`px-4 py-2.5 flex items-center justify-between`}>
          <h1 className={`text-base font-bold tracking-tight ${t(d, "text-white", "text-zinc-900")}`}>
            🎛️ Mission Control
          </h1>
          <div className={`text-[10px] ${t(d, "text-zinc-700", "text-zinc-400")}`}>
            Updated {timeAgo(data.last_updated)}
          </div>
        </div>

        {/*
          Tab bar:
          - Mobile: horizontally scrollable, full-width strip, no wrapping
          - md+: right-aligned pill group (original behavior)
        */}

        {/* Mobile tab strip — hidden on md+ */}
        <div className={`flex overflow-x-auto scrollbar-hide border-t md:hidden ${t(d, "border-zinc-800 bg-zinc-950", "border-zinc-100 bg-zinc-50")}`}>
          {TABS.map(([val, label]) => (
            <button
              key={val}
              onClick={() => setTab(val)}
              className={`flex-none px-4 py-2 text-xs font-medium border-b-2 whitespace-nowrap transition ${
                tab === val
                  ? t(
                      d,
                      "border-blue-500 text-white",
                      "border-blue-500 text-blue-600"
                    )
                  : t(
                      d,
                      "border-transparent text-zinc-500 hover:text-zinc-300",
                      "border-transparent text-zinc-500 hover:text-zinc-800"
                    )
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Desktop tab pill group — hidden on mobile */}
        <div className={`hidden md:flex items-center justify-end px-4 pb-2`}>
          <div className={`flex rounded-md p-0.5 text-[10px] ${t(d, "bg-zinc-900", "bg-zinc-100")}`}>
            {TABS.map(([val, label]) => (
              <button
                key={val}
                onClick={() => setTab(val)}
                className={`px-3 py-1.5 rounded transition ${
                  tab === val
                    ? t(d, "bg-zinc-700 text-white font-medium", "bg-white text-zinc-900 font-medium shadow-sm")
                    : t(d, "text-zinc-500 hover:text-white", "text-zinc-500 hover:text-zinc-900")
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4">
        {tab === "overview" && (
          <>
            {/* Agent status — full-width on all sizes */}
            <AgentStatus agent={data.agent} d={d} />

            {/* Cron + Contacts: 1 col on mobile, 2 cols on md+ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <CronPanel jobs={data.cron_jobs} d={d} />
              <ContactsPanel contacts={data.contacts} d={d} />
            </div>

            {/* Task board: mobile-collapsible columns / desktop 4-col grid */}
            <TaskBoard tasks={data.tasks} d={d} />

            {/* Projects + Team: 1 col on mobile, 2 cols on md+ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <ProjectsPanel projects={data.projects} d={d} />
              <TeamPanel team={data.team} d={d} />
            </div>
          </>
        )}

        {tab === "tasks" && <TaskBoard tasks={data.tasks} d={d} />}

        {tab === "schedule" && <CronPanel jobs={data.cron_jobs} d={d} />}

        {tab === "projects" && (
          <div className="space-y-3 md:space-y-4">
            <ProjectsPanel projects={data.projects} d={d} />
            <TeamPanel team={data.team} d={d} />
          </div>
        )}
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className={`border-t px-4 py-2 text-center text-[10px] shrink-0 ${t(d, "border-zinc-800 text-zinc-700", "border-zinc-200 text-zinc-400")}`}>
        Mission Control • extractai.xyz 🐾
      </footer>
    </div>
  );
}

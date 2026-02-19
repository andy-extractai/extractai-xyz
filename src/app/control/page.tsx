"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";

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

const COLUMN_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  backlog: { label: "Backlog", color: "border-zinc-700", icon: "📋" },
  in_progress: { label: "In Progress", color: "border-blue-500", icon: "🔨" },
  review: { label: "Review", color: "border-amber-500", icon: "👀" },
  done: { label: "Done", color: "border-green-500", icon: "✅" },
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "text-red-400 bg-red-500/10",
  medium: "text-amber-400 bg-amber-500/10",
  low: "text-zinc-400 bg-zinc-700/50",
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

// --- COMPONENTS ---

function AgentStatus({ agent }: { agent: MCData["agent"] }) {
  return (
    <div className="border border-zinc-800 rounded-xl p-4 bg-zinc-900/50">
      <div className="flex items-center gap-3">
        <div className="text-3xl">{agent.emoji}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-lg">{agent.name}</span>
            <span className={`w-2 h-2 rounded-full ${agent.status === "online" ? "bg-green-500 animate-pulse" : "bg-zinc-600"}`} />
            <span className="text-zinc-500 text-xs">{agent.status}</span>
          </div>
          <div className="text-zinc-400 text-sm mt-0.5">{agent.current_task}</div>
        </div>
        <div className="text-right">
          <div className="text-zinc-600 text-[10px]">MODEL</div>
          <div className="text-zinc-400 text-xs font-mono">{agent.model}</div>
          <div className="text-zinc-600 text-[10px] mt-1">SINCE</div>
          <div className="text-zinc-400 text-xs">{agent.uptime_since}</div>
        </div>
      </div>
    </div>
  );
}

function TaskCard({ task }: { task: Task }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 hover:border-zinc-700 transition">
      <div className="flex items-start justify-between gap-2">
        <div className="text-white text-sm font-medium leading-tight">{task.title}</div>
        <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium shrink-0 ${PRIORITY_COLORS[task.priority] || ""}`}>
          {task.priority.toUpperCase()}
        </span>
      </div>
      <div className="text-zinc-500 text-xs mt-1.5 leading-relaxed">{task.description}</div>
      <div className="flex items-center justify-between mt-2.5">
        <span className="text-zinc-600 text-[10px]">
          {task.assigned === "andy" ? "🐾" : "👤"} {task.assigned}
        </span>
        <span className="text-zinc-700 text-[10px]">{task.created}</span>
      </div>
    </div>
  );
}

function TaskBoard({ tasks }: { tasks: MCData["tasks"] }) {
  const columns = tasks.columns;
  const tasksByColumn = useMemo(() => {
    const map: Record<string, Task[]> = {};
    columns.forEach((col) => { map[col] = []; });
    tasks.items.forEach((t) => {
      if (map[t.status]) map[t.status].push(t);
    });
    return map;
  }, [tasks, columns]);

  return (
    <div className="border border-zinc-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-zinc-900/70 border-b border-zinc-800">
        <h2 className="text-sm font-bold text-white">📋 Tasks</h2>
        <p className="text-zinc-600 text-[10px]">{tasks.items.length} total • {tasks.items.filter(t => t.status === "done").length} completed</p>
      </div>
      <div className="grid grid-cols-4 gap-0 divide-x divide-zinc-800">
        {columns.map((col) => {
          const cfg = COLUMN_CONFIG[col] || { label: col, color: "border-zinc-700", icon: "📌" };
          const items = tasksByColumn[col] || [];
          return (
            <div key={col} className="min-h-[300px]">
              <div className={`px-3 py-2 border-t-2 ${cfg.color} bg-zinc-900/30`}>
                <span className="text-xs font-medium text-zinc-400">
                  {cfg.icon} {cfg.label}
                  <span className="text-zinc-600 ml-1.5">{items.length}</span>
                </span>
              </div>
              <div className="p-2 space-y-2">
                {items.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CronPanel({ jobs }: { jobs: CronJob[] }) {
  return (
    <div className="border border-zinc-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-zinc-900/70 border-b border-zinc-800">
        <h2 className="text-sm font-bold text-white">⏰ Scheduled Jobs</h2>
      </div>
      <div className="divide-y divide-zinc-800/50">
        {jobs.map((job) => (
          <div key={job.name} className="px-4 py-3 flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full shrink-0 ${job.status === "active" ? "bg-green-500" : "bg-zinc-600"}`} />
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-medium">{job.name}</div>
              <div className="text-zinc-500 text-xs">{job.description}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-zinc-400 text-xs font-mono">{job.schedule}</div>
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

function ProjectsPanel({ projects }: { projects: Project[] }) {
  return (
    <div className="border border-zinc-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-zinc-900/70 border-b border-zinc-800">
        <h2 className="text-sm font-bold text-white">🚀 Projects</h2>
      </div>
      {projects.map((project) => (
        <div key={project.name} className="px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-white text-sm font-bold hover:text-blue-400 transition">
              {project.name} ↗
            </a>
            <span className="text-[9px] bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded">{project.status.toUpperCase()}</span>
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
                    ? "border-zinc-700 text-zinc-300 hover:border-zinc-500 bg-zinc-900"
                    : "border-amber-800/50 text-amber-400 bg-amber-500/5"
                }`}
              >
                {page.name}
                <span className="text-zinc-600 ml-1">{page.path}</span>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TeamPanel({ team }: { team: TeamMember[] }) {
  return (
    <div className="border border-zinc-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-zinc-900/70 border-b border-zinc-800">
        <h2 className="text-sm font-bold text-white">👥 Team</h2>
      </div>
      <div className="p-4 flex flex-wrap gap-3">
        {team.map((member) => (
          <div key={member.name} className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 min-w-[200px] flex-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{member.emoji}</span>
              <div>
                <div className="text-white text-sm font-bold">{member.name}</div>
                <div className="text-zinc-500 text-xs">{member.role}</div>
              </div>
              <span className={`w-2 h-2 rounded-full ml-auto ${member.status === "active" ? "bg-green-500 animate-pulse" : "bg-zinc-600"}`} />
            </div>
            <div className="text-zinc-600 text-xs mt-2">{member.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContactsPanel({ contacts }: { contacts: Contact[] }) {
  return (
    <div className="border border-zinc-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-zinc-900/70 border-b border-zinc-800">
        <h2 className="text-sm font-bold text-white">📇 Contacts</h2>
      </div>
      <div className="divide-y divide-zinc-800/50">
        {contacts.map((c) => (
          <div key={c.name} className="px-4 py-2.5 flex items-center justify-between">
            <div>
              <span className="text-white text-sm font-medium">{c.name}</span>
              <span className="text-zinc-500 text-xs ml-2">{c.status}</span>
            </div>
            <span className="text-zinc-700 text-[10px]">{c.last_contact}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- MAIN ---

type Tab = "overview" | "tasks" | "schedule" | "projects";

export default function MissionControlPage() {
  const [data, setData] = useState<MCData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    fetch("/data/mission-control.json")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-zinc-500 text-sm animate-pulse">Loading Mission Control...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-zinc-500">
        <div className="text-4xl mb-3">🎛️</div>
        <div>Mission Control data unavailable</div>
        <Link href="/" className="text-zinc-600 hover:text-white text-sm mt-4">← back</Link>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-zinc-800 px-4 py-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* sidebar handles nav */}
            <h1 className="text-lg font-bold tracking-tight">🎛️ Mission Control</h1>
          </div>
          <div className="flex items-center gap-4">
            {/* Tabs */}
            <div className="flex bg-zinc-900 rounded-md p-0.5 text-[10px]">
              {([
                ["overview", "Overview"],
                ["tasks", "Tasks"],
                ["schedule", "Schedule"],
                ["projects", "Projects"],
              ] as [Tab, string][]).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setTab(val)}
                  className={`px-3 py-1.5 rounded transition ${
                    tab === val ? "bg-zinc-700 text-white font-medium" : "text-zinc-500 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="text-zinc-700 text-[10px]">
              Updated {timeAgo(data.last_updated)}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {tab === "overview" && (
          <>
            <AgentStatus agent={data.agent} />
            <div className="grid grid-cols-2 gap-4">
              <CronPanel jobs={data.cron_jobs} />
              <ContactsPanel contacts={data.contacts} />
            </div>
            <TaskBoard tasks={data.tasks} />
            <div className="grid grid-cols-2 gap-4">
              <ProjectsPanel projects={data.projects} />
              <TeamPanel team={data.team} />
            </div>
          </>
        )}

        {tab === "tasks" && <TaskBoard tasks={data.tasks} />}

        {tab === "schedule" && <CronPanel jobs={data.cron_jobs} />}

        {tab === "projects" && (
          <div className="space-y-4">
            <ProjectsPanel projects={data.projects} />
            <TeamPanel team={data.team} />
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-4 py-2 text-center text-zinc-700 text-[10px] shrink-0">
        Mission Control • extractai.xyz 🐾
      </footer>
    </div>
  );
}

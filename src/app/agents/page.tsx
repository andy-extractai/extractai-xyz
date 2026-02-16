"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Agent {
  id: string;
  name: string;
  role: string;
  emoji: string;
  status: string;
  statusMessage: string;
}

interface Step {
  id: string;
  agent: string;
  status: string;
  retries: number;
  type: string;
  currentStory: string | null;
}

interface Story {
  id: string;
  title: string;
  status: string;
  retries: number;
}

interface ActiveRun {
  id: string;
  workflow: string;
  task: string;
  status: string;
  runNumber: number;
  createdAt: string;
}

interface RunSummary {
  id: string;
  workflow: string;
  status: string;
  runNumber: number;
  createdAt: string;
}

interface ApiResponse {
  timestamp: string;
  activeRun: ActiveRun | null;
  agents: Agent[];
  steps: Step[];
  stories: Story[];
  runs: RunSummary[];
  error?: string;
}

function StatusDot({ status }: { status: string }) {
  const config: Record<string, { dot: string; ping: boolean }> = {
    active: { dot: "bg-emerald-400 shadow-emerald-400/50", ping: true },
    done: { dot: "bg-blue-400 shadow-blue-400/50", ping: false },
    idle: { dot: "bg-zinc-600", ping: false },
    error: { dot: "bg-red-500 shadow-red-500/50", ping: true },
    waiting: { dot: "bg-zinc-600", ping: false },
  };
  const c = config[status] || config.idle;
  return (
    <span className="relative flex h-3 w-3">
      {c.ping && (
        <span
          className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${c.dot.split(" ")[0]}`}
        />
      )}
      <span className={`relative inline-flex h-3 w-3 rounded-full shadow-sm ${c.dot}`} />
    </span>
  );
}

function StatusLabel({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "text-emerald-400",
    done: "text-blue-400",
    idle: "text-zinc-600",
    error: "text-red-400",
    waiting: "text-zinc-600",
    running: "text-emerald-400",
    pending: "text-yellow-400",
    completed: "text-blue-400",
    failed: "text-red-400",
    cancelled: "text-zinc-500",
  };
  return (
    <span className={`text-[10px] font-medium uppercase tracking-wider ${colors[status] || "text-zinc-500"}`}>
      {status}
    </span>
  );
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
      {role}
    </span>
  );
}

function StepBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    done: "border-blue-500/30 bg-blue-500/10 text-blue-400",
    running: "border-emerald-400/30 bg-emerald-400/10 text-emerald-400",
    pending: "border-yellow-400/30 bg-yellow-400/10 text-yellow-400",
    waiting: "border-zinc-700 bg-zinc-800/50 text-zinc-500",
    failed: "border-red-500/30 bg-red-500/10 text-red-400",
    error: "border-red-500/30 bg-red-500/10 text-red-400",
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${colors[status] || colors.waiting}`}>
      {status}
    </span>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AgentsPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<string>("");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/agents-state.json?t=" + Date.now(), { cache: "no-store" });
      const json = await res.json();
      if (json.error) {
        setError(json.error);
      } else {
        setData(json);
        setError(null);
      }
      setLastFetch(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    } catch {
      setError("Failed to connect to API");
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const agents = data?.agents || [];
  const steps = data?.steps || [];
  const stories = data?.stories || [];
  const activeRun = data?.activeRun;
  const andy = agents.find((a) => a.id === "andy");
  const workers = agents.filter((a) => a.id !== "andy");
  const activeCount = agents.filter((a) => a.status === "active").length;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <nav className="p-6 flex items-center justify-between">
        <Link href="/" className="text-zinc-500 hover:text-white transition-colors text-sm">
          ← extractai
        </Link>
        <div className="flex items-center gap-3">
          {error && <span className="text-xs text-red-400">⚠ {error}</span>}
          <span className="text-xs text-zinc-600">Updated {lastFetch}</span>
          <span className={`h-2 w-2 rounded-full ${error ? "bg-red-500" : "bg-emerald-400"}`} />
        </div>
      </nav>

      <main className="flex-1 px-6 pb-12 max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-200">Agent Status</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {activeCount} of {agents.length} agents active
            {activeRun && (
              <span className="text-zinc-600">
                {" "}
                · Run #{activeRun.runNumber || 1} ({activeRun.status})
              </span>
            )}
          </p>
        </div>

        {/* Active Run Banner */}
        {activeRun && (
          <div className="mb-6 border border-zinc-800 rounded-xl p-4 bg-zinc-900/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <StatusLabel status={activeRun.status} />
                <span className="text-xs text-zinc-500">
                  {activeRun.workflow} · Run #{activeRun.runNumber || 1}
                </span>
              </div>
              <span className="text-xs text-zinc-600">{timeAgo(activeRun.createdAt)}</span>
            </div>
            <p className="text-sm text-zinc-300 line-clamp-2">{activeRun.task}</p>
          </div>
        )}

        {/* Andy (Lead) */}
        {andy && (
          <div className="mb-6">
            <div className="border border-emerald-400/30 bg-emerald-400/5 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <StatusDot status={andy.status} />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-lg">
                        {andy.name} {andy.emoji}
                      </h2>
                      <RoleBadge role={andy.role} />
                    </div>
                    <p className="text-sm text-zinc-400 mt-0.5">{andy.statusMessage}</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">
                  Lead
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Connecting line */}
        <div className="flex justify-center mb-6">
          <div className="w-px h-8 bg-zinc-800" />
        </div>

        {/* Worker Agents Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-10">
          {workers.map((agent) => (
            <div
              key={agent.id}
              className={`border rounded-xl p-4 transition-all ${
                agent.status === "active"
                  ? "border-emerald-400/30 bg-emerald-400/5"
                  : agent.status === "done"
                  ? "border-blue-500/20 bg-blue-500/5"
                  : agent.status === "error"
                  ? "border-red-500/20 bg-red-500/5"
                  : "border-zinc-800 bg-zinc-900/30"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <StatusDot status={agent.status} />
                  <div>
                    <h3 className="font-medium text-sm">
                      {agent.emoji} {agent.name}
                    </h3>
                    <RoleBadge role={agent.role} />
                  </div>
                </div>
                <StatusLabel status={agent.status} />
              </div>
              <p className="text-xs text-zinc-500 mt-2 ml-5 truncate">{agent.statusMessage}</p>
            </div>
          ))}
        </div>

        {/* Pipeline Steps */}
        {steps.length > 0 && (
          <div className="mb-10">
            <h2 className="text-sm font-medium text-zinc-400 mb-4">Pipeline</h2>
            <div className="flex flex-wrap items-center gap-2">
              {steps.map((step, i) => (
                <div key={step.id} className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <StepBadge status={step.status} />
                    <span className="text-xs text-zinc-400">{step.id}</span>
                    {step.retries > 0 && (
                      <span className="text-[10px] text-yellow-500">↻{step.retries}</span>
                    )}
                  </div>
                  {i < steps.length - 1 && <span className="text-zinc-700">→</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stories */}
        {stories.length > 0 && (
          <div className="mb-10">
            <h2 className="text-sm font-medium text-zinc-400 mb-4">
              Stories ({stories.filter((s) => s.status === "done").length}/{stories.length} complete)
            </h2>
            <div className="space-y-2">
              {stories.map((story) => (
                <div
                  key={story.id}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${
                    story.status === "done"
                      ? "border-blue-500/20 bg-blue-500/5"
                      : story.status === "in_progress"
                      ? "border-emerald-400/20 bg-emerald-400/5"
                      : story.status === "failed"
                      ? "border-red-500/20 bg-red-500/5"
                      : "border-zinc-800 bg-zinc-900/20"
                  }`}
                >
                  <span className="text-xs font-mono text-zinc-500 w-14 shrink-0">{story.id}</span>
                  <span className="text-xs text-zinc-300 flex-1 truncate">{story.title}</span>
                  <StepBadge status={story.status} />
                  {story.retries > 0 && (
                    <span className="text-[10px] text-yellow-500">↻{story.retries}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Active Run */}
        {!activeRun && !error && data && (
          <div className="text-center py-16 text-zinc-600">
            <p className="text-lg">No active workflow runs</p>
            <p className="text-sm mt-1">Agents are standing by</p>
          </div>
        )}

        {/* Workflows */}
        <div className="border border-zinc-800 rounded-xl p-5">
          <h2 className="text-sm font-medium text-zinc-400 mb-3">Available Workflows</h2>
          <div className="flex flex-wrap gap-2">
            {["feature-dev", "bug-fix", "security-audit"].map((wf) => (
              <span
                key={wf}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium ${
                  activeRun?.workflow === wf
                    ? "border-emerald-400/30 text-emerald-400 bg-emerald-400/5"
                    : "border-zinc-700 text-zinc-400"
                }`}
              >
                {wf}
                {activeRun?.workflow === wf && " ●"}
              </span>
            ))}
          </div>
        </div>
      </main>

      <footer className="py-8 text-center text-sm text-zinc-600">
        <p>extractai.xyz — Agents · Live from Antfarm</p>
      </footer>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Agent {
  id: string;
  name: string;
  role: string;
  status: "active" | "idle" | "offline";
  statusMessage: string;
  workflow?: string;
}

const AGENTS: Agent[] = [
  {
    id: "andy",
    name: "Andy",
    role: "Commander / Orchestrator",
    status: "active",
    statusMessage: "Managing operations",
  },
  {
    id: "planner",
    name: "Planner",
    role: "Task Decomposition",
    status: "idle",
    statusMessage: "Waiting for tasks",
    workflow: "feature-dev",
  },
  {
    id: "setup",
    name: "Setup",
    role: "Environment Prep",
    status: "idle",
    statusMessage: "Waiting for tasks",
    workflow: "feature-dev",
  },
  {
    id: "developer",
    name: "Developer",
    role: "Implementation",
    status: "idle",
    statusMessage: "Waiting for tasks",
    workflow: "feature-dev",
  },
  {
    id: "verifier",
    name: "Verifier",
    role: "QA / Sanity Check",
    status: "idle",
    statusMessage: "Waiting for tasks",
    workflow: "feature-dev",
  },
  {
    id: "tester",
    name: "Tester",
    role: "Integration & E2E",
    status: "idle",
    statusMessage: "Waiting for tasks",
    workflow: "feature-dev",
  },
  {
    id: "reviewer",
    name: "Reviewer",
    role: "Code Review",
    status: "idle",
    statusMessage: "Waiting for tasks",
    workflow: "feature-dev",
  },
];

function StatusDot({ status }: { status: Agent["status"] }) {
  const colors = {
    active: "bg-emerald-400 shadow-emerald-400/50",
    idle: "bg-yellow-400 shadow-yellow-400/50",
    offline: "bg-zinc-600",
  };
  return (
    <span className="relative flex h-3 w-3">
      {status === "active" && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
      )}
      <span
        className={`relative inline-flex h-3 w-3 rounded-full shadow-sm ${colors[status]}`}
      />
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

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>(AGENTS);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  useEffect(() => {
    const update = () => {
      setLastUpdated(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    update();
    const interval = setInterval(update, 5000);
    return () => clearInterval(interval);
  }, []);

  const activeCount = agents.filter((a) => a.status === "active").length;
  const totalCount = agents.length;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <nav className="p-6 flex items-center justify-between">
        <Link
          href="/"
          className="text-zinc-500 hover:text-white transition-colors text-sm"
        >
          ← extractai
        </Link>
        <span className="text-xs text-zinc-600">
          Updated {lastUpdated}
        </span>
      </nav>

      <main className="flex-1 px-6 pb-12 max-w-3xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-200">Agent Status</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {activeCount} of {totalCount} agents active
          </p>
        </div>

        {/* Agent commanding the hierarchy */}
        <div className="mb-6">
          <div className="border border-emerald-400/30 bg-emerald-400/5 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <StatusDot status={agents[0].status} />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-lg">{agents[0].name} 🐾</h2>
                    <RoleBadge role={agents[0].role} />
                  </div>
                  <p className="text-sm text-zinc-400 mt-0.5">
                    {agents[0].statusMessage}
                  </p>
                </div>
              </div>
              <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">
                Lead
              </span>
            </div>
          </div>
        </div>

        {/* Connecting line */}
        <div className="flex justify-center mb-6">
          <div className="w-px h-8 bg-zinc-800" />
        </div>

        {/* Worker agents grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {agents.slice(1).map((agent) => (
            <div
              key={agent.id}
              className={`border rounded-xl p-4 transition-all ${
                agent.status === "active"
                  ? "border-emerald-400/30 bg-emerald-400/5"
                  : agent.status === "idle"
                  ? "border-zinc-800 bg-zinc-900/30"
                  : "border-zinc-800/50 bg-zinc-900/10 opacity-50"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <StatusDot status={agent.status} />
                  <div>
                    <h3 className="font-medium text-sm">{agent.name}</h3>
                    <RoleBadge role={agent.role} />
                  </div>
                </div>
                <span
                  className={`text-[10px] font-medium uppercase tracking-wider ${
                    agent.status === "active"
                      ? "text-emerald-400"
                      : agent.status === "idle"
                      ? "text-yellow-400"
                      : "text-zinc-600"
                  }`}
                >
                  {agent.status}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-2 ml-5">
                {agent.statusMessage}
              </p>
            </div>
          ))}
        </div>

        {/* Workflows */}
        <div className="mt-10 border border-zinc-800 rounded-xl p-5">
          <h2 className="text-sm font-medium text-zinc-400 mb-3">Available Workflows</h2>
          <div className="flex flex-wrap gap-2">
            {["feature-dev", "bug-fix", "security-audit"].map((wf) => (
              <span
                key={wf}
                className="text-xs px-3 py-1.5 rounded-full border border-zinc-700 text-zinc-400"
              >
                {wf}
              </span>
            ))}
          </div>
        </div>
      </main>

      <footer className="py-8 text-center text-sm text-zinc-600">
        <p>extractai.xyz — Agents</p>
      </footer>
    </div>
  );
}

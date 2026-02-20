/**
 * Seed Convex from the existing mission-control.json
 * Usage: CONVEX_URL=https://... npx ts-node scripts/seed-convex.ts
 *
 * Or after deployment, POST to /api/seed on the Convex HTTP router.
 */

import * as fs from "fs";
import * as path from "path";

const DATA_PATH = path.join(__dirname, "../public/data/mission-control.json");
const raw = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));

const payload = {
  agent: {
    name: raw.agent.name,
    emoji: raw.agent.emoji,
    status: raw.agent.status,
    current_task: raw.agent.current_task,
    model: raw.agent.model,
    uptime_since: raw.agent.uptime_since ?? "2026-02-15",
  },
  tasks: raw.tasks.items.map((t: Record<string, unknown>) => ({
    title: t.title,
    description: t.description,
    status: t.status,
    assigned: t.assigned,
    priority: t.priority,
    created: t.created,
    completed: t.completed,
  })),
  contacts: raw.contacts.map((c: Record<string, unknown>) => ({
    name: c.name,
    status: c.status,
    last_contact: c.last_contact,
  })),
  cronJobs: raw.cron_jobs.map((j: Record<string, unknown>) => ({
    name: j.name,
    schedule: j.schedule,
    description: j.description,
    status: j.status,
    last_run: j.last_run,
    last_status: j.last_status,
  })),
  projects: raw.projects.map((p: Record<string, unknown>) => ({
    name: p.name,
    url: p.url,
    repo: p.repo,
    status: p.status,
    pages: p.pages,
  })),
  team: [
    {
      name: "Andy",
      role: "Lead Agent / Chief of Staff",
      emoji: "🐾",
      description: "Coordinates, delegates, keeps the ship tight. First point of contact between boss and machine.",
      status: "active",
      skills: ["Orchestration", "Clarity", "Delegation"],
      is_lead: true,
    },
    {
      name: "Scout",
      role: "Research Analyst",
      emoji: "🔍",
      description: "Finds leads, tracks signals, scouts the web for opportunities and threats.",
      status: "active",
      skills: ["Speed", "Radar", "Intuition"],
    },
    {
      name: "Ledger",
      role: "Congress Trade Tracker",
      emoji: "🏛️",
      description: "Monitors congressional stock trades, parses STOCK Act filings, detects insider signals.",
      status: "active",
      skills: ["Parsing", "Detection", "Compliance"],
    },
    {
      name: "Mint",
      role: "Token Analyst",
      emoji: "🪙",
      description: "Tracks AI agent tokens on Base chain, monitors launches, scores quality.",
      status: "active",
      skills: ["DeFi", "Analytics", "Speed"],
    },
    {
      name: "Scribe",
      role: "Comms & Documentation",
      emoji: "✍️",
      description: "Drafts emails, writes docs, handles all outbound communication.",
      status: "active",
      skills: ["Writing", "Tone", "Clarity"],
    },
  ],
};

const CONVEX_URL = process.env.CONVEX_URL;
if (!CONVEX_URL) {
  console.error("Set CONVEX_URL env var (e.g. https://xxx.convex.cloud)");
  process.exit(1);
}

fetch(`${CONVEX_URL}/api/seed`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
})
  .then((r) => r.json())
  .then((res) => {
    console.log("✅ Seed complete:", res);
  })
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  });

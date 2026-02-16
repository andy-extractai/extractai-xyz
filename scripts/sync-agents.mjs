#!/usr/bin/env node
// Syncs Antfarm SQLite DB → public/agents-state.json for the live dashboard
// Run via cron or watch loop

import Database from "better-sqlite3";
import { writeFileSync, readFileSync } from "fs";
import { execSync } from "child_process";
import { join } from "path";
import { homedir } from "os";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(homedir(), ".openclaw", "antfarm", "antfarm.db");
const OUT_PATH = join(__dirname, "..", "public", "agents-state.json");

const AGENTS_DEF = [
  { id: "andy", name: "Andy", role: "Commander / Orchestrator", emoji: "🐾" },
  { id: "planner", name: "Planner", role: "Task Decomposition", emoji: "📋" },
  { id: "architect", name: "Architect", role: "Plan Review", emoji: "🏗️" },
  { id: "setup", name: "Setup", role: "Environment Prep", emoji: "⚙️" },
  { id: "developer", name: "Developer", role: "Implementation", emoji: "💻" },
  { id: "verifier", name: "Verifier", role: "QA / Sanity Check", emoji: "✅" },
  { id: "tester", name: "Tester", role: "Integration & E2E", emoji: "🧪" },
  { id: "reviewer", name: "Reviewer", role: "Code Review", emoji: "👁️" },
];

function cleanAgent(agentId) {
  return agentId.replace(/^(feature-dev|bug-fix|security-audit)_/, "");
}

function sync() {
  let db;
  try {
    db = new Database(DB_PATH, { readonly: true });
  } catch {
    const empty = {
      timestamp: new Date().toISOString(),
      activeRun: null,
      agents: AGENTS_DEF.map((a) => ({ ...a, status: "idle", statusMessage: "Waiting for tasks" })),
      steps: [],
      stories: [],
      runs: [],
    };
    writeFileSync(OUT_PATH, JSON.stringify(empty, null, 2));
    return;
  }

  // Recent runs
  const runs = db
    .prepare("SELECT id, workflow_id as workflow, task, status, created_at as createdAt, run_number as runNumber FROM runs ORDER BY created_at DESC LIMIT 5")
    .all();

  // Active or most recent run
  const activeRun = runs.find((r) => r.status === "running") || runs[0] || null;

  let steps = [];
  let stories = [];

  if (activeRun) {
    steps = db
      .prepare("SELECT step_id as id, agent_id as agent, status, retry_count as retries, type, current_story_id as currentStory FROM steps WHERE run_id = ? ORDER BY step_index")
      .all(activeRun.id);

    stories = db
      .prepare("SELECT story_id as id, title, status, retry_count as retries FROM stories WHERE run_id = ? ORDER BY story_index")
      .all(activeRun.id);
  }

  db.close();

  // Derive agent statuses from steps
  const agentStatus = {};
  for (const s of steps) {
    const name = cleanAgent(s.agent);
    if (s.status === "running" || s.status === "pending") {
      agentStatus[name] = { status: "active", msg: `Working on: ${s.id}` };
    } else if (s.status === "done" && !agentStatus[name]) {
      agentStatus[name] = { status: "done", msg: `Completed: ${s.id}` };
    } else if ((s.status === "failed" || s.status === "error") && !agentStatus[name]) {
      agentStatus[name] = { status: "error", msg: `Failed at: ${s.id}` };
    }
  }

  const agents = AGENTS_DEF.map((a) => {
    if (a.id === "andy") {
      const isRunning = activeRun?.status === "running";
      return {
        ...a,
        status: isRunning ? "active" : "idle",
        statusMessage: isRunning ? `Orchestrating run #${activeRun.runNumber || 1}` : "Waiting for tasks",
      };
    }
    const st = agentStatus[a.id];
    return {
      ...a,
      status: st?.status || "idle",
      statusMessage: st?.msg || "Waiting for tasks",
    };
  });

  // Clean step agent names
  const cleanSteps = steps.map((s) => ({ ...s, agent: cleanAgent(s.agent) }));

  // Truncate task in activeRun
  const activeRunClean = activeRun
    ? { ...activeRun, task: activeRun.task?.substring(0, 200) || "" }
    : null;

  const result = {
    timestamp: new Date().toISOString(),
    activeRun: activeRunClean,
    agents,
    steps: cleanSteps,
    stories,
    runs: runs.map((r) => ({ ...r, task: undefined })),
  };

  writeFileSync(OUT_PATH, JSON.stringify(result, null, 2));
}

// If called with --watch, loop every 10s
const watch = process.argv.includes("--watch");
sync();
console.log(`Synced → ${OUT_PATH}`);

if (watch) {
  const shouldPush = process.argv.includes("--push");
  let lastStatusKey = "";
  console.log(`Watching (10s sync${shouldPush ? " + auto-push on status change" : ""})...`);

  setInterval(() => {
    try {
      sync();

      if (shouldPush) {
        // Only push when agent statuses change (not every tick)
        const data = JSON.parse(readFileSync(OUT_PATH, "utf-8"));
        const statusKey = (data.agents || []).map(a => `${a.id}:${a.status}`).join(",")
          + "|" + (data.steps || []).map(s => `${s.id}:${s.status}`).join(",")
          + "|stories:" + (data.stories || []).length;

        if (statusKey !== lastStatusKey) {
          lastStatusKey = statusKey;
          const repoDir = join(__dirname, "..");
          try {
            // Copy the JSON, switch to main, commit, push, switch back
            const jsonPath = join(repoDir, "public", "agents-state.json");
            const tmpPath = "/tmp/agents-state.json";
            execSync(`cp "${jsonPath}" "${tmpPath}"`, { stdio: "pipe" });
            // Use git worktree to push to main without switching branches
            const worktreePath = "/tmp/extractai-main-worktree";
            try {
              execSync(`cd "${repoDir}" && git worktree add "${worktreePath}" main --quiet 2>/dev/null || true`, { stdio: "pipe", timeout: 10000 });
            } catch {}
            execSync(`cp "${tmpPath}" "${worktreePath}/public/agents-state.json"`, { stdio: "pipe" });
            execSync(
              `cd "${worktreePath}" && git add public/agents-state.json && git diff --cached --quiet || (git commit -m "sync: agent state" --no-verify && git push origin main)`,
              { stdio: "pipe", timeout: 15000 }
            );
            console.log(`[${new Date().toLocaleTimeString()}] Pushed state update`);
          } catch (e) {
            // Worktree approach — no branch switching needed, nothing to recover
            console.error("Git push error:", e.message?.substring(0, 200));
          }
        }
      }
    } catch (e) {
      console.error("Sync error:", e.message);
    }
  }, 10000);
}

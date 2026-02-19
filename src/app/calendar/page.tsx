"use client";

import { useState, useEffect } from "react";
import { useTheme } from "../components/ThemeProvider";

function t(d: boolean, dark: string, light: string) {
  return d ? dark : light;
}

interface Agent {
  name: string;
  emoji: string;
  status: string;
  current_task: string;
  model: string;
  uptime_since?: string;
}

interface CronJob {
  name: string;
  schedule: string;
  description: string;
  status: string;
  last_run: string;
  last_status: "success" | "timeout" | "error" | string;
}

interface MissionControlData {
  agent: Agent;
  cron_jobs: CronJob[];
  last_updated: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatLastRun(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function StatusChip({
  status,
  isDark,
}: {
  status: string;
  isDark: boolean;
}) {
  const cfg: Record<string, { label: string; dark: string; light: string }> = {
    success: {
      label: "success",
      dark: "bg-emerald-900/60 text-emerald-300 border border-emerald-600/40",
      light: "bg-emerald-50 text-emerald-700 border border-emerald-300",
    },
    timeout: {
      label: "timeout",
      dark: "bg-amber-900/60 text-amber-300 border border-amber-600/40",
      light: "bg-amber-50 text-amber-700 border border-amber-300",
    },
    error: {
      label: "error",
      dark: "bg-red-900/60 text-red-300 border border-red-600/40",
      light: "bg-red-50 text-red-700 border border-red-300",
    },
  };
  const c = cfg[status] || cfg.error;
  return (
    <span
      className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
        isDark ? c.dark : c.light
      }`}
    >
      {c.label}
    </span>
  );
}

// Hours at which jobs fire in a day (0-23)
const TIMELINE_HOURS = Array.from({ length: 24 }, (_, i) => i);

// Jobs visualized: name, hours they fire, color
const VISUAL_JOBS = [
  {
    name: "Daily Briefing",
    emoji: "📧",
    hours: [8],
    dark: "bg-violet-500",
    light: "bg-violet-400",
  },
  {
    name: "Backup",
    emoji: "💾",
    hours: [0, 6, 12, 18],
    dark: "bg-emerald-500",
    light: "bg-emerald-500",
  },
];

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function WeeklyTimeline({ isDark }: { isDark: boolean }) {
  const today = new Date().getDay(); // 0=Sun

  return (
    <div>
      {/* Hour axis labels */}
      <div className="flex mb-2 pl-12">
        {[0, 6, 12, 18].map((h) => (
          <div key={h} className="flex-1 text-[10px] text-left" style={{ marginLeft: h === 0 ? 0 : undefined }}>
            <span className={t(isDark, "text-zinc-500", "text-zinc-400")}>
              {h === 0 ? "12a" : h === 12 ? "12p" : h < 12 ? `${h}a` : `${h - 12}p`}
            </span>
          </div>
        ))}
        <div className="w-6" />
      </div>

      {/* Days */}
      <div className="space-y-1.5">
        {DAY_LABELS.map((day, dayIdx) => (
          <div key={day} className="flex items-center gap-2">
            {/* Day label */}
            <div
              className={`w-10 text-right text-[11px] font-medium shrink-0 ${
                dayIdx === today
                  ? t(isDark, "text-white", "text-zinc-900")
                  : t(isDark, "text-zinc-500", "text-zinc-400")
              }`}
            >
              {day}
            </div>

            {/* Timeline row */}
            <div
              className={`relative flex-1 h-6 rounded-md overflow-hidden ${t(
                isDark,
                "bg-zinc-800/60",
                "bg-zinc-100"
              )} ${dayIdx === today ? (isDark ? "ring-1 ring-zinc-600" : "ring-1 ring-zinc-300") : ""}`}
            >
              {VISUAL_JOBS.flatMap((job) =>
                job.hours.map((hr) => {
                  const pct = (hr / 24) * 100;
                  return (
                    <div
                      key={`${job.name}-${hr}`}
                      title={`${job.name} at ${hr === 0 ? "12:00 AM" : hr < 12 ? `${hr}:00 AM` : hr === 12 ? "12:00 PM" : `${hr - 12}:00 PM`}`}
                      className={`absolute top-1 bottom-1 w-2 rounded-sm ${isDark ? job.dark : job.light} opacity-90`}
                      style={{ left: `calc(${pct}% - 4px)` }}
                    />
                  );
                })
              )}
            </div>

            {/* Today marker */}
            {dayIdx === today && (
              <span
                className={`text-[10px] font-bold shrink-0 ${t(
                  isDark,
                  "text-zinc-300",
                  "text-zinc-600"
                )}`}
              >
                ←
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 pl-12">
        {VISUAL_JOBS.map((job) => (
          <div key={job.name} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-sm ${isDark ? job.dark : job.light}`} />
            <span className={`text-[11px] ${t(isDark, "text-zinc-400", "text-zinc-500")}`}>
              {job.emoji} {job.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const { theme } = useTheme();
  const d = theme === "dark";

  const [data, setData] = useState<MissionControlData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/data/mission-control.json")
      .then((r) => r.json())
      .then((json) => setData(json))
      .catch(() => setError("Failed to load schedule data"));
  }, []);

  const agent = data?.agent;
  const jobs = data?.cron_jobs ?? [];

  return (
    <div className={`min-h-screen ${t(d, "bg-zinc-950 text-white", "bg-white text-zinc-900")}`}>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Header */}
        <div className="mb-10">
          <h1 className={`text-3xl font-bold tracking-tight ${t(d, "text-white", "text-zinc-900")}`}>
            📅 Calendar
          </h1>
          <p className={`mt-1.5 text-sm ${t(d, "text-zinc-400", "text-zinc-500")}`}>
            Scheduled jobs and automated tasks
          </p>
          {error && (
            <p className="mt-2 text-xs text-red-400">⚠ {error}</p>
          )}
        </div>

        {/* Agent Status Card */}
        {agent && (
          <div
            className={`rounded-2xl border p-5 mb-8 ${t(
              d,
              "bg-zinc-900/60 border-zinc-700/60",
              "bg-zinc-50 border-zinc-200"
            )}`}
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 min-w-0">
                {/* Status dot */}
                <span className="relative flex h-3 w-3 shrink-0 mt-0.5">
                  {agent.status === "online" && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  )}
                  <span
                    className={`relative inline-flex h-3 w-3 rounded-full ${
                      agent.status === "online" ? "bg-emerald-400" : "bg-zinc-500"
                    }`}
                  />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-lg font-bold">
                      {agent.emoji} {agent.name}
                    </span>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                        agent.status === "online"
                          ? t(
                              d,
                              "bg-emerald-900/60 text-emerald-300 border border-emerald-600/40",
                              "bg-emerald-50 text-emerald-700 border border-emerald-300"
                            )
                          : t(
                              d,
                              "bg-zinc-800 text-zinc-400 border border-zinc-700",
                              "bg-zinc-100 text-zinc-500 border border-zinc-200"
                            )
                      }`}
                    >
                      {agent.status}
                    </span>
                  </div>
                  <p className={`text-sm mt-1 truncate ${t(d, "text-zinc-300", "text-zinc-600")}`}>
                    {agent.current_task}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-[11px] ${t(d, "text-zinc-500", "text-zinc-400")}`}>Model</p>
                <p className={`text-xs font-mono font-medium mt-0.5 ${t(d, "text-zinc-300", "text-zinc-600")}`}>
                  {agent.model}
                </p>
                {agent.uptime_since && (
                  <>
                    <p className={`text-[11px] mt-2 ${t(d, "text-zinc-500", "text-zinc-400")}`}>Online since</p>
                    <p className={`text-xs font-medium mt-0.5 ${t(d, "text-zinc-300", "text-zinc-600")}`}>
                      {agent.uptime_since}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Cron Jobs */}
        <section className="mb-10">
          <h2 className={`text-xs font-semibold uppercase tracking-widest mb-4 ${t(d, "text-zinc-500", "text-zinc-400")}`}>
            Scheduled Jobs
          </h2>
          {jobs.length === 0 && !error && (
            <p className={`text-sm ${t(d, "text-zinc-600", "text-zinc-400")}`}>No jobs found.</p>
          )}
          <div className="space-y-3">
            {jobs.map((job) => (
              <div
                key={job.name}
                className={`rounded-xl border p-4 sm:p-5 transition-colors ${t(
                  d,
                  "bg-zinc-900/50 border-zinc-700/50 hover:border-zinc-600/70",
                  "bg-white border-zinc-200 hover:border-zinc-300 shadow-sm"
                )}`}
              >
                <div className="flex items-start gap-3">
                  {/* Active dot */}
                  <span className="relative flex h-2.5 w-2.5 shrink-0 mt-1.5">
                    {job.status === "active" && (
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                    )}
                    <span
                      className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                        job.status === "active" ? "bg-emerald-400" : "bg-zinc-500"
                      }`}
                    />
                  </span>

                  <div className="flex-1 min-w-0">
                    {/* Name + schedule row */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
                      <span className={`font-semibold text-sm ${t(d, "text-white", "text-zinc-900")}`}>
                        {job.name}
                      </span>
                      <span
                        className={`text-xs font-mono px-2 py-0.5 rounded-md ${t(
                          d,
                          "bg-zinc-800 text-zinc-300",
                          "bg-zinc-100 text-zinc-600"
                        )}`}
                      >
                        {job.schedule}
                      </span>
                    </div>

                    {/* Description */}
                    <p className={`text-sm mb-3 ${t(d, "text-zinc-400", "text-zinc-500")}`}>
                      {job.description}
                    </p>

                    {/* Last run row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusChip status={job.last_status} isDark={d} />
                      <span className={`text-xs ${t(d, "text-zinc-500", "text-zinc-400")}`}>
                        Last run {timeAgo(job.last_run)}
                      </span>
                      <span className={`text-xs hidden sm:inline ${t(d, "text-zinc-600", "text-zinc-400")}`}>
                        · {formatLastRun(job.last_run)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Weekly Timeline */}
        <section>
          <h2 className={`text-xs font-semibold uppercase tracking-widest mb-5 ${t(d, "text-zinc-500", "text-zinc-400")}`}>
            Weekly Timeline
          </h2>
          <div
            className={`rounded-2xl border p-5 sm:p-6 ${t(
              d,
              "bg-zinc-900/50 border-zinc-700/50",
              "bg-zinc-50 border-zinc-200"
            )}`}
          >
            <WeeklyTimeline isDark={d} />
          </div>
          <p className={`mt-3 text-[11px] text-center ${t(d, "text-zinc-600", "text-zinc-400")}`}>
            All times relative to agent timezone (EST). Hover blocks for details.
          </p>
        </section>
      </main>
    </div>
  );
}

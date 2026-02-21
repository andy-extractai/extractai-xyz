"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyId = any;
import Link from "next/link";
import { useTheme } from "../../components/ThemeProvider";

function t(d: boolean, dark: string, light: string) {
  return d ? dark : light;
}

interface LessonPlan {
  _id: string;
  title: string;
  subject: string;
  gradeLevel: string;
  assignmentTypes: string[];
  duration: string;
  learningObjectives: string;
  additionalNotes?: string;
  generatedPlan?: string;
  status: string;
  createdAt: string;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function LessonPlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { theme } = useTheme();
  const d = theme === "dark";
  const plan = useQuery(api.lessonPlans.get, {
    id: id as AnyId,
  }) as LessonPlan | undefined | null;

  // Loading
  if (plan === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          className={`text-sm animate-pulse ${t(
            d,
            "text-zinc-500",
            "text-zinc-400"
          )}`}
        >
          Loading lesson plan...
        </div>
      </div>
    );
  }

  // Not found
  if (plan === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <div className="text-4xl">📚</div>
        <div className={t(d, "text-zinc-500", "text-zinc-400")}>
          Lesson plan not found
        </div>
        <Link
          href="/lesson-planner"
          className={`text-sm ${t(
            d,
            "text-zinc-600 hover:text-white",
            "text-zinc-400 hover:text-zinc-900"
          )}`}
        >
          ← Back to Lesson Planner
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header
        className={`border-b px-4 md:px-6 py-4 ${t(
          d,
          "border-zinc-800",
          "border-zinc-200"
        )}`}
      >
        <Link
          href="/lesson-planner"
          className={`text-xs font-medium transition ${t(
            d,
            "text-zinc-500 hover:text-white",
            "text-zinc-400 hover:text-zinc-900"
          )}`}
        >
          ← Lesson Planner
        </Link>
        <h1
          className={`text-xl font-bold tracking-tight mt-2 ${t(
            d,
            "text-white",
            "text-zinc-900"
          )}`}
        >
          {plan.title}
        </h1>
        <p
          className={`text-xs mt-0.5 ${t(
            d,
            "text-zinc-500",
            "text-zinc-500"
          )}`}
        >
          Created {formatDate(plan.createdAt)}
        </p>
      </header>

      {/* Content */}
      <div className="flex-1 p-4 md:p-6 max-w-4xl">
        {/* Metadata card */}
        <div
          className={`border rounded-xl p-4 mb-6 ${t(
            d,
            "bg-zinc-900/50 border-zinc-800",
            "bg-zinc-50 border-zinc-200"
          )}`}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p
                className={`text-xs font-semibold uppercase tracking-wider mb-1 ${t(
                  d,
                  "text-zinc-500",
                  "text-zinc-400"
                )}`}
              >
                Subject
              </p>
              <p
                className={`text-sm font-medium ${t(
                  d,
                  "text-white",
                  "text-zinc-900"
                )}`}
              >
                {plan.subject}
              </p>
            </div>
            <div>
              <p
                className={`text-xs font-semibold uppercase tracking-wider mb-1 ${t(
                  d,
                  "text-zinc-500",
                  "text-zinc-400"
                )}`}
              >
                Grade
              </p>
              <p
                className={`text-sm font-medium ${t(
                  d,
                  "text-white",
                  "text-zinc-900"
                )}`}
              >
                {plan.gradeLevel}
              </p>
            </div>
            <div>
              <p
                className={`text-xs font-semibold uppercase tracking-wider mb-1 ${t(
                  d,
                  "text-zinc-500",
                  "text-zinc-400"
                )}`}
              >
                Duration
              </p>
              <p
                className={`text-sm font-medium ${t(
                  d,
                  "text-white",
                  "text-zinc-900"
                )}`}
              >
                {plan.duration || "Not specified"}
              </p>
            </div>
            <div>
              <p
                className={`text-xs font-semibold uppercase tracking-wider mb-1 ${t(
                  d,
                  "text-zinc-500",
                  "text-zinc-400"
                )}`}
              >
                Status
              </p>
              {plan.status === "pending" || plan.status === "generating" ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  Generating...
                </span>
              ) : plan.status === "done" ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
                  Ready
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-400">
                  <span className="inline-block w-2 h-2 rounded-full bg-red-400" />
                  Error
                </span>
              )}
            </div>
          </div>

          {/* Assignment types pills */}
          {plan.assignmentTypes.length > 0 && (
            <div className={`mt-4 pt-4 border-t ${t(d, "border-zinc-800", "border-zinc-200")}`}>
              <p
                className={`text-xs font-semibold uppercase tracking-wider mb-2 ${t(
                  d,
                  "text-zinc-500",
                  "text-zinc-400"
                )}`}
              >
                Assignment Types
              </p>
              <div className="flex flex-wrap gap-2">
                {plan.assignmentTypes.map((type) => (
                  <span
                    key={type}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${t(
                      d,
                      "bg-emerald-500/15 text-emerald-400",
                      "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    )}`}
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Learning Objectives */}
          <div className={`mt-4 pt-4 border-t ${t(d, "border-zinc-800", "border-zinc-200")}`}>
            <p
              className={`text-xs font-semibold uppercase tracking-wider mb-2 ${t(
                d,
                "text-zinc-500",
                "text-zinc-400"
              )}`}
            >
              Learning Objectives
            </p>
            <p
              className={`text-sm leading-relaxed ${t(
                d,
                "text-zinc-300",
                "text-zinc-700"
              )}`}
            >
              {plan.learningObjectives}
            </p>
          </div>

          {/* Additional Notes */}
          {plan.additionalNotes && (
            <div className={`mt-4 pt-4 border-t ${t(d, "border-zinc-800", "border-zinc-200")}`}>
              <p
                className={`text-xs font-semibold uppercase tracking-wider mb-2 ${t(
                  d,
                  "text-zinc-500",
                  "text-zinc-400"
                )}`}
              >
                Additional Notes
              </p>
              <p
                className={`text-sm leading-relaxed ${t(
                  d,
                  "text-zinc-300",
                  "text-zinc-700"
                )}`}
              >
                {plan.additionalNotes}
              </p>
            </div>
          )}
        </div>

        {/* Generated Plan Content */}
        {(plan.status === "pending" || plan.status === "generating") && (
          <div
            className={`border border-dashed rounded-xl p-8 text-center ${t(
              d,
              "border-zinc-800",
              "border-zinc-300"
            )}`}
          >
            <div className="text-3xl mb-3">⏳</div>
            <p
              className={`text-sm font-medium ${t(
                d,
                "text-zinc-400",
                "text-zinc-500"
              )}`}
            >
              Generating your lesson plan
              <span className="inline-flex w-6 text-left">
                <span className="animate-pulse">...</span>
              </span>
            </p>
            <p
              className={`text-xs mt-2 ${t(
                d,
                "text-zinc-600",
                "text-zinc-400"
              )}`}
            >
              This usually takes a minute or two. This page will update
              automatically.
            </p>
          </div>
        )}

        {plan.status === "done" && plan.generatedPlan && (
          <div
            className={`border rounded-xl p-6 ${t(
              d,
              "bg-zinc-900 border-zinc-800",
              "bg-white border-zinc-200 shadow-sm"
            )}`}
          >
            <h2
              className={`text-sm font-bold mb-4 ${t(
                d,
                "text-zinc-300",
                "text-zinc-700"
              )}`}
            >
              Generated Lesson Plan
            </h2>
            <pre
              className={`text-sm leading-relaxed whitespace-pre-wrap font-sans ${t(
                d,
                "text-zinc-300",
                "text-zinc-700"
              )}`}
            >
              {plan.generatedPlan}
            </pre>
          </div>
        )}

        {plan.status === "error" && (
          <div
            className={`border border-dashed rounded-xl p-8 text-center ${t(
              d,
              "border-red-500/30",
              "border-red-200"
            )}`}
          >
            <div className="text-3xl mb-3">❌</div>
            <p
              className={`text-sm font-medium ${t(
                d,
                "text-red-400",
                "text-red-600"
              )}`}
            >
              Something went wrong generating this lesson plan.
            </p>
            <p
              className={`text-xs mt-2 mb-4 ${t(
                d,
                "text-zinc-600",
                "text-zinc-400"
              )}`}
            >
              You can try creating a new one from the Lesson Planner page.
            </p>
            <Link
              href="/lesson-planner"
              className="inline-block text-xs font-bold px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition"
            >
              ← Back to Lesson Planner
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

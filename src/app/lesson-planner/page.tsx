"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";
import { useTheme } from "../components/ThemeProvider";

function t(d: boolean, dark: string, light: string) {
  return d ? dark : light;
}

const GRADE_LEVELS = [
  "Kindergarten",
  "1st Grade",
  "2nd Grade",
  "3rd Grade",
  "4th Grade",
  "5th Grade",
  "6th Grade",
  "7th Grade",
  "8th Grade",
  "9th Grade",
  "10th Grade",
  "11th Grade",
  "12th Grade",
  "College",
];

const ASSIGNMENT_TYPES = [
  "Lecture",
  "Discussion",
  "Lab/Experiment",
  "Essay",
  "Quiz/Test",
  "Group Project",
  "Presentation",
  "Homework",
  "Activity/Worksheet",
];

const DURATIONS = [
  "30 minutes",
  "45 minutes",
  "60 minutes",
  "90 minutes",
  "2 hours",
  "Full day",
];

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

function StatusBadge({ status, d }: { status: string; d: boolean }) {
  if (status === "pending" || status === "generating") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${t(
          d,
          "bg-amber-500/15 text-amber-400",
          "bg-amber-50 text-amber-600 border border-amber-200"
        )}`}
      >
        <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        Generating...
      </span>
    );
  }
  if (status === "done") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${t(
          d,
          "bg-emerald-500/15 text-emerald-400",
          "bg-emerald-50 text-emerald-600 border border-emerald-200"
        )}`}
      >
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
        Ready
      </span>
    );
  }
  if (status === "error") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${t(
          d,
          "bg-red-500/15 text-red-400",
          "bg-red-50 text-red-600 border border-red-200"
        )}`}
      >
        <span className="inline-block w-2 h-2 rounded-full bg-red-400" />
        Error
      </span>
    );
  }
  return null;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function PlanCard({ plan, d }: { plan: LessonPlan; d: boolean }) {
  return (
    <Link href={`/lesson-planner/${plan._id}`}>
      <div
        className={`border rounded-xl p-4 transition-all cursor-pointer ${t(
          d,
          "bg-zinc-900 border-zinc-800 hover:border-zinc-600 hover:shadow-lg hover:shadow-black/40",
          "bg-white border-zinc-200 hover:border-zinc-300 shadow-sm hover:shadow-md"
        )}`}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3
            className={`text-sm font-semibold leading-snug ${t(
              d,
              "text-white",
              "text-zinc-900"
            )}`}
          >
            {plan.title}
          </h3>
          <StatusBadge status={plan.status} d={d} />
        </div>
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${t(
              d,
              "bg-emerald-500/15 text-emerald-400",
              "bg-emerald-50 text-emerald-700 border border-emerald-200"
            )}`}
          >
            {plan.subject}
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${t(
              d,
              "bg-zinc-800 text-zinc-400",
              "bg-zinc-100 text-zinc-600"
            )}`}
          >
            {plan.gradeLevel}
          </span>
        </div>
        <div
          className={`text-xs ${t(d, "text-zinc-600", "text-zinc-400")}`}
        >
          {formatDate(plan.createdAt)}
        </div>
      </div>
    </Link>
  );
}

export default function LessonPlannerPage() {
  const { theme } = useTheme();
  const d = theme === "dark";
  const plans = useQuery(api.lessonPlans.list);

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [assignmentTypes, setAssignmentTypes] = useState<string[]>([]);
  const [duration, setDuration] = useState("");
  const [learningObjectives, setLearningObjectives] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState("");

  function toggleAssignment(type: string) {
    setAssignmentTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !subject || !gradeLevel || !learningObjectives) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/lesson-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subject,
          gradeLevel,
          assignmentTypes,
          duration,
          learningObjectives,
          additionalNotes: additionalNotes || undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to create lesson plan");

      setTitle("");
      setSubject("");
      setGradeLevel("");
      setAssignmentTypes([]);
      setDuration("");
      setLearningObjectives("");
      setAdditionalNotes("");
      setBanner("Lesson plan is being generated...");
      setTimeout(() => setBanner(""), 5000);
    } catch {
      setBanner("Failed to create lesson plan. Please try again.");
      setTimeout(() => setBanner(""), 5000);
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls = `w-full rounded-lg border px-3 py-2 text-sm outline-none transition ${t(
    d,
    "bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-emerald-500",
    "bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500"
  )}`;

  const labelCls = `block text-xs font-semibold mb-1.5 ${t(
    d,
    "text-zinc-400",
    "text-zinc-600"
  )}`;

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
        <h1
          className={`text-xl font-bold tracking-tight ${t(
            d,
            "text-white",
            "text-zinc-900"
          )}`}
        >
          📚 Lesson Planner
        </h1>
        <p
          className={`text-xs mt-0.5 ${t(
            d,
            "text-zinc-500",
            "text-zinc-500"
          )}`}
        >
          AI-generated lesson plans for any subject, grade, and format.
        </p>
      </header>

      {/* Banner */}
      {banner && (
        <div
          className={`px-4 md:px-6 py-3 text-sm font-medium ${
            banner.includes("Failed")
              ? t(
                  d,
                  "bg-red-500/10 text-red-400 border-b border-red-500/20",
                  "bg-red-50 text-red-600 border-b border-red-200"
                )
              : t(
                  d,
                  "bg-emerald-500/10 text-emerald-400 border-b border-emerald-500/20",
                  "bg-emerald-50 text-emerald-600 border-b border-emerald-200"
                )
          }`}
        >
          {banner}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-0">
          {/* Left: Form */}
          <div className={`md:pr-6 md:border-r ${t(d, "md:border-zinc-800", "md:border-zinc-200")}`}>
            <h2
              className={`text-sm font-bold mb-4 ${t(
                d,
                "text-zinc-300",
                "text-zinc-700"
              )}`}
            >
              Create New Lesson Plan
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className={labelCls}>
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  className={inputCls}
                  placeholder="e.g. Introduction to Fractions"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              {/* Subject */}
              <div>
                <label className={labelCls}>
                  Subject <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  className={inputCls}
                  placeholder="e.g. Mathematics, English, Science"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>

              {/* Grade Level */}
              <div>
                <label className={labelCls}>
                  Grade Level <span className="text-red-400">*</span>
                </label>
                <select
                  className={inputCls}
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  required
                >
                  <option value="">Select grade level...</option>
                  {GRADE_LEVELS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              {/* Assignment Types */}
              <div>
                <label className={labelCls}>Assignment Types</label>
                <div className="flex flex-wrap gap-2">
                  {ASSIGNMENT_TYPES.map((type) => {
                    const active = assignmentTypes.includes(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => toggleAssignment(type)}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition ${
                          active
                            ? t(
                                d,
                                "bg-emerald-500/20 border-emerald-500/40 text-emerald-400",
                                "bg-emerald-50 border-emerald-300 text-emerald-700"
                              )
                            : t(
                                d,
                                "bg-zinc-900 border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300",
                                "bg-white border-zinc-300 text-zinc-500 hover:border-zinc-400 hover:text-zinc-700"
                              )
                        }`}
                      >
                        {active ? "✓ " : ""}
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className={labelCls}>Duration</label>
                <select
                  className={inputCls}
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                >
                  <option value="">Select duration...</option>
                  {DURATIONS.map((dur) => (
                    <option key={dur} value={dur}>
                      {dur}
                    </option>
                  ))}
                </select>
              </div>

              {/* Learning Objectives */}
              <div>
                <label className={labelCls}>
                  Learning Objectives <span className="text-red-400">*</span>
                </label>
                <textarea
                  className={`${inputCls} min-h-[80px] resize-y`}
                  placeholder="What should students learn?"
                  value={learningObjectives}
                  onChange={(e) => setLearningObjectives(e.target.value)}
                  required
                />
              </div>

              {/* Additional Notes */}
              <div>
                <label className={labelCls}>Additional Notes</label>
                <textarea
                  className={`${inputCls} min-h-[60px] resize-y`}
                  placeholder="Any special requirements, accommodations, etc."
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={
                  submitting ||
                  !title ||
                  !subject ||
                  !gradeLevel ||
                  !learningObjectives
                }
                className={`w-full py-2.5 rounded-lg text-sm font-bold transition ${
                  submitting ||
                  !title ||
                  !subject ||
                  !gradeLevel ||
                  !learningObjectives
                    ? t(
                        d,
                        "bg-zinc-800 text-zinc-600 cursor-not-allowed",
                        "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                      )
                    : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                }`}
              >
                {submitting ? "Creating..." : "Generate Lesson Plan"}
              </button>
            </form>
          </div>

          {/* Right: List */}
          <div className="md:pl-6">
            <h2
              className={`text-sm font-bold mb-4 ${t(
                d,
                "text-zinc-300",
                "text-zinc-700"
              )}`}
            >
              Your Lesson Plans
            </h2>

            {plans === undefined && (
              <div
                className={`text-center py-16 text-sm animate-pulse ${t(
                  d,
                  "text-zinc-500",
                  "text-zinc-400"
                )}`}
              >
                Loading plans...
              </div>
            )}

            {plans !== undefined && plans.length === 0 && (
              <div
                className={`text-center py-16 border border-dashed rounded-xl ${t(
                  d,
                  "border-zinc-800 text-zinc-600",
                  "border-zinc-300 text-zinc-400"
                )}`}
              >
                <div className="text-3xl mb-3">📝</div>
                <p className="text-sm">No lesson plans yet.</p>
                <p className="text-xs mt-1">
                  Create your first one →
                </p>
              </div>
            )}

            {plans !== undefined && plans.length > 0 && (
              <div className="space-y-3">
                {plans.map((plan) => (
                  <PlanCard
                    key={(plan as LessonPlan)._id}
                    plan={plan as LessonPlan}
                    d={d}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";
import { useTheme } from "../components/ThemeProvider";
import { motion, AnimatePresence } from "framer-motion";

function t(d: boolean, dark: string, light: string) {
  return d ? dark : light;
}

const GRADE_LEVELS = [
  "Kindergarten","1st Grade","2nd Grade","3rd Grade","4th Grade","5th Grade",
  "6th Grade","7th Grade","8th Grade","9th Grade","10th Grade","11th Grade",
  "12th Grade","College",
];

const ASSIGNMENT_TYPES = [
  "Lecture","Discussion","Lab / Experiment","Essay","Quiz / Test",
  "Group Project","Presentation","Homework","Activity / Worksheet",
];

const DURATIONS = ["30 min","45 min","60 min","90 min","2 hours","Full day"];

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

// ── Motion variants ──────────────────────────────────────────────────────────
const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -48 : 48, opacity: 0 }),
};

const cardContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const cardItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 28 } },
};

// ── Shared input style ────────────────────────────────────────────────────────
function inputCls(d: boolean) {
  return `w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-all ${t(
    d,
    "bg-zinc-900/80 border-zinc-700/80 text-white placeholder:text-zinc-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30",
    "bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/20"
  )}`;
}

function labelCls(d: boolean) {
  return `block text-[10px] font-bold tracking-widest uppercase mb-2 ${t(d, "text-zinc-500", "text-zinc-400")}`;
}

// ── Plan card ─────────────────────────────────────────────────────────────────
function PlanCard({ plan, d }: { plan: LessonPlan; d: boolean }) {
  const isPending = plan.status === "pending" || plan.status === "generating";
  const isDone = plan.status === "done";

  return (
    <motion.div variants={cardItem}>
      <Link href={`/lesson-planner/${plan._id}`}>
        <div className={`group relative flex gap-0 rounded-xl overflow-hidden border transition-all ${t(
          d,
          "border-zinc-800 hover:border-zinc-600 bg-zinc-900/60",
          "border-zinc-200 hover:border-zinc-300 bg-white shadow-sm hover:shadow-md"
        )}`}>
          {/* Left accent stripe */}
          <div className={`w-1 flex-shrink-0 transition-all ${
            isDone
              ? "bg-indigo-500 group-hover:bg-indigo-400"
              : isPending
              ? "bg-amber-500 animate-pulse"
              : t(d, "bg-zinc-800", "bg-zinc-200")
          }`} />

          {/* Content */}
          <div className="flex-1 p-4">
            <div className="flex items-start justify-between gap-3">
              <h3 className={`text-sm font-semibold leading-snug ${t(d, "text-white", "text-zinc-900")}`}>
                {plan.title}
              </h3>
              <span className={`flex-shrink-0 text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md ${
                isDone
                  ? t(d, "bg-indigo-500/15 text-indigo-400", "bg-indigo-50 text-indigo-600")
                  : isPending
                  ? t(d, "bg-amber-500/15 text-amber-400", "bg-amber-50 text-amber-600")
                  : t(d, "bg-zinc-800 text-zinc-500", "bg-zinc-100 text-zinc-500")
              }`}>
                {isPending ? "generating" : plan.status}
              </span>
            </div>
            <div className={`mt-2 flex items-center gap-2 text-[11px] ${t(d, "text-zinc-500", "text-zinc-400")}`}>
              <span>{plan.subject}</span>
              <span>·</span>
              <span>{plan.gradeLevel}</span>
              <span>·</span>
              <span>{new Date(plan.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function LessonPlannerPage() {
  const { theme } = useTheme();
  const d = theme === "dark";
  const plans = useQuery(api.lessonPlans.list);

  // Form state
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState("");
  const [success, setSuccess] = useState(false);

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [assignmentTypes, setAssignmentTypes] = useState<string[]>([]);
  const [duration, setDuration] = useState("");
  const [learningObjectives, setLearningObjectives] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  const STEPS = [
    { label: "About",      num: 1 },
    { label: "Format",     num: 2 },
    { label: "Objectives", num: 3 },
  ];

  function goTo(next: number) {
    setDir(next > step ? 1 : -1);
    setStep(next);
  }

  function toggleAssignment(type: string) {
    setAssignmentTypes((prev) =>
      prev.includes(type) ? prev.filter((x) => x !== type) : [...prev, type]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/lesson-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, subject, gradeLevel, assignmentTypes, duration, learningObjectives, additionalNotes: additionalNotes || undefined }),
      });
      if (!res.ok) throw new Error();
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setTitle(""); setSubject(""); setGradeLevel("");
        setAssignmentTypes([]); setDuration("");
        setLearningObjectives(""); setAdditionalNotes("");
        setDir(1); setStep(0);
      }, 2200);
    } catch {
      setBanner("Something went wrong. Try again.");
      setTimeout(() => setBanner(""), 4000);
    } finally {
      setSubmitting(false);
    }
  }

  const step0Valid = title.trim() && subject.trim() && gradeLevel;
  const step2Valid = learningObjectives.trim();

  return (
    <div className={`min-h-screen flex flex-col ${t(d, "bg-zinc-950", "bg-zinc-50")}`}>

      {/* Header */}
      <header className={`border-b px-6 py-5 ${t(d, "border-zinc-800/80", "border-zinc-200")}`}>
        <div className="max-w-4xl mx-auto flex items-end justify-between">
          <div>
            <p className={`text-[10px] font-bold tracking-widest uppercase mb-1 ${t(d, "text-indigo-400", "text-indigo-500")}`}>
              extractai · tools
            </p>
            <h1 className={`text-2xl font-bold tracking-tight ${t(d, "text-white", "text-zinc-900")}`}>
              Lesson Planner
            </h1>
          </div>
          <p className={`text-xs hidden sm:block ${t(d, "text-zinc-600", "text-zinc-400")}`}>
            AI-generated · any subject · any grade
          </p>
        </div>
      </header>

      {/* Banner */}
      <AnimatePresence>
        {banner && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className={`px-6 py-3 text-sm font-medium border-b ${t(d, "bg-red-500/10 text-red-400 border-red-500/20", "bg-red-50 text-red-600 border-red-200")}`}
          >
            {banner}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 lg:gap-12">

        {/* ── LEFT: Wizard form ─────────────────────────────────────────────── */}
        <div>
          {/* Step progress */}
          <div className="flex items-center gap-0 mb-8">
            {STEPS.map((s, i) => (
              <div key={s.num} className="flex items-center">
                <button
                  onClick={() => i < step ? goTo(i) : undefined}
                  className={`flex items-center gap-2 transition-all ${i < step ? "cursor-pointer" : "cursor-default"}`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                    i === step
                      ? t(d, "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30", "bg-indigo-500 text-white")
                      : i < step
                      ? t(d, "bg-indigo-500/20 text-indigo-400", "bg-indigo-100 text-indigo-600")
                      : t(d, "bg-zinc-800 text-zinc-600", "bg-zinc-200 text-zinc-400")
                  }`}>
                    {i < step ? "✓" : s.num}
                  </span>
                  <span className={`text-xs font-semibold hidden sm:inline transition-all ${
                    i === step
                      ? t(d, "text-white", "text-zinc-900")
                      : t(d, "text-zinc-600", "text-zinc-400")
                  }`}>
                    {s.label}
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`w-8 h-px mx-2 ${i < step ? t(d, "bg-indigo-500/40", "bg-indigo-200") : t(d, "bg-zinc-800", "bg-zinc-200")}`} />
                )}
              </div>
            ))}
          </div>

          {/* Step content */}
          <div className="relative overflow-hidden">
            <AnimatePresence custom={dir} mode="wait">
              {success ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-20 gap-4"
                >
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.1 }}
                    className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center text-3xl"
                  >
                    ✓
                  </motion.div>
                  <p className={`text-sm font-semibold ${t(d, "text-white", "text-zinc-900")}`}>Generating your plan…</p>
                  <p className={`text-xs ${t(d, "text-zinc-500", "text-zinc-400")}`}>Check back in a moment.</p>
                </motion.div>
              ) : step === 0 ? (
                <motion.div key="step0" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit"
                  transition={{ type: "spring", stiffness: 320, damping: 30 }}
                  className="space-y-5"
                >
                  <div>
                    <label className={labelCls(d)}>Lesson title</label>
                    <input
                      type="text" autoFocus
                      className={`${inputCls(d)} text-base font-semibold`}
                      placeholder="e.g. Introduction to Fractions"
                      value={title} onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls(d)}>Subject</label>
                      <input
                        type="text" className={inputCls(d)}
                        placeholder="Math, English…"
                        value={subject} onChange={(e) => setSubject(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={labelCls(d)}>Grade level</label>
                      <select className={inputCls(d)} value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)}>
                        <option value="">Select…</option>
                        {GRADE_LEVELS.map((g) => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="pt-2">
                    <button onClick={() => goTo(1)} disabled={!step0Valid}
                      className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                        step0Valid
                          ? "bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                          : t(d, "bg-zinc-800 text-zinc-600 cursor-not-allowed", "bg-zinc-200 text-zinc-400 cursor-not-allowed")
                      }`}>
                      Next →
                    </button>
                  </div>
                </motion.div>

              ) : step === 1 ? (
                <motion.div key="step1" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit"
                  transition={{ type: "spring", stiffness: 320, damping: 30 }}
                  className="space-y-6"
                >
                  <div>
                    <label className={labelCls(d)}>Assignment types</label>
                    <div className="flex flex-wrap gap-2">
                      {ASSIGNMENT_TYPES.map((type) => {
                        const active = assignmentTypes.includes(type);
                        return (
                          <button key={type} type="button" onClick={() => toggleAssignment(type)}
                            className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                              active
                                ? t(d, "bg-indigo-500/20 border-indigo-500/50 text-indigo-400", "bg-indigo-50 border-indigo-300 text-indigo-700")
                                : t(d, "bg-zinc-900 border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300", "bg-white border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:text-zinc-700")
                            }`}>
                            {active && <span className="mr-1">✓</span>}{type}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className={labelCls(d)}>Duration</label>
                    <div className="flex flex-wrap gap-2">
                      {DURATIONS.map((dur) => (
                        <button key={dur} type="button" onClick={() => setDuration(dur === duration ? "" : dur)}
                          className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                            dur === duration
                              ? t(d, "bg-indigo-500/20 border-indigo-500/50 text-indigo-400", "bg-indigo-50 border-indigo-300 text-indigo-700")
                              : t(d, "bg-zinc-900 border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300", "bg-white border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:text-zinc-700")
                          }`}>
                          {dur}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => goTo(0)}
                      className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all border ${t(d, "border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500", "border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:border-zinc-400")}`}>
                      ← Back
                    </button>
                    <button onClick={() => goTo(2)}
                      className="px-6 py-2.5 rounded-lg text-sm font-bold bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 transition-all">
                      Next →
                    </button>
                  </div>
                </motion.div>

              ) : (
                <motion.div key="step2" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit"
                  transition={{ type: "spring", stiffness: 320, damping: 30 }}
                >
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label className={labelCls(d)}>Learning objectives <span className="text-red-400 normal-case">*</span></label>
                      <textarea autoFocus
                        className={`${inputCls(d)} min-h-[100px] resize-y`}
                        placeholder="What should students understand or be able to do?"
                        value={learningObjectives} onChange={(e) => setLearningObjectives(e.target.value)} required
                      />
                    </div>
                    <div>
                      <label className={labelCls(d)}>Additional notes</label>
                      <textarea
                        className={`${inputCls(d)} min-h-[64px] resize-y`}
                        placeholder="Accommodations, special requirements, context…"
                        value={additionalNotes} onChange={(e) => setAdditionalNotes(e.target.value)}
                      />
                    </div>

                    {/* Summary */}
                    <div className={`rounded-lg border p-3 text-xs space-y-1 ${t(d, "border-zinc-800 bg-zinc-900/50", "border-zinc-100 bg-zinc-50")}`}>
                      <p className={t(d, "text-zinc-500", "text-zinc-400")}>
                        <span className={`font-semibold ${t(d, "text-zinc-300", "text-zinc-700")}`}>{title}</span>
                        {subject && <> · {subject}</>}
                        {gradeLevel && <> · {gradeLevel}</>}
                        {duration && <> · {duration}</>}
                      </p>
                      {assignmentTypes.length > 0 && (
                        <p className={t(d, "text-zinc-600", "text-zinc-400")}>{assignmentTypes.join(" · ")}</p>
                      )}
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => goTo(1)}
                        className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all border ${t(d, "border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500", "border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:border-zinc-400")}`}>
                        ← Back
                      </button>
                      <button type="submit" disabled={submitting || !step2Valid}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                          submitting || !step2Valid
                            ? t(d, "bg-zinc-800 text-zinc-600 cursor-not-allowed", "bg-zinc-200 text-zinc-400 cursor-not-allowed")
                            : "bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                        }`}>
                        {submitting ? "Creating…" : "Generate Lesson Plan"}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── RIGHT: Plan list ──────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-[10px] font-bold tracking-widest uppercase ${t(d, "text-zinc-500", "text-zinc-400")}`}>
              Your Plans
            </h2>
            {plans && plans.length > 0 && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${t(d, "bg-zinc-800 text-zinc-500", "bg-zinc-100 text-zinc-500")}`}>
                {plans.length}
              </span>
            )}
          </div>

          {plans === undefined && (
            <div className={`space-y-2`}>
              {[1,2,3].map(i => (
                <div key={i} className={`h-16 rounded-xl animate-pulse ${t(d, "bg-zinc-900", "bg-zinc-100")}`} />
              ))}
            </div>
          )}

          {plans !== undefined && plans.length === 0 && (
            <div className={`rounded-xl border border-dashed py-12 text-center ${t(d, "border-zinc-800", "border-zinc-200")}`}>
              <p className={`text-sm ${t(d, "text-zinc-600", "text-zinc-400")}`}>No plans yet.</p>
              <p className={`text-xs mt-1 ${t(d, "text-zinc-700", "text-zinc-500")}`}>Create your first one →</p>
            </div>
          )}

          {plans !== undefined && plans.length > 0 && (
            <motion.div
              variants={cardContainer} initial="hidden" animate="show"
              className="space-y-2"
            >
              {plans.map((plan) => (
                <PlanCard key={(plan as LessonPlan)._id} plan={plan as LessonPlan} d={d} />
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

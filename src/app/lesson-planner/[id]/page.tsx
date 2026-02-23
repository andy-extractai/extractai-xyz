"use client";

import { use, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyId = any;
import Link from "next/link";
import { useTheme } from "../../components/ThemeProvider";
import { motion } from "framer-motion";

// ── Document generation ───────────────────────────────────────────────────────

async function downloadPptx(plan: LessonPlan, sections: Section[]) {
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";

  const BG_DARK  = "0f0f13";
  const BG_SLIDE = "16161d";
  const INDIGO   = "6366f1";
  const WHITE    = "ffffff";
  const MUTED    = "9999bb";
  const BORDER   = "2a2a3a";

  // ── Title slide ──
  const title = pptx.addSlide();
  title.background = { color: BG_DARK };
  title.addShape(pptx.ShapeType.rect, { x: 0, y: 3.8, w: 10, h: 0.04, fill: { color: INDIGO } });
  title.addText(plan.subject.toUpperCase(), {
    x: 0.6, y: 1.4, w: 8.8, h: 0.4, fontSize: 12, bold: true,
    color: INDIGO, charSpacing: 4,
  });
  title.addText(plan.title, {
    x: 0.6, y: 1.9, w: 8.8, h: 1.6, fontSize: 36, bold: true, color: WHITE,
    breakLine: false, wrap: true,
  });
  const meta = [plan.gradeLevel, plan.duration].filter(Boolean).join("  ·  ");
  if (meta) title.addText(meta, { x: 0.6, y: 3.55, w: 8.8, h: 0.3, fontSize: 13, color: MUTED });

  // ── Objectives slide ──
  if (plan.learningObjectives) {
    const obj = pptx.addSlide();
    obj.background = { color: BG_SLIDE };
    obj.addText("🎯  LEARNING OBJECTIVES", { x: 0.6, y: 0.4, w: 8.8, h: 0.5, fontSize: 11, bold: true, color: INDIGO, charSpacing: 3 });
    obj.addShape(pptx.ShapeType.rect, { x: 0.6, y: 0.95, w: 8.8, h: 0.025, fill: { color: BORDER } });
    obj.addText(plan.learningObjectives, { x: 0.6, y: 1.15, w: 8.8, h: 3.5, fontSize: 16, color: WHITE, valign: "top", wrap: true });
  }

  // ── Section slides ──
  const ICONS: Record<string, string> = {
    "overview": "📋", "learning objectives": "🎯", "materials needed": "📦",
    "materials": "📦", "lesson outline": "🕐", "activities & exercises": "🔬",
    "activities and exercises": "🔬", "activities": "🔬", "assessment": "📊",
    "differentiation strategies": "♿", "homework/extension": "📝", "homework": "📝",
  };

  for (const section of sections) {
    if (section.title.toLowerCase().includes("overview") && plan.learningObjectives) {
      // Skip re-adding objectives already shown
    }
    const slide = pptx.addSlide();
    slide.background = { color: BG_SLIDE };
    const icon = ICONS[section.title.toLowerCase()] ?? "📄";
    slide.addText(`${icon}  ${section.title.toUpperCase()}`, {
      x: 0.6, y: 0.4, w: 8.8, h: 0.5, fontSize: 11, bold: true, color: INDIGO, charSpacing: 3,
    });
    slide.addShape(pptx.ShapeType.rect, { x: 0.6, y: 0.95, w: 8.8, h: 0.025, fill: { color: BORDER } });

    // Parse bullets from content
    const lines = parseContentLines(section.content)
      .filter(l => l.type !== "blank")
      .slice(0, 14);

    if (lines.length > 0) {
      const bullets = lines.map(l => ({
        text: l.type === "timeline" ? `${l.time}  —  ${l.content}` : l.content,
        options: { bullet: l.type === "bullet" || l.type === "numbered", fontSize: 14, color: l.type === "timeline" ? "aaaaee" : "ccccdd" }
      }));
      slide.addText(bullets, { x: 0.6, y: 1.2, w: 8.8, h: 3.5, valign: "top", wrap: true });
    } else {
      const plain = section.content.trim().slice(0, 600);
      slide.addText(plain, { x: 0.6, y: 1.2, w: 8.8, h: 3.5, fontSize: 14, color: "ccccdd", valign: "top", wrap: true });
    }

    // Footer
    slide.addText(plan.title, {
      x: 0.6, y: 5.1, w: 8.8, h: 0.25, fontSize: 9, color: BORDER, align: "left",
    });
  }

  await pptx.writeFile({ fileName: `${plan.title.replace(/[^a-z0-9 ]/gi, "")}.pptx` });
}

async function downloadDocx(plan: LessonPlan, sections: Section[]) {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } = await import("docx");

  const children: InstanceType<typeof Paragraph>[] = [];

  // Title
  children.push(
    new Paragraph({
      children: [new TextRun({ text: plan.title, bold: true, size: 56, color: "1e1e2e" })],
      heading: HeadingLevel.TITLE,
      spacing: { after: 200 },
    })
  );

  // Meta line
  const metaParts = [plan.subject, plan.gradeLevel, plan.duration].filter(Boolean).join("  ·  ");
  children.push(
    new Paragraph({
      children: [new TextRun({ text: metaParts, size: 22, color: "6366f1", bold: true })],
      spacing: { after: 120 },
    })
  );

  // Assignment types
  if (plan.assignmentTypes.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: plan.assignmentTypes.join("  ·  "), size: 20, color: "888888" })],
        spacing: { after: 300 },
      })
    );
  }

  // Objectives callout
  if (plan.learningObjectives) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: "🎯  Learning Objectives", bold: true, size: 26, color: "4f46e5" })],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 160 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "e0e0f0" } },
      })
    );
    children.push(
      new Paragraph({
        children: [new TextRun({ text: plan.learningObjectives, size: 22 })],
        spacing: { after: 300 },
      })
    );
  }

  // Sections
  const SECTION_ICONS: Record<string, string> = {
    "overview": "📋", "learning objectives": "🎯", "materials needed": "📦",
    "lesson outline": "🕐", "activities & exercises": "🔬", "assessment": "📊",
    "differentiation strategies": "♿", "homework/extension": "📝",
  };

  for (const section of sections) {
    const icon = SECTION_ICONS[section.title.toLowerCase()] ?? "📄";
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `${icon}  ${section.title}`, bold: true, size: 28, color: "4f46e5" })],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 160 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "e0e0f0" } },
      })
    );

    const lines = parseContentLines(section.content);
    for (const line of lines) {
      if (line.type === "blank") {
        children.push(new Paragraph({ children: [], spacing: { after: 80 } }));
        continue;
      }
      if (line.type === "bullet") {
        children.push(new Paragraph({
          children: [new TextRun({ text: line.content, size: 22 })],
          bullet: { level: 0 },
          spacing: { after: 80 },
        }));
      } else if (line.type === "numbered") {
        children.push(new Paragraph({
          children: [new TextRun({ text: `${line.num}. ${line.content}`, size: 22 })],
          spacing: { after: 80 },
        }));
      } else if (line.type === "timeline") {
        children.push(new Paragraph({
          children: [
            new TextRun({ text: `${line.time}  — `, bold: true, color: "6366f1", size: 22 }),
            new TextRun({ text: line.content, size: 22 }),
          ],
          spacing: { after: 100 },
        }));
      } else {
        children.push(new Paragraph({
          children: [new TextRun({ text: line.content, size: 22 })],
          spacing: { after: 80 },
          alignment: AlignmentType.LEFT,
        }));
      }
    }
  }

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 22 } },
      },
    },
    sections: [{ properties: {}, children }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${plan.title.replace(/[^a-z0-9 ]/gi, "")}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}

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

// ── Section config ────────────────────────────────────────────────────────────
const SECTION_META: Record<string, { icon: string; accent: string }> = {
  "overview":                  { icon: "📋", accent: "indigo" },
  "learning objectives":       { icon: "🎯", accent: "violet" },
  "materials needed":          { icon: "📦", accent: "amber"  },
  "materials":                 { icon: "📦", accent: "amber"  },
  "lesson outline":            { icon: "🕐", accent: "blue"   },
  "activities & exercises":    { icon: "🔬", accent: "emerald"},
  "activities and exercises":  { icon: "🔬", accent: "emerald"},
  "activities":                { icon: "🔬", accent: "emerald"},
  "assessment":                { icon: "📊", accent: "teal"   },
  "differentiation strategies":{ icon: "♿", accent: "pink"   },
  "differentiation":           { icon: "♿", accent: "pink"   },
  "homework/extension":        { icon: "📝", accent: "orange" },
  "homework":                  { icon: "📝", accent: "orange" },
  "extension":                 { icon: "📝", accent: "orange" },
  "closing":                   { icon: "✅", accent: "emerald"},
  "introduction":              { icon: "👋", accent: "blue"   },
  "resources":                 { icon: "🔗", accent: "zinc"   },
};

const ACCENT_DOT: Record<string, string> = {
  indigo:  "bg-indigo-500",
  violet:  "bg-violet-500",
  amber:   "bg-amber-500",
  blue:    "bg-blue-500",
  emerald: "bg-emerald-500",
  teal:    "bg-teal-500",
  pink:    "bg-pink-500",
  orange:  "bg-orange-500",
  zinc:    "bg-zinc-500",
};

const ACCENT_BORDER: Record<string, { d: string; l: string }> = {
  indigo:  { d: "border-indigo-500/30",  l: "border-indigo-200"  },
  violet:  { d: "border-violet-500/30",  l: "border-violet-200"  },
  amber:   { d: "border-amber-500/30",   l: "border-amber-200"   },
  blue:    { d: "border-blue-500/30",    l: "border-blue-200"    },
  emerald: { d: "border-emerald-500/30", l: "border-emerald-200" },
  teal:    { d: "border-teal-500/30",    l: "border-teal-200"    },
  pink:    { d: "border-pink-500/30",    l: "border-pink-200"    },
  orange:  { d: "border-orange-500/30",  l: "border-orange-200"  },
  zinc:    { d: "border-zinc-700",       l: "border-zinc-200"    },
};

// ── Markdown parser ───────────────────────────────────────────────────────────
interface Section { title: string; content: string }

function parseSections(text: string): Section[] {
  const lines = text.split("\n");
  const sections: Section[] = [];
  let current: Section | null = null;

  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (current) sections.push(current);
      current = { title: line.replace(/^##\s+/, "").trim(), content: "" };
    } else if (line.startsWith("# ")) {
      // top-level heading — skip or treat as preamble
    } else {
      if (current) {
        current.content += line + "\n";
      }
    }
  }
  if (current) sections.push(current);

  // If no ## sections found, treat whole thing as one block
  if (sections.length === 0 && text.trim()) {
    sections.push({ title: "Lesson Plan", content: text });
  }

  return sections;
}

// Render a line of markdown-ish text to JSX (bold, inline code)
function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) {
      return <strong key={i} className="font-semibold">{p.slice(2, -2)}</strong>;
    }
    if (p.startsWith("`") && p.endsWith("`")) {
      return <code key={i} className="text-[11px] font-mono px-1 py-0.5 rounded bg-black/10">{p.slice(1, -1)}</code>;
    }
    return p;
  });
}

// Time pattern: "(0-5 min)", "(5 min)", "5-10 minutes:", etc.
const TIME_RE = /^\*?\*?(\d+[-–]\d+\s*(?:min(?:utes?)?|hours?)|~?\d+\s*(?:min(?:utes?)?|hours?))\*?\*?:?\s*/i;

interface ParsedLine { type: "bullet" | "numbered" | "timeline" | "text" | "blank"; content: string; time?: string; num?: number }

function parseContentLines(content: string): ParsedLine[] {
  const lines = content.split("\n");
  const result: ParsedLine[] = [];

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) { result.push({ type: "blank", content: "" }); continue; }

    // Bullet
    if (/^[\-\*]\s+/.test(line)) {
      result.push({ type: "bullet", content: line.replace(/^[\-\*]\s+/, "") });
      continue;
    }
    // Numbered list
    const numMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      result.push({ type: "numbered", content: numMatch[2], num: parseInt(numMatch[1]) });
      continue;
    }
    // Timeline row (bold time prefix)
    const timeMatch = line.match(TIME_RE);
    if (timeMatch) {
      result.push({ type: "timeline", time: timeMatch[1], content: line.slice(timeMatch[0].length) });
      continue;
    }
    result.push({ type: "text", content: line });
  }

  // Strip leading/trailing blanks
  while (result.length && result[0].type === "blank") result.shift();
  while (result.length && result[result.length - 1].type === "blank") result.pop();

  return result;
}

// ── Checkbox item (materials list) ───────────────────────────────────────────
function CheckItem({ text, d }: { text: string; d: boolean }) {
  const [checked, setChecked] = useState(false);
  return (
    <button
      onClick={() => setChecked(!checked)}
      className={`flex items-start gap-2.5 w-full text-left group`}
    >
      <span className={`flex-shrink-0 mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-all ${
        checked
          ? "bg-indigo-500 border-indigo-500"
          : t(d, "border-zinc-600 group-hover:border-zinc-400", "border-zinc-300 group-hover:border-zinc-500")
      }`}>
        {checked && <span className="text-white text-[9px] leading-none">✓</span>}
      </span>
      <span className={`text-sm leading-relaxed transition-all ${checked ? t(d, "text-zinc-600 line-through", "text-zinc-400 line-through") : t(d, "text-zinc-300", "text-zinc-700")}`}>
        {renderInline(text)}
      </span>
    </button>
  );
}

// ── Section renderer ──────────────────────────────────────────────────────────
function SectionCard({ section, d, index }: { section: Section; d: boolean; index: number }) {
  const key = section.title.toLowerCase().trim();
  const meta = SECTION_META[key] ?? { icon: "📄", accent: "zinc" };
  const dot = ACCENT_DOT[meta.accent] ?? "bg-zinc-500";
  const border = ACCENT_BORDER[meta.accent] ?? ACCENT_BORDER.zinc;
  const isMaterials = key.includes("material");
  const isOutline = key.includes("outline");
  const lines = parseContentLines(section.content);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: "spring", stiffness: 280, damping: 28 }}
      className={`rounded-xl border overflow-hidden ${t(d, `bg-zinc-900/60 ${border.d}`, `bg-white ${border.l} shadow-sm`)}`}
    >
      {/* Section header */}
      <div className={`flex items-center gap-2.5 px-4 py-3 border-b ${t(d, "border-zinc-800/60", "border-zinc-100")}`}>
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
        <span className="text-base leading-none">{meta.icon}</span>
        <h3 className={`text-sm font-bold tracking-tight ${t(d, "text-white", "text-zinc-900")}`}>
          {section.title}
        </h3>
      </div>

      {/* Section content */}
      <div className="px-4 py-4 space-y-1.5">
        {lines.length === 0 && (
          <p className={`text-sm ${t(d, "text-zinc-500", "text-zinc-400")}`}>—</p>
        )}

        {isOutline ? (
          // Timeline layout
          <div className="space-y-0">
            {lines.filter(l => l.type !== "blank").map((line, i) => {
              if (line.type === "timeline") {
                return (
                  <div key={i} className={`flex gap-3 py-2.5 border-b last:border-0 ${t(d, "border-zinc-800/60", "border-zinc-100")}`}>
                    <span className={`flex-shrink-0 text-[10px] font-bold uppercase tracking-wider mt-0.5 w-20 ${t(d, "text-indigo-400", "text-indigo-600")}`}>
                      {line.time}
                    </span>
                    <span className={`text-sm leading-relaxed flex-1 ${t(d, "text-zinc-300", "text-zinc-700")}`}>
                      {renderInline(line.content)}
                    </span>
                  </div>
                );
              }
              if (line.type === "bullet") {
                return (
                  <div key={i} className={`flex gap-3 py-2 border-b last:border-0 ${t(d, "border-zinc-800/60", "border-zinc-100")}`}>
                    <span className={`flex-shrink-0 w-1.5 h-1.5 rounded-full mt-2 ${dot}`} />
                    <span className={`text-sm leading-relaxed ${t(d, "text-zinc-300", "text-zinc-700")}`}>
                      {renderInline(line.content)}
                    </span>
                  </div>
                );
              }
              return (
                <p key={i} className={`text-sm leading-relaxed py-1 ${t(d, "text-zinc-400", "text-zinc-600")}`}>
                  {renderInline(line.content)}
                </p>
              );
            })}
          </div>
        ) : isMaterials ? (
          // Checklist layout
          <div className="space-y-2.5">
            {lines.filter(l => l.type !== "blank").map((line, i) => {
              if (line.type === "bullet" || line.type === "numbered") {
                return <CheckItem key={i} text={line.content} d={d} />;
              }
              return (
                <p key={i} className={`text-sm leading-relaxed ${t(d, "text-zinc-400", "text-zinc-600")}`}>
                  {renderInline(line.content)}
                </p>
              );
            })}
          </div>
        ) : (
          // Default layout
          <div className="space-y-1.5">
            {lines.map((line, i) => {
              if (line.type === "blank") return <div key={i} className="h-1" />;
              if (line.type === "bullet") {
                return (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className={`flex-shrink-0 w-1.5 h-1.5 rounded-full mt-2 ${dot}`} />
                    <span className={`text-sm leading-relaxed ${t(d, "text-zinc-300", "text-zinc-700")}`}>
                      {renderInline(line.content)}
                    </span>
                  </div>
                );
              }
              if (line.type === "numbered") {
                return (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className={`flex-shrink-0 text-[11px] font-bold w-5 text-right mt-0.5 ${t(d, "text-zinc-500", "text-zinc-400")}`}>
                      {line.num}.
                    </span>
                    <span className={`text-sm leading-relaxed ${t(d, "text-zinc-300", "text-zinc-700")}`}>
                      {renderInline(line.content)}
                    </span>
                  </div>
                );
              }
              return (
                <p key={i} className={`text-sm leading-relaxed ${t(d, "text-zinc-300", "text-zinc-700")}`}>
                  {renderInline(line.content)}
                </p>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function LessonPlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { theme } = useTheme();
  const d = theme === "dark";
  const plan = useQuery(api.lessonPlans.get, { id: id as AnyId }) as LessonPlan | undefined | null;
  const resetToPending = useMutation(api.lessonPlans.resetToPending);
  const [pptxLoading, setPptxLoading] = useState(false);
  const [docxLoading, setDocxLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  async function handleRegenerate() {
    if (!plan || regenerating) return;
    setRegenerating(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await resetToPending({ id: plan._id as any });
    } finally {
      // Keep spinner until Convex real-time update flips status to "pending"
      setTimeout(() => setRegenerating(false), 1500);
    }
  }

  async function handlePptx(plan: LessonPlan, sections: Section[]) {
    setPptxLoading(true);
    try { await downloadPptx(plan, sections); } finally { setPptxLoading(false); }
  }
  async function handleDocx(plan: LessonPlan, sections: Section[]) {
    setDocxLoading(true);
    try { await downloadDocx(plan, sections); } finally { setDocxLoading(false); }
  }

  if (plan === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-2 w-full max-w-2xl px-6">
          {[1,2,3].map(i => (
            <div key={i} className={`h-24 rounded-xl animate-pulse ${t(d, "bg-zinc-900", "bg-zinc-100")}`} />
          ))}
        </div>
      </div>
    );
  }

  if (plan === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <span className="text-4xl">📚</span>
        <p className={`text-sm ${t(d, "text-zinc-500", "text-zinc-400")}`}>Plan not found.</p>
        <Link href="/lesson-planner" className="text-xs text-indigo-400 hover:text-indigo-300">
          ← Back to Lesson Planner
        </Link>
      </div>
    );
  }

  const isPending = plan.status === "pending" || plan.status === "generating";
  const sections = plan.generatedPlan ? parseSections(plan.generatedPlan) : [];

  return (
    <div className={`min-h-screen flex flex-col ${t(d, "bg-zinc-950", "bg-zinc-50")}`}>

      {/* Header */}
      <header className={`border-b px-6 py-5 ${t(d, "border-zinc-800/80", "border-zinc-200")}`}>
        <div className="max-w-3xl mx-auto">
          <Link href="/lesson-planner" className={`text-[11px] font-medium transition ${t(d, "text-zinc-500 hover:text-white", "text-zinc-400 hover:text-zinc-900")}`}>
            ← Lesson Planner
          </Link>

          <div className="mt-3 flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <p className={`text-[10px] font-bold tracking-widest uppercase mb-1 ${t(d, "text-indigo-400", "text-indigo-500")}`}>
                {plan.subject}
              </p>
              <h1 className={`text-2xl font-bold tracking-tight leading-tight ${t(d, "text-white", "text-zinc-900")}`}>
                {plan.title}
              </h1>
            </div>
            {/* Action buttons */}
            {(plan.status === "done" || plan.status === "error") && (
              <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                {plan.status === "done" && sections.length > 0 && (
                  <>
                    <button
                      onClick={() => handleDocx(plan, sections)}
                      disabled={docxLoading}
                      className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${t(d, "border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 disabled:opacity-40", "border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:border-zinc-400 disabled:opacity-40")}`}
                    >
                      {docxLoading ? "⏳" : "📄"} {docxLoading ? "Generating…" : "Word"}
                    </button>
                    <button
                      onClick={() => handlePptx(plan, sections)}
                      disabled={pptxLoading}
                      className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${t(d, "border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 disabled:opacity-40", "border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:border-zinc-400 disabled:opacity-40")}`}
                    >
                      {pptxLoading ? "⏳" : "📊"} {pptxLoading ? "Generating…" : "PowerPoint"}
                    </button>
                    <button
                      onClick={() => window.print()}
                      className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${t(d, "border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500", "border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:border-zinc-400")}`}
                    >
                      🖨 Print
                    </button>
                  </>
                )}
                <button
                  onClick={handleRegenerate}
                  disabled={regenerating}
                  className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${t(d, "border-indigo-500/50 text-indigo-400 hover:border-indigo-400 hover:text-indigo-300 disabled:opacity-40", "border-indigo-300 text-indigo-600 hover:border-indigo-400 hover:text-indigo-700 disabled:opacity-40")}`}
                >
                  {regenerating ? "⏳" : "↺"} {regenerating ? "Queuing…" : "Regenerate"}
                </button>
              </div>
            )}
          </div>

          {/* Meta pills */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {plan.gradeLevel && (
              <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${t(d, "bg-zinc-800 text-zinc-400", "bg-zinc-100 text-zinc-600")}`}>
                {plan.gradeLevel}
              </span>
            )}
            {plan.duration && (
              <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${t(d, "bg-zinc-800 text-zinc-400", "bg-zinc-100 text-zinc-600")}`}>
                ⏱ {plan.duration}
              </span>
            )}
            {plan.assignmentTypes.map(type => (
              <span key={type} className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${t(d, "bg-indigo-500/15 text-indigo-400", "bg-indigo-50 text-indigo-700")}`}>
                {type}
              </span>
            ))}
            <span className={`text-[11px] ml-auto ${t(d, "text-zinc-600", "text-zinc-400")}`}>
              {new Date(plan.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </span>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8">

        {/* Objectives callout */}
        {plan.learningObjectives && (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl border-l-4 border-indigo-500 px-4 py-3.5 mb-6 ${t(d, "bg-indigo-500/8 border-r border-t border-b border-r-indigo-500/20 border-t-indigo-500/20 border-b-indigo-500/20", "bg-indigo-50 border-r border-t border-b border-indigo-100")}`}
          >
            <p className={`text-[10px] font-bold tracking-widest uppercase mb-1.5 ${t(d, "text-indigo-400", "text-indigo-600")}`}>
              🎯 Learning Objectives
            </p>
            <p className={`text-sm leading-relaxed ${t(d, "text-zinc-300", "text-zinc-700")}`}>
              {plan.learningObjectives}
            </p>
          </motion.div>
        )}

        {/* Generating state */}
        {isPending && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className={`rounded-xl border border-dashed py-16 text-center ${t(d, "border-zinc-800", "border-zinc-200")}`}
          >
            <div className="flex justify-center gap-1.5 mb-4">
              {[0,1,2].map(i => (
                <span key={i} className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
            <p className={`text-sm font-medium ${t(d, "text-zinc-400", "text-zinc-600")}`}>
              Generating your lesson plan…
            </p>
            <p className={`text-xs mt-2 ${t(d, "text-zinc-600", "text-zinc-400")}`}>
              This page will update automatically.
            </p>
          </motion.div>
        )}

        {/* Generated sections */}
        {plan.status === "done" && sections.length > 0 && (
          <div className="space-y-4">
            {sections.map((section, i) => (
              <SectionCard key={section.title} section={section} d={d} index={i} />
            ))}
          </div>
        )}

        {/* Error */}
        {plan.status === "error" && (
          <div className={`rounded-xl border border-dashed py-12 text-center space-y-4 ${t(d, "border-red-500/30", "border-red-200")}`}>
            <p className="text-2xl">⚠️</p>
            <p className={`text-sm font-medium ${t(d, "text-red-400", "text-red-600")}`}>Generation failed.</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleRegenerate}
                disabled={regenerating}
                className="text-xs font-bold px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white transition"
              >
                {regenerating ? "Queuing…" : "↺ Try Again"}
              </button>
              <Link href="/lesson-planner" className={`text-xs ${t(d, "text-zinc-500 hover:text-white", "text-zinc-400 hover:text-zinc-900")}`}>
                ← Back
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useTheme } from "../components/ThemeProvider";

function t(d: boolean, dark: string, light: string) {
  return d ? dark : light;
}

interface Contact {
  name: string;
  status: string;
  last_contact: string;
}

interface MCData {
  contacts: Contact[];
}

interface PersonConfig {
  key: string;
  emoji: string;
  relation: string;
  email: string;
  borderColor: string;
  accentBg: string;
  accentText: string;
  pillBg: string;
  pillText: string;
}

const PERSON_CONFIG: Record<string, PersonConfig> = {
  Zack: {
    key: "Zack",
    emoji: "💰",
    relation: "Brother",
    email: "zackpln01@gmail.com",
    borderColor: "border-amber-500/50",
    accentBg: "bg-amber-500/15",
    accentText: "text-amber-400",
    pillBg: "bg-amber-500/20",
    pillText: "text-amber-300",
  },
  Ben: {
    key: "Ben",
    emoji: "🎧",
    relation: "Friend",
    email: "benjaminlinuscarmody@gmail.com",
    borderColor: "border-violet-500/50",
    accentBg: "bg-violet-500/15",
    accentText: "text-violet-400",
    pillBg: "bg-violet-500/20",
    pillText: "text-violet-300",
  },
  Colin: {
    key: "Colin",
    emoji: "🎵",
    relation: "Friend",
    email: "colints902@gmail.com",
    borderColor: "border-sky-500/50",
    accentBg: "bg-sky-500/15",
    accentText: "text-sky-400",
    pillBg: "bg-sky-500/20",
    pillText: "text-sky-300",
  },
  "Ted (Dad)": {
    key: "Ted (Dad)",
    emoji: "👨‍👦",
    relation: "Father",
    email: "tedkaplan@optonline.net",
    borderColor: "border-emerald-500/50",
    accentBg: "bg-emerald-500/15",
    accentText: "text-emerald-400",
    pillBg: "bg-emerald-500/20",
    pillText: "text-emerald-300",
  },
};

// Light-mode variants for accents
const PERSON_CONFIG_LIGHT: Record<string, { borderColor: string; accentBg: string; accentText: string; pillBg: string; pillText: string }> = {
  Zack: {
    borderColor: "border-amber-400/60",
    accentBg: "bg-amber-50",
    accentText: "text-amber-600",
    pillBg: "bg-amber-100",
    pillText: "text-amber-700",
  },
  Ben: {
    borderColor: "border-violet-400/60",
    accentBg: "bg-violet-50",
    accentText: "text-violet-600",
    pillBg: "bg-violet-100",
    pillText: "text-violet-700",
  },
  Colin: {
    borderColor: "border-sky-400/60",
    accentBg: "bg-sky-50",
    accentText: "text-sky-600",
    pillBg: "bg-sky-100",
    pillText: "text-sky-700",
  },
  "Ted (Dad)": {
    borderColor: "border-emerald-400/60",
    accentBg: "bg-emerald-50",
    accentText: "text-emerald-600",
    pillBg: "bg-emerald-100",
    pillText: "text-emerald-700",
  },
};

function daysAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface PersonCardProps {
  contact: Contact;
  isDark: boolean;
}

function PersonCard({ contact, isDark }: PersonCardProps) {
  const cfg = PERSON_CONFIG[contact.name];
  if (!cfg) return null;

  const lCfg = PERSON_CONFIG_LIGHT[contact.name];

  const borderColor = isDark ? cfg.borderColor : lCfg.borderColor;
  const accentBg = isDark ? cfg.accentBg : lCfg.accentBg;
  const accentText = isDark ? cfg.accentText : lCfg.accentText;
  const pillBg = isDark ? cfg.pillBg : lCfg.pillBg;
  const pillText = isDark ? cfg.pillText : lCfg.pillText;

  const cardBg = t(isDark, "bg-zinc-900", "bg-white");
  const cardBorder = `border ${borderColor}`;
  const nameCls = t(isDark, "text-white", "text-zinc-900");
  const statusCls = t(isDark, "text-zinc-300", "text-zinc-700");
  const mutedCls = t(isDark, "text-zinc-500", "text-zinc-400");
  const emailCls = t(isDark, "text-zinc-500", "text-zinc-400");
  const dateLabelCls = t(isDark, "text-zinc-500", "text-zinc-400");
  const dateValCls = t(isDark, "text-zinc-300", "text-zinc-600");
  const dividerCls = t(isDark, "border-zinc-800", "border-zinc-100");

  return (
    <div
      className={`${cardBg} ${cardBorder} rounded-2xl p-6 flex flex-col gap-5 shadow-lg transition-all duration-200 hover:scale-[1.01] hover:shadow-xl`}
    >
      {/* Header: emoji circle + name + relation pill */}
      <div className="flex items-center gap-4">
        <div
          className={`w-16 h-16 rounded-full ${accentBg} flex items-center justify-center text-3xl shrink-0 shadow-sm`}
        >
          {cfg.emoji}
        </div>
        <div className="flex flex-col gap-1.5">
          <span className={`text-xl font-bold leading-tight ${nameCls}`}>{contact.name}</span>
          <span
            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full self-start ${pillBg} ${pillText}`}
          >
            {cfg.relation}
          </span>
        </div>
      </div>

      {/* Status */}
      <div className={`rounded-xl ${accentBg} px-4 py-3`}>
        <p className={`text-xs font-semibold uppercase tracking-wider ${accentText} mb-1`}>Status</p>
        <p className={`text-sm leading-relaxed ${statusCls}`}>{contact.status}</p>
      </div>

      {/* Divider */}
      <div className={`border-t ${dividerCls}`} />

      {/* Last contact */}
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wider ${dateLabelCls} mb-0.5`}>
            Last Contact
          </p>
          <p className={`text-sm font-medium ${dateValCls}`}>
            {formatDate(contact.last_contact)}
            <span className={`ml-2 text-xs ${mutedCls}`}>({daysAgo(contact.last_contact)})</span>
          </p>
        </div>
      </div>

      {/* Email */}
      <div className={`flex items-center gap-2`}>
        <span className={`text-xs ${mutedCls}`}>✉️</span>
        <a
          href={`mailto:${cfg.email}`}
          className={`text-xs font-mono ${emailCls} hover:underline hover:${accentText} transition-colors truncate`}
        >
          {cfg.email}
        </a>
      </div>
    </div>
  );
}

export default function PeoplePage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/data/mission-control.json")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load data");
        return r.json() as Promise<MCData>;
      })
      .then((data) => {
        setContacts(data.contacts ?? []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const pageBg = t(isDark, "bg-black", "bg-zinc-50");
  const headingCls = t(isDark, "text-white", "text-zinc-900");
  const subtitleCls = t(isDark, "text-zinc-400", "text-zinc-500");

  return (
    <div className={`min-h-screen ${pageBg} px-4 py-10 sm:px-6 lg:px-10`}>
      {/* Page header */}
      <div className="mb-10 max-w-4xl mx-auto">
        <h1 className={`text-3xl sm:text-4xl font-bold ${headingCls} mb-2 tracking-tight`}>
          📇 People
        </h1>
        <p className={`text-base ${subtitleCls}`}>Kyle&apos;s contacts and their current status</p>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto">
        {loading && (
          <div className={`text-center py-24 ${subtitleCls} text-sm animate-pulse`}>
            Loading contacts…
          </div>
        )}

        {error && (
          <div className="text-center py-24 text-red-500 text-sm">
            Error: {error}
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {contacts.map((contact) => (
              <PersonCard key={contact.name} contact={contact} isDark={isDark} />
            ))}
          </div>
        )}

        {!loading && !error && contacts.length === 0 && (
          <div className={`text-center py-24 ${subtitleCls} text-sm`}>
            No contacts found.
          </div>
        )}
      </div>
    </div>
  );
}

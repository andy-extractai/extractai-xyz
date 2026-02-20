"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useTheme } from "../components/ThemeProvider";

function t(d: boolean, dark: string, light: string) {
  return d ? dark : light;
}

interface Contact {
  _id: string;
  name: string;
  status: string;
  last_contact: string;
  email?: string;
  relation?: string;
}

interface PersonConfig {
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
    emoji: "💰", relation: "Brother", email: "zackpln01@gmail.com",
    borderColor: "border-amber-500/50", accentBg: "bg-amber-500/15",
    accentText: "text-amber-400", pillBg: "bg-amber-500/20", pillText: "text-amber-300",
  },
  Ben: {
    emoji: "🎧", relation: "Friend", email: "benjaminlinuscarmody@gmail.com",
    borderColor: "border-violet-500/50", accentBg: "bg-violet-500/15",
    accentText: "text-violet-400", pillBg: "bg-violet-500/20", pillText: "text-violet-300",
  },
  Colin: {
    emoji: "🎵", relation: "Friend", email: "colints902@gmail.com",
    borderColor: "border-sky-500/50", accentBg: "bg-sky-500/15",
    accentText: "text-sky-400", pillBg: "bg-sky-500/20", pillText: "text-sky-300",
  },
  "Ted (Dad)": {
    emoji: "👨‍👦", relation: "Father", email: "tedkaplan@optonline.net",
    borderColor: "border-emerald-500/50", accentBg: "bg-emerald-500/15",
    accentText: "text-emerald-400", pillBg: "bg-emerald-500/20", pillText: "text-emerald-300",
  },
};

const PERSON_CONFIG_LIGHT: Record<string, Partial<PersonConfig>> = {
  Zack:       { borderColor: "border-amber-400/60",   accentBg: "bg-amber-50",   accentText: "text-amber-600",   pillBg: "bg-amber-100",   pillText: "text-amber-700"   },
  Ben:        { borderColor: "border-violet-400/60",  accentBg: "bg-violet-50",  accentText: "text-violet-600",  pillBg: "bg-violet-100",  pillText: "text-violet-700"  },
  Colin:      { borderColor: "border-sky-400/60",     accentBg: "bg-sky-50",     accentText: "text-sky-600",     pillBg: "bg-sky-100",     pillText: "text-sky-700"     },
  "Ted (Dad)":{ borderColor: "border-emerald-400/60", accentBg: "bg-emerald-50", accentText: "text-emerald-600", pillBg: "bg-emerald-100", pillText: "text-emerald-700" },
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

function PersonCard({ contact, isDark }: { contact: Contact; isDark: boolean }) {
  const cfg = PERSON_CONFIG[contact.name];
  if (!cfg) return null;
  const lCfg = PERSON_CONFIG_LIGHT[contact.name] ?? {};

  const borderColor = isDark ? cfg.borderColor : (lCfg.borderColor ?? cfg.borderColor);
  const accentBg    = isDark ? cfg.accentBg    : (lCfg.accentBg    ?? cfg.accentBg);
  const accentText  = isDark ? cfg.accentText  : (lCfg.accentText  ?? cfg.accentText);
  const pillBg      = isDark ? cfg.pillBg      : (lCfg.pillBg      ?? cfg.pillBg);
  const pillText    = isDark ? cfg.pillText    : (lCfg.pillText    ?? cfg.pillText);

  // Use email from DB if available, fallback to config
  const email = contact.email ?? cfg.email;

  return (
    <div className={`border ${borderColor} rounded-2xl p-6 flex flex-col gap-5 shadow-lg transition-all duration-200 hover:scale-[1.01] hover:shadow-xl ${t(isDark, "bg-zinc-900", "bg-white")}`}>
      <div className="flex items-center gap-4">
        <div className={`w-16 h-16 rounded-full ${accentBg} flex items-center justify-center text-3xl shrink-0 shadow-sm`}>
          {cfg.emoji}
        </div>
        <div className="flex flex-col gap-1.5">
          <span className={`text-xl font-bold leading-tight ${t(isDark, "text-white", "text-zinc-900")}`}>{contact.name}</span>
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full self-start ${pillBg} ${pillText}`}>
            {contact.relation ?? cfg.relation}
          </span>
        </div>
      </div>

      <div className={`rounded-xl ${accentBg} px-4 py-3`}>
        <p className={`text-xs font-semibold uppercase tracking-wider ${accentText} mb-1`}>Status</p>
        <p className={`text-sm leading-relaxed ${t(isDark, "text-zinc-300", "text-zinc-700")}`}>{contact.status}</p>
      </div>

      <div className={`border-t ${t(isDark, "border-zinc-800", "border-zinc-100")}`} />

      <div className="flex items-center justify-between">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wider ${t(isDark, "text-zinc-500", "text-zinc-400")} mb-0.5`}>Last Contact</p>
          <p className={`text-sm font-medium ${t(isDark, "text-zinc-300", "text-zinc-600")}`}>
            {formatDate(contact.last_contact)}
            <span className={`ml-2 text-xs ${t(isDark, "text-zinc-500", "text-zinc-400")}`}>({daysAgo(contact.last_contact)})</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className={`text-xs ${t(isDark, "text-zinc-500", "text-zinc-400")}`}>✉️</span>
        <a href={`mailto:${email}`} className={`text-xs font-mono ${t(isDark, "text-zinc-500 hover:text-zinc-300", "text-zinc-400 hover:text-zinc-700")} hover:underline transition-colors truncate`}>
          {email}
        </a>
      </div>
    </div>
  );
}

export default function PeoplePage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const contacts = useQuery(api.contacts.list);

  return (
    <div className={`min-h-screen ${t(isDark, "bg-black", "bg-zinc-50")} px-4 py-10 sm:px-6 lg:px-10`}>
      <div className="mb-10 max-w-4xl mx-auto">
        <h1 className={`text-3xl sm:text-4xl font-bold ${t(isDark, "text-white", "text-zinc-900")} mb-2 tracking-tight`}>
          📇 People
        </h1>
        <p className={`text-base ${t(isDark, "text-zinc-400", "text-zinc-500")}`}>Kyle&apos;s contacts and their current status</p>
      </div>

      <div className="max-w-4xl mx-auto">
        {contacts === undefined && (
          <div className={`text-center py-24 text-sm animate-pulse ${t(isDark, "text-zinc-500", "text-zinc-400")}`}>
            Loading contacts…
          </div>
        )}
        {contacts !== undefined && contacts.length === 0 && (
          <div className={`text-center py-24 text-sm ${t(isDark, "text-zinc-500", "text-zinc-400")}`}>
            No contacts found.
          </div>
        )}
        {contacts !== undefined && contacts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {contacts.map((contact) => (
              <PersonCard key={contact._id} contact={contact as Contact} isDark={isDark} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

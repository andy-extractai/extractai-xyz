"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const TIMEZONES = [
  { label: "EST", zone: "America/New_York" },
  { label: "PST", zone: "America/Los_Angeles" },
  { label: "UTC", zone: "UTC" },
  { label: "ART", zone: "America/Argentina/Buenos_Aires" },
];

export default function ClockPage() {
  const [selected, setSelected] = useState("America/New_York");
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-US", {
          timeZone: selected,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
      setDate(
        now.toLocaleDateString("en-US", {
          timeZone: selected,
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      );
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [selected]);

  const activeLabel = TIMEZONES.find((tz) => tz.zone === selected)?.label;

  return (
    <div className="min-h-screen  flex flex-col">
      <nav className="p-6 relative z-10">
        <Link
          href="/"
          className="text-zinc-500 hover:text-white transition-colors text-sm"
        >
          ← extractai
        </Link>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-6 -mt-20">
        <div className="text-center space-y-8">
          <h1 className="text-2xl font-semibold text-zinc-400">World Clock</h1>

          {/* Time display */}
          <div className="space-y-2">
            <p className="text-7xl sm:text-8xl font-mono font-bold tracking-tight tabular-nums">
              {time || "\u00A0"}
            </p>
            <p className="text-lg text-zinc-500">{date || "\u00A0"}</p>
            <p className="text-sm text-emerald-400 font-medium">{activeLabel}</p>
          </div>

          {/* Timezone selector */}
          <div className="flex gap-3 justify-center pt-4">
            {TIMEZONES.map((tz) => (
              <button
                key={tz.zone}
                onClick={() => setSelected(tz.zone)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  selected === tz.zone
                    ? "bg-emerald-400 text-black"
                    : "border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white"
                }`}
              >
                {tz.label}
              </button>
            ))}
          </div>
        </div>
      </main>

      <footer className="py-8 text-center text-sm text-zinc-600">
        <p>extractai.xyz — Clock</p>
      </footer>
    </div>
  );
}

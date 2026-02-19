"use client";

/**
 * page.mobile.tsx — Responsive wrapper for ClockPage.
 *
 * Differences from page.tsx:
 *  - Time display scales from text-4xl (375 px) → text-7xl (md) → text-8xl (lg)
 *  - Timezone buttons wrap and shrink on narrow screens
 *  - Padding / spacing tightened for mobile viewports
 *  - All desktop behaviour is identical; only CSS classes changed.
 */

import { useState, useEffect } from "react";
import Link from "next/link";

const TIMEZONES = [
  { label: "EST", zone: "America/New_York" },
  { label: "PST", zone: "America/Los_Angeles" },
  { label: "UTC", zone: "UTC" },
  { label: "ART", zone: "America/Argentina/Buenos_Aires" },
];

export default function ClockPageMobile() {
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
    <div className="min-h-screen flex flex-col">
      {/* Nav — tighter padding on mobile */}
      <nav className="px-4 py-4 sm:p-6 relative z-10">
        <Link
          href="/"
          className="text-zinc-500 hover:text-white transition-colors text-sm"
        >
          ← extractai
        </Link>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 -mt-16 sm:-mt-20">
        <div className="text-center space-y-6 sm:space-y-8 w-full max-w-sm sm:max-w-none">
          <h1 className="text-xl sm:text-2xl font-semibold text-zinc-400">
            World Clock
          </h1>

          {/* Time display — scales up from mobile */}
          <div className="space-y-1 sm:space-y-2">
            <p
              className="
                text-4xl
                xs:text-5xl
                sm:text-7xl
                md:text-8xl
                font-mono font-bold tracking-tight tabular-nums
                leading-none
              "
            >
              {time || "\u00A0"}
            </p>

            {/* Date — smaller on very narrow screens */}
            <p className="text-sm sm:text-lg text-zinc-500 px-2">
              {date || "\u00A0"}
            </p>

            <p className="text-xs sm:text-sm text-emerald-400 font-medium">
              {activeLabel}
            </p>
          </div>

          {/* Timezone selector — wraps on mobile */}
          <div className="flex flex-wrap gap-2 sm:gap-3 justify-center pt-2 sm:pt-4">
            {TIMEZONES.map((tz) => (
              <button
                key={tz.zone}
                onClick={() => setSelected(tz.zone)}
                className={`px-3 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
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

      <footer className="py-6 sm:py-8 text-center text-xs sm:text-sm text-zinc-600">
        <p>extractai.xyz — Clock</p>
      </footer>
    </div>
  );
}

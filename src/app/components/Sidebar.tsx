"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTheme } from "./ThemeProvider";

const NAV_ITEMS = [
  { href: "/tasks",    label: "Tasks",    emoji: "📋" },
  { href: "/calendar", label: "Calendar", emoji: "📅" },
  { href: "/projects", label: "Projects", emoji: "🚀" },
  { href: "/memory",   label: "Memory",   emoji: "🧠" },
  { href: "/team",     label: "Team",     emoji: "👥" },
  { href: "/chat",     label: "Chat",     emoji: "💬" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);

  const d = theme === "dark";

  return (
    <>
      <button
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={`
          fixed top-3 left-3 z-50 lg:hidden
          p-3 rounded-xl
          min-w-[44px] min-h-[44px] flex items-center justify-center
          text-lg font-semibold
          transition-colors duration-150
          ${d
            ? "bg-zinc-900 text-white hover:bg-zinc-800 active:bg-zinc-700"
            : "bg-white text-zinc-900 hover:bg-zinc-100 active:bg-zinc-200 shadow-sm border border-zinc-200"
          }
        `}
      >
        {open ? "✕" : "☰"}
      </button>

      <div
        aria-hidden="true"
        onClick={() => setOpen(false)}
        className={`
          fixed inset-0 z-40 lg:hidden
          bg-black/50 backdrop-blur-[2px]
          transition-opacity duration-200
          ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
      />

      <aside
        className={`
          fixed top-0 left-0 h-full z-40 flex flex-col
          w-[280px] sm:w-64 lg:w-56
          border-r
          transition-transform duration-200 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
          ${d ? "bg-zinc-950 border-zinc-800" : "bg-zinc-50 border-zinc-200"}
        `}
      >
        <div className={`px-4 pt-4 pb-1 ${d ? "text-zinc-600" : "text-zinc-400"}`}>
          <span className="text-[10px] font-medium tracking-widest uppercase">
            🎛️ Mission Control
          </span>
        </div>

        <div className="px-4 py-4 border-b border-inherit">
          <Link href="/" onClick={() => setOpen(false)} className="block">
            <span className={`text-xl font-bold tracking-tight ${d ? "text-white" : "text-zinc-900"}`}>
              extract<span className="text-emerald-500">ai</span>
            </span>
            <span className={`text-[10px] block mt-0.5 ${d ? "text-zinc-600" : "text-zinc-400"}`}>
              signal from noise 🐾
            </span>
          </Link>
        </div>

        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`
                  flex items-center gap-3 px-3 rounded-lg text-sm
                  min-h-[44px]
                  transition-colors duration-150
                  ${active
                    ? d
                      ? "bg-zinc-800 text-white font-medium"
                      : "bg-emerald-50 text-emerald-700 font-medium"
                    : d
                    ? "text-zinc-400 hover:text-white hover:bg-zinc-800/50 active:bg-zinc-800"
                    : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 active:bg-zinc-200"
                  }
                `}
              >
                <span className="text-lg leading-none">{item.emoji}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={`px-3 py-3 border-t ${d ? "border-zinc-800" : "border-zinc-200"}`}>
          <button
            onClick={toggle}
            className={`
              flex items-center gap-2 w-full px-3 rounded-lg text-sm
              min-h-[44px]
              transition-colors duration-150
              ${d
                ? "text-zinc-500 hover:text-white hover:bg-zinc-800/50 active:bg-zinc-800"
                : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 active:bg-zinc-200"
              }
            `}
          >
            <span className="text-base">{d ? "🌙" : "☀️"}</span>
            <span>{d ? "Dark Mode" : "Light Mode"}</span>
          </button>
          <div className={`text-[9px] px-3 mt-2 ${d ? "text-zinc-700" : "text-zinc-400"}`}>
            Built by Kyle & Andy 🐾
          </div>
        </div>
      </aside>
    </>
  );
}

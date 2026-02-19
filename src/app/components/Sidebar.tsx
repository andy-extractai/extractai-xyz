"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTheme } from "./ThemeProvider";

const NAV_ITEMS = [
  { href: "/", label: "Home", emoji: "🏠" },
  { href: "/control", label: "Mission Control", emoji: "🎛️" },
  { href: "/congress", label: "Congress Trades", emoji: "🏛️" },
  { href: "/tokens", label: "Agent Tokens", emoji: "🪙" },
  { href: "/clock", label: "World Clock", emoji: "🕐" },
  { href: "/pokemon", label: "Pokémon RPG", emoji: "⚡" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);

  const d = theme === "dark";

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setOpen(!open)}
        className={`fixed top-3 left-3 z-50 lg:hidden p-2 rounded-lg transition ${
          d ? "bg-zinc-900 text-white hover:bg-zinc-800" : "bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
        }`}
      >
        {open ? "✕" : "☰"}
      </button>

      {/* Overlay for mobile */}
      {open && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-40 flex flex-col transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 w-56 border-r ${
          d ? "bg-zinc-950 border-zinc-800" : "bg-zinc-50 border-zinc-200"
        }`}
      >
        {/* Brand */}
        <div className="px-4 py-5 border-b border-inherit">
          <Link href="/" onClick={() => setOpen(false)} className="block">
            <span className={`text-xl font-bold tracking-tight ${d ? "text-white" : "text-zinc-900"}`}>
              extract<span className="text-emerald-500">ai</span>
            </span>
            <span className={`text-[10px] block mt-0.5 ${d ? "text-zinc-600" : "text-zinc-400"}`}>
              signal from noise 🐾
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition ${
                  active
                    ? d
                      ? "bg-zinc-800 text-white font-medium"
                      : "bg-emerald-50 text-emerald-700 font-medium"
                    : d
                    ? "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                    : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
                }`}
              >
                <span className="text-base">{item.emoji}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer: Theme toggle */}
        <div className={`px-3 py-3 border-t ${d ? "border-zinc-800" : "border-zinc-200"}`}>
          <button
            onClick={toggle}
            className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition ${
              d
                ? "text-zinc-500 hover:text-white hover:bg-zinc-800/50"
                : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
            }`}
          >
            <span>{d ? "🌙" : "☀️"}</span>
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

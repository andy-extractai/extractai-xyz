"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Token {
  id: string | number;
  name: string;
  symbol: string;
  description: string;
  contractAddress: string;
  imageUrl: string | null;
  deployedAt: string;
  socialLinks: Record<string, string>;
  pair: string;
  volume24h: number | null;
  marketCap: number | null;
  fdv: number | null;
  priceUsd: string | null;
  priceChange24h: number | null;
  liquidity: number | null;
  txns24h: { buys: number; sells: number } | null;
  score: number;
  verified: boolean;
  warnings: string[];
  dexUrl?: string;
}

type SortOption = "volume" | "mcap" | "score";
type MobileTab = "new" | "all";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

function formatUsd(n: number | null | undefined): string {
  if (n == null || n === 0) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  return `$${n.toFixed(4)}`;
}

function shortenAddr(addr: string): string {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

// ─── TokenRow ─────────────────────────────────────────────────────────────────
// Mobile-first: rank + image + name/meta + price-change always visible.
// Vol shown always. MCap hidden on xs, shown sm+. Txns bar hidden on xs/sm, shown md+.

function TokenRow({ token, rank }: { token: Token; rank: number }) {
  const dexUrl = `https://dexscreener.com/base/${token.contractAddress}`;
  const change = token.priceChange24h;
  const txns = token.txns24h;
  const totalTxns = txns ? txns.buys + txns.sells : 0;
  const buyPct = txns && totalTxns > 0 ? (txns.buys / totalTxns) * 100 : 50;

  return (
    <a
      href={dexUrl}
      target="_blank"
      rel="noopener noreferrer"
      // On mobile: tighter horizontal padding, slightly reduced vertical padding
      className="flex items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3
                 hover:bg-zinc-800/50 transition-colors border-b border-zinc-800/50 group"
    >
      {/* Rank */}
      <span className="text-zinc-600 text-xs font-mono w-4 sm:w-5 text-right flex-shrink-0">
        {rank}
      </span>

      {/* Avatar */}
      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-zinc-800 flex-shrink-0 overflow-hidden">
        {token.imageUrl ? (
          <img
            src={token.imageUrl}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs font-bold">
            {token.symbol.charAt(0)}
          </div>
        )}
      </div>

      {/* Name & Meta — min-w-0 + truncate prevent overflow */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-white text-xs sm:text-sm font-medium truncate
                           group-hover:text-emerald-400 transition-colors">
            {token.name}
          </span>
          {token.verified && (
            <span className="text-[9px] text-blue-400 flex-shrink-0">✓</span>
          )}
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5 mt-0.5">
          <span className="text-zinc-500 text-[10px] sm:text-xs font-mono truncate">
            ${token.symbol}
          </span>
          {token.deployedAt && (
            <>
              <span className="text-zinc-700 text-[10px] flex-shrink-0">•</span>
              <span className="text-zinc-600 text-[10px] flex-shrink-0">
                {timeAgo(token.deployedAt)}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Volume — always visible, narrower on mobile */}
      <div className="text-right w-14 sm:w-20 flex-shrink-0">
        <div className="text-zinc-500 text-[9px] uppercase">Vol</div>
        <div className="text-white text-[10px] sm:text-xs font-mono">
          {formatUsd(token.volume24h)}
        </div>
      </div>

      {/* Market Cap — hidden on xs (< 640 px), shown sm+ */}
      <div className="text-right w-16 sm:w-20 flex-shrink-0 hidden sm:block">
        <div className="text-zinc-500 text-[9px] uppercase">MCap</div>
        <div className="text-white text-xs font-mono">
          {formatUsd(token.marketCap || token.fdv)}
        </div>
      </div>

      {/* Txns bar — hidden below md (768 px) */}
      <div className="w-16 flex-shrink-0 hidden md:block">
        <div className="flex items-center gap-1">
          <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full"
              style={{ width: `${buyPct}%` }}
            />
          </div>
          <span className="text-[9px] text-zinc-600 font-mono">{totalTxns}</span>
        </div>
      </div>

      {/* Price Change — always visible */}
      <div className="w-12 sm:w-14 text-right flex-shrink-0">
        {change != null ? (
          <span
            className={`text-[10px] sm:text-xs font-mono ${
              change >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {change >= 0 ? "+" : ""}
            {change.toFixed(1)}%
          </span>
        ) : (
          <span className="text-zinc-700 text-xs">—</span>
        )}
      </div>

      {/* Social Links — hidden on xs, shown sm+ */}
      <div
        className="items-center gap-1.5 flex-shrink-0 hidden sm:flex"
        onClick={(e) => e.stopPropagation()}
      >
        {token.socialLinks.website && (
          <a
            href={token.socialLinks.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-700 hover:text-white text-[10px] transition"
            title="Website"
          >
            🌐
          </a>
        )}
        {token.socialLinks.twitter && (
          <a
            href={token.socialLinks.twitter}
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-700 hover:text-blue-400 text-[10px] transition"
            title="Twitter"
          >
            𝕏
          </a>
        )}
        {token.socialLinks.telegram && (
          <a
            href={token.socialLinks.telegram}
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-700 hover:text-blue-300 text-[10px] transition"
            title="Telegram"
          >
            ✈️
          </a>
        )}
      </div>
    </a>
  );
}

// ─── StreamPanel ──────────────────────────────────────────────────────────────

function StreamPanel({
  title,
  subtitle,
  tokens,
  emptyMsg,
  accent,
}: {
  title: string;
  subtitle: string;
  tokens: Token[];
  emptyMsg: string;
  accent: string;
}) {
  return (
    <div className="flex flex-col min-h-0 h-full">
      <div className="px-3 sm:px-4 py-3 border-b border-zinc-800 bg-zinc-900/50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <h2 className={`text-sm font-bold ${accent}`}>{title}</h2>
          <span className="text-zinc-600 text-xs bg-zinc-800 px-1.5 py-0.5 rounded">
            {tokens.length}
          </span>
        </div>
        <p className="text-zinc-600 text-[10px] mt-0.5">{subtitle}</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tokens.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-600">
            <div className="text-2xl mb-2">🔍</div>
            <div className="text-xs text-center px-4">{emptyMsg}</div>
          </div>
        ) : (
          tokens.map((token, i) => (
            <TokenRow key={token.id} token={token} rank={i + 1} />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TokensPage() {
  const [newTokens, setNewTokens] = useState<Token[]>([]);
  const [allTokens, setAllTokens] = useState<Token[]>([]);
  const [sort, setSort] = useState<SortOption>("volume");
  const [loading, setLoading] = useState(true);
  const [mobileTab, setMobileTab] = useState<MobileTab>("new");
  const [autoRefresh, setAutoRefresh] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("tokens_live") === "true";
    }
    return false;
  });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [total, setTotal] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchTokens = useCallback(async () => {
    try {
      const params = new URLSearchParams({ filter: "agents", sort, limit: "60" });
      const res = await fetch(`/api/tokens?${params}`);
      const data = await res.json();
      if (data.newTokens) {
        setNewTokens(data.newTokens);
        setAllTokens(data.allTokens);
        setTotal(data.total || 0);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error("Failed to fetch:", err);
    } finally {
      setLoading(false);
    }
  }, [sort]);

  useEffect(() => {
    setLoading(true);
    fetchTokens();
  }, [fetchTokens]);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchTokens, 30000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, fetchTokens]);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-black text-white">

      {/* ── Header ── */}
      <header className="border-b border-zinc-800 px-3 sm:px-4 py-2 sm:py-3 flex-shrink-0">

        {/* Row 1: back link + title + (desktop: sort/refresh inline) */}
        <div className="flex items-center justify-between gap-2">
          {/* Left: nav + title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link
              href="/"
              className="text-zinc-600 hover:text-white transition text-sm flex-shrink-0"
            >
              ←
            </Link>
            <h1 className="text-base sm:text-lg font-bold tracking-tight truncate">
              🤖 Tokenized Agents
            </h1>
            <span className="text-zinc-600 text-[10px] bg-zinc-900 px-2 py-0.5 rounded hidden sm:inline flex-shrink-0">
              Base Chain
            </span>
          </div>

          {/* Right (desktop only ≥ md): sort + refresh + live + timestamp */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            {/* Sort pills */}
            <div className="flex bg-zinc-900 rounded-md p-0.5 text-[10px]">
              {(
                [
                  ["volume", "Vol"],
                  ["mcap", "MCap"],
                  ["score", "Score"],
                ] as [SortOption, string][]
              ).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setSort(val)}
                  className={`px-2.5 py-1 rounded transition ${
                    sort === val
                      ? "bg-zinc-700 text-white font-medium"
                      : "text-zinc-500 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setLoading(true);
                fetchTokens();
              }}
              className="px-2 py-1 rounded text-[10px] bg-zinc-800 text-zinc-400 hover:text-white transition"
              title="Refresh now"
            >
              ↻
            </button>

            <button
              onClick={() => {
                const next = !autoRefresh;
                setAutoRefresh(next);
                localStorage.setItem("tokens_live", String(next));
              }}
              className={`px-2 py-1 rounded text-[10px] transition ${
                autoRefresh
                  ? "bg-green-500/20 text-green-400"
                  : "bg-zinc-800 text-zinc-500"
              }`}
            >
              {autoRefresh ? "● LIVE 30s" : "○ OFF"}
            </button>

            {lastUpdated && (
              <span className="text-zinc-700 text-[10px]">
                {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* Row 2 (mobile only < md): sort + refresh controls — full-width */}
        <div className="flex items-center gap-2 mt-2 md:hidden">
          {/* Sort — horizontally scrollable strip */}
          <div
            className="flex gap-1 overflow-x-auto no-scrollbar flex-shrink-0"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {(
              [
                ["volume", "Vol"],
                ["mcap", "MCap"],
                ["score", "Score"],
              ] as [SortOption, string][]
            ).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setSort(val)}
                className={`px-3 py-1.5 rounded text-[11px] whitespace-nowrap transition flex-shrink-0 ${
                  sort === val
                    ? "bg-zinc-700 text-white font-medium"
                    : "bg-zinc-900 text-zinc-500 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Refresh button — compact */}
          <button
            onClick={() => {
              setLoading(true);
              fetchTokens();
            }}
            className="px-2.5 py-1.5 rounded text-[11px] bg-zinc-800 text-zinc-400
                       hover:text-white transition flex-shrink-0"
            title="Refresh now"
          >
            ↻
          </button>

          {/* Live toggle — compact */}
          <button
            onClick={() => {
              const next = !autoRefresh;
              setAutoRefresh(next);
              localStorage.setItem("tokens_live", String(next));
            }}
            className={`px-2.5 py-1.5 rounded text-[11px] transition flex-shrink-0 ${
              autoRefresh
                ? "bg-green-500/20 text-green-400"
                : "bg-zinc-800 text-zinc-500"
            }`}
          >
            {autoRefresh ? "● LIVE" : "○ OFF"}
          </button>
        </div>

        {/* Row 3: Threshold badges — horizontally scrollable on mobile */}
        <div
          className="flex items-center gap-1.5 mt-2 overflow-x-auto no-scrollbar pb-0.5"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {[
            "MCap ≥ $250k",
            "Vol ≥ $50k",
            "Liq ≥ $25k",
            "Txns ≥ 125",
          ].map((badge) => (
            <span
              key={badge}
              className="text-[9px] text-zinc-600 bg-zinc-900 px-1.5 py-0.5 rounded whitespace-nowrap flex-shrink-0"
            >
              {badge}
            </span>
          ))}
          {total > 0 && (
            <span className="text-[9px] bg-zinc-900 px-1.5 py-0.5 rounded text-emerald-500 whitespace-nowrap flex-shrink-0">
              {total} qualified
            </span>
          )}
        </div>
      </header>

      {/* ── Mobile tab bar (hidden md+) ── */}
      <div className="flex border-b border-zinc-800 flex-shrink-0 md:hidden">
        <button
          onClick={() => setMobileTab("new")}
          className={`flex-1 py-2 text-xs font-semibold transition border-b-2 ${
            mobileTab === "new"
              ? "border-emerald-400 text-emerald-400"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          🆕 New Agents
          {newTokens.length > 0 && (
            <span className="ml-1.5 text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">
              {newTokens.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setMobileTab("all")}
          className={`flex-1 py-2 text-xs font-semibold transition border-b-2 ${
            mobileTab === "all"
              ? "border-amber-400 text-amber-400"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          🏆 All Agents
          {allTokens.length > 0 && (
            <span className="ml-1.5 text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">
              {allTokens.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Content area ── */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-zinc-500 text-sm animate-pulse">Loading tokens...</div>
        </div>
      ) : (
        <>
          {/* Mobile: single panel toggled by tab (hidden md+) */}
          <div className="flex-1 flex flex-col min-h-0 md:hidden overflow-hidden">
            {mobileTab === "new" ? (
              <StreamPanel
                title="🆕 New Agents"
                subtitle="Deployed in the last 72 hours"
                tokens={newTokens}
                emptyMsg="No new qualifying agents in the last 72h"
                accent="text-emerald-400"
              />
            ) : (
              <StreamPanel
                title="🏆 All Agents"
                subtitle="All time, sorted by performance"
                tokens={allTokens}
                emptyMsg="No qualifying agents found"
                accent="text-amber-400"
              />
            )}
          </div>

          {/* Desktop: two-column side-by-side (hidden below md) */}
          <div className="flex-1 hidden md:flex min-h-0">
            {/* Left: New tokens (<72h) */}
            <div className="flex-1 border-r border-zinc-800 flex flex-col min-h-0 overflow-hidden">
              <StreamPanel
                title="🆕 New Agents"
                subtitle="Deployed in the last 72 hours"
                tokens={newTokens}
                emptyMsg="No new qualifying agents in the last 72h"
                accent="text-emerald-400"
              />
            </div>

            {/* Right: All qualifying tokens */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <StreamPanel
                title="🏆 All Agents"
                subtitle="All time, sorted by performance"
                tokens={allTokens}
                emptyMsg="No qualifying agents found"
                accent="text-amber-400"
              />
            </div>
          </div>
        </>
      )}

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-800 px-3 sm:px-4 py-2 text-center text-zinc-700 text-[10px] flex-shrink-0">
        DexScreener + Clanker on Base • Powered by{" "}
        <a
          href="https://bankr.bot"
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-500 hover:text-white transition"
        >
          Bankr
        </a>{" "}
        • extractai.xyz 🐾
      </footer>
    </div>
  );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";

interface Trade {
  ticker: string;
  company: string;
  asset_type: string;
  transaction: string;
  date: string;
  notification_date: string;
  amount: { min: number; max: number; raw: string };
  politician: string;
  state_district: string;
  filing_date: string;
  doc_id: string;
  chamber: string;
}

interface HotTicker {
  ticker: string;
  company: string;
  politician_count: number;
  politicians: string[];
  buys: number;
  sells: number;
  total_min: number;
  total_max: number;
}

interface TopPolitician {
  name: string;
  state: string;
  buys: number;
  sells: number;
  total_trades: number;
  total_min: number;
  total_max: number;
}

interface CongressData {
  last_updated: string;
  total_trades: number;
  trades: Trade[];
  hot_tickers: HotTicker[];
  top_politicians: TopPolitician[];
}

function formatAmount(min: number, max: number): string {
  const fmt = (n: number) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
    return `$${n}`;
  };
  if (min === 0 && max === 0) return "—";
  return `${fmt(min)} – ${fmt(max)}`;
}

function parseDate(d: string): Date | null {
  if (!d) return null;
  // Handle MM/DD/YYYY format
  const parts = d.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (parts) return new Date(+parts[3], +parts[1] - 1, +parts[2]);
  // Fallback to ISO
  const date = new Date(d);
  return isNaN(date.getTime()) ? null : date;
}

function formatDate(d: string): string {
  const date = parseDate(d);
  if (!date) return d || "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function daysAgo(d: string): number {
  const date = parseDate(d);
  if (!date) return 999;
  return Math.floor((Date.now() - date.getTime()) / 86400000);
}

function TagBadge({ type }: { type: string }) {
  if (type === "purchase") return <span className="text-[10px] bg-green-500/15 text-green-400 px-1.5 py-0.5 rounded font-medium">BUY</span>;
  if (type === "sale") return <span className="text-[10px] bg-red-500/15 text-red-400 px-1.5 py-0.5 rounded font-medium">SELL</span>;
  return <span className="text-[10px] bg-zinc-700 text-zinc-400 px-1.5 py-0.5 rounded">{type.toUpperCase()}</span>;
}

function AmountBar({ min, max }: { min: number; max: number }) {
  // Visual bar showing size relative to max possible ($25M)
  const pct = Math.min((max / 25_000_000) * 100, 100);
  const color = max >= 5_000_000 ? "bg-amber-500" : max >= 1_000_000 ? "bg-emerald-500" : max >= 250_000 ? "bg-blue-500" : "bg-zinc-600";
  return (
    <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden mt-1">
      <div className={`h-full ${color} rounded-full`} style={{ width: `${Math.max(pct, 3)}%` }} />
    </div>
  );
}

// --- SECTIONS ---

function StatsBar({ data }: { data: CongressData }) {
  const totalBuys = data.trades.filter(t => t.transaction === "purchase").length;
  const totalSells = data.trades.filter(t => t.transaction === "sale").length;
  const totalMin = data.trades.reduce((s, t) => s + t.amount.min, 0);
  const totalMax = data.trades.reduce((s, t) => s + t.amount.max, 0);
  const uniquePols = new Set(data.trades.map(t => t.politician)).size;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 px-4 py-3">
      {[
        { label: "Total Trades", value: data.total_trades.toLocaleString() },
        { label: "Buys", value: totalBuys.toLocaleString(), color: "text-green-400" },
        { label: "Sells", value: totalSells.toLocaleString(), color: "text-red-400" },
        { label: "Volume Range", value: formatAmount(totalMin, totalMax) },
        { label: "Politicians", value: uniquePols.toString() },
      ].map((s) => (
        <div key={s.label} className="bg-zinc-900 rounded-lg px-3 py-2">
          <div className="text-zinc-600 text-[9px] uppercase tracking-wider">{s.label}</div>
          <div className={`text-sm font-mono font-medium ${s.color || "text-white"}`}>{s.value}</div>
        </div>
      ))}
    </div>
  );
}

function HotTickersPanel({ tickers }: { tickers: HotTicker[] }) {
  return (
    <div className="border-b border-zinc-800">
      <div className="px-4 py-2 bg-zinc-900/50">
        <h2 className="text-sm font-bold text-amber-400">🔥 Hot Tickers</h2>
        <p className="text-zinc-600 text-[10px]">Most traded by unique politicians</p>
      </div>
      <div className="flex gap-2 px-4 py-3 overflow-x-auto">
        {tickers.slice(0, 15).map((t) => (
          <a
            key={t.ticker}
            href={`https://finance.yahoo.com/quote/${t.ticker}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 hover:border-amber-500/50 transition min-w-[130px]"
          >
            <div className="flex items-center justify-between">
              <span className="text-white font-mono font-bold text-sm">{t.ticker}</span>
              <span className="text-zinc-500 text-[9px]">{t.politician_count} pols</span>
            </div>
            <div className="text-zinc-500 text-[10px] truncate mt-0.5">{t.company}</div>
            <div className="flex gap-2 mt-1.5 text-[10px]">
              <span className="text-green-400">{t.buys}B</span>
              <span className="text-red-400">{t.sells}S</span>
            </div>
            <div className="text-zinc-600 text-[9px] mt-1">{formatAmount(t.total_min, t.total_max)}</div>
          </a>
        ))}
      </div>
    </div>
  );
}

function TopPoliticiansPanel({ politicians }: { politicians: TopPolitician[] }) {
  return (
    <div className="border-b border-zinc-800">
      <div className="px-4 py-2 bg-zinc-900/50">
        <h2 className="text-sm font-bold text-purple-400">👤 Top Traders</h2>
        <p className="text-zinc-600 text-[10px]">Biggest movers by dollar volume</p>
      </div>
      <div className="flex gap-2 px-4 py-3 overflow-x-auto">
        {politicians.slice(0, 12).map((p) => (
          <div
            key={p.name}
            className="flex-shrink-0 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 min-w-[150px]"
          >
            <div className="text-white text-sm font-medium truncate">{p.name}</div>
            <div className="text-zinc-600 text-[10px]">{p.state}</div>
            <div className="flex gap-2 mt-1.5 text-[10px]">
              <span className="text-green-400">{p.buys} buys</span>
              <span className="text-red-400">{p.sells} sells</span>
            </div>
            <div className="text-zinc-500 text-[9px] mt-1">{formatAmount(p.total_min, p.total_max)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TradeRow({ trade }: { trade: Trade }) {
  const days = daysAgo(trade.date);
  const isOptions = trade.asset_type === "option";
  const isBig = trade.amount.max >= 1_000_000;
  const dateObj = parseDate(trade.date);
  const year = dateObj ? dateObj.getFullYear() : 2026;
  const pdfUrl = `https://disclosures-clerk.house.gov/public_disc/ptr-pdfs/${year}/${trade.doc_id}.pdf`;

  return (
    <a
      href={pdfUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="grid grid-cols-[60px_42px_minmax(0,1fr)_110px_85px] items-center gap-1.5 px-3 py-2.5 hover:bg-zinc-800/40 transition border-b border-zinc-800/30"
    >
      {/* Ticker */}
      <div>
        <div className={`font-mono font-bold text-sm ${isBig ? "text-amber-300" : "text-white"}`}>
          {trade.ticker}
        </div>
        {isOptions && <span className="text-[8px] text-purple-400 font-medium">OPTIONS</span>}
      </div>

      {/* Type badge */}
      <div>
        <TagBadge type={trade.transaction} />
      </div>

      {/* Politician */}
      <div className="min-w-0">
        <div className="text-zinc-300 text-xs truncate">{trade.politician}</div>
        <div className="text-zinc-600 text-[10px]">{trade.state_district}</div>
      </div>

      {/* Amount */}
      <div>
        <div className="text-zinc-300 text-xs font-mono">{formatAmount(trade.amount.min, trade.amount.max)}</div>
        <AmountBar min={trade.amount.min} max={trade.amount.max} />
      </div>

      {/* Date */}
      <div className="text-right">
        <div className="text-zinc-400 text-xs">{formatDate(trade.date)}</div>
        <div className={`text-[9px] ${days <= 7 ? "text-emerald-500" : days <= 30 ? "text-zinc-500" : "text-zinc-700"}`}>
          {days === 0 ? "today" : days > 0 ? `${days}d ago` : ""}
        </div>
      </div>
    </a>
  );
}

type FilterType = "all" | "buys" | "sells" | "options" | "big";

export default function CongressPage() {
  const [data, setData] = useState<CongressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [polFilter, setPolFilter] = useState("");

  useEffect(() => {
    fetch("/data/congress-trades.json")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filteredTrades = useMemo(() => {
    if (!data) return [];
    let trades = data.trades;

    if (filter === "buys") trades = trades.filter((t) => t.transaction === "purchase");
    else if (filter === "sells") trades = trades.filter((t) => t.transaction === "sale");
    else if (filter === "options") trades = trades.filter((t) => t.asset_type === "option");
    else if (filter === "big") trades = trades.filter((t) => t.amount.max >= 1_000_000);

    if (search) {
      const q = search.toLowerCase();
      trades = trades.filter((t) => t.ticker.toLowerCase().includes(q) || t.company.toLowerCase().includes(q));
    }

    if (polFilter) {
      const q = polFilter.toLowerCase();
      trades = trades.filter((t) => t.politician.toLowerCase().includes(q));
    }

    // Sort by date, newest first
    trades.sort((a, b) => {
      const da = parseDate(a.date);
      const db = parseDate(b.date);
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return db.getTime() - da.getTime();
    });

    return trades;
  }, [data, filter, search, polFilter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-zinc-500 text-sm animate-pulse">Loading Congress trades...</div>
      </div>
    );
  }

  if (!data || data.total_trades === 0) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-zinc-500">
        <div className="text-4xl mb-3">🏛️</div>
        <div>No trade data available yet</div>
        <Link href="/" className="text-zinc-600 hover:text-white text-sm mt-4">← back</Link>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden max-w-full">
      {/* Header */}
      <header className="border-b border-zinc-800 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-zinc-600 hover:text-white transition text-sm">←</Link>
            <h1 className="text-lg font-bold tracking-tight">🏛️ Congress Trades</h1>
            <span className="text-zinc-600 text-[10px] bg-zinc-900 px-2 py-0.5 rounded hidden sm:inline">
              House • STOCK Act Filings
            </span>
          </div>
          <div className="text-zinc-700 text-[10px]">
            Updated {new Date(data.last_updated).toLocaleDateString()}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* Stats */}
        <StatsBar data={data} />

        {/* Hot Tickers */}
        <HotTickersPanel tickers={data.hot_tickers} />

        {/* Top Politicians */}
        <TopPoliticiansPanel politicians={data.top_politicians} />

        {/* Trade Feed */}
        <div className="border-b border-zinc-800">
          <div className="px-4 py-3 bg-zinc-900/50 flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <h2 className="text-sm font-bold text-white">📋 All Trades</h2>

            {/* Filters */}
            <div className="flex bg-zinc-900 rounded-md p-0.5 text-[10px]">
              {([
                ["all", "All"],
                ["buys", "🟢 Buys"],
                ["sells", "🔴 Sells"],
                ["options", "📈 Options"],
                ["big", "💰 $1M+"],
              ] as [FilterType, string][]).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setFilter(val)}
                  className={`px-2.5 py-1 rounded transition ${
                    filter === val ? "bg-zinc-700 text-white font-medium" : "text-zinc-500 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="flex gap-2 ml-auto">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ticker..."
                className="bg-zinc-900 border border-zinc-800 text-white px-2 py-1 rounded text-[11px] w-24 focus:outline-none focus:border-zinc-600 placeholder:text-zinc-700"
              />
              <input
                type="text"
                value={polFilter}
                onChange={(e) => setPolFilter(e.target.value)}
                placeholder="Politician..."
                className="bg-zinc-900 border border-zinc-800 text-white px-2 py-1 rounded text-[11px] w-28 focus:outline-none focus:border-zinc-600 placeholder:text-zinc-700"
              />
            </div>

            <span className="text-zinc-600 text-[10px]">{filteredTrades.length} trades</span>
          </div>

          {/* Trade list */}
          <div>
            {filteredTrades.slice(0, 200).map((trade, i) => (
              <TradeRow key={`${trade.doc_id}-${trade.ticker}-${i}`} trade={trade} />
            ))}
            {filteredTrades.length > 200 && (
              <div className="text-center text-zinc-600 text-xs py-4">
                Showing 200 of {filteredTrades.length} trades
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-4 py-2 text-center text-zinc-700 text-[10px] flex-shrink-0">
        Source: U.S. House Financial Disclosures (STOCK Act) • extractai.xyz 🐾
      </footer>
    </div>
  );
}

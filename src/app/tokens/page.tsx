"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";

interface Token {
  id: number;
  name: string;
  symbol: string;
  description: string;
  contractAddress: string;
  chainId: number;
  imageUrl: string | null;
  poolAddress: string;
  deployedAt: string;
  startingMarketCap: number;
  type: string;
  verified: boolean;
  champagne: boolean;
  warnings: string[];
  socialLinks: Record<string, string>;
  deployer: string;
  txHash: string;
  pair: string;
  feeType: string;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function shortenAddr(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function TokenCard({ token }: { token: Token }) {
  const basescanUrl = `https://basescan.org/token/${token.contractAddress}`;
  const dexScreenerUrl = `https://dexscreener.com/base/${token.contractAddress}`;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-600 transition-all duration-200 group">
      <div className="flex items-start gap-3">
        {/* Token Image */}
        <div className="w-12 h-12 rounded-lg bg-zinc-800 flex-shrink-0 overflow-hidden">
          {token.imageUrl ? (
            <img
              src={token.imageUrl}
              alt={token.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-600 text-lg font-bold">
              {token.symbol.charAt(0)}
            </div>
          )}
        </div>

        {/* Token Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-white font-semibold truncate">{token.name}</h3>
            {token.verified && (
              <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">✓</span>
            )}
            {token.champagne && (
              <span className="text-xs">🍾</span>
            )}
            {token.warnings.length > 0 && (
              <span className="text-xs bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded">⚠</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-zinc-400 text-sm font-mono">${token.symbol}</span>
            <span className="text-zinc-600 text-xs">•</span>
            <span className="text-zinc-500 text-xs">{timeAgo(token.deployedAt)}</span>
          </div>
        </div>

        {/* Market Cap */}
        <div className="text-right flex-shrink-0">
          <div className="text-zinc-400 text-xs">mcap</div>
          <div className="text-white text-sm font-mono">
            ${token.startingMarketCap >= 1000
              ? `${(token.startingMarketCap / 1000).toFixed(1)}k`
              : token.startingMarketCap.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Description */}
      {token.description && (
        <p className="text-zinc-500 text-xs mt-3 line-clamp-2 leading-relaxed">
          {token.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-zinc-600 text-xs font-mono">{shortenAddr(token.contractAddress)}</span>
          <span className="text-zinc-700 text-xs">|</span>
          <span className="text-zinc-600 text-xs">{token.feeType} fees</span>
        </div>
        <div className="flex items-center gap-2">
          {token.socialLinks.twitter && (
            <a
              href={token.socialLinks.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-600 hover:text-blue-400 text-xs transition"
            >
              𝕏
            </a>
          )}
          {token.socialLinks.website && (
            <a
              href={token.socialLinks.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-600 hover:text-white text-xs transition"
            >
              🌐
            </a>
          )}
          <a
            href={dexScreenerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-600 hover:text-green-400 text-xs transition"
          >
            📊
          </a>
          <a
            href={basescanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-600 hover:text-white text-xs transition"
          >
            ⛓
          </a>
        </div>
      </div>
    </div>
  );
}

export default function TokensPage() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [totalDeployed, setTotalDeployed] = useState(0);
  const [filter, setFilter] = useState<"agents" | "all">("agents");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchTokens = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        filter,
        limit: "50",
        ...(search && { search }),
      });
      const res = await fetch(`/api/tokens?${params}`);
      const data = await res.json();
      if (data.tokens) {
        setTokens(data.tokens);
        setTotalDeployed(data.totalDeployed || 0);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error("Failed to fetch tokens:", err);
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    setLoading(true);
    fetchTokens();
  }, [fetchTokens]);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchTokens, 15000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, fetchTokens]);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-zinc-500 hover:text-white transition text-sm">
              ← extractai
            </Link>
            <h1 className="text-xl font-bold tracking-tight">
              🤖 Tokenized Agents
            </h1>
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            {totalDeployed > 0 && (
              <span className="bg-zinc-900 px-2 py-1 rounded">
                {totalDeployed.toLocaleString()} tokens deployed
              </span>
            )}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-2 py-1 rounded transition ${
                autoRefresh
                  ? "bg-green-500/20 text-green-400"
                  : "bg-zinc-800 text-zinc-500"
              }`}
            >
              {autoRefresh ? "● LIVE" : "○ PAUSED"}
            </button>
          </div>
        </div>
      </header>

      {/* Controls */}
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Filter Tabs */}
          <div className="flex bg-zinc-900 rounded-lg p-0.5">
            <button
              onClick={() => setFilter("agents")}
              className={`px-4 py-1.5 rounded-md text-sm transition ${
                filter === "agents"
                  ? "bg-white text-black font-medium"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              🤖 AI Agents
            </button>
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-1.5 rounded-md text-sm transition ${
                filter === "all"
                  ? "bg-white text-black font-medium"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              All Tokens
            </button>
          </div>

          {/* Search */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or symbol..."
            className="bg-zinc-900 border border-zinc-800 text-white px-3 py-1.5 rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:border-zinc-600 placeholder:text-zinc-600"
          />

          {/* Last Updated */}
          {lastUpdated && (
            <span className="text-zinc-600 text-xs ml-auto">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Token Grid */}
      <div className="max-w-6xl mx-auto px-6 pb-12">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-zinc-500 text-sm animate-pulse">Loading tokens...</div>
          </div>
        ) : tokens.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
            <div className="text-4xl mb-3">🔍</div>
            <div className="text-sm">No tokens found</div>
            <div className="text-xs mt-1">
              {filter === "agents" ? "Try switching to 'All Tokens'" : "Try a different search"}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {tokens.map((token) => (
              <TokenCard key={token.id} token={token} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-6 py-4 text-center text-zinc-600 text-xs">
        Data from Clanker on Base • Powered by{" "}
        <a href="https://bankr.bot" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white transition">
          Bankr
        </a>
        {" "}• Built by Kyle & Andy 🐾
      </footer>
    </div>
  );
}

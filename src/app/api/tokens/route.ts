import { NextRequest, NextResponse } from "next/server";

const CLANKER_API = "https://www.clanker.world/api/tokens";
const DEXSCREENER_SEARCH = "https://api.dexscreener.com/latest/dex/search";
const DEXSCREENER_TOKENS = "https://api.dexscreener.com/tokens/v1/base";

const AGENT_KEYWORDS = [
  "ai", "agent", "bot", "assistant", "gpt", "llm", "autonomous",
  "claw", "4claw", "clawnch", "moltbot", "openclaw", "bankr",
  "neural", "intelligence", "cognitive", "sentient", "autonom",
];

function isAgentToken(name: string, symbol: string, description: string): boolean {
  const text = `${name} ${symbol} ${description}`.toLowerCase();
  return AGENT_KEYWORDS.some((kw) => {
    const regex = new RegExp(`(^|[^a-z])${kw}([^a-z]|$)`, "i");
    return regex.test(text);
  });
}

// For agent filter: use DexScreener search to find agent tokens with volume data directly
async function searchAgentTokens(): Promise<any[]> {
  const searchTerms = ["AI agent", "AI bot", "autonomous agent", "GPT bot", "claw agent", "bankr bot", "neural AI", "sentient AI"];
  const seen = new Set<string>();
  const allPairs: any[] = [];

  // Fetch in parallel (DexScreener handles it fine)
  const results = await Promise.all(
    searchTerms.map(async (q) => {
      try {
        const res = await fetch(`${DEXSCREENER_SEARCH}?q=${encodeURIComponent(q)}`, {
          next: { revalidate: 60 },
        });
        if (!res.ok) return [];
        const data = await res.json();
        return (data.pairs || []).filter((p: any) => p.chainId === "base");
      } catch {
        return [];
      }
    })
  );

  for (const pairs of results) {
    for (const pair of pairs) {
      const addr = pair.baseToken?.address?.toLowerCase();
      if (!addr || seen.has(addr)) continue;
      // Verify it's actually an agent token
      const name = pair.baseToken?.name || "";
      const symbol = pair.baseToken?.symbol || "";
      // DexScreener doesn't have descriptions, but the search already filtered
      if (isAgentToken(name, symbol, name)) {
        seen.add(addr);
        allPairs.push(pair);
      }
    }
  }

  return allPairs;
}

function formatDexPair(pair: any) {
  return {
    id: pair.pairAddress,
    name: pair.baseToken?.name || "Unknown",
    symbol: pair.baseToken?.symbol || "???",
    description: "",
    contractAddress: pair.baseToken?.address || "",
    chainId: 8453,
    imageUrl: pair.info?.imageUrl || null,
    poolAddress: pair.pairAddress,
    deployedAt: pair.pairCreatedAt ? new Date(pair.pairCreatedAt).toISOString() : "",
    startingMarketCap: 0,
    type: "clanker",
    verified: false,
    champagne: false,
    warnings: [],
    socialLinks: {} as Record<string, string>,
    deployer: "",
    txHash: "",
    pair: pair.quoteToken?.symbol || "WETH",
    feeType: "unknown",
    volume24h: parseFloat(pair.volume?.h24 || "0"),
    marketCap: pair.marketCap || null,
    fdv: pair.fdv || null,
    priceUsd: pair.priceUsd || null,
    priceChange24h: pair.priceChange?.h24 ?? null,
    liquidity: pair.liquidity?.usd ?? null,
    txns24h: pair.txns?.h24
      ? { buys: pair.txns.h24.buys || 0, sells: pair.txns.h24.sells || 0 }
      : null,
    dexUrl: pair.url || null,
  };
}

function formatClankerToken(t: any, dexData?: any) {
  const socialLinks: Record<string, string> = {};
  if (Array.isArray(t.socialLinks)) {
    for (const link of t.socialLinks) {
      if (link.name && link.link) socialLinks[link.name] = link.link;
    }
  }
  return {
    id: t.id,
    name: t.name || "Unknown",
    symbol: t.symbol || "???",
    description: (t.description || "").slice(0, 300),
    contractAddress: t.contract_address,
    chainId: t.chain_id,
    imageUrl: t.img_url || dexData?.info?.imageUrl || null,
    poolAddress: t.pool_address,
    deployedAt: t.deployed_at || t.created_at,
    startingMarketCap: t.starting_market_cap,
    type: t.type,
    verified: t.tags?.verified || false,
    champagne: t.tags?.champagne || false,
    warnings: t.warnings || [],
    socialLinks,
    deployer: t.admin,
    txHash: t.tx_hash,
    pair: t.pair || "WETH",
    feeType: t.extensions?.fees?.type || "unknown",
    volume24h: dexData ? parseFloat(dexData.volume?.h24 || "0") : null,
    marketCap: dexData ? (dexData.marketCap || null) : null,
    fdv: dexData ? (dexData.fdv || null) : null,
    priceUsd: dexData ? dexData.priceUsd : null,
    priceChange24h: dexData?.priceChange?.h24 ?? null,
    liquidity: dexData?.liquidity?.usd ?? null,
    txns24h: dexData
      ? { buys: dexData.txns?.h24?.buys || 0, sells: dexData.txns?.h24?.sells || 0 }
      : null,
  };
}

async function fetchDexScreenerBatch(addresses: string[]): Promise<Record<string, any>> {
  if (addresses.length === 0) return {};
  const results: Record<string, any> = {};
  // DexScreener supports up to 30 addresses per call
  for (let i = 0; i < addresses.length; i += 30) {
    const chunk = addresses.slice(i, i + 30);
    try {
      const res = await fetch(`${DEXSCREENER_TOKENS}/${chunk.join(",")}`, {
        next: { revalidate: 30 },
      });
      if (!res.ok) continue;
      const pairs = await res.json();
      if (!Array.isArray(pairs)) continue;
      for (const pair of pairs) {
        const addr = pair.baseToken?.address?.toLowerCase();
        if (!addr) continue;
        if (!results[addr] || parseFloat(pair.volume?.h24 || "0") > parseFloat(results[addr].volume?.h24 || "0")) {
          results[addr] = pair;
        }
      }
    } catch {}
  }
  return results;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = searchParams.get("page") || "1";
  const limit = parseInt(searchParams.get("limit") || "50");
  const filter = searchParams.get("filter") || "all";
  const search = searchParams.get("search") || "";
  const sortBy = searchParams.get("sort") || "volume";

  try {
    if (filter === "agents") {
      // Use DexScreener search directly — fast, has volume, no Clanker timeout issues
      const pairs = await searchAgentTokens();
      const formatted = pairs.map(formatDexPair);

      if (sortBy === "volume") {
        formatted.sort((a, b) => (b.volume24h || 0) - (a.volume24h || 0));
      } else if (sortBy === "mcap") {
        formatted.sort((a, b) => (b.marketCap || b.fdv || 0) - (a.marketCap || a.fdv || 0));
      } else {
        formatted.sort((a, b) => new Date(b.deployedAt).getTime() - new Date(a.deployedAt).getTime());
      }

      return NextResponse.json({
        tokens: formatted.slice(0, limit),
        total: formatted.length,
        totalDeployed: 0,
      });
    }

    // "all" filter — single Clanker page + DexScreener enrichment
    const url = search
      ? `${CLANKER_API}?sort=desc&page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`
      : `${CLANKER_API}?sort=desc&page=${page}&limit=${limit}`;

    const res = await fetch(url, { next: { revalidate: 30 } });
    if (!res.ok) return NextResponse.json({ error: "Failed to fetch" }, { status: 502 });

    const data = await res.json();
    const rawTokens = (data.data || []).filter((t: any) => t.id && t.contract_address);
    const addresses = rawTokens.map((t: any) => t.contract_address);
    const dexData = await fetchDexScreenerBatch(addresses);

    let tokens = rawTokens.map((t: any) => formatClankerToken(t, dexData[t.contract_address.toLowerCase()]));

    if (sortBy === "volume") {
      tokens.sort((a: any, b: any) => (b.volume24h || 0) - (a.volume24h || 0));
    } else if (sortBy === "mcap") {
      tokens.sort((a: any, b: any) => (b.marketCap || b.fdv || 0) - (a.marketCap || a.fdv || 0));
    }

    return NextResponse.json({
      tokens,
      total: data.total || tokens.length,
      totalDeployed: data.tokensDeployed || 0,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

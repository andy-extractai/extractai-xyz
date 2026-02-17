import { NextRequest, NextResponse } from "next/server";

const CLANKER_API = "https://www.clanker.world/api/tokens";
const DEXSCREENER_API = "https://api.dexscreener.com/tokens/v1/base";

const AGENT_KEYWORDS = [
  "ai", "agent", "bot", "assistant", "gpt", "llm", "autonomous",
  "claw", "4claw", "clawnch", "moltbot", "openclaw", "bankr",
  "neural", "intelligence", "cognitive", "sentient", "autonom",
];

function isAgentToken(t: any): boolean {
  const text = `${t.name} ${t.symbol} ${t.description || ""}`.toLowerCase();
  return AGENT_KEYWORDS.some((kw) => {
    const regex = new RegExp(`(^|[^a-z])${kw}([^a-z]|$)`, "i");
    return regex.test(text);
  });
}

function formatToken(t: any, dexData?: any) {
  const socialLinks: Record<string, string> = {};
  if (t.socialLinks) {
    for (const link of t.socialLinks) {
      socialLinks[link.name] = link.link;
    }
  }

  return {
    id: t.id,
    name: t.name,
    symbol: t.symbol,
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
    // Live market data from DexScreener
    volume24h: dexData ? parseFloat(dexData.volume?.h24 || "0") : null,
    marketCap: dexData ? (dexData.marketCap || null) : null,
    fdv: dexData ? (dexData.fdv || null) : null,
    priceUsd: dexData ? dexData.priceUsd : null,
    priceChange24h: dexData?.priceChange?.h24 ?? null,
    liquidity: dexData?.liquidity?.usd ?? null,
    txns24h: dexData ? {
      buys: dexData.txns?.h24?.buys || 0,
      sells: dexData.txns?.h24?.sells || 0,
    } : null,
  };
}

async function fetchDexScreenerBatch(addresses: string[]): Promise<Record<string, any>> {
  if (addresses.length === 0) return {};

  // DexScreener supports up to 30 addresses per call
  const chunks: string[][] = [];
  for (let i = 0; i < addresses.length; i += 30) {
    chunks.push(addresses.slice(i, i + 30));
  }

  const results: Record<string, any> = {};

  await Promise.all(
    chunks.map(async (chunk) => {
      try {
        const url = `${DEXSCREENER_API}/${chunk.join(",")}`;
        const res = await fetch(url, { next: { revalidate: 30 } });
        if (!res.ok) return;
        const pairs = await res.json();
        if (!Array.isArray(pairs)) return;
        // Group by base token address, keep highest volume pair
        for (const pair of pairs) {
          const addr = pair.baseToken?.address?.toLowerCase();
          if (!addr) continue;
          const existing = results[addr];
          if (!existing || parseFloat(pair.volume?.h24 || "0") > parseFloat(existing.volume?.h24 || "0")) {
            results[addr] = pair;
          }
        }
      } catch {}
    })
  );

  return results;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = searchParams.get("page") || "1";
  const limit = parseInt(searchParams.get("limit") || "50");
  const filter = searchParams.get("filter") || "all";
  const search = searchParams.get("search") || "";
  const sortBy = searchParams.get("sort") || "volume"; // "volume" | "time" | "mcap"

  try {
    if (filter === "agents") {
      // Scan multiple pages to find agent tokens
      const agentTokens: any[] = [];
      const seenIds = new Set<number>();
      const pagesToScan = 10;

      const fetchPromises = [];
      for (let p = 1; p <= pagesToScan; p++) {
        const url = search
          ? `${CLANKER_API}?sort=desc&page=${p}&limit=100&search=${encodeURIComponent(search)}`
          : `${CLANKER_API}?sort=desc&page=${p}&limit=100`;
        fetchPromises.push(
          fetch(url, { next: { revalidate: 30 } })
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null)
        );
      }

      const results = await Promise.all(fetchPromises);
      let totalDeployed = 0;

      for (const data of results) {
        if (!data?.data) continue;
        totalDeployed = data.tokensDeployed || totalDeployed;
        for (const t of data.data) {
          if (isAgentToken(t) && !seenIds.has(t.id)) {
            seenIds.add(t.id);
            agentTokens.push(t);
          }
        }
      }

      // Fetch live market data from DexScreener
      const addresses = agentTokens.map((t) => t.contract_address);
      const dexData = await fetchDexScreenerBatch(addresses);

      // Format with enriched data
      const formatted = agentTokens.map((t) => {
        const dex = dexData[t.contract_address.toLowerCase()];
        return formatToken(t, dex);
      });

      // Sort
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
        totalDeployed,
      });
    }

    // "all" filter
    const url = search
      ? `${CLANKER_API}?sort=desc&page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`
      : `${CLANKER_API}?sort=desc&page=${page}&limit=${limit}`;

    const res = await fetch(url, { next: { revalidate: 30 } });
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch tokens" }, { status: 502 });
    }

    const data = await res.json();
    const rawTokens = data.data || [];

    // Fetch DexScreener data for all tokens
    const addresses = rawTokens.map((t: any) => t.contract_address);
    const dexData = await fetchDexScreenerBatch(addresses);

    let tokens = rawTokens.map((t: any) => {
      const dex = dexData[t.contract_address.toLowerCase()];
      return formatToken(t, dex);
    });

    // Sort
    if (sortBy === "volume") {
      tokens.sort((a: any, b: any) => (b.volume24h || 0) - (a.volume24h || 0));
    } else if (sortBy === "mcap") {
      tokens.sort((a: any, b: any) => (b.marketCap || b.fdv || 0) - (a.marketCap || a.fdv || 0));
    }

    return NextResponse.json({
      tokens,
      total: data.total,
      totalDeployed: data.tokensDeployed,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

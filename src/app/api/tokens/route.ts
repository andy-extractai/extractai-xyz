import { NextRequest, NextResponse } from "next/server";

const DEXSCREENER_SEARCH = "https://api.dexscreener.com/latest/dex/search";
const DEXSCREENER_TOKENS = "https://api.dexscreener.com/tokens/v1/base";
const CLANKER_API = "https://www.clanker.world/api/tokens";

const AGENT_KEYWORDS = [
  "ai", "agent", "bot", "assistant", "gpt", "llm", "autonomous",
  "claw", "4claw", "clawnch", "moltbot", "openclaw", "bankr",
  "neural", "intelligence", "cognitive", "sentient", "autonom",
];

const SEARCH_TERMS = [
  "AI agent", "AI bot", "autonomous agent", "GPT bot",
  "claw agent", "bankr bot", "neural AI", "sentient AI",
];

// Thresholds
const MIN_MARKET_CAP = 250_000;
const MIN_LIQUIDITY = 25_000;
const MIN_TXNS = 125;

function isAgentToken(name: string, symbol: string, description: string): boolean {
  const text = `${name} ${symbol} ${description}`.toLowerCase();
  return AGENT_KEYWORDS.some((kw) => {
    const regex = new RegExp(`(^|[^a-z])${kw}([^a-z]|$)`, "i");
    return regex.test(text);
  });
}

function extractSocialLinks(info: any): Record<string, string> {
  const links: Record<string, string> = {};
  if (info?.websites) {
    for (const w of info.websites) {
      if (w.url) links.website = w.url;
    }
  }
  if (info?.socials) {
    for (const s of info.socials) {
      if (s.type === "twitter" && s.url) links.twitter = s.url;
      if (s.type === "telegram" && s.url) links.telegram = s.url;
      if (s.type === "discord" && s.url) links.discord = s.url;
    }
  }
  return links;
}

function passesThresholds(pair: any): boolean {
  const mc = pair.marketCap || pair.fdv || 0;
  const liq = pair.liquidity?.usd || 0;
  const txns = (pair.txns?.h24?.buys || 0) + (pair.txns?.h24?.sells || 0);
  return mc >= MIN_MARKET_CAP && liq >= MIN_LIQUIDITY && txns >= MIN_TXNS;
}

function formatPair(pair: any) {
  const buys = pair.txns?.h24?.buys || 0;
  const sells = pair.txns?.h24?.sells || 0;
  const vol = parseFloat(pair.volume?.h24 || "0");
  const mc = pair.marketCap || pair.fdv || 0;

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
    type: "clanker",
    verified: false,
    warnings: [] as string[],
    socialLinks: extractSocialLinks(pair.info),
    pair: pair.quoteToken?.symbol || "WETH",
    volume24h: vol,
    marketCap: pair.marketCap || null,
    fdv: pair.fdv || null,
    priceUsd: pair.priceUsd || null,
    priceChange24h: pair.priceChange?.h24 ?? null,
    liquidity: pair.liquidity?.usd ?? null,
    txns24h: { buys, sells },
    dexUrl: pair.url || null,
    score: computeScore(vol, mc, pair.liquidity?.usd || 0, buys + sells, buys),
  };
}

function computeScore(vol: number, mc: number, liq: number, txns: number, buys: number): number {
  if (vol < 500 || liq < MIN_LIQUIDITY || txns < 5) return 0;
  const log = Math.log10;
  let s = log(Math.max(vol, 1)) * 10 + log(Math.max(liq, 1)) * 8 + log(Math.max(mc, 1)) * 5 + log(Math.max(txns, 1)) * 12;
  const vmcRatio = mc > 0 ? vol / mc : 0;
  s += Math.min(vmcRatio * 10, 20);
  const buyRatio = txns > 0 ? buys / txns : 0.5;
  s += (buyRatio - 0.5) * 20;
  return Math.round(s * 10) / 10;
}

async function searchAgentTokens(): Promise<any[]> {
  const seen = new Set<string>();
  const allPairs: any[] = [];

  const results = await Promise.all(
    SEARCH_TERMS.map(async (q) => {
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
      const name = pair.baseToken?.name || "";
      const symbol = pair.baseToken?.symbol || "";
      if (isAgentToken(name, symbol, name)) {
        seen.add(addr);
        if (passesThresholds(pair)) {
          allPairs.push(pair);
        }
      }
    }
  }

  return allPairs;
}

function formatClankerToken(t: any, dexData?: any) {
  const socialLinks: Record<string, string> = {};
  if (Array.isArray(t.socialLinks)) {
    for (const link of t.socialLinks) {
      if (link.name && link.link) socialLinks[link.name] = link.link;
    }
  }
  const dexLinks = extractSocialLinks(dexData?.info);
  for (const [k, v] of Object.entries(dexLinks)) {
    if (!socialLinks[k]) socialLinks[k] = v;
  }

  const vol = dexData ? parseFloat(dexData.volume?.h24 || "0") : 0;
  const mc = dexData ? (dexData.marketCap || dexData.fdv || 0) : 0;
  const liq = dexData?.liquidity?.usd || 0;
  const buys = dexData?.txns?.h24?.buys || 0;
  const sells = dexData?.txns?.h24?.sells || 0;

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
    type: t.type,
    verified: t.tags?.verified || false,
    warnings: t.warnings || [],
    socialLinks,
    pair: t.pair || "WETH",
    volume24h: vol,
    marketCap: dexData?.marketCap || null,
    fdv: dexData?.fdv || null,
    priceUsd: dexData?.priceUsd || null,
    priceChange24h: dexData?.priceChange?.h24 ?? null,
    liquidity: liq,
    txns24h: { buys, sells },
    score: computeScore(vol, mc, liq, buys + sells, buys),
  };
}

async function fetchDexScreenerBatch(addresses: string[]): Promise<Record<string, any>> {
  if (addresses.length === 0) return {};
  const results: Record<string, any> = {};
  for (let i = 0; i < addresses.length; i += 30) {
    const chunk = addresses.slice(i, i + 30);
    try {
      const res = await fetch(`${DEXSCREENER_TOKENS}/${chunk.join(",")}`, { next: { revalidate: 30 } });
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
      const pairs = await searchAgentTokens();
      const formatted = pairs.map(formatPair);

      // Split into new (<72h) and all
      const now = Date.now();
      const HOURS_72 = 72 * 60 * 60 * 1000;
      const newTokens = formatted.filter((t) => {
        const deployed = new Date(t.deployedAt).getTime();
        return deployed > 0 && now - deployed < HOURS_72;
      });
      const allTokens = [...formatted];

      // Sort both by chosen metric
      const sortFn = (a: any, b: any) => {
        if (sortBy === "mcap") return (b.marketCap || b.fdv || 0) - (a.marketCap || a.fdv || 0);
        if (sortBy === "score") return (b.score || 0) - (a.score || 0);
        return (b.volume24h || 0) - (a.volume24h || 0); // default: volume
      };
      newTokens.sort(sortFn);
      allTokens.sort(sortFn);

      return NextResponse.json({
        newTokens: newTokens.slice(0, limit),
        allTokens: allTokens.slice(0, limit),
        total: formatted.length,
        thresholds: { minMarketCap: MIN_MARKET_CAP, minLiquidity: MIN_LIQUIDITY, minTxns: MIN_TXNS },
      });
    }

    // "all" filter
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

    if (sortBy === "volume") tokens.sort((a: any, b: any) => (b.volume24h || 0) - (a.volume24h || 0));
    else if (sortBy === "mcap") tokens.sort((a: any, b: any) => (b.marketCap || b.fdv || 0) - (a.marketCap || a.fdv || 0));

    return NextResponse.json({
      tokens,
      total: data.total || tokens.length,
      totalDeployed: data.tokensDeployed || 0,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

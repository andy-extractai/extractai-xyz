import { NextRequest, NextResponse } from "next/server";

const CLANKER_API = "https://www.clanker.world/api/tokens";

// Keywords that indicate an AI agent token
const AGENT_KEYWORDS = [
  "ai", "agent", "bot", "assistant", "gpt", "llm", "autonomous",
  "claw", "4claw", "clawnch", "moltbot", "openclaw", "bankr",
  "neural", "intelligence", "cognitive", "sentient", "autonom",
];

function isAgentToken(token: any): boolean {
  const text = `${token.name} ${token.symbol} ${token.description || ""}`.toLowerCase();
  return AGENT_KEYWORDS.some((kw) => {
    // Word boundary matching to avoid false positives
    const regex = new RegExp(`(^|[^a-z])${kw}([^a-z]|$)`, "i");
    return regex.test(text);
  });
}

function formatToken(t: any) {
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
    imageUrl: t.img_url || null,
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
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = searchParams.get("page") || "1";
  const limit = parseInt(searchParams.get("limit") || "50");
  const filter = searchParams.get("filter") || "all"; // "all" | "agents"
  const search = searchParams.get("search") || "";

  try {
    if (filter === "agents") {
      // For agent filter: scan through multiple pages to find agent tokens
      const allAgentTokens: any[] = [];
      const seenIds = new Set<number>();
      const pagesToScan = 10; // scan 10 pages of 100 = 1000 tokens
      
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
            allAgentTokens.push(formatToken(t));
          }
        }
      }

      // Sort by deployed date descending
      allAgentTokens.sort(
        (a, b) => new Date(b.deployedAt).getTime() - new Date(a.deployedAt).getTime()
      );

      return NextResponse.json({
        tokens: allAgentTokens.slice(0, limit),
        total: allAgentTokens.length,
        totalDeployed,
      });
    }

    // "all" filter — simple passthrough
    const url = search
      ? `${CLANKER_API}?sort=desc&page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`
      : `${CLANKER_API}?sort=desc&page=${page}&limit=${limit}`;

    const res = await fetch(url, { next: { revalidate: 30 } });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch tokens" }, { status: 502 });
    }

    const data = await res.json();
    const tokens = (data.data || []).map(formatToken);

    return NextResponse.json({
      tokens,
      total: data.total,
      totalDeployed: data.tokensDeployed,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

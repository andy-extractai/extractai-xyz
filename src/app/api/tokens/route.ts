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
  return AGENT_KEYWORDS.some((kw) => text.includes(kw));
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
  const limit = searchParams.get("limit") || "50";
  const filter = searchParams.get("filter") || "all"; // "all" | "agents"
  const search = searchParams.get("search") || "";

  try {
    // Fetch more than needed so we can filter for agents
    const fetchLimit = filter === "agents" ? 200 : parseInt(limit);
    const url = search
      ? `${CLANKER_API}?sort=desc&page=${page}&limit=${fetchLimit}&search=${encodeURIComponent(search)}`
      : `${CLANKER_API}?sort=desc&page=${page}&limit=${fetchLimit}`;

    const res = await fetch(url, {
      next: { revalidate: 30 }, // cache for 30s
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch tokens" }, { status: 502 });
    }

    const data = await res.json();
    let tokens = (data.data || []).map(formatToken);

    if (filter === "agents") {
      tokens = tokens.filter((t: any) => {
        const text = `${t.name} ${t.symbol} ${t.description}`.toLowerCase();
        return AGENT_KEYWORDS.some((kw) => text.includes(kw));
      });
      tokens = tokens.slice(0, parseInt(limit));
    }

    return NextResponse.json({
      tokens,
      total: filter === "agents" ? tokens.length : data.total,
      totalDeployed: data.tokensDeployed,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

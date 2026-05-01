import { NextResponse } from "next/server";

const SYNC_SECRET = process.env.DISCORD_SYNC_SECRET || "";

const domain = process.env.SHOPIFY_STORE_DOMAIN
  ? process.env.SHOPIFY_STORE_DOMAIN.startsWith("https://")
    ? process.env.SHOPIFY_STORE_DOMAIN
    : `https://${process.env.SHOPIFY_STORE_DOMAIN}`
  : "";
const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || "";
const adminEndpoint = domain ? `${domain}/admin/api/2024-10/graphql.json` : "";

const TIERS = [
  { name: "bronze",   min: 0,     max: 5000     },
  { name: "silver",   min: 5000,  max: 15000    },
  { name: "gold",     min: 15000, max: 30000    },
  { name: "platinum", min: 30000, max: 50000    },
  { name: "champion", min: 50000, max: Infinity },
];

function getNextTier(tierName: string): string | null {
  const idx = TIERS.findIndex((t) => t.name === tierName);
  return idx >= 0 && idx < TIERS.length - 1 ? TIERS[idx + 1]!.name : null;
}

async function adminFetch(query: string, variables: Record<string, unknown> = {}) {
  const res = await fetch(adminEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": adminToken,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`Admin API ${res.status}`);
  return res.json();
}

export async function GET(request: Request) {
  const syncSecret = request.headers.get("x-discord-sync-secret");
  if (!SYNC_SECRET || syncSecret !== SYNC_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const discordId = searchParams.get("discordId");
  if (!discordId) return NextResponse.json({ error: "discordId required" }, { status: 400 });

  const searchData = await adminFetch(
    `query customers($q: String!) {
      customers(first: 1, query: $q) {
        edges { node { id tags totalSpentV2 { amount } } }
      }
    }`,
    { q: `tag:discord:${discordId}` },
  );

  const node = searchData.data?.customers?.edges?.[0]?.node;
  if (!node) return NextResponse.json({ tier: null });

  const tags: string[] = node.tags || [];
  const tierTag = tags.find((t: string) => t.startsWith("tier:"));
  const isAthlete = tags.includes("tier:athlete");
  const isAdmin = tags.includes("tier:admin");

  const totalSpent = parseFloat(node.totalSpentV2?.amount || "0");
  const points = Math.floor(totalSpent * 50);

  const tier = tierTag ? tierTag.replace("tier:", "") : "bronze";
  const nextTier = isAthlete || isAdmin ? null : getNextTier(tier);

  return NextResponse.json({ tier, points, nextTier });
}

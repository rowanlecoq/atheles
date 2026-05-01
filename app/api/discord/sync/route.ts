import { NextResponse } from "next/server";

const SYNC_SECRET = process.env.DISCORD_SYNC_SECRET || "";

const domain = process.env.SHOPIFY_STORE_DOMAIN
  ? process.env.SHOPIFY_STORE_DOMAIN.startsWith("https://")
    ? process.env.SHOPIFY_STORE_DOMAIN
    : `https://${process.env.SHOPIFY_STORE_DOMAIN}`
  : "";
const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || "";
const adminEndpoint = domain ? `${domain}/admin/api/2024-10/graphql.json` : "";

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

// Returns all customers who have a discord: tag
export async function GET(request: Request) {
  const syncSecret = request.headers.get("x-discord-sync-secret");
  if (!SYNC_SECRET || syncSecret !== SYNC_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const data = await adminFetch(
    `query {
      customers(first: 250, query: "tag:discord:*") {
        edges {
          node {
            id
            tags
          }
        }
      }
    }`,
  );

  const edges = data.data?.customers?.edges || [];
  const users = edges
    .map((e: { node: { id: string; tags: string[] } }) => {
      const tags: string[] = e.node.tags || [];
      const discordTag = tags.find((t) => t.startsWith("discord:") && !t.startsWith("discord_username:"));
      const tierTag = tags.find((t) => t.startsWith("tier:"));
      if (!discordTag) return null;
      return {
        discordId: discordTag.replace("discord:", ""),
        tier: tierTag ? tierTag.replace("tier:", "") : "bronze",
      };
    })
    .filter(Boolean);

  return NextResponse.json({ users });
}

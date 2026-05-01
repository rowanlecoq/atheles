import { NextResponse } from "next/server";
import { createHmac } from "crypto";

const LINK_SECRET = process.env.DISCORD_LINK_SECRET || "change-me";
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

function verifyToken(raw: string): string | null {
  try {
    const decoded = Buffer.from(raw, "base64url").toString();
    const parts = decoded.split(".");
    if (parts.length < 4) return null;

    const sig = parts.pop()!;
    const payload = parts.join(".");
    const expected = createHmac("sha256", LINK_SECRET).update(payload).digest("hex");
    if (sig !== expected) return null;

    const expiry = parseInt(parts[1]!, 10);
    if (Date.now() > expiry) return null;

    return parts[0]!; // email
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const syncSecret = request.headers.get("x-discord-sync-secret");
  if (!SYNC_SECRET || syncSecret !== SYNC_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { token, discordId, discordUsername } = await request.json();
  if (!token || !discordId) {
    return NextResponse.json({ error: "token and discordId required" }, { status: 400 });
  }

  const email = verifyToken(token);
  if (!email) {
    return NextResponse.json({ error: "invalid or expired token" }, { status: 400 });
  }

  // Look up customer by email in Shopify
  const searchData = await adminFetch(
    `query customers($q: String!) {
      customers(first: 1, query: $q) {
        edges { node { id tags } }
      }
    }`,
    { q: `email:${email}` },
  );

  const node = searchData.data?.customers?.edges?.[0]?.node;
  if (!node) return NextResponse.json({ error: "account not found" }, { status: 404 });

  // Store discord ID tag, keep all other tags intact
  const filteredTags: string[] = (node.tags as string[]).filter(
    (t: string) => !t.startsWith("discord:"),
  );
  if (discordUsername) filteredTags.push(`discord_username:${discordUsername}`);
  filteredTags.push(`discord:${discordId}`);

  await adminFetch(
    `mutation customerUpdate($input: CustomerInput!) {
      customerUpdate(input: $input) {
        customer { id }
        userErrors { message }
      }
    }`,
    { input: { id: node.id, tags: filteredTags } },
  );

  // Determine tier from tags
  const tierTag = (node.tags as string[]).find((t: string) => t.startsWith("tier:"));
  const tier = tierTag ? tierTag.replace("tier:", "") : "bronze";

  return NextResponse.json({ success: true, tier });
}

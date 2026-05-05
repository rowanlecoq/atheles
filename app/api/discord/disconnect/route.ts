import { assignDiscordRole } from "lib/discord";
import { getCustomerByToken } from "lib/auth/shopify-customer";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

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
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": adminToken },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`Admin API ${res.status}`);
  return res.json();
}

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get("atheles-auth-token")?.value;
  if (!token) return NextResponse.json({ error: "not logged in" }, { status: 401 });

  const customer = await getCustomerByToken(token);
  if (!customer) return NextResponse.json({ error: "not logged in" }, { status: 401 });

  const searchData = await adminFetch(
    `query customers($q: String!) {
      customers(first: 1, query: $q) {
        edges { node { id tags } }
      }
    }`,
    { q: `email:${customer.email}` },
  );

  const node = searchData.data?.customers?.edges?.[0]?.node;
  if (!node) return NextResponse.json({ error: "customer not found" }, { status: 404 });

  const discordTag = (node.tags as string[]).find(
    (t: string) => t.startsWith("discord:") && !t.startsWith("discord_username:"),
  );
  const discordId = discordTag?.replace("discord:", "") ?? null;

  const filteredTags = (node.tags as string[]).filter(
    (t: string) => !t.startsWith("discord:") && !t.startsWith("discord_username:"),
  );

  await adminFetch(
    `mutation customerUpdate($input: CustomerInput!) {
      customerUpdate(input: $input) { customer { id } userErrors { message } }
    }`,
    { input: { id: node.id, tags: filteredTags } },
  );

  if (discordId) await assignDiscordRole(discordId, "__none__").catch(() => {});

  return NextResponse.json({ success: true });
}

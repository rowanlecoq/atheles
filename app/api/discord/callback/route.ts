import { assignDiscordRole } from "lib/discord";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

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

const profileUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/profile`;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const cookieStore = await cookies();
  const storedState = cookieStore.get("discord-oauth-state")?.value;

  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(`${profileUrl}?discord=error`);
  }

  // Decode email from state
  const email = Buffer.from(state, "base64url").toString();

  // Exchange code for Discord access token
  const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID!,
      client_secret: process.env.DISCORD_CLIENT_SECRET!,
      grant_type: "authorization_code",
      code,
      redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/discord/callback`,
    }),
  });

  if (!tokenRes.ok) return NextResponse.redirect(`${profileUrl}?discord=error`);
  const { access_token } = await tokenRes.json();

  // Get Discord user
  const userRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!userRes.ok) return NextResponse.redirect(`${profileUrl}?discord=error`);
  const discordUser = await userRes.json();

  // Find Shopify customer by email and update discord tags
  const searchData = await adminFetch(
    `query customers($q: String!) {
      customers(first: 1, query: $q) {
        edges { node { id tags } }
      }
    }`,
    { q: `email:${email}` },
  );

  const node = searchData.data?.customers?.edges?.[0]?.node;
  if (!node) return NextResponse.redirect(`${profileUrl}?discord=error`);

  const tags: string[] = (node.tags as string[]).filter(
    (t: string) => !t.startsWith("discord:") && !t.startsWith("discord_username:"),
  );
  tags.push(`discord:${discordUser.id}`);
  tags.push(`discord_username:${discordUser.username}`);

  await adminFetch(
    `mutation customerUpdate($input: CustomerInput!) {
      customerUpdate(input: $input) {
        customer { id }
        userErrors { message }
      }
    }`,
    { input: { id: node.id, tags } },
  );

  // Assign Discord role based on current tier
  const tierTag = (node.tags as string[]).find((t: string) => t.startsWith("tier:"));
  const tier = tierTag ? tierTag.replace("tier:", "") : "bronze";
  await assignDiscordRole(discordUser.id, tier).catch(() => {});

  const res = NextResponse.redirect(`${profileUrl}?discord=linked`);
  res.cookies.delete("discord-oauth-state");
  return res;
}

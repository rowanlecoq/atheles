import { getCustomerByToken } from "lib/auth/shopify-customer";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || "";
const domain = process.env.SHOPIFY_STORE_DOMAIN
  ? process.env.SHOPIFY_STORE_DOMAIN.startsWith("https://")
    ? process.env.SHOPIFY_STORE_DOMAIN
    : `https://${process.env.SHOPIFY_STORE_DOMAIN}`
  : "";
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
  return res.json();
}

async function verifyAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("atheles-auth-token")?.value;
  if (!token) return false;
  const customer = await getCustomerByToken(token);
  return customer?.isAdmin ?? false;
}

const DEFAULT_QUOTES = [
  { text: "Excellence is not a gift. It is a skill that takes practice.", author: "Plato" },
  { text: "No man is free who is not master of himself.", author: "Epictetus" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
  { text: "The soul that is within me no man can degrade.", author: "Frederick Douglass" },
  { text: "He who is not a good servant will not be a good master.", author: "Plato" },
  { text: "Strength does not come from physical capacity. It comes from an indomitable will.", author: "Ancient proverb" },
  { text: "The mind is everything. What you think, you become.", author: "Greek philosophy" },
];

export async function GET() {
  try {
    const data = await adminFetch(`
      query { shop { metafield(namespace: "atheles", key: "quotes") { value } } }
    `);
    const raw = data.data?.shop?.metafield?.value;
    if (raw) {
      try { return NextResponse.json({ quotes: JSON.parse(raw) }); } catch {}
    }
    return NextResponse.json({ quotes: DEFAULT_QUOTES });
  } catch {
    return NextResponse.json({ quotes: DEFAULT_QUOTES });
  }
}

export async function POST(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { quotes } = await request.json();
  if (!Array.isArray(quotes)) {
    return NextResponse.json({ error: "quotes must be an array" }, { status: 400 });
  }

  const cleaned = quotes.filter((q: { text: string; author: string }) => q.text?.trim());

  const shopData = await adminFetch(`query { shop { id } }`);
  const shopId = shopData.data?.shop?.id;
  if (!shopId) return NextResponse.json({ error: "shop not found" }, { status: 500 });

  await adminFetch(`
    mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields { key }
        userErrors { message }
      }
    }
  `, {
    metafields: [{
      ownerId: shopId,
      namespace: "atheles",
      key: "quotes",
      type: "json",
      value: JSON.stringify(cleaned),
    }],
  });

  return NextResponse.json({ success: true, count: cleaned.length });
}

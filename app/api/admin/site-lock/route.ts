import { getCustomerByToken } from "lib/auth/shopify-customer";
import { revalidateTag } from "next/cache";
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
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": adminToken },
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

export type SiteLock = {
  locked: boolean;
  message: string;
  countdownTo: string | null; // ISO date string or null
};

const DEFAULT_LOCK: SiteLock = {
  locked: false,
  message: "we're currently updating the site. check back soon.",
  countdownTo: null,
};

export async function GET() {
  try {
    const data = await adminFetch(`
      query { shop { metafield(namespace: "atheles", key: "site_lock") { value } } }
    `);
    const raw = data.data?.shop?.metafield?.value;
    if (raw) {
      try {
        return NextResponse.json({ lock: { ...DEFAULT_LOCK, ...JSON.parse(raw) } });
      } catch {}
    }
    return NextResponse.json({ lock: DEFAULT_LOCK });
  } catch {
    return NextResponse.json({ lock: DEFAULT_LOCK });
  }
}

export async function POST(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { lock } = await request.json();
    if (!lock) return NextResponse.json({ error: "lock data required" }, { status: 400 });

    const shopData = await adminFetch(`query { shop { id } }`);
    const shopId = shopData.data?.shop?.id;
    if (shopId) {
      await adminFetch(`
        mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields) { metafields { key } userErrors { message } }
        }
      `, {
        metafields: [{
          ownerId: shopId,
          namespace: "atheles",
          key: "site_lock",
          type: "json",
          value: JSON.stringify(lock),
        }],
      });
    }
    try { revalidateTag("site-lock"); } catch {}
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin/site-lock] Error:", err);
    return NextResponse.json({ error: "something went wrong" }, { status: 500 });
  }
}

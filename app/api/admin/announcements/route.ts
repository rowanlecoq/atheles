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
  if (!res.ok) throw new Error(`Admin API ${res.status}`);
  return res.json();
}

async function verifyAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("atheles-auth-token")?.value;
  if (!token) return false;
  const customer = await getCustomerByToken(token);
  return customer?.isAdmin ?? false;
}

// GET: fetch current announcements from shop metafield
export async function GET() {
  try {
    const data = await adminFetch(`
      query {
        shop {
          metafield(namespace: "atheles", key: "announcements") {
            value
          }
        }
      }
    `);

    const raw = data.data?.shop?.metafield?.value;
    if (raw) {
      try {
        return NextResponse.json({ announcements: JSON.parse(raw) });
      } catch {}
    }

    // Return defaults if no metafield set
    return NextResponse.json({
      announcements: [
        "to ascend.",
        "coming soon. this summer.",
        "authentic superiority.",
        "follow us at @atheles.co to share your aesthetic.",
      ],
    });
  } catch {
    return NextResponse.json({ announcements: [] });
  }
}

// POST: save announcements to shop metafield (admin only)
export async function POST(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { announcements } = await request.json();

  if (!Array.isArray(announcements)) {
    return NextResponse.json({ error: "announcements must be an array" }, { status: 400 });
  }

  // Filter out empty strings
  const cleaned = announcements.filter((a: string) => a.trim().length > 0);

  const data = await adminFetch(`
    mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields { key value }
        userErrors { field message }
      }
    }
  `, {
    metafields: [{
      ownerId: "gid://shopify/Shop/1",
      namespace: "atheles",
      key: "announcements",
      type: "json",
      value: JSON.stringify(cleaned),
    }],
  });

  // The ownerId might need the actual shop ID. Let's try getting it first.
  if (data.data?.metafieldsSet?.userErrors?.length > 0) {
    // Try with shop query to get actual ID
    const shopData = await adminFetch(`query { shop { id } }`);
    const shopId = shopData.data?.shop?.id;

    if (shopId) {
      await adminFetch(`
        mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields) {
            metafields { key value }
            userErrors { field message }
          }
        }
      `, {
        metafields: [{
          ownerId: shopId,
          namespace: "atheles",
          key: "announcements",
          type: "json",
          value: JSON.stringify(cleaned),
        }],
      });
    }
  }

  return NextResponse.json({ success: true, count: cleaned.length });
}

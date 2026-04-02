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

const DEFAULT_ATHLETES = [
  {
    name: "rowan le coq",
    age: 18,
    role: "founder & athlete",
    image: null,
    socials: {
      tiktok: "https://www.tiktok.com/@rowanlecoq",
      instagram: "https://www.instagram.com/rowanlecoq",
      linkedin: "https://www.linkedin.com/in/rowanlecoq",
      youtube: "https://www.youtube.com/@rowanlecoq",
    },
    hobbies: [
      "baking brownies or chocolate chip banana bread",
      "working out on the daily",
      "playing hockey",
    ],
  },
];

export async function GET() {
  try {
    const data = await adminFetch(`
      query { shop { metafield(namespace: "atheles", key: "athletes") { value } } }
    `);
    const raw = data.data?.shop?.metafield?.value;
    if (raw) {
      try { return NextResponse.json({ athletes: JSON.parse(raw) }); } catch {}
    }
    return NextResponse.json({ athletes: DEFAULT_ATHLETES });
  } catch {
    return NextResponse.json({ athletes: DEFAULT_ATHLETES });
  }
}

export async function POST(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { athletes } = await request.json();
  if (!Array.isArray(athletes)) {
    return NextResponse.json({ error: "athletes must be an array" }, { status: 400 });
  }

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
      key: "athletes",
      type: "json",
      value: JSON.stringify(athletes),
    }],
  });

  return NextResponse.json({ success: true, count: athletes.length });
}

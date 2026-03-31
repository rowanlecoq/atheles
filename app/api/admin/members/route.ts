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

// GET: list all customers with their tiers
export async function GET() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const data = await adminFetch(`
    query {
      customers(first: 100, sortKey: CREATED_AT, reverse: true) {
        edges {
          node {
            id
            email
            firstName
            lastName
            tags
            createdAt
            ordersCount
            totalSpent
          }
        }
      }
    }
  `);

  const customers = (data.data?.customers?.edges || []).map(
    (e: { node: Record<string, unknown> }) => {
      const c = e.node as {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        tags: string[];
        createdAt: string;
        ordersCount: string;
        totalSpent: string;
      };
      const tierTag = c.tags?.find((t) => t.startsWith("tier:"));
      const dobTag = c.tags?.find((t) => t.startsWith("dob:"));
      return {
        id: c.id,
        email: c.email,
        name: `${c.firstName || ""} ${c.lastName || ""}`.trim() || c.email,
        tier: tierTag ? tierTag.replace("tier:", "") : "none",
        dob: dobTag ? dobTag.replace("dob:", "") : null,
        createdAt: c.createdAt,
        ordersCount: c.ordersCount,
        totalSpent: c.totalSpent,
        tags: c.tags,
      };
    },
  );

  return NextResponse.json({ customers });
}

// POST: update a customer's tier tag
export async function POST(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { customerId, tier } = await request.json();

  if (!customerId || !tier) {
    return NextResponse.json({ error: "customerId and tier required" }, { status: 400 });
  }

  const validTiers = ["bronze", "silver", "gold", "platinum", "champion", "athlete", "admin"];
  if (!validTiers.includes(tier)) {
    return NextResponse.json({ error: `invalid tier. valid: ${validTiers.join(", ")}` }, { status: 400 });
  }

  // Get current tags
  const customerData = await adminFetch(`
    query node($id: ID!) {
      node(id: $id) {
        ... on Customer {
          id
          tags
        }
      }
    }
  `, { id: customerId });

  const currentTags: string[] = customerData.data?.node?.tags || [];
  const filteredTags = currentTags.filter((t: string) => !t.startsWith("tier:"));
  const newTags = [...filteredTags, `tier:${tier}`];

  const updateData = await adminFetch(`
    mutation customerUpdate($input: CustomerInput!) {
      customerUpdate(input: $input) {
        customer { id tags }
        userErrors { message }
      }
    }
  `, { input: { id: customerId, tags: newTags } });

  const errors = updateData.data?.customerUpdate?.userErrors || [];
  if (errors.length > 0) {
    return NextResponse.json({ error: errors[0].message }, { status: 400 });
  }

  return NextResponse.json({ success: true, tier });
}

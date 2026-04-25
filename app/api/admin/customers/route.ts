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

// GET: list all customers and their DOB tags
// POST: bulk set DOB tags for specific customers
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const data = await adminFetch(`
      query {
        customers(first: 50) {
          edges {
            node {
              id
              email
              firstName
              lastName
              tags
            }
          }
        }
      }
    `);

    const customers = data.data?.customers?.edges?.map((e: { node: Record<string, unknown> }) => e.node) || [];

    const result = customers.map((c: { id: string; email: string; firstName: string; lastName: string; tags: string[] }) => {
      const dobTag = c.tags?.find((t: string) => t.startsWith("dob:"));
      const tierTag = c.tags?.find((t: string) => t.startsWith("tier:"));
      return {
        email: c.email,
        name: `${c.firstName || ""} ${c.lastName || ""}`.trim(),
        dob: dobTag ? dobTag.replace("dob:", "") : null,
        tier: tierTag ? tierTag.replace("tier:", "") : null,
        allTags: c.tags,
        shopifyId: c.id,
      };
    });

    return NextResponse.json({
      total: result.length,
      withDob: result.filter((c: { dob: string | null }) => c.dob).length,
      withoutDob: result.filter((c: { dob: string | null }) => !c.dob).length,
      customers: result,
    });
  } catch (err) {
    console.error("[admin/customers] Error:", err);
    return NextResponse.json({ error: "failed to fetch customers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Expects: { updates: [{ email: "user@example.com", dob: "2000-01-15" }, ...] }
  const { updates } = await request.json();

  if (!Array.isArray(updates) || updates.length === 0) {
    return NextResponse.json({ error: "provide updates array with email and dob" }, { status: 400 });
  }

  const results = [];

  for (const { email, dob } of updates) {
    if (!email || !dob) {
      results.push({ email, success: false, error: "missing email or dob" });
      continue;
    }

    // Find customer
    const searchData = await adminFetch(`
      query customers($query: String!) {
        customers(first: 1, query: $query) {
          edges { node { id tags } }
        }
      }
    `, { query: `email:${email}` });

    const customer = searchData.data?.customers?.edges?.[0]?.node;
    if (!customer) {
      results.push({ email, success: false, error: "customer not found" });
      continue;
    }

    // Update tags — remove old dob tag, add new one
    const filteredTags = (customer.tags || []).filter((t: string) => !t.startsWith("dob:"));
    const newTags = [...filteredTags, `dob:${dob}`];

    await adminFetch(`
      mutation customerUpdate($input: CustomerInput!) {
        customerUpdate(input: $input) {
          customer { id }
          userErrors { message }
        }
      }
    `, { input: { id: customer.id, tags: newTags } });

    results.push({ email, success: true, dob });
  }

  return NextResponse.json({ results });
}

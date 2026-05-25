import { NextResponse } from "next/server";
import { adminFetch, verifyAdmin } from "lib/admin/utils";

const VALID_TIERS = ["bronze", "silver", "gold", "platinum", "champion", "athlete", "admin"];

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
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
              numberOfOrders
              acceptsMarketing
            }
          }
        }
      }
    `);

    if (data.errors) {
      console.error("[admin/members] GraphQL errors:", JSON.stringify(data.errors));
      return NextResponse.json({ error: "failed to fetch customers" }, { status: 500 });
    }

    const customers = (data.data?.customers?.edges || []).map(
      (e: { node: Record<string, unknown> }) => {
        const c = e.node as {
          id: string;
          email: string;
          firstName: string;
          lastName: string;
          tags: string[];
          createdAt: string;
          numberOfOrders: string;
          acceptsMarketing: boolean;
        };
        const tierTag = c.tags?.find((t) => t.startsWith("tier:"));
        const dobTag = c.tags?.find((t) => t.startsWith("dob:"));
        return {
          id: c.id,
          email: c.email,
          name: `${c.firstName || ""} ${c.lastName || ""}`.trim() || c.email,
          tier: tierTag ? tierTag.replace("tier:", "") : "bronze",
          dob: dobTag ? dobTag.replace("dob:", "") : null,
          createdAt: c.createdAt,
          orders: c.numberOfOrders || "0",
          tags: c.tags,
          newsletter: c.acceptsMarketing,
        };
      },
    );

    return NextResponse.json({ customers });
  } catch (err) {
    console.error("[admin/members] Error:", err);
    return NextResponse.json({ error: "failed to fetch customers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { customerId, tier } = await request.json();

  if (!customerId || !tier) {
    return NextResponse.json({ error: "customerId and tier required" }, { status: 400 });
  }

  if (!VALID_TIERS.includes(tier)) {
    return NextResponse.json({ error: `invalid tier. valid: ${VALID_TIERS.join(", ")}` }, { status: 400 });
  }

  const customerData = await adminFetch(
    `query node($id: ID!) { node(id: $id) { ... on Customer { id tags } } }`,
    { id: customerId },
  );

  const currentTags: string[] = customerData.data?.node?.tags || [];
  const newTags = [...currentTags.filter((t: string) => !t.startsWith("tier:")), `tier:${tier}`];

  const updateData = await adminFetch(
    `mutation customerUpdate($input: CustomerInput!) {
      customerUpdate(input: $input) {
        customer { id tags }
        userErrors { message }
      }
    }`,
    { input: { id: customerId, tags: newTags } },
  );

  const errors = updateData.data?.customerUpdate?.userErrors || [];
  if (errors.length > 0) {
    return NextResponse.json({ error: errors[0].message }, { status: 400 });
  }

  return NextResponse.json({ success: true, tier });
}

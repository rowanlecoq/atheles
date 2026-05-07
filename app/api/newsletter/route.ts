import { updateCustomer } from "lib/auth/shopify-customer";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || "";
const rawDomain = process.env.SHOPIFY_STORE_DOMAIN || "";
const domain = rawDomain
  ? rawDomain.startsWith("https://") ? rawDomain : `https://${rawDomain}`
  : "";
const adminEndpoint = domain ? `${domain}/admin/api/2024-10/graphql.json` : "";

async function adminGraphQL(query: string, variables: Record<string, unknown> = {}) {
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

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "email is required" },
        { status: 400 },
      );
    }

    if (!domain || !adminToken) {
      return NextResponse.json(
        { success: false, error: "store not configured" },
        { status: 500 },
      );
    }

    // Logged-in user — just update their marketing preference
    const cookieStore = await cookies();
    const authToken = cookieStore.get("atheles-auth-token")?.value;
    if (authToken) {
      await updateCustomer(authToken, { acceptsMarketing: true });
      return NextResponse.json({ success: true, updated: true });
    }

    // Try to create the customer via Admin GraphQL.
    // emailMarketingConsent sets the subscription status shown in Shopify admin.
    const createData = await adminGraphQL(
      `mutation customerCreate($input: CustomerInput!) {
        customerCreate(input: $input) {
          customer { id }
          userErrors { field message code }
        }
      }`,
      {
        input: {
          email,
          acceptsMarketing: true,
          emailMarketingConsent: {
            marketingState: "SUBSCRIBED",
            marketingOptInLevel: "SINGLE_OPT_IN",
            consentUpdatedAt: new Date().toISOString(),
          },
        },
      },
    );

    const userErrors = createData.data?.customerCreate?.userErrors ?? [];
    const alreadyExists = userErrors.some(
      (e: { code: string }) => e.code === "TAKEN" || e.code === "CUSTOMER_DISABLED",
    );

    if (alreadyExists) {
      // Customer exists — look them up and update their marketing consent
      const searchData = await adminGraphQL(
        `query findCustomer($query: String!) {
          customers(first: 1, query: $query) {
            edges { node { id } }
          }
        }`,
        { query: `email:${email}` },
      );

      const customerId = searchData.data?.customers?.edges?.[0]?.node?.id;
      if (customerId) {
        await adminGraphQL(
          `mutation customerUpdate($input: CustomerInput!) {
            customerUpdate(input: $input) {
              userErrors { message }
            }
          }`,
          {
            input: {
              id: customerId,
              acceptsMarketing: true,
              emailMarketingConsent: {
                marketingState: "SUBSCRIBED",
                marketingOptInLevel: "SINGLE_OPT_IN",
                consentUpdatedAt: new Date().toISOString(),
              },
            },
          },
        );
      }
      return NextResponse.json({ success: true });
    }

    if (userErrors.length > 0) {
      return NextResponse.json(
        { success: false, error: "failed to subscribe" },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "something went wrong" },
      { status: 500 },
    );
  }
}

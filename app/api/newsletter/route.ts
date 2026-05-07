import { updateCustomer } from "lib/auth/shopify-customer";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || "";
const rawDomain = process.env.SHOPIFY_STORE_DOMAIN || "";
const domain = rawDomain
  ? rawDomain.startsWith("https://") ? rawDomain : `https://${rawDomain}`
  : "";

async function adminRest(path: string, method: string, body?: object) {
  return fetch(`${domain}/admin/api/2024-10${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": adminToken,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
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

    // Create customer via REST API with send_email_invite: false so no invite
    // email is ever sent to newsletter subscribers.
    const createRes = await adminRest("/customers.json", "POST", {
      customer: {
        email,
        accepts_marketing: true,
        marketing_opt_in_level: "single_opt_in",
        email_marketing_consent: {
          state: "subscribed",
          opt_in_level: "single_opt_in",
          consent_updated_at: new Date().toISOString(),
        },
        send_email_invite: false,
        send_email_welcome: false,
        verified_email: true,
      },
    });

    if (createRes.ok) {
      return NextResponse.json({ success: true });
    }

    const createData = await createRes.json();
    const errors: string[] = createData.errors?.email ?? [];
    const alreadyExists = errors.some((e) =>
      e.toLowerCase().includes("taken") || e.toLowerCase().includes("already"),
    );

    if (alreadyExists) {
      // Customer exists — look them up and update their marketing consent
      const searchRes = await adminRest(
        `/customers/search.json?query=email:${encodeURIComponent(email)}&limit=1`,
        "GET",
      );
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        const customer = searchData.customers?.[0];
        if (customer) {
          await adminRest(`/customers/${customer.id}.json`, "PUT", {
            customer: {
              id: customer.id,
              accepts_marketing: true,
              marketing_opt_in_level: "single_opt_in",
              email_marketing_consent: {
                state: "subscribed",
                opt_in_level: "single_opt_in",
                consent_updated_at: new Date().toISOString(),
              },
            },
          });
        }
      }
      return NextResponse.json({ success: true, alreadySubscribed: true });
    }

    return NextResponse.json(
      { success: false, error: "failed to subscribe" },
      { status: 400 },
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "something went wrong" },
      { status: 500 },
    );
  }
}

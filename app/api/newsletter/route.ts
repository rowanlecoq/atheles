import { updateCustomer } from "lib/auth/shopify-customer";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || "";
const rawDomain = process.env.SHOPIFY_STORE_DOMAIN || "";
const domain = rawDomain
  ? rawDomain.startsWith("https://") ? rawDomain : `https://${rawDomain}`
  : "";

async function adminRestFetch(path: string, method: string, body?: object) {
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

    // Guest — create customer via Admin API so we can suppress the activation email
    const createRes = await adminRestFetch("/customers.json", "POST", {
      customer: {
        email,
        accepts_marketing: true,
        // Prevents Shopify from sending an account activation email,
        // which would confuse guests who only wanted a newsletter subscription.
        send_email_invite: false,
        marketing_opt_in_level: "single_opt_in",
      },
    });

    if (createRes.ok) {
      return NextResponse.json({ success: true });
    }

    if (createRes.status === 422) {
      // Customer already exists — update their marketing consent
      const searchRes = await adminRestFetch(
        `/customers/search.json?query=email:${encodeURIComponent(email)}&limit=1`,
        "GET",
      );
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        const existingId = searchData.customers?.[0]?.id;
        if (existingId) {
          await adminRestFetch(`/customers/${existingId}.json`, "PUT", {
            customer: { id: existingId, accepts_marketing: true },
          });
        }
      }
      return NextResponse.json({ success: true });
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

import { customerCreateMutation } from "lib/shopify/mutations/customer";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const domain = process.env.SHOPIFY_STORE_DOMAIN
  ? process.env.SHOPIFY_STORE_DOMAIN.startsWith("https://")
    ? process.env.SHOPIFY_STORE_DOMAIN
    : `https://${process.env.SHOPIFY_STORE_DOMAIN}`
  : "";
const endpoint = domain ? `${domain}/api/2023-01/graphql.json` : "";
const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || "";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "email is required" },
        { status: 400 },
      );
    }

    if (!endpoint) {
      return NextResponse.json(
        { success: false, error: "store not configured" },
        { status: 500 },
      );
    }

    const randomPassword = crypto.randomUUID().replace(/-/g, "").slice(0, 16);

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": token,
      },
      body: JSON.stringify({
        query: customerCreateMutation,
        variables: {
          input: {
            email,
            acceptsMarketing: true,
            password: randomPassword,
          },
        },
      }),
    });

    const json = await res.json();
    const errors = json.data?.customerCreate?.customerUserErrors || [];

    if (errors.length > 0) {
      const alreadyExists = errors.some(
        (e: { code: string }) =>
          e.code === "TAKEN" || e.code === "CUSTOMER_DISABLED",
      );
      if (alreadyExists) {
        return NextResponse.json({ success: true });
      }
      return NextResponse.json(
        { success: false, error: errors[0]?.message || "failed to subscribe" },
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

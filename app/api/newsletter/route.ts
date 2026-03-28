import { shopifyFetch } from "lib/shopify";
import { customerCreateMutation } from "lib/shopify/mutations/customer";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "email is required" },
        { status: 400 }
      );
    }

    // Generate a random password (required by Shopify but not used for login)
    const randomPassword = crypto.randomUUID().replace(/-/g, "").slice(0, 16);

    const res = await shopifyFetch<{
      data: {
        customerCreate: {
          customer: { id: string; email: string } | null;
          customerUserErrors: { code: string; message: string }[];
        };
      };
    }>({
      query: customerCreateMutation,
      variables: {
        input: {
          email,
          acceptsMarketing: true,
          password: randomPassword,
        },
      },
    });

    const errors = res.body.data.customerCreate.customerUserErrors;

    // If customer already exists, that's fine — they're already subscribed
    if (errors.length > 0) {
      const alreadyExists = errors.some(
        (e) => e.code === "TAKEN" || e.code === "CUSTOMER_DISABLED"
      );
      if (alreadyExists) {
        return NextResponse.json({ success: true });
      }
      return NextResponse.json(
        { success: false, error: errors[0]?.message || "failed to subscribe" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "something went wrong" },
      { status: 500 }
    );
  }
}

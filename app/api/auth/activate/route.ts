import { setAuthCookie } from "lib/auth/set-auth-cookie";
import {
  activateCustomerByUrl,
  getCustomerByToken,
} from "lib/auth/shopify-customer";
import { NextResponse } from "next/server";


export async function POST(request: Request) {
  try {
    const { customerId, activationToken, password } = await request.json();

    if (!customerId || !activationToken || !password) {
      return NextResponse.json(
        { success: false, error: "missing required fields" },
        { status: 400 },
      );
    }

    const shopifyDomain = process.env.SHOPIFY_STORE_DOMAIN || "";
    const domain = shopifyDomain.startsWith("https://")
      ? shopifyDomain
      : `https://${shopifyDomain}`;
    const activationUrl = `${domain}/account/activate/${customerId}/${activationToken}`;

    const result = await activateCustomerByUrl(activationUrl, password);

    if ("error" in result) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 },
      );
    }

    const customer = await getCustomerByToken(result.accessToken);
    await setAuthCookie(result.accessToken, result.expiresAt);

    return NextResponse.json({
      success: true,
      user: customer
        ? {
            id: customer.id,
            email: customer.email,
            name:
              customer.displayName ||
              customer.firstName ||
              customer.email.split("@")[0],
            createdAt: customer.createdAt,
          }
        : null,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "something went wrong" },
      { status: 500 },
    );
  }
}

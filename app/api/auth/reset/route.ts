import { setAuthCookie } from "lib/auth/set-auth-cookie";
import {
  resetCustomerByUrl,
  getCustomerByToken,
} from "lib/auth/shopify-customer";
import { NextResponse } from "next/server";


export async function POST(request: Request) {
  try {
    const { customerId, resetToken, password } = await request.json();

    if (!customerId || !resetToken || !password) {
      return NextResponse.json(
        { success: false, error: "missing required fields" },
        { status: 400 },
      );
    }

    const shopifyDomain = process.env.SHOPIFY_STORE_DOMAIN || "";
    const domain = shopifyDomain.startsWith("https://")
      ? shopifyDomain
      : `https://${shopifyDomain}`;
    const resetUrl = `${domain}/account/reset/${customerId}/${resetToken}`;

    const result = await resetCustomerByUrl(resetUrl, password);

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
  } catch (err) {
    console.error("[reset] Error:", err);
    return NextResponse.json(
      { success: false, error: "something went wrong" },
      { status: 500 },
    );
  }
}

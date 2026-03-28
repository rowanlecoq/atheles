import { setAuthCookie } from "lib/auth/set-auth-cookie";
import {
  authenticateCustomer,
  getCustomerByToken,
} from "lib/auth/shopify-customer";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "email and password are required" },
        { status: 400 },
      );
    }

    const tokenResult = await authenticateCustomer(email, password);
    if (!tokenResult) {
      return NextResponse.json(
        { success: false, error: "invalid email or password" },
        { status: 401 },
      );
    }

    const customer = await getCustomerByToken(tokenResult.accessToken);
    await setAuthCookie(tokenResult.accessToken, tokenResult.expiresAt);

    return NextResponse.json({
      success: true,
      user: customer
        ? {
            id: customer.id,
            email: customer.email,
            name:
              customer.displayName || customer.firstName || email.split("@")[0],
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

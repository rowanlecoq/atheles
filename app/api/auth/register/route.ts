import { setAuthCookie } from "lib/auth/set-auth-cookie";
import { createCustomerAccount, authenticateCustomer, getCustomerByToken } from "lib/auth/shopify-customer";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "email and password are required" }, { status: 400 });
    }
    if (password.length < 5) {
      return NextResponse.json({ success: false, error: "password must be at least 5 characters" }, { status: 400 });
    }

    const firstName = name?.split(" ")[0] || undefined;
    const lastName = name?.split(" ").slice(1).join(" ") || undefined;

    const result = await createCustomerAccount(email, password, firstName, lastName);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    const tokenResult = await authenticateCustomer(email, password);
    if (tokenResult) {
      const customer = await getCustomerByToken(tokenResult.accessToken);
      await setAuthCookie(tokenResult.accessToken, tokenResult.expiresAt);
      return NextResponse.json({
        success: true,
        user: customer ? {
          id: customer.id,
          email: customer.email,
          name: customer.displayName || customer.firstName || email.split("@")[0],
          createdAt: customer.createdAt,
        } : null,
      });
    }

    return NextResponse.json({
      success: true,
      user: null,
      message: "account created. please sign in.",
    });
  } catch {
    return NextResponse.json({ success: false, error: "something went wrong" }, { status: 500 });
  }
}

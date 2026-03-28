import { authenticateCustomer, getCustomerByToken } from "lib/auth/shopify-customer";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "email and password are required" }, { status: 400 });
    }

    const tokenResult = await authenticateCustomer(email, password);
    if (!tokenResult) {
      return NextResponse.json({ success: false, error: "invalid email or password" }, { status: 401 });
    }

    const customer = await getCustomerByToken(tokenResult.accessToken);

    const cookieStore = await cookies();
    cookieStore.set("atheles-auth-token", tokenResult.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return NextResponse.json({
      success: true,
      user: customer ? {
        id: customer.id,
        email: customer.email,
        name: customer.displayName || customer.firstName || email.split("@")[0],
        createdAt: customer.createdAt,
      } : null,
    });
  } catch {
    return NextResponse.json({ success: false, error: "something went wrong" }, { status: 500 });
  }
}

import { setAuthCookie } from "lib/auth/set-auth-cookie";
import {
  createCustomerAccount,
  authenticateCustomer,
  getCustomerByToken,
} from "lib/auth/shopify-customer";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { email, password, firstName, lastName, dob, acceptsMarketing } =
      await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "email and password are required" },
        { status: 400 },
      );
    }
    if (!firstName?.trim()) {
      return NextResponse.json(
        { success: false, error: "first name is required" },
        { status: 400 },
      );
    }
    if (password.length < 5) {
      return NextResponse.json(
        { success: false, error: "password must be at least 5 characters" },
        { status: 400 },
      );
    }

    const result = await createCustomerAccount(
      email,
      password,
      firstName.trim(),
      lastName?.trim() || undefined,
      acceptsMarketing,
      dob,
    );
    if (!result.success) {
      // Improve error messages
      const err = result.error || "";
      if (err.toLowerCase().includes("taken") || err.toLowerCase().includes("already")) {
        return NextResponse.json(
          {
            success: false,
            error:
              "an account with this email already exists. try signing in, or use forgot password to reset your password.",
          },
          { status: 400 },
        );
      }
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 },
      );
    }

    const tokenResult = await authenticateCustomer(email, password);
    if (tokenResult) {
      const customer = await getCustomerByToken(tokenResult.accessToken);
      await setAuthCookie(tokenResult.accessToken, tokenResult.expiresAt);
      return NextResponse.json({
        success: true,
        user: customer
          ? {
              id: customer.id,
              email: customer.email,
              firstName: customer.firstName,
              lastName: customer.lastName,
              name:
                customer.displayName ||
                customer.firstName ||
                email.split("@")[0],
              phone: customer.phone,
              acceptsMarketing: customer.acceptsMarketing,
              createdAt: customer.createdAt,
              numberOfOrders: customer.numberOfOrders,
              totalSpent: customer.totalSpent,
              dob: customer.dob,
              theme: customer.theme,
            }
          : null,
      });
    }

    return NextResponse.json({
      success: true,
      user: null,
      verificationRequired: true,
      message:
        "account created. please check your email to activate your account.",
    });
  } catch (err) {
    console.error("[register] Error:", err);
    const message = err instanceof Error ? err.message : "";
    if (message.toLowerCase().includes("taken") || message.toLowerCase().includes("already")) {
      return NextResponse.json(
        {
          success: false,
          error: "an account with this email already exists. try signing in, or use forgot password to reset your password.",
        },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { success: false, error: "something went wrong. please try again." },
      { status: 500 },
    );
  }
}

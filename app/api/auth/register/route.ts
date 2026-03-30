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
    const { email, password, name, dob, acceptsMarketing } =
      await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "email and password are required" },
        { status: 400 },
      );
    }
    if (password.length < 5) {
      return NextResponse.json(
        { success: false, error: "password must be at least 5 characters" },
        { status: 400 },
      );
    }

    const firstName = name?.split(" ")[0] || undefined;
    const lastName = name?.split(" ").slice(1).join(" ") || undefined;

    const result = await createCustomerAccount(
      email,
      password,
      firstName,
      lastName,
      acceptsMarketing,
      dob,
    );
    if (!result.success) {
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
  } catch {
    return NextResponse.json(
      { success: false, error: "something went wrong" },
      { status: 500 },
    );
  }
}

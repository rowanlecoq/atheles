import { setAuthCookie } from "lib/auth/set-auth-cookie";
import {
  createCustomerAccount,
  authenticateCustomer,
  getCustomerByToken,
  recoverCustomerPassword,
} from "lib/auth/shopify-customer";
import { NextResponse } from "next/server";


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
      const err = result.error || "";
      if (err.toLowerCase().includes("taken") || err.toLowerCase().includes("already")) {
        // Email was taken by a newsletter signup — silently send a password
        // reset so they can set a real password without a confusing error.
        await recoverCustomerPassword(email).catch(() => {});
        return NextResponse.json(
          {
            success: false,
            alreadyExists: true,
            error:
              "looks like you're already on our list! we've sent you an email to set your password and complete your account.",
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
      await recoverCustomerPassword(email).catch(() => {});
      return NextResponse.json(
        {
          success: false,
          alreadyExists: true,
          error: "looks like you're already on our list! we've sent you an email to set your password and complete your account.",
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

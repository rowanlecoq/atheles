import { recoverCustomerPassword } from "lib/auth/shopify-customer";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ success: false, error: "email is required" }, { status: 400 });
    }

    await recoverCustomerPassword(email);

    // Always return success to avoid leaking whether an email exists
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}

import { getCustomerByToken } from "lib/auth/shopify-customer";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("atheles-auth-token")?.value;

    if (!token) {
      return NextResponse.json({ user: null });
    }

    const customer = await getCustomerByToken(token);
    if (!customer) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: {
        id: customer.id,
        email: customer.email,
        name: customer.displayName || customer.firstName || "athlete",
        createdAt: customer.createdAt,
      },
    });
  } catch {
    return NextResponse.json({ user: null });
  }
}

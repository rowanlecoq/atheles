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
        firstName: customer.firstName,
        lastName: customer.lastName,
        name: customer.displayName || customer.firstName || "athlete",
        phone: customer.phone,
        acceptsMarketing: customer.acceptsMarketing,
        createdAt: customer.createdAt,
        numberOfOrders: customer.numberOfOrders,
        totalSpent: customer.totalSpent,
      },
    });
  } catch {
    return NextResponse.json({ user: null });
  }
}

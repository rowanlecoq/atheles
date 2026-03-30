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
      // Token is invalid/expired — clear cookies so middleware redirects properly
      cookieStore.delete("atheles-auth-token");
      cookieStore.delete("atheles-logged-in");
      return NextResponse.json({ user: null });
    }

    // Admin points override
    const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());
    const totalSpent = adminEmails.includes(customer.email.toLowerCase())
      ? "1100.00"
      : customer.totalSpent;

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
        totalSpent,
        dob: customer.dob,
        theme: customer.theme,
      },
    });
  } catch {
    return NextResponse.json({ user: null });
  }
}

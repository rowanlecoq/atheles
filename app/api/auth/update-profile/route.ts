import { updateCustomer, getCustomerByToken } from "lib/auth/shopify-customer";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("atheles-auth-token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "not authenticated" },
        { status: 401 }
      );
    }

    const { firstName, lastName, phone, acceptsMarketing } =
      await request.json();

    const input: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      acceptsMarketing?: boolean;
    } = {};

    if (firstName !== undefined) input.firstName = firstName;
    if (lastName !== undefined) input.lastName = lastName;
    // Shopify rejects empty/blank phone - only include if it has a real value
    if (phone) input.phone = phone;
    if (acceptsMarketing !== undefined)
      input.acceptsMarketing = acceptsMarketing;

    const result = await updateCustomer(token, input);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    const customer = await getCustomerByToken(token);

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
              customer.email.split("@")[0],
            phone: customer.phone,
            acceptsMarketing: customer.acceptsMarketing,
            createdAt: customer.createdAt,
            numberOfOrders: customer.numberOfOrders,
            totalSpent: customer.totalSpent,
          }
        : null,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "something went wrong" },
      { status: 500 }
    );
  }
}

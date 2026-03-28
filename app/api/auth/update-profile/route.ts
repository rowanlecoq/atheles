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

    if (firstName !== undefined && firstName !== "") input.firstName = firstName;
    if (lastName !== undefined && lastName !== "") input.lastName = lastName;
    if (phone !== undefined && phone !== null && phone !== "") input.phone = phone;
    if (acceptsMarketing !== undefined)
      input.acceptsMarketing = acceptsMarketing;

    // Track which fields the user tried to clear but Shopify won't allow
    const skippedClears: string[] = [];
    if (lastName !== undefined && lastName === "") skippedClears.push("last name");
    if ((phone === "" || phone === null) && phone !== undefined) skippedClears.push("phone number");

    const result = await updateCustomer(token, input);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    const customer = await getCustomerByToken(token);

    const warning = skippedClears.length > 0
      ? `profile updated, but ${skippedClears.join(" and ")} can't be removed once set.`
      : null;

    return NextResponse.json({
      success: true,
      warning,
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

import {
  updateCustomer,
  updateCustomerDob,
  getCustomerByToken,
} from "lib/auth/shopify-customer";
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
        { status: 401 },
      );
    }

    const { firstName, lastName, phone, acceptsMarketing, dob } =
      await request.json();

    const input: {
      firstName?: string | null;
      lastName?: string | null;
      phone?: string | null;
      acceptsMarketing?: boolean;
    } = {};

    // Send actual values or null to clear - let Shopify handle it
    if (firstName !== undefined) input.firstName = firstName || null;
    if (lastName !== undefined) input.lastName = lastName || null;
    if (phone !== undefined) input.phone = phone || null;
    if (acceptsMarketing !== undefined)
      input.acceptsMarketing = acceptsMarketing;

    const result = await updateCustomer(token, input);

    // Update DOB via Admin API if provided
    if (dob) {
      const customer = await getCustomerByToken(token);
      if (customer) {
        await updateCustomerDob(customer.email, dob).catch(() => {
          // DOB update is best-effort — don't fail the whole save
        });
      }
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 },
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
            dob: customer.dob,
          }
        : null,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "something went wrong" },
      { status: 500 },
    );
  }
}

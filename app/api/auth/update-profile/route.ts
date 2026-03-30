import {
  updateCustomer,
  updateCustomerDob,
  getCustomerByToken,
  updateCustomerTier,
} from "lib/auth/shopify-customer";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const TIERS = [
  { name: "bronze", min: 0, max: 5000 },
  { name: "silver", min: 5000, max: 15000 },
  { name: "gold", min: 15000, max: 30000 },
  { name: "platinum", min: 30000, max: 50000 },
  { name: "champion", min: 50000, max: Infinity },
];

function getTierName(points: number): string {
  return (TIERS.find((t) => points >= t.min && points < t.max) || TIERS[0]!).name;
}

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
    if (!customer) {
      return NextResponse.json({ success: true, user: null });
    }

    // Apply same admin override + tier/discount logic as session API
    const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());
    const totalSpent = adminEmails.includes(customer.email.toLowerCase())
      ? "1100.00"
      : customer.totalSpent;

    const points = Math.floor(parseFloat(totalSpent) * 50);
    const tierName = getTierName(points);
    updateCustomerTier(customer.email, tierName).catch(() => {});

    const discountCodes: Record<string, string | undefined> = {
      silver: process.env.DISCOUNT_SILVER,
      gold: process.env.DISCOUNT_GOLD,
      platinum: process.env.DISCOUNT_PLATINUM,
      champion: process.env.DISCOUNT_CHAMPION,
    };

    return NextResponse.json({
      success: true,
      user: {
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
        totalSpent,
        dob: customer.dob,
        theme: customer.theme,
        globalTheme: customer.globalTheme,
        discountCode: discountCodes[tierName] || null,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "something went wrong" },
      { status: 500 },
    );
  }
}

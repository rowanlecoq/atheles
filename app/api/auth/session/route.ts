import { getCustomerByToken, updateCustomerTier } from "lib/auth/shopify-customer";
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

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("atheles-auth-token")?.value;

    if (!token) {
      return NextResponse.json({ user: null });
    }

    const customer = await getCustomerByToken(token);
    if (!customer) {
      cookieStore.delete("atheles-auth-token");
      cookieStore.delete("atheles-logged-in");
      return NextResponse.json({ user: null });
    }

    // Admin points override
    const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());
    const totalSpent = adminEmails.includes(customer.email.toLowerCase())
      ? "1100.00"
      : customer.totalSpent;

    // Auto-tag customer with their tier (non-blocking) — skip if athlete
    const points = Math.floor(parseFloat(totalSpent) * 50);
    const tierName = getTierName(points);
    if (!customer.isAthlete && !customer.isAdmin) {
      updateCustomerTier(customer.email, tierName).catch(() => {});
    }

    // Get discount code for the customer's tier from env vars
    const discountCodes: Record<string, string | undefined> = {
      silver: process.env.DISCOUNT_SILVER,
      gold: process.env.DISCOUNT_GOLD,
      platinum: process.env.DISCOUNT_PLATINUM,
      champion: process.env.DISCOUNT_CHAMPION,
    };

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
        globalTheme: customer.globalTheme,
        isAthlete: customer.isAthlete,
        isAdmin: customer.isAdmin,
        discountCode: customer.isAthlete
          ? (process.env.DISCOUNT_ATHLETE || "athelesathlete")
          : (discountCodes[tierName] || null),
      },
    });
  } catch {
    return NextResponse.json({ user: null });
  }
}

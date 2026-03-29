import { getCustomerByToken } from "lib/auth/shopify-customer";
import { approveReview, getPendingReviews, rejectReview } from "lib/reviews";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);

async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get("atheles-auth-token")?.value;
  if (!token) return false;

  const customer = await getCustomerByToken(token);
  if (!customer) return false;

  return ADMIN_EMAILS.includes(customer.email.toLowerCase());
}

export async function GET() {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "unauthorized" }, { status: 403 });
    }

    const reviews = await getPendingReviews();
    return NextResponse.json({ reviews });
  } catch {
    return NextResponse.json(
      { error: "something went wrong" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "unauthorized" }, { status: 403 });
    }

    const { id, action } = await request.json();

    if (!id || !action) {
      return NextResponse.json(
        { error: "missing id or action" },
        { status: 400 },
      );
    }

    if (action === "approve") {
      await approveReview(id);
    } else if (action === "reject") {
      await rejectReview(id);
    } else {
      return NextResponse.json(
        { error: "invalid action" },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "something went wrong" },
      { status: 500 },
    );
  }
}

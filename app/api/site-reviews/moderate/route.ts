import { getCustomerByToken } from "lib/auth/shopify-customer";
import { moderateSiteReview } from "lib/site-reviews";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("atheles-auth-token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const customer = await getCustomerByToken(token);
    if (!customer?.isAdmin) {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const body = await req.json() as { reviewId?: string; hidden?: boolean };
    const { reviewId, hidden } = body;

    if (!reviewId || typeof hidden !== "boolean") {
      return NextResponse.json({ error: "Missing reviewId or hidden." }, { status: 400 });
    }

    await moderateSiteReview(reviewId, hidden);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

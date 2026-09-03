import { getCustomerByToken } from "lib/auth/shopify-customer";
import { flagSiteReview } from "lib/site-reviews";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("atheles-auth-token")?.value;
    if (!token) {
      return NextResponse.json({ error: "You must be logged in to flag a review." }, { status: 401 });
    }

    const customer = await getCustomerByToken(token);
    if (!customer) {
      return NextResponse.json({ error: "Invalid session." }, { status: 401 });
    }

    const body = await req.json() as { reviewId?: string };
    if (!body.reviewId) {
      return NextResponse.json({ error: "Missing reviewId." }, { status: 400 });
    }

    await flagSiteReview(body.reviewId);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

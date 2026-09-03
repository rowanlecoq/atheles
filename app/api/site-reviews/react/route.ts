import { getCustomerByToken } from "lib/auth/shopify-customer";
import { toggleReaction } from "lib/site-reviews";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("atheles-auth-token")?.value;
    if (!token) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    const customer = await getCustomerByToken(token);
    if (!customer) return NextResponse.json({ error: "Invalid session." }, { status: 401 });
    const { reviewId, type } = await req.json() as { reviewId?: string; type?: "up" | "down" };
    if (!reviewId) return NextResponse.json({ error: "reviewId required." }, { status: 400 });
    if (type !== "up" && type !== "down") return NextResponse.json({ error: "type must be up or down." }, { status: 400 });
    const result = await toggleReaction(reviewId, customer.email, type);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

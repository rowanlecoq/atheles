import { getCustomerByToken } from "lib/auth/shopify-customer";
import { toggleProductReaction } from "lib/reviews";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("atheles-auth-token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const customer = await getCustomerByToken(token);
    if (!customer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as { handle?: string; reviewId?: string; type?: "up" | "down" };
    const { handle, reviewId, type } = body;

    if (!handle || !reviewId || !type) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const result = await toggleProductReaction(handle, reviewId, customer.email, type);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

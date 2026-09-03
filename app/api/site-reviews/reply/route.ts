import { getCustomerByToken, getCustomerMetafield } from "lib/auth/shopify-customer";
import { addReply, deleteReply } from "lib/site-reviews";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("atheles-auth-token")?.value;
    if (!token) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    const customer = await getCustomerByToken(token);
    if (!customer) return NextResponse.json({ error: "Invalid session." }, { status: 401 });
    const { reviewId, body } = await req.json() as { reviewId?: string; body?: string };
    if (!reviewId) return NextResponse.json({ error: "reviewId required." }, { status: 400 });
    if (!body?.trim()) return NextResponse.json({ error: "body required." }, { status: 400 });
    const authorName = customer.firstName || customer.displayName || "atheles member";
    const avatarUrl = await getCustomerMetafield(customer.email, "atheles", "avatar").catch(() => null);
    const reply = await addReply(reviewId, authorName, customer.email, body.trim(), avatarUrl || undefined);
    return NextResponse.json({ reply }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("atheles-auth-token")?.value;
    if (!token) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    const customer = await getCustomerByToken(token);
    if (!customer) return NextResponse.json({ error: "Invalid session." }, { status: 401 });
    const { reviewId, replyId } = await req.json() as { reviewId?: string; replyId?: string };
    if (!reviewId || !replyId) return NextResponse.json({ error: "reviewId and replyId required." }, { status: 400 });
    await deleteReply(reviewId, replyId, customer.email, !!customer.isAdmin);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    const status = message.includes("Not authorized") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

import { getCustomerByToken, getCustomerMetafield } from "lib/auth/shopify-customer";
import { addProductReply, deleteProductReply } from "lib/reviews";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("atheles-auth-token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const customer = await getCustomerByToken(token);
    if (!customer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as { handle?: string; reviewId?: string; body?: string };
    const { handle, reviewId, body: replyBody } = body;

    if (!handle || !reviewId || !replyBody?.trim()) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const authorName = customer.displayName || customer.firstName || "Member";
    const avatarUrl = await getCustomerMetafield(customer.email, "atheles", "avatar").catch(() => null);

    const reply = await addProductReply(handle, reviewId, authorName, customer.email, replyBody.trim(), avatarUrl || undefined);
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
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const customer = await getCustomerByToken(token);
    if (!customer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as { handle?: string; reviewId?: string; replyId?: string };
    const { handle, reviewId, replyId } = body;

    if (!handle || !reviewId || !replyId) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    await deleteProductReply(handle, reviewId, replyId, customer.email, !!customer.isAdmin);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    const status = message.includes("Not authorized") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

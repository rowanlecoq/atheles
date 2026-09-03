import { getCustomerByToken } from "lib/auth/shopify-customer";
import { addSiteReview, getSiteReviews } from "lib/site-reviews";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const all = req.nextUrl.searchParams.get("all") === "1";
    let isAdmin = false;

    if (all) {
      const cookieStore = await cookies();
      const token = cookieStore.get("atheles-auth-token")?.value;
      if (token) {
        const customer = await getCustomerByToken(token);
        isAdmin = !!customer?.isAdmin;
      }
    }

    const reviews = await getSiteReviews(isAdmin && all);
    return NextResponse.json({ reviews });
  } catch {
    return NextResponse.json({ reviews: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("atheles-auth-token")?.value;
    if (!token) {
      return NextResponse.json({ error: "You must be logged in to leave a review." }, { status: 401 });
    }

    const customer = await getCustomerByToken(token);
    if (!customer) {
      return NextResponse.json({ error: "Invalid session." }, { status: 401 });
    }

    const body = await req.json() as { rating?: number; title?: string; body?: string };
    const { rating, title, body: reviewBody } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5." }, { status: 400 });
    }
    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }
    if (!reviewBody?.trim()) {
      return NextResponse.json({ error: "Review body is required." }, { status: 400 });
    }

    const authorName = customer.firstName || customer.displayName || "Member";
    const review = await addSiteReview({
      authorName,
      authorEmail: customer.email,
      rating,
      title: title.trim(),
      body: reviewBody.trim(),
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    const status = message.includes("already left") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

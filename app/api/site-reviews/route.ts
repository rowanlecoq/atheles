import { getCustomerByToken } from "lib/auth/shopify-customer";
import { addSiteReview, deleteSiteReview, editSiteReview, getSiteReviews } from "lib/site-reviews";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const all = req.nextUrl.searchParams.get("all") === "1";
    let isAdmin = false;
    let currentUserEmail: string | undefined;

    const cookieStore = await cookies();
    const token = cookieStore.get("atheles-auth-token")?.value;
    if (token) {
      const customer = await getCustomerByToken(token);
      if (customer) {
        currentUserEmail = customer.email;
        isAdmin = !!customer.isAdmin;
      }
    }

    const { reviews, myReviewId } = await getSiteReviews(isAdmin && all, currentUserEmail);
    return NextResponse.json({ reviews, myReviewId });
  } catch {
    return NextResponse.json({ reviews: [], myReviewId: null });
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

    const body = await req.json() as { rating?: number; title?: string; body?: string; displayName?: string };
    const { rating, title, body: reviewBody, displayName } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "rating must be between 1 and 5." }, { status: 400 });
    }
    if (!title?.trim()) {
      return NextResponse.json({ error: "title is required." }, { status: 400 });
    }
    if (!reviewBody?.trim()) {
      return NextResponse.json({ error: "review body is required." }, { status: 400 });
    }

    const authorName =
      displayName?.trim() ||
      customer.firstName ||
      customer.displayName ||
      "atheles member";
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

export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("atheles-auth-token")?.value;
    if (!token) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    const customer = await getCustomerByToken(token);
    if (!customer) return NextResponse.json({ error: "Invalid session." }, { status: 401 });
    const { reviewId } = await req.json() as { reviewId?: string };
    if (!reviewId) return NextResponse.json({ error: "reviewId required." }, { status: 400 });
    await deleteSiteReview(reviewId, customer.email);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    const status = message.includes("Not authorized") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("atheles-auth-token")?.value;
    if (!token) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    const customer = await getCustomerByToken(token);
    if (!customer) return NextResponse.json({ error: "Invalid session." }, { status: 401 });
    const body = await req.json() as { reviewId?: string; rating?: number; title?: string; body?: string };
    const { reviewId, rating, title, body: reviewBody } = body;
    if (!reviewId) return NextResponse.json({ error: "reviewId required." }, { status: 400 });
    if (!rating || rating < 1 || rating > 5) return NextResponse.json({ error: "rating must be 1-5." }, { status: 400 });
    if (!title?.trim()) return NextResponse.json({ error: "title required." }, { status: 400 });
    if (!reviewBody?.trim()) return NextResponse.json({ error: "body required." }, { status: 400 });
    const review = await editSiteReview(reviewId, customer.email, { rating, title: title.trim(), body: reviewBody.trim() });
    return NextResponse.json({ review });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    const status = message.includes("Not authorized") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

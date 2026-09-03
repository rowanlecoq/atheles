import { getCustomerByToken } from "lib/auth/shopify-customer";
import { addProductReview, getProductReviews } from "lib/reviews";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const handle = searchParams.get("product");
  if (!handle) {
    return NextResponse.json({ error: "Missing product handle" }, { status: 400 });
  }

  const wantAll = searchParams.get("all") === "1";

  try {
    if (wantAll) {
      const cookieStore = await cookies();
      const token = cookieStore.get("atheles-auth-token")?.value;
      if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const customer = await getCustomerByToken(token);
      if (!customer?.isAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const reviews = await getProductReviews(handle, true);
      return NextResponse.json({ reviews });
    }

    const reviews = await getProductReviews(handle, false);
    return NextResponse.json({ reviews });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
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

    const body = await req.json() as {
      handle?: string;
      rating?: number;
      title?: string;
      body?: string;
    };

    const { handle, rating, title, body: reviewBody } = body;

    if (!handle || !rating || !title || !reviewBody) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5." }, { status: 400 });
    }

    const authorName = customer.displayName || customer.firstName || "Member";
    const authorEmail = customer.email;

    const review = await addProductReview(handle, {
      authorName,
      authorEmail,
      rating,
      title,
      body: reviewBody,
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    const status = message.includes("already reviewed") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

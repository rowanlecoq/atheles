import { getCustomerByToken, getCustomerMetafield } from "lib/auth/shopify-customer";
import {
  addProductReview,
  deleteProductReview,
  editProductReview,
  getProductReviews,
} from "lib/reviews";
import { addSiteReview } from "lib/site-reviews";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

async function getCurrentCustomer() {
  const cookieStore = await cookies();
  const token = cookieStore.get("atheles-auth-token")?.value;
  if (!token) return null;
  return getCustomerByToken(token);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const handle = searchParams.get("product");
  if (!handle) {
    return NextResponse.json({ error: "Missing product handle" }, { status: 400 });
  }

  const wantAll = searchParams.get("all") === "1";

  try {
    const customer = await getCurrentCustomer();

    if (wantAll) {
      if (!customer?.isAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const reviews = await getProductReviews(handle, wantAll && !!customer?.isAdmin, customer?.email);
    return NextResponse.json({ reviews });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const customer = await getCurrentCustomer();
    if (!customer) {
      return NextResponse.json({ error: "You must be logged in to leave a review." }, { status: 401 });
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

    const avatarUrl = await getCustomerMetafield(authorEmail, "atheles", "avatar").catch(() => null);

    const review = await addProductReview(handle, {
      authorName,
      authorEmail,
      rating,
      title,
      body: reviewBody,
      avatarUrl: avatarUrl || undefined,
    });

    // Cross-post to the community feed (best-effort)
    const productDisplayTitle = handle
      .split("-")
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    addSiteReview({
      authorName,
      authorEmail,
      rating,
      title,
      body: reviewBody,
      productTitle: productDisplayTitle,
      avatarUrl: avatarUrl || undefined,
    }).catch(() => {});

    return NextResponse.json({ review }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const customer = await getCurrentCustomer();
    if (!customer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json() as {
      handle?: string;
      reviewId?: string;
      rating?: number;
      title?: string;
      body?: string;
    };

    const { handle, reviewId, rating, title, body: reviewBody } = body;

    if (!handle || !reviewId || !rating || !title || !reviewBody) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const review = await editProductReview(handle, reviewId, customer.email, {
      rating,
      title,
      body: reviewBody,
    });

    return NextResponse.json({ review });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    const status = message.includes("Not authorized") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const customer = await getCurrentCustomer();
    if (!customer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json() as { handle?: string; reviewId?: string };
    const { handle, reviewId } = body;

    if (!handle || !reviewId) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    await deleteProductReview(handle, reviewId, customer.email, !!customer.isAdmin);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    const status = message.includes("Not authorized") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

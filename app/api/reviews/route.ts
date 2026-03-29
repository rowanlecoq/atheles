import { getCustomerByToken } from "lib/auth/shopify-customer";
import { getApprovedReviews, submitReview } from "lib/reviews";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const product = request.nextUrl.searchParams.get("product");
    const reviews = await getApprovedReviews(product || undefined);
    return NextResponse.json({ reviews });
  } catch {
    return NextResponse.json({ reviews: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("atheles-auth-token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "you must be signed in to leave a review" },
        { status: 401 },
      );
    }

    const customer = await getCustomerByToken(token);
    if (!customer) {
      return NextResponse.json(
        { success: false, error: "invalid session" },
        { status: 401 },
      );
    }

    const { rating, title, body, images, product_handle } =
      await request.json();

    if (!rating || !body) {
      return NextResponse.json(
        { success: false, error: "rating and review text are required" },
        { status: 400 },
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: "rating must be between 1 and 5" },
        { status: 400 },
      );
    }

    const userName =
      customer.displayName ||
      customer.firstName ||
      customer.email.split("@")[0];

    const result = await submitReview({
      user_name: userName,
      user_email: customer.email,
      rating,
      title,
      body,
      images: images || [],
      product_handle: product_handle || undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "something went wrong" },
      { status: 500 },
    );
  }
}

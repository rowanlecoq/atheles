import {
  getCustomerByToken,
  getCustomerMetafield,
  updateCustomerMetafield,
} from "lib/auth/shopify-customer";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("atheles-auth-token")?.value;
    if (!token) return NextResponse.json({ favorites: null });

    const customer = await getCustomerByToken(token);
    if (!customer) return NextResponse.json({ favorites: null });

    const raw = await getCustomerMetafield(
      customer.email,
      "atheles",
      "favorites",
    );

    if (!raw) return NextResponse.json({ favorites: [] });

    try {
      const parsed = JSON.parse(raw);
      return NextResponse.json({ favorites: Array.isArray(parsed) ? parsed : [] });
    } catch {
      return NextResponse.json({ favorites: [] });
    }
  } catch {
    return NextResponse.json({ favorites: null });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("atheles-auth-token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "not authenticated" },
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

    const { favorites } = await request.json();

    if (!Array.isArray(favorites)) {
      return NextResponse.json(
        { success: false, error: "favorites must be an array" },
        { status: 400 },
      );
    }

    // Store as JSON string in metafield
    await updateCustomerMetafield(
      customer.email,
      "atheles",
      "favorites",
      JSON.stringify(favorites),
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[favorites] Save error:", err);
    return NextResponse.json(
      { success: false, error: "something went wrong" },
      { status: 500 },
    );
  }
}

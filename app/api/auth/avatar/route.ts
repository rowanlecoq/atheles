import {
  getCustomerByToken,
  getCustomerMetafield,
  updateCustomerMetafield,
} from "lib/auth/shopify-customer";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Get avatar URL
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("atheles-auth-token")?.value;
    if (!token) return NextResponse.json({ avatar: null });

    const customer = await getCustomerByToken(token);
    if (!customer) return NextResponse.json({ avatar: null });

    const avatar = await getCustomerMetafield(
      customer.email,
      "atheles",
      "avatar",
    );

    return NextResponse.json({ avatar });
  } catch {
    return NextResponse.json({ avatar: null });
  }
}

// Save avatar (base64 data URL)
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

    const { avatar } = await request.json();

    if (avatar === null) {
      // Remove avatar
      await updateCustomerMetafield(
        customer.email,
        "atheles",
        "avatar",
        "",
      );
      return NextResponse.json({ success: true });
    }

    // Avatar is a base64 data URL — store it directly
    // Shopify metafields support up to ~512KB
    if (avatar.length > 500000) {
      return NextResponse.json(
        { success: false, error: "image too large" },
        { status: 400 },
      );
    }

    await updateCustomerMetafield(
      customer.email,
      "atheles",
      "avatar",
      avatar,
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "something went wrong" },
      { status: 500 },
    );
  }
}

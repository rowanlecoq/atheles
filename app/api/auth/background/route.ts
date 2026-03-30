import { del, put } from "@vercel/blob";
import {
  getCustomerByToken,
  getCustomerMetafield,
  updateCustomerMetafield,
} from "lib/auth/shopify-customer";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("atheles-auth-token")?.value;
    if (!token) return NextResponse.json({ background: null });

    const customer = await getCustomerByToken(token);
    if (!customer) return NextResponse.json({ background: null });

    const background = await getCustomerMetafield(
      customer.email,
      "atheles",
      "custom_bg",
    );

    return NextResponse.json({ background });
  } catch {
    return NextResponse.json({ background: null });
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

    const { background } = await request.json();

    // Delete old blob if one exists
    const oldUrl = await getCustomerMetafield(
      customer.email,
      "atheles",
      "custom_bg",
    );
    if (oldUrl?.includes("vercel-storage.com")) {
      try {
        await del(oldUrl);
      } catch {
        // Old blob may already be gone
      }
    }

    if (background === null) {
      await updateCustomerMetafield(
        customer.email,
        "atheles",
        "custom_bg",
        "",
      );
      return NextResponse.json({ success: true, url: null });
    }

    const matches = background.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
      return NextResponse.json(
        { success: false, error: "invalid image data" },
        { status: 400 },
      );
    }

    const contentType = matches[1] as string;
    const buffer = Buffer.from(matches[2] as string, "base64");

    if (buffer.byteLength > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "image too large (max 10MB)" },
        { status: 400 },
      );
    }

    const ext = contentType.split("/")[1] || "jpg";
    const customerId = customer.id.replace(/[^a-zA-Z0-9]/g, "");
    const filename = `backgrounds/${customerId}-${Date.now()}.${ext}`;

    const blob = await put(filename, buffer, {
      access: "public",
      contentType,
      addRandomSuffix: false,
    });

    // Save blob URL to customer metafield for cross-device sync
    await updateCustomerMetafield(
      customer.email,
      "atheles",
      "custom_bg",
      blob.url,
    );

    return NextResponse.json({ success: true, url: blob.url });
  } catch (err) {
    console.error("[background] Upload error:", err);
    return NextResponse.json(
      { success: false, error: "something went wrong" },
      { status: 500 },
    );
  }
}

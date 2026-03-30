import { del, put } from "@vercel/blob";
import {
  getCustomerByToken,
  getCustomerMetafield,
  updateCustomerMetafield,
} from "lib/auth/shopify-customer";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

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

    const res = NextResponse.json({ background: background || null });
    res.headers.set("Cache-Control", "private, max-age=60, stale-while-revalidate=300");
    return res;
  } catch {
    return NextResponse.json({ background: null });
  }
}

export async function POST(request: Request) {
  try {
    if (!blobToken) {
      return NextResponse.json(
        { success: false, error: "blob storage not configured" },
        { status: 500 },
      );
    }

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

    const body = await request.json();
    const background = body.background;

    // Delete old blob if one exists
    const oldUrl = await getCustomerMetafield(
      customer.email,
      "atheles",
      "custom_bg",
    );
    if (oldUrl?.includes("vercel-storage.com")) {
      try {
        await del(oldUrl, { token: blobToken });
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

    if (typeof background !== "string" || !background.startsWith("data:")) {
      return NextResponse.json(
        { success: false, error: "invalid image data" },
        { status: 400 },
      );
    }

    const commaIdx = background.indexOf(",");
    if (commaIdx === -1) {
      return NextResponse.json(
        { success: false, error: "invalid data URL format" },
        { status: 400 },
      );
    }

    const meta = background.slice(0, commaIdx);
    const base64 = background.slice(commaIdx + 1);
    const contentType = meta.replace("data:", "").replace(";base64", "");
    const buffer = Buffer.from(base64, "base64");

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
      token: blobToken,
    });

    await updateCustomerMetafield(
      customer.email,
      "atheles",
      "custom_bg",
      blob.url,
    );

    return NextResponse.json({ success: true, url: blob.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    console.error("[background] Upload error:", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

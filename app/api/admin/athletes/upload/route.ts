import { put } from "@vercel/blob";
import { getCustomerByToken } from "lib/auth/shopify-customer";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";


async function verifyAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("atheles-auth-token")?.value;
  if (!token) return false;
  const customer = await getCustomerByToken(token);
  return customer?.isAdmin ?? false;
}

export async function POST(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({ error: "blob storage not configured. add BLOB_READ_WRITE_TOKEN to Vercel env vars." }, { status: 500 });
    }

    const { image } = await request.json();

    const matches = image.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
      return NextResponse.json({ error: "invalid file data" }, { status: 400 });
    }

    const contentType = matches[1] as string;
    const buffer = Buffer.from(matches[2] as string, "base64");
    const isVideo = contentType.startsWith("video/");
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;

    if (buffer.byteLength > maxSize) {
      return NextResponse.json({ error: `file too large (max ${isVideo ? "50" : "10"}MB)` }, { status: 400 });
    }

    const ext = contentType.split("/")[1] || "jpg";
    const filename = `athletes/athlete-${Date.now()}.${ext}`;

    const blob = await put(filename, buffer, {
      access: "public",
      contentType,
      addRandomSuffix: false,
    });

    return NextResponse.json({ success: true, url: blob.url });
  } catch (err) {
    console.error("[athletes/upload] Error:", err);
    return NextResponse.json({ error: "upload failed" }, { status: 500 });
  }
}

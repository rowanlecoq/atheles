import { getCustomerByToken } from "lib/auth/shopify-customer";
import { uploadReviewImage } from "lib/reviews";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: NextRequest) {
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

    const formData = await request.formData();
    const files = formData.getAll("images") as File[];

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: "no images provided" },
        { status: 400 },
      );
    }

    if (files.length > 3) {
      return NextResponse.json(
        { success: false, error: "maximum 3 images allowed" },
        { status: 400 },
      );
    }

    const urls: string[] = [];

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { success: false, error: `invalid file type: ${file.type}` },
          { status: 400 },
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { success: false, error: "images must be under 5mb" },
          { status: 400 },
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const url = await uploadReviewImage(buffer, file.name, file.type);
      urls.push(url);
    }

    return NextResponse.json({ success: true, urls });
  } catch {
    return NextResponse.json(
      { success: false, error: "failed to upload images" },
      { status: 500 },
    );
  }
}

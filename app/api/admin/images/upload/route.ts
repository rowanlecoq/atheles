import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { verifyAdmin } from "lib/admin/utils";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;
  // Only check admin auth for token generation.
  // Vercel Blob calls the completion webhook from its own servers (no session cookie).
  if (body.type === "blob.generate-client-token" && !(await verifyAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/webp",
          "image/gif",
          "video/mp4",
          "video/webm",
        ],
        maximumSizeInBytes: 50 * 1024 * 1024,
        tokenPayload: "admin-upload",
      }),
      onUploadCompleted: async () => {
        // URL is registered by the client after upload completes
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 });
  }
}

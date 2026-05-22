import { NextResponse } from "next/server";
import { readMetafield, verifyAdmin, writeMetafield } from "lib/admin/utils";

const DEFAULT_ANNOUNCEMENTS = [
  "to ascend.",
  "coming soon. this summer.",
  "authentic superiority.",
  "follow us at @atheles.co to share your aesthetic.",
];

const CACHE_HEADERS = { "Cache-Control": "s-maxage=60, stale-while-revalidate=300" };

export async function GET() {
  try {
    const raw = await readMetafield("announcements");
    if (Array.isArray(raw)) {
      return NextResponse.json({ announcements: raw }, { headers: CACHE_HEADERS });
    }
    return NextResponse.json({ announcements: DEFAULT_ANNOUNCEMENTS }, { headers: CACHE_HEADERS });
  } catch {
    return NextResponse.json({ announcements: DEFAULT_ANNOUNCEMENTS });
  }
}

export async function POST(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { announcements } = await request.json();
  if (!Array.isArray(announcements)) {
    return NextResponse.json({ error: "announcements must be an array" }, { status: 400 });
  }

  const cleaned = (announcements as string[]).filter((a) => a.trim().length > 0);
  const err = await writeMetafield("announcements", cleaned);
  if (err) return NextResponse.json({ error: err }, { status: 500 });

  return NextResponse.json({ success: true, count: cleaned.length });
}

import { NextResponse } from "next/server";
import { readMetafield, verifyAdmin, writeMetafield } from "lib/admin/utils";

const DEFAULT_ATHLETES = [
  {
    name: "rowan le coq",
    age: 18,
    role: "founder & athlete",
    description: "",
    image: null,
    images: [],
    socials: [
      { platform: "tiktok", url: "https://www.tiktok.com/@rowanlecoq" },
      { platform: "instagram", url: "https://www.instagram.com/rowanlecoq" },
      { platform: "linkedin", url: "https://www.linkedin.com/in/rowanlecoq" },
      { platform: "youtube", url: "https://www.youtube.com/@rowanlecoq" },
    ],
    hobbies: [
      "baking brownies or chocolate chip banana bread",
      "working out on the daily",
      "playing hockey",
    ],
  },
];

const CACHE_HEADERS = { "Cache-Control": "s-maxage=60, stale-while-revalidate=300" };

export async function GET() {
  try {
    const raw = await readMetafield("athletes");
    if (Array.isArray(raw)) {
      return NextResponse.json({ athletes: raw }, { headers: CACHE_HEADERS });
    }
    return NextResponse.json({ athletes: DEFAULT_ATHLETES }, { headers: CACHE_HEADERS });
  } catch {
    return NextResponse.json({ athletes: DEFAULT_ATHLETES }, { headers: CACHE_HEADERS });
  }
}

export async function POST(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { athletes } = await request.json();
  if (!Array.isArray(athletes)) {
    return NextResponse.json({ error: "athletes must be an array" }, { status: 400 });
  }

  const err = await writeMetafield("athletes", athletes);
  if (err) return NextResponse.json({ error: err }, { status: 500 });

  return NextResponse.json({ success: true, count: athletes.length });
}

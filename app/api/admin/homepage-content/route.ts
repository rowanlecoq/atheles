import { HOMEPAGE_CONTENT_DEFAULTS } from "lib/homepage-content";
import { readMetafield, verifyAdmin, writeMetafield } from "lib/admin/utils";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export async function GET() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const saved = await readMetafield("homepage_content");
    return NextResponse.json({ ...HOMEPAGE_CONTENT_DEFAULTS, ...(saved as object ?? {}) });
  } catch {
    return NextResponse.json(HOMEPAGE_CONTENT_DEFAULTS);
  }
}

export async function POST(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const value = {
    carouselTitle: String(body.carouselTitle ?? HOMEPAGE_CONTENT_DEFAULTS.carouselTitle).slice(0, 120),
    carouselSubtitle: String(body.carouselSubtitle ?? "").slice(0, 120),
    carouselViewAllHref: String(body.carouselViewAllHref ?? HOMEPAGE_CONTENT_DEFAULTS.carouselViewAllHref).slice(0, 200),
    featuredTitle: String(body.featuredTitle ?? HOMEPAGE_CONTENT_DEFAULTS.featuredTitle).slice(0, 120),
  };

  const err = await writeMetafield("homepage_content", value);
  if (err) return NextResponse.json({ error: err }, { status: 500 });

  revalidateTag("homepage_content");
  return NextResponse.json({ success: true, ...value });
}

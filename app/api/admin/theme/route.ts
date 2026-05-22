import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { readMetafield, verifyAdmin, writeMetafield } from "lib/admin/utils";

export type SiteTheme = {
  brandGold: string;
  brandDarkGold: string;
  brandDark: string;
  headingStyle: "solid" | "gradient";
  headingColor: string;
  headingGradientFrom: string;
  headingGradientTo: string;
  logoDefault: string | null;
  logoHover: string | null;
  logoSmall: string | null;
};

const DEFAULT_THEME: SiteTheme = {
  brandGold: "#ccb173",
  brandDarkGold: "#7f6f4c",
  brandDark: "#1a1a1a",
  headingStyle: "solid",
  headingColor: "#ccb173",
  headingGradientFrom: "#ccb173",
  headingGradientTo: "#e5c685",
  logoDefault: null,
  logoHover: null,
  logoSmall: null,
};

export async function GET() {
  try {
    const raw = await readMetafield("site_theme");
    if (raw && typeof raw === "object") {
      return NextResponse.json({ theme: { ...DEFAULT_THEME, ...(raw as Partial<SiteTheme>) } });
    }
    return NextResponse.json({ theme: DEFAULT_THEME });
  } catch {
    return NextResponse.json({ theme: DEFAULT_THEME });
  }
}

export async function POST(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { theme, logoUrl, logoType } = await request.json();

    // Logo URL save — client-side Vercel Blob upload already completed, just persist the URL
    if (logoUrl && logoType) {
      const raw = await readMetafield("site_theme");
      const current: SiteTheme = {
        ...DEFAULT_THEME,
        ...(raw && typeof raw === "object" ? (raw as Partial<SiteTheme>) : {}),
      };
      if (logoType === "default") current.logoDefault = logoUrl;
      else if (logoType === "hover") current.logoHover = logoUrl;
      else if (logoType === "small") current.logoSmall = logoUrl;
      const err = await writeMetafield("site_theme", current);
      if (err) return NextResponse.json({ error: err }, { status: 500 });
      revalidateTag("site-theme", "seconds");
      return NextResponse.json({ success: true, theme: current });
    }

    // Full theme save
    if (theme) {
      const err = await writeMetafield("site_theme", theme);
      if (err) return NextResponse.json({ error: err }, { status: 500 });
      revalidateTag("site-theme", "seconds");
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "theme or logoUrl+logoType required" }, { status: 400 });
  } catch (err) {
    console.error("[admin/theme]", err);
    return NextResponse.json({ error: "something went wrong" }, { status: 500 });
  }
}

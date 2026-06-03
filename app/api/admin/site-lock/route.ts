import { NextResponse } from "next/server";
import { readMetafield, verifyAdmin, writeMetafield } from "lib/admin/utils";

export type SiteLock = {
  isLocked: boolean;
  password: string;
  countdownEndsAt: string | null;
  message: string;
};

const DEFAULT: SiteLock = {
  isLocked: false,
  password: "",
  countdownEndsAt: null,
  message: "Something big is coming.",
};

export async function GET() {
  if (!(await verifyAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const raw = await readMetafield("site_lock");
    return NextResponse.json({ lock: { ...DEFAULT, ...(raw && typeof raw === "object" ? raw : {}) } });
  } catch {
    return NextResponse.json({ lock: DEFAULT });
  }
}

export async function POST(req: Request) {
  if (!(await verifyAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const current = ((await readMetafield("site_lock")) as Partial<SiteLock>) || {};
    const updated: SiteLock = { ...DEFAULT, ...current, ...body };
    const err = await writeMetafield("site_lock", updated);
    if (err) return NextResponse.json({ error: err }, { status: 500 });
    return NextResponse.json({ lock: updated });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

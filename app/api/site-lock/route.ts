import { NextResponse } from "next/server";
import { adminFetch } from "lib/admin/utils";

const CACHE = { "Cache-Control": "s-maxage=20, stale-while-revalidate=40" };

async function fetchLock() {
  const data = await adminFetch(
    `query { shop { metafield(namespace: "atheles", key: "site_lock") { value } } }`,
  );
  const raw = data.data?.shop?.metafield?.value;
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export async function GET() {
  try {
    const lock = await fetchLock();
    if (!lock) return NextResponse.json({ isLocked: false, countdownEndsAt: null, message: "" }, { headers: CACHE });
    return NextResponse.json(
      {
        isLocked: !!lock.isLocked,
        countdownEndsAt: lock.countdownEndsAt ?? null,
        message: lock.message ?? "",
        backgroundImage: lock.backgroundImage ?? null,
      },
      { headers: CACHE },
    );
  } catch {
    return NextResponse.json({ isLocked: false, countdownEndsAt: null, message: "" });
  }
}

export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    const lock = await fetchLock();
    if (!lock?.isLocked) return NextResponse.json({ error: "Not locked" }, { status: 400 });
    if (!lock.password || lock.password !== password) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
    }
    const res = NextResponse.json({ ok: true });
    res.cookies.set("atheles-site-bypass", "1", {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24,
      sameSite: "lax",
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { readMetafield, verifyAdmin, writeMetafield } from "lib/admin/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET() {
  if (!(await verifyAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const list = ((await readMetafield("site_waitlist")) as string[]) || [];
  return NextResponse.json({ waitlist: list, count: list.length });
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    const normalized = email.toLowerCase().trim();
    const list = ((await readMetafield("site_waitlist")) as string[]) || [];
    if (list.includes(normalized)) return NextResponse.json({ ok: true, alreadyJoined: true });
    list.push(normalized);
    const err = await writeMetafield("site_waitlist", list);
    if (err) return NextResponse.json({ error: "Failed to save" }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!(await verifyAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });
    const list = ((await readMetafield("site_waitlist")) as string[]) || [];
    const updated = list.filter((e) => e !== email.toLowerCase().trim());
    await writeMetafield("site_waitlist", updated);
    return NextResponse.json({ ok: true, count: updated.length });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

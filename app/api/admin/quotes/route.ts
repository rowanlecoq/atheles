import { NextResponse } from "next/server";
import { readMetafield, verifyAdmin, writeMetafield } from "lib/admin/utils";

const DEFAULT_QUOTES = [
  { text: "Excellence is not a gift. It is a skill that takes practice.", author: "Plato" },
  { text: "No man is free who is not master of himself.", author: "Epictetus" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
  { text: "The soul that is within me no man can degrade.", author: "Frederick Douglass" },
  { text: "He who is not a good servant will not be a good master.", author: "Plato" },
  { text: "Strength does not come from physical capacity. It comes from an indomitable will.", author: "Ancient proverb" },
  { text: "The mind is everything. What you think, you become.", author: "Greek philosophy" },
];

export async function GET() {
  try {
    const raw = await readMetafield("quotes");
    if (Array.isArray(raw)) return NextResponse.json({ quotes: raw });
    return NextResponse.json({ quotes: DEFAULT_QUOTES });
  } catch {
    return NextResponse.json({ quotes: DEFAULT_QUOTES });
  }
}

export async function POST(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { quotes } = await request.json();
  if (!Array.isArray(quotes)) {
    return NextResponse.json({ error: "quotes must be an array" }, { status: 400 });
  }

  const cleaned = (quotes as { text: string; author: string }[]).filter((q) => q.text?.trim());
  const err = await writeMetafield("quotes", cleaned);
  if (err) return NextResponse.json({ error: err }, { status: 500 });

  return NextResponse.json({ success: true, count: cleaned.length });
}

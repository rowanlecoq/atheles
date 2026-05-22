import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { readMetafield, verifyAdmin, writeMetafield } from "lib/admin/utils";

export type SlotData = {
  media: string[];
  transition: "crossfade" | "slide" | "fade";
  interval: number;
  grayscale: boolean;
  opacity: number;
  focusX: number;
  focusY: number;
};

export const DEFAULT_IMAGES: Record<string, string> = {
  hero_bg: "/statues/greek-god-hero.png",
  hero_left: "/statues/augustus-primaporta.jpg",
  hero_right: "/statues/trajan-louvre.jpg",
  store_header: "/statues/greek-god-hero.png",
  newsletter: "/statues/roman-emperor-pergamon.jpg",
  brand_story: "/statues/roman-emperor-pergamon.jpg",
  interstitial: "/statues/hadrian-cuirassed.jpg",
};

function makeDefault(key: string): SlotData {
  return {
    media: [DEFAULT_IMAGES[key] || ""],
    transition: "crossfade",
    interval: 6000,
    grayscale: true,
    opacity: 50,
    focusX: 50,
    focusY: 50,
  };
}

function normalizeSlot(val: unknown, key: string): SlotData {
  if (!val) return makeDefault(key);
  if (typeof val === "string") return { ...makeDefault(key), media: [val] };
  if (typeof val === "object" && val !== null) {
    const obj = val as Record<string, unknown>;
    return {
      media: Array.isArray(obj.media)
        ? obj.media.filter((m): m is string => typeof m === "string")
        : [],
      transition: (["crossfade", "slide", "fade"].includes(obj.transition as string)
        ? obj.transition
        : "crossfade") as SlotData["transition"],
      interval: typeof obj.interval === "number" ? obj.interval : 6000,
      grayscale: typeof obj.grayscale === "boolean" ? obj.grayscale : true,
      opacity: typeof obj.opacity === "number" ? obj.opacity : 50,
      focusX: typeof obj.focusX === "number" ? obj.focusX : 50,
      focusY: typeof obj.focusY === "number" ? obj.focusY : 50,
    };
  }
  return makeDefault(key);
}

function purgeCache() {
  revalidateTag("site-images");
  revalidatePath("/");
  revalidatePath("/search", "layout");
}

export async function GET() {
  try {
    const stored = ((await readMetafield("site_images")) ?? {}) as Record<string, unknown>;
    const images: Record<string, SlotData> = {};
    for (const key of Object.keys(DEFAULT_IMAGES)) {
      images[key] = normalizeSlot(stored[key], key);
      if (images[key].media.length === 0) images[key].media = [DEFAULT_IMAGES[key] || ""];
    }
    return NextResponse.json({ images });
  } catch {
    const images: Record<string, SlotData> = {};
    for (const key of Object.keys(DEFAULT_IMAGES)) images[key] = makeDefault(key);
    return NextResponse.json({ images });
  }
}

export async function POST(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const stored = ((await readMetafield("site_images")) ?? {}) as Record<string, unknown>;

  // Bulk save: whole slot config (media, transition, interval, etc.)
  if (body.slot && body.slotData) {
    stored[body.slot as string] = body.slotData as SlotData;
    const err = await writeMetafield("site_images", stored);
    if (err) return NextResponse.json({ error: err }, { status: 500 });
    purgeCache();
    return NextResponse.json({ success: true, slotData: body.slotData });
  }

  const { key, file } = body as { key: string; file?: string | null };

  // Add URL to slot (from client-side Vercel Blob upload or pasted external URL)
  if (key && file && file.startsWith("http")) {
    const slot = normalizeSlot(stored[key], key);
    if (slot.media.length === 1 && slot.media[0] === DEFAULT_IMAGES[key]) {
      slot.media = [file];
    } else {
      slot.media.push(file);
    }
    stored[key] = slot;
    const err = await writeMetafield("site_images", stored);
    if (err) return NextResponse.json({ error: err }, { status: 500 });
    purgeCache();
    return NextResponse.json({ success: true, url: file, slotData: slot });
  }

  // Reset slot to default
  if (key && !file) {
    delete stored[key];
    await writeMetafield("site_images", stored);
    purgeCache();
    return NextResponse.json({ success: true, url: DEFAULT_IMAGES[key] || null });
  }

  return NextResponse.json({ error: "invalid request" }, { status: 400 });
}

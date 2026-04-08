import { getCustomerByToken } from "lib/auth/shopify-customer";
import { put } from "@vercel/blob";
import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || "";
const domain = process.env.SHOPIFY_STORE_DOMAIN
  ? process.env.SHOPIFY_STORE_DOMAIN.startsWith("https://")
    ? process.env.SHOPIFY_STORE_DOMAIN
    : `https://${process.env.SHOPIFY_STORE_DOMAIN}`
  : "";
const adminEndpoint = domain ? `${domain}/admin/api/2024-10/graphql.json` : "";

async function adminFetch(query: string, variables: Record<string, unknown> = {}) {
  const res = await fetch(adminEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": adminToken },
    body: JSON.stringify({ query, variables }),
  });
  return res.json();
}

async function verifyAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("atheles-auth-token")?.value;
  if (!token) return false;
  const customer = await getCustomerByToken(token);
  return customer?.isAdmin ?? false;
}

const DEFAULT_IMAGES: Record<string, string> = {
  hero_bg: "/statues/greek-god-hero.png",
  hero_left: "/statues/augustus-primaporta.jpg",
  hero_right: "/statues/trajan-louvre.jpg",
  store_header: "/statues/greek-god-hero.png",
  newsletter: "/statues/roman-emperor-pergamon.jpg",
  brand_story: "/statues/roman-emperor-pergamon.jpg",
  interstitial: "/statues/hadrian-cuirassed.jpg",
};

export type SlotData = {
  media: string[];
  transition: "crossfade" | "slide" | "fade";
  interval: number;
  grayscale: boolean;
  opacity: number; // 0–100
  focusX: number;  // 0–100 (object-position x%)
  focusY: number;  // 0–100 (object-position y%)
};

/** Normalise legacy string values and new slot objects into SlotData */
function normalizeSlot(val: unknown, key: string): SlotData {
  if (!val) return { media: [DEFAULT_IMAGES[key] || ""], transition: "crossfade", interval: 6000, grayscale: true, opacity: 50, focusX: 50, focusY: 50 };
  if (typeof val === "string") return { media: [val], transition: "crossfade", interval: 6000, grayscale: true, opacity: 50, focusX: 50, focusY: 50 };
  if (typeof val === "object" && val !== null) {
    const obj = val as Record<string, unknown>;
    return {
      media: Array.isArray(obj.media) ? obj.media.filter((m): m is string => typeof m === "string") : [],
      transition: (["crossfade", "slide", "fade"].includes(obj.transition as string) ? obj.transition : "crossfade") as SlotData["transition"],
      interval: typeof obj.interval === "number" ? obj.interval : 6000,
      grayscale: typeof obj.grayscale === "boolean" ? obj.grayscale : true,
      opacity: typeof obj.opacity === "number" ? obj.opacity : 50,
      focusX: typeof obj.focusX === "number" ? obj.focusX : 50,
      focusY: typeof obj.focusY === "number" ? obj.focusY : 50,
    };
  }
  return { media: [DEFAULT_IMAGES[key] || ""], transition: "crossfade", interval: 6000, grayscale: true, opacity: 50, focusX: 50, focusY: 50 };
}

async function getStoredData(): Promise<Record<string, unknown>> {
  const data = await adminFetch(`
    query { shop { metafield(namespace: "atheles", key: "site_images") { value } } }
  `);
  const raw = data.data?.shop?.metafield?.value;
  if (raw) {
    try { return JSON.parse(raw); } catch {}
  }
  return {};
}

function purgeCache() {
  try { revalidateTag("site-images", "layout"); } catch {}
}

async function saveData(current: Record<string, unknown>): Promise<string | null> {
  const shopData = await adminFetch(`query { shop { id } }`);
  const shopId = shopData.data?.shop?.id;
  if (!shopId) return "could not fetch shop ID from Shopify";
  const result = await adminFetch(`
    mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) { metafields { key } userErrors { message } }
    }
  `, { metafields: [{ ownerId: shopId, namespace: "atheles", key: "site_images", type: "json", value: JSON.stringify(current) }] });
  const errors = result.data?.metafieldsSet?.userErrors;
  if (errors?.length) return errors.map((e: { message: string }) => e.message).join(", ");
  return null;
}

export async function GET() {
  try {
    const stored = await getStoredData();
    const images: Record<string, SlotData> = {};
    for (const key of Object.keys(DEFAULT_IMAGES)) {
      images[key] = normalizeSlot(stored[key], key);
      // Ensure at least the default if media is empty
      if (images[key].media.length === 0) {
        images[key].media = [DEFAULT_IMAGES[key] || ""];
      }
    }
    return NextResponse.json({ images });
  } catch {
    const images: Record<string, SlotData> = {};
    for (const key of Object.keys(DEFAULT_IMAGES)) {
      images[key] = { media: [DEFAULT_IMAGES[key]!], transition: "crossfade", interval: 6000, grayscale: true, opacity: 50, focusX: 50, focusY: 50 };
    }
    return NextResponse.json({ images });
  }
}

export async function POST(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // ── Bulk update: save entire slot config (media array, transition, interval)
  if (body.slot && body.slotData) {
    const { slot, slotData } = body as { slot: string; slotData: SlotData };
    const current = await getStoredData();
    current[slot] = {
      media: slotData.media,
      transition: slotData.transition,
      interval: slotData.interval,
      grayscale: slotData.grayscale,
      opacity: slotData.opacity,
      focusX: slotData.focusX,
      focusY: slotData.focusY,
    };
    const saveError = await saveData(current);
    if (saveError) return NextResponse.json({ error: `save failed: ${saveError}` }, { status: 500 });
    purgeCache();
    return NextResponse.json({ success: true, slotData: current[slot] });
  }

  // ── Upload a single file to a slot (appends to media array)
  const { key, file } = body;

  if (file && file.startsWith("data:")) {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({ error: "blob storage not configured" }, { status: 500 });
    }
    const matches = file.match(/^data:(.+);base64,(.+)$/);
    if (!matches) return NextResponse.json({ error: "invalid file" }, { status: 400 });

    const contentType = matches[1] as string;
    const buffer = Buffer.from(matches[2] as string, "base64");
    const isVideo = contentType.startsWith("video/");
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;

    if (buffer.byteLength > maxSize) {
      return NextResponse.json({ error: `file too large (max ${isVideo ? "50" : "10"}MB)` }, { status: 400 });
    }

    const ext = contentType.split("/")[1] || "jpg";
    const filename = `site-images/${key}-${Date.now()}.${ext}`;
    const blob = await put(filename, buffer, { access: "public", contentType, addRandomSuffix: false });

    // Add to slot media array
    const current = await getStoredData();
    const slot = normalizeSlot(current[key], key);
    // Replace default image if it's the only one
    if (slot.media.length === 1 && DEFAULT_IMAGES[key] && slot.media[0] === DEFAULT_IMAGES[key]) {
      slot.media = [blob.url];
    } else {
      slot.media.push(blob.url);
    }
    current[key] = slot;
    const saveError1 = await saveData(current);
    if (saveError1) return NextResponse.json({ error: `save failed: ${saveError1}` }, { status: 500 });

    return NextResponse.json({ success: true, url: blob.url, slotData: slot });
  }

  // If file is a URL (external), add to media array
  if (file && file.startsWith("http")) {
    const current = await getStoredData();
    const slot = normalizeSlot(current[key], key);
    if (slot.media.length === 1 && DEFAULT_IMAGES[key] && slot.media[0] === DEFAULT_IMAGES[key]) {
      slot.media = [file];
    } else {
      slot.media.push(file);
    }
    current[key] = slot;
    const saveError2 = await saveData(current);
    if (saveError2) return NextResponse.json({ error: `save failed: ${saveError2}` }, { status: 500 });

    return NextResponse.json({ success: true, url: file, slotData: slot });
  }

  // Reset to default
  if (key && !file) {
    const current = await getStoredData();
    delete current[key];
    await saveData(current);

    return NextResponse.json({ success: true, url: DEFAULT_IMAGES[key] || null });
  }

  return NextResponse.json({ error: "key and file required" }, { status: 400 });
}

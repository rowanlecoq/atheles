/**
 * Server-side fetch of site images data from Shopify metafields.
 * Called from the root layout to inject data into the page as a
 * synchronous <script> tag — eliminates client-side fetch delay.
 */

const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || "";
const domain = process.env.SHOPIFY_STORE_DOMAIN
  ? process.env.SHOPIFY_STORE_DOMAIN.startsWith("https://")
    ? process.env.SHOPIFY_STORE_DOMAIN
    : `https://${process.env.SHOPIFY_STORE_DOMAIN}`
  : "";
const adminEndpoint = domain ? `${domain}/admin/api/2024-10/graphql.json` : "";

const DEFAULT_IMAGES: Record<string, string> = {
  hero_bg: "/statues/greek-god-hero.png",
  hero_left: "/statues/augustus-primaporta.jpg",
  hero_right: "/statues/trajan-louvre.jpg",
  store_header: "/statues/greek-god-hero.png",
  newsletter: "/statues/roman-emperor-pergamon.jpg",
  brand_story: "/statues/roman-emperor-pergamon.jpg",
  interstitial: "/statues/hadrian-cuirassed.jpg",
};

type SlotData = {
  media: string[];
  transition: "crossfade" | "slide" | "fade";
  interval: number;
  grayscale: boolean;
  opacity: number;
  focusX: number;
  focusY: number;
};

function normalizeSlot(val: unknown, key: string): SlotData {
  const base: SlotData = { media: [DEFAULT_IMAGES[key] || ""], transition: "crossfade", interval: 6000, grayscale: true, opacity: 50, focusX: 50, focusY: 50 };
  if (!val) return base;
  if (typeof val === "string") return { ...base, media: [val] };
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
  return base;
}

export async function getSiteImagesData(): Promise<Record<string, SlotData>> {
  const images: Record<string, SlotData> = {};

  try {
    if (!adminEndpoint) throw new Error("no endpoint");
    const res = await fetch(adminEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": adminToken },
      body: JSON.stringify({
        query: `query { shop { metafield(namespace: "atheles", key: "site_images") { value } } }`,
      }),
      next: { revalidate: 300, tags: ["site-images"] },
    });
    const data = await res.json();
    const raw = data.data?.shop?.metafield?.value;
    const stored = raw ? JSON.parse(raw) : {};

    for (const key of Object.keys(DEFAULT_IMAGES)) {
      const slot = normalizeSlot(stored[key], key);
      if (slot.media.length === 0) slot.media = [DEFAULT_IMAGES[key] || ""];
      images[key] = slot;
    }
  } catch {
    for (const key of Object.keys(DEFAULT_IMAGES)) {
      images[key] = { media: [DEFAULT_IMAGES[key]!], transition: "crossfade", interval: 6000, grayscale: true, opacity: 50, focusX: 50, focusY: 50 };
    }
  }

  return images;
}

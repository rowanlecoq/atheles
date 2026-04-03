import { getCustomerByToken } from "lib/auth/shopify-customer";
import { put } from "@vercel/blob";
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

export async function GET() {
  try {
    const data = await adminFetch(`
      query { shop { metafield(namespace: "atheles", key: "site_images") { value } } }
    `);
    const raw = data.data?.shop?.metafield?.value;
    if (raw) {
      try { return NextResponse.json({ images: { ...DEFAULT_IMAGES, ...JSON.parse(raw) } }); } catch {}
    }
    return NextResponse.json({ images: DEFAULT_IMAGES });
  } catch {
    return NextResponse.json({ images: DEFAULT_IMAGES });
  }
}

export async function POST(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { key, file } = await request.json();

  // If file is a data URL, upload to blob
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

    // Save to metafield
    const currentData = await adminFetch(`
      query { shop { metafield(namespace: "atheles", key: "site_images") { value } } }
    `);
    const current = currentData.data?.shop?.metafield?.value ? JSON.parse(currentData.data.shop.metafield.value) : {};
    current[key] = blob.url;

    const shopData = await adminFetch(`query { shop { id } }`);
    const shopId = shopData.data?.shop?.id;
    if (shopId) {
      await adminFetch(`
        mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields) { metafields { key } userErrors { message } }
        }
      `, { metafields: [{ ownerId: shopId, namespace: "atheles", key: "site_images", type: "json", value: JSON.stringify(current) }] });
    }

    return NextResponse.json({ success: true, url: blob.url });
  }

  // If file is a URL (external), just save it
  if (file && file.startsWith("http")) {
    const currentData = await adminFetch(`
      query { shop { metafield(namespace: "atheles", key: "site_images") { value } } }
    `);
    const current = currentData.data?.shop?.metafield?.value ? JSON.parse(currentData.data.shop.metafield.value) : {};
    current[key] = file;

    const shopData = await adminFetch(`query { shop { id } }`);
    const shopId = shopData.data?.shop?.id;
    if (shopId) {
      await adminFetch(`
        mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields) { metafields { key } userErrors { message } }
        }
      `, { metafields: [{ ownerId: shopId, namespace: "atheles", key: "site_images", type: "json", value: JSON.stringify(current) }] });
    }

    return NextResponse.json({ success: true, url: file });
  }

  // Reset to default
  if (key && !file) {
    const currentData = await adminFetch(`
      query { shop { metafield(namespace: "atheles", key: "site_images") { value } } }
    `);
    const current = currentData.data?.shop?.metafield?.value ? JSON.parse(currentData.data.shop.metafield.value) : {};
    delete current[key];

    const shopData = await adminFetch(`query { shop { id } }`);
    const shopId = shopData.data?.shop?.id;
    if (shopId) {
      await adminFetch(`
        mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields) { metafields { key } userErrors { message } }
        }
      `, { metafields: [{ ownerId: shopId, namespace: "atheles", key: "site_images", type: "json", value: JSON.stringify(current) }] });
    }

    return NextResponse.json({ success: true, url: DEFAULT_IMAGES[key] || null });
  }

  return NextResponse.json({ error: "key and file required" }, { status: 400 });
}

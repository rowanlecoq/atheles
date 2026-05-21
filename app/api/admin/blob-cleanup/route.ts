import { del, list } from "@vercel/blob";
import { getCustomerByToken } from "lib/auth/shopify-customer";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const blobToken = process.env.BLOB_READ_WRITE_TOKEN || "";
const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || "";
const cronSecret = process.env.CRON_SECRET || "";
const domain = process.env.SHOPIFY_STORE_DOMAIN
  ? process.env.SHOPIFY_STORE_DOMAIN.startsWith("https://")
    ? process.env.SHOPIFY_STORE_DOMAIN
    : `https://${process.env.SHOPIFY_STORE_DOMAIN}`
  : "";
const adminEndpoint = domain ? `${domain}/admin/api/2024-10/graphql.json` : "";

async function verifyAdmin(request: Request) {
  // Cron job auth via secret header
  const auth = request.headers.get("authorization");
  if (cronSecret && auth === `Bearer ${cronSecret}`) return true;

  // Admin cookie auth
  const cookieStore = await cookies();
  const token = cookieStore.get("atheles-auth-token")?.value;
  if (!token) return false;
  const customer = await getCustomerByToken(token);
  return customer?.isAdmin ?? false;
}

async function shopifyFetch(query: string) {
  const res = await fetch(adminEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": adminToken },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error(`Admin API ${res.status}`);
  return res.json();
}

// Collect every blob URL currently referenced anywhere in the site
async function collectActiveUrls(): Promise<Set<string>> {
  const active = new Set<string>();

  // Site images (shop metafield)
  try {
    const d = await shopifyFetch(`query { shop { metafield(namespace: "atheles", key: "site_images") { value } } }`);
    const raw = d.data?.shop?.metafield?.value;
    if (raw) {
      const obj = JSON.parse(raw);
      for (const slot of Object.values(obj) as { media?: string[] }[]) {
        for (const url of slot.media ?? []) {
          if (url?.includes("vercel-storage.com")) active.add(url);
        }
      }
    }
  } catch {}

  // Site theme (logos)
  try {
    const d = await shopifyFetch(`query { shop { metafield(namespace: "atheles", key: "site_theme") { value } } }`);
    const raw = d.data?.shop?.metafield?.value;
    if (raw) {
      const obj = JSON.parse(raw);
      for (const v of Object.values(obj)) {
        if (typeof v === "string" && v.includes("vercel-storage.com")) active.add(v);
      }
    }
  } catch {}

  // Athletes
  try {
    const d = await shopifyFetch(`query { shop { metafield(namespace: "atheles", key: "athletes") { value } } }`);
    const raw = d.data?.shop?.metafield?.value;
    if (raw) {
      const athletes = JSON.parse(raw);
      for (const a of athletes) {
        if (typeof a.image === "string" && a.image.includes("vercel-storage.com")) active.add(a.image);
      }
    }
  } catch {}

  // All customer avatar metafields (paginated)
  try {
    let cursor: string | null = null;
    do {
      const after = cursor ? `, after: "${cursor}"` : "";
      const d = await shopifyFetch(`
        query {
          customers(first: 250${after}) {
            pageInfo { hasNextPage endCursor }
            edges {
              node {
                metafield(namespace: "atheles", key: "avatar") { value }
              }
            }
          }
        }
      `);
      const page = d.data?.customers;
      for (const { node } of page?.edges ?? []) {
        const url = node.metafield?.value;
        if (url?.includes("vercel-storage.com")) active.add(url);
      }
      cursor = page?.pageInfo?.hasNextPage ? page.pageInfo.endCursor : null;
    } while (cursor);
  } catch {}

  return active;
}

// GET — dry run: returns what would be deleted
export async function GET(request: Request) {
  if (!(await verifyAdmin(request))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!blobToken) return NextResponse.json({ error: "blob not configured" }, { status: 500 });

  const active = await collectActiveUrls();

  const orphans: string[] = [];
  let cursor: string | undefined;
  do {
    const { blobs, cursor: next } = await list({ token: blobToken, cursor, limit: 1000 });
    for (const b of blobs) {
      if (!active.has(b.url)) orphans.push(b.url);
    }
    cursor = next;
  } while (cursor);

  return NextResponse.json({ activeCount: active.size, orphanCount: orphans.length, orphans });
}

// DELETE — actually deletes orphaned blobs
export async function DELETE(request: Request) {
  if (!(await verifyAdmin(request))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!blobToken) return NextResponse.json({ error: "blob not configured" }, { status: 500 });

  const active = await collectActiveUrls();

  const orphans: string[] = [];
  let cursor: string | undefined;
  do {
    const { blobs, cursor: next } = await list({ token: blobToken, cursor, limit: 1000 });
    for (const b of blobs) {
      if (!active.has(b.url)) orphans.push(b.url);
    }
    cursor = next;
  } while (cursor);

  let deleted = 0;
  // Delete in batches of 10
  for (let i = 0; i < orphans.length; i += 10) {
    const batch = orphans.slice(i, i + 10);
    await Promise.all(batch.map((url) => del(url, { token: blobToken }).catch(() => {})));
    deleted += batch.length;
  }

  return NextResponse.json({ deleted, total: orphans.length });
}

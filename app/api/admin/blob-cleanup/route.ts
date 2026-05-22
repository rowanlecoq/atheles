import { del, list } from "@vercel/blob";
import { getCustomerByToken } from "lib/auth/shopify-customer";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { adminFetch } from "lib/admin/utils";

const blobToken = process.env.BLOB_READ_WRITE_TOKEN || "";
const cronSecret = process.env.CRON_SECRET || "";

async function verifyAccess(request: Request) {
  const auth = request.headers.get("authorization");
  if (cronSecret && auth === `Bearer ${cronSecret}`) return true;
  const cookieStore = await cookies();
  const token = cookieStore.get("atheles-auth-token")?.value;
  if (!token) return false;
  const customer = await getCustomerByToken(token);
  return customer?.isAdmin ?? false;
}

function collectUrlsFromValue(obj: unknown, active: Set<string>) {
  if (typeof obj === "string" && obj.includes("vercel-storage.com")) {
    active.add(obj);
  } else if (Array.isArray(obj)) {
    obj.forEach((v) => collectUrlsFromValue(v, active));
  } else if (obj && typeof obj === "object") {
    Object.values(obj).forEach((v) => collectUrlsFromValue(v, active));
  }
}

async function collectActiveUrls(): Promise<Set<string>> {
  const active = new Set<string>();

  for (const key of ["site_images", "site_theme", "athletes"]) {
    try {
      const d = await adminFetch(
        `query { shop { metafield(namespace: "atheles", key: "${key}") { value } } }`,
      );
      const raw = d.data?.shop?.metafield?.value;
      if (raw) collectUrlsFromValue(JSON.parse(raw), active);
    } catch {}
  }

  // Customer avatars (paginated)
  try {
    let cursor: string | null = null;
    do {
      const after = cursor ? `, after: "${cursor}"` : "";
      const d = await adminFetch(`
        query {
          customers(first: 250${after}) {
            pageInfo { hasNextPage endCursor }
            edges { node { metafield(namespace: "atheles", key: "avatar") { value } } }
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

export async function GET(request: Request) {
  if (!(await verifyAccess(request))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
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

export async function DELETE(request: Request) {
  if (!(await verifyAccess(request))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
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
  for (let i = 0; i < orphans.length; i += 10) {
    await Promise.all(
      orphans.slice(i, i + 10).map((url) => del(url, { token: blobToken }).catch(() => {})),
    );
    deleted += Math.min(10, orphans.length - i);
  }

  return NextResponse.json({ deleted, total: orphans.length });
}

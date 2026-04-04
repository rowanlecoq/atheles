import { type NextRequest, NextResponse } from "next/server";

const protectedPaths = ["/profile", "/account", "/admin"];
const authPaths = ["/login", "/register"];

// Paths that should never be locked (API routes, static assets, the lock page itself, admin)
const lockExempt = ["/locked", "/api/", "/admin", "/_next/", "/favicon", "/icon-", "/apple-touch-icon"];

const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || "";
const domain = process.env.SHOPIFY_STORE_DOMAIN
  ? process.env.SHOPIFY_STORE_DOMAIN.startsWith("https://")
    ? process.env.SHOPIFY_STORE_DOMAIN
    : `https://${process.env.SHOPIFY_STORE_DOMAIN}`
  : "";
const adminEndpoint = domain ? `${domain}/admin/api/2024-10/graphql.json` : "";

// In-memory cache for lock status (avoids hitting Shopify on every request)
let lockCache: { locked: boolean; ts: number } = { locked: false, ts: 0 };
const LOCK_CACHE_TTL = 15_000; // 15 seconds

async function isSiteLocked(): Promise<boolean> {
  if (Date.now() - lockCache.ts < LOCK_CACHE_TTL) return lockCache.locked;
  try {
    if (!adminEndpoint) return false;
    const res = await fetch(adminEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": adminToken },
      body: JSON.stringify({
        query: `query { shop { metafield(namespace: "atheles", key: "site_lock") { value } } }`,
      }),
    });
    const data = await res.json();
    const raw = data.data?.shop?.metafield?.value;
    const locked = raw ? JSON.parse(raw).locked === true : false;
    lockCache = { locked, ts: Date.now() };
    return locked;
  } catch {
    return lockCache.locked; // Fall back to last known state
  }
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("atheles-auth-token")?.value;
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/account/activate") || pathname.startsWith("/account/reset")) {
    return NextResponse.next();
  }

  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  const isAuthPage = authPaths.some((p) => pathname.startsWith(p));

  if (isProtected && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL("/profile", request.url));
  }

  // Site lock check — skip for exempt paths and admin users
  const isExempt = lockExempt.some((p) => pathname.startsWith(p));
  if (!isExempt) {
    // Admin users have a special cookie set by the session — check via auth token presence + admin flag
    // We use a lightweight cookie check: admins get an "atheles-admin" cookie from the session endpoint
    const isAdmin = request.cookies.get("atheles-admin")?.value === "1";
    if (!isAdmin) {
      const locked = await isSiteLocked();
      if (locked) {
        return NextResponse.redirect(new URL("/locked", request.url));
      }
    }
  }

  // If user is on /locked but site is not locked, redirect home
  if (pathname === "/locked") {
    const locked = await isSiteLocked();
    if (!locked) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|statues|fonts|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|mp4|webm)$).*)"],
};

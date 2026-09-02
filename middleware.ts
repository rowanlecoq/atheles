import { type NextRequest, NextResponse } from "next/server";

const protectedPaths = ["/profile", "/account", "/orders", "/admin"];
const authPaths = ["/login", "/register"];
const lockExempt = ["/coming-soon", "/api/", "/_next/", "/favicon.", "/icon-", "/apple-"];

// Module-level TTL cache — reduces Shopify calls significantly within a single edge isolate
let _lockCache: { isLocked: boolean; ts: number } | null = null;

async function getSiteLockStatus(): Promise<boolean> {
  const now = Date.now();
  if (_lockCache && now - _lockCache.ts < 20_000) return _lockCache.isLocked;

  const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  const rawDomain = process.env.SHOPIFY_STORE_DOMAIN;
  if (!token || !rawDomain) return false;

  const base = rawDomain.startsWith("https://") ? rawDomain : `https://${rawDomain}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const res = await fetch(`${base}/admin/api/2025-04/graphql.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
      body: JSON.stringify({
        query: `query { shop { metafield(namespace: "atheles", key: "site_lock") { value } } }`,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return _lockCache?.isLocked ?? false;
    const data = await res.json();
    const raw = data.data?.shop?.metafield?.value;
    const isLocked = raw ? !!JSON.parse(raw).isLocked : false;
    _lockCache = { isLocked, ts: now };
    return isLocked;
  } catch {
    clearTimeout(timeout);
    // Fail open — don't lock users out if Shopify is unreachable
    return _lockCache?.isLocked ?? false;
  }
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("atheles-auth-token")?.value;
  const { pathname } = request.nextUrl;

  // Forward pathname to server components (used to hide navbar on coming-soon)
  const reqHeaders = new Headers(request.headers);
  reqHeaders.set("x-pathname", pathname);

  if (pathname.startsWith("/account/activate") || pathname.startsWith("/account/reset")) {
    return NextResponse.next({ request: { headers: reqHeaders } });
  }

  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  const isAuthPage = authPaths.some((p) => pathname.startsWith(p));

  if (isProtected && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL("/profile", request.url));
  }

  // Site lock — admin paths, API routes, and static assets are always exempt
  const isLockExempt =
    lockExempt.some((p) => pathname.startsWith(p)) || pathname.startsWith("/admin");
  const hasBypass = request.cookies.get("atheles-site-bypass")?.value === "1";

  // If visiting /coming-soon, redirect to home when the lock is off
  if (pathname.startsWith("/coming-soon")) {
    const locked = await getSiteLockStatus();
    if (!locked) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next({ request: { headers: reqHeaders } });
  }

  if (!isLockExempt && !hasBypass) {
    const locked = await getSiteLockStatus();
    if (locked) {
      return NextResponse.redirect(new URL("/coming-soon", request.url));
    }
  }

  return NextResponse.next({ request: { headers: reqHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon-|apple-touch-icon).*)"],
};

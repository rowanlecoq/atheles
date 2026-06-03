import { type NextRequest, NextResponse } from "next/server";

const protectedPaths = ["/profile", "/account", "/admin"];
const authPaths = ["/login", "/register"];

// Paths that bypass the site lock entirely
const lockExempt = ["/coming-soon", "/api/", "/_next/", "/favicon.", "/icon-", "/apple-"];

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

  // Site lock — skip for admin paths, API routes, static assets, and the coming-soon page itself
  const isLockExempt =
    lockExempt.some((p) => pathname.startsWith(p)) || pathname.startsWith("/admin");
  const hasBypass = request.cookies.get("atheles-site-bypass")?.value === "1";

  if (!isLockExempt && !hasBypass) {
    try {
      const lockRes = await fetch(new URL("/api/site-lock", request.url).toString());
      if (lockRes.ok) {
        const { isLocked } = await lockRes.json();
        if (isLocked) {
          return NextResponse.redirect(new URL("/coming-soon", request.url));
        }
      }
    } catch {
      // Fail open — if we can't check the lock, don't block the user
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon-|apple-touch-icon).*)"],
};

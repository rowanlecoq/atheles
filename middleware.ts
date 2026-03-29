import { type NextRequest, NextResponse } from "next/server";

const protectedPaths = ["/profile", "/account", "/admin"];
const authPaths = ["/login", "/register"];

export function middleware(request: NextRequest) {
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
  return NextResponse.next();
}

export const config = {
  matcher: ["/profile/:path*", "/account/:path*", "/admin/:path*", "/login", "/register"],
};

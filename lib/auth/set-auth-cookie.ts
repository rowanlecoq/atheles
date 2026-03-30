import { cookies } from "next/headers";

export async function setAuthCookie(accessToken: string, expiresAt: string) {
  const maxAge = Math.max(
    60,
    Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000),
  );

  const cookieStore = await cookies();
  cookieStore.set("atheles-auth-token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge,
    path: "/",
  });
  // Non-httpOnly indicator cookie so client JS can check login status
  cookieStore.set("atheles-logged-in", "1", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge,
    path: "/",
  });
}

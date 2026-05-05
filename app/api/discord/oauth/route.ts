import { getCustomerByToken } from "lib/auth/shopify-customer";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("atheles-auth-token")?.value;
  if (!token) return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_SITE_URL!));

  const customer = await getCustomerByToken(token);
  if (!customer) return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_SITE_URL!));

  const state = Buffer.from(customer.email).toString("base64url");

  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/discord/callback`,
    response_type: "code",
    scope: "identify guilds.join",
    state,
  });

  const res = NextResponse.redirect(`https://discord.com/oauth2/authorize?${params}`);
  // Store state in cookie to verify on callback
  res.cookies.set("discord-oauth-state", state, { httpOnly: true, maxAge: 600, path: "/" });
  return res;
}

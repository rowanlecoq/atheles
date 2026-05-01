import { getCustomerByToken } from "lib/auth/shopify-customer";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createHmac, randomBytes } from "crypto";

const LINK_SECRET = process.env.DISCORD_LINK_SECRET || "change-me";
const TOKEN_TTL_MS = 10 * 60 * 1000; // 10 minutes

function makeToken(email: string): string {
  const expiry = Date.now() + TOKEN_TTL_MS;
  const nonce = randomBytes(4).toString("hex");
  const payload = `${email}.${expiry}.${nonce}`;
  const sig = createHmac("sha256", LINK_SECRET).update(payload).digest("hex");
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get("atheles-auth-token")?.value;

  if (!token) return NextResponse.json({ error: "not logged in" }, { status: 401 });

  const customer = await getCustomerByToken(token);
  if (!customer) return NextResponse.json({ error: "not logged in" }, { status: 401 });

  return NextResponse.json({ token: makeToken(customer.email) });
}

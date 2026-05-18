import { createCustomerAddress, getCustomerAddresses } from "lib/auth/shopify-customer";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

async function getToken() {
  return (await cookies()).get("atheles-auth-token")?.value ?? null;
}

export async function GET() {
  const token = await getToken();
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const result = await getCustomerAddresses(token);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "failed to fetch addresses" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const token = await getToken();
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const address = await req.json();
    const result = await createCustomerAddress(token, address);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "failed to create address" }, { status: 500 });
  }
}

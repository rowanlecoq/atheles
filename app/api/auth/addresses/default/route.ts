import { setDefaultCustomerAddress } from "lib/auth/shopify-customer";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function PUT(req: Request) {
  const token = (await cookies()).get("atheles-auth-token")?.value;
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const { addressId } = await req.json();
    const result = await setDefaultCustomerAddress(token, addressId);
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "failed to set default address" }, { status: 500 });
  }
}

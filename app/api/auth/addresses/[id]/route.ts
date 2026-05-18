import { deleteCustomerAddress, updateCustomerAddress } from "lib/auth/shopify-customer";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

async function getToken() {
  return (await cookies()).get("atheles-auth-token")?.value ?? null;
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken();
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const address = await req.json();
    const decodedId = decodeURIComponent(id);
    const result = await updateCustomerAddress(token, decodedId, address);
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "failed to update address" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken();
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const decodedId = decodeURIComponent(id);
    const result = await deleteCustomerAddress(token, decodedId);
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "failed to delete address" }, { status: 500 });
  }
}

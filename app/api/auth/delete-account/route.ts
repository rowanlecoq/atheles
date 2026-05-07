import { cookies } from "next/headers";
import { getCustomerByToken } from "lib/auth/shopify-customer";
import { NextResponse } from "next/server";

const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || "";
const rawDomain = process.env.SHOPIFY_STORE_DOMAIN || "";
const domain = rawDomain
  ? rawDomain.startsWith("https://") ? rawDomain : `https://${rawDomain}`
  : "";

function numericId(gid: string) {
  return gid.split("/").pop();
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("atheles-auth-token")?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: "not authenticated" }, { status: 401 });
    }

    const { confirmEmail } = await request.json();
    const customer = await getCustomerByToken(token);
    if (!customer?.id) {
      return NextResponse.json({ success: false, error: "customer not found" }, { status: 404 });
    }

    if (confirmEmail?.trim().toLowerCase() !== customer.email?.toLowerCase()) {
      return NextResponse.json({ success: false, error: "email does not match" }, { status: 400 });
    }

    const id = numericId(customer.id);
    const res = await fetch(`${domain}/admin/api/2024-10/customers/${id}.json`, {
      method: "DELETE",
      headers: { "X-Shopify-Access-Token": adminToken },
    });

    // 204 = deleted, 422 = has orders (can't delete)
    if (res.status === 422) {
      return NextResponse.json(
        { success: false, error: "accounts with orders cannot be deleted. contact us at atheles.co/contact to request removal." },
        { status: 422 },
      );
    }

    if (!res.ok && res.status !== 204) {
      return NextResponse.json({ success: false, error: "failed to delete account" }, { status: 400 });
    }

    cookieStore.set("atheles-auth-token", "", { maxAge: 0, path: "/" });
    cookieStore.set("atheles-logged-in", "", { maxAge: 0, path: "/" });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[delete-account]", err);
    return NextResponse.json({ success: false, error: "something went wrong" }, { status: 500 });
  }
}

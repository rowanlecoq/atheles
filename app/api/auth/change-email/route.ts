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

    const { newEmail } = await request.json();
    if (!newEmail || typeof newEmail !== "string" || !newEmail.includes("@")) {
      return NextResponse.json({ success: false, error: "valid email required" }, { status: 400 });
    }

    const customer = await getCustomerByToken(token);
    if (!customer?.id) {
      return NextResponse.json({ success: false, error: "customer not found" }, { status: 404 });
    }

    const id = numericId(customer.id);
    const res = await fetch(`${domain}/admin/api/2024-10/customers/${id}.json`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": adminToken,
      },
      body: JSON.stringify({ customer: { id, email: newEmail.trim().toLowerCase() } }),
    });

    const data = await res.json();
    if (!res.ok || data.errors) {
      const emailErr = data.errors?.email?.[0];
      return NextResponse.json(
        { success: false, error: emailErr || "failed to update email" },
        { status: 400 },
      );
    }

    // Email changed — clear session so they log in with new email
    cookieStore.set("atheles-auth-token", "", { maxAge: 0, path: "/" });
    cookieStore.set("atheles-logged-in", "", { maxAge: 0, path: "/" });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[change-email]", err);
    return NextResponse.json({ success: false, error: "something went wrong" }, { status: 500 });
  }
}

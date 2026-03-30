import { getCustomerByToken, updateCustomerTag } from "lib/auth/shopify-customer";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("atheles-auth-token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "not authenticated" },
        { status: 401 },
      );
    }

    const { theme } = await request.json();

    if (!theme) {
      return NextResponse.json(
        { success: false, error: "theme is required" },
        { status: 400 },
      );
    }

    const customer = await getCustomerByToken(token);
    if (!customer) {
      return NextResponse.json(
        { success: false, error: "invalid session" },
        { status: 401 },
      );
    }

    await updateCustomerTag(customer.email, "theme", theme);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "something went wrong" },
      { status: 500 },
    );
  }
}

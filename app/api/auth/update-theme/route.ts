import { getCustomerByToken, updateCustomerTag } from "lib/auth/shopify-customer";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { PROFILE_BACKGROUNDS } from "lib/profile-backgrounds";


const VALID_THEMES = PROFILE_BACKGROUNDS.map((b) => b.id);

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

    const { theme, globalTheme } = await request.json();

    if (theme !== null && !VALID_THEMES.includes(theme)) {
      return NextResponse.json(
        { success: false, error: "invalid theme" },
        { status: 400 },
      );
    }

    const customer = await getCustomerByToken(token);
    if (!customer) {
      return NextResponse.json(
        { success: false, error: "customer not found" },
        { status: 404 },
      );
    }

    // Save theme tag (use "none" as the clear value)
    await updateCustomerTag(customer.email, "theme", theme || "none").catch(() => {});

    // Save globaltheme toggle
    if (typeof globalTheme === "boolean") {
      await updateCustomerTag(
        customer.email,
        "globaltheme",
        globalTheme ? "on" : "off",
      ).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "something went wrong" },
      { status: 500 },
    );
  }
}

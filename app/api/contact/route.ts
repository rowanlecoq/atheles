import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { name, email, subject, message } = await request.json();

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { success: false, error: "all fields are required" },
        { status: 400 },
      );
    }

    const shopifyDomain = process.env.SHOPIFY_STORE_DOMAIN || "";
    const domain = shopifyDomain.startsWith("https://")
      ? shopifyDomain
      : `https://${shopifyDomain}`;

    // Post to Shopify's built-in contact form endpoint
    const formData = new URLSearchParams();
    formData.append("form_type", "contact");
    formData.append("utf8", "✓");
    formData.append("contact[name]", name);
    formData.append("contact[email]", email);
    formData.append("contact[subject]", subject);
    formData.append("contact[body]", message);

    const response = await fetch(`${domain}/contact#contact_form`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
      redirect: "manual",
    });

    // Shopify returns a 302 redirect on success
    if (response.status === 302 || response.status === 200) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: "failed to send message" },
      { status: 500 },
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "something went wrong" },
      { status: 500 },
    );
  }
}

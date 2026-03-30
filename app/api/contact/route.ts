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

    // Send via Web3Forms (free, no signup — just needs access key)
    const accessKey = process.env.WEB3FORMS_KEY;

    if (!accessKey) {
      console.error("[contact] WEB3FORMS_KEY not set");
      return NextResponse.json(
        { success: false, error: "contact form not configured" },
        { status: 500 },
      );
    }

    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_key: accessKey,
        from_name: "Atheles Contact Form",
        subject: `[Atheles] ${subject} — from ${name}`,
        name,
        email,
        message,
      }),
    });

    const data = await response.json();

    if (data.success) {
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

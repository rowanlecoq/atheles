import { setAuthCookie } from "lib/auth/set-auth-cookie";
import { authenticateCustomer } from "lib/auth/shopify-customer";
import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

async function sendWelcomeEmail(toEmail: string, firstName: string) {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  if (!gmailUser || !gmailPass) return;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailUser, pass: gmailPass },
  });

  await transporter.sendMail({
    from: `"Atheles" <${gmailUser}>`,
    to: toEmail,
    subject: "welcome to atheles.",
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome | Atheles</title>
</head>
<body style="margin:0;padding:0;background-color:#1a1a1a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1a1a1a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td align="center" style="padding:30px 0 20px;">
              <h1 style="margin:0;font-size:28px;letter-spacing:8px;color:#ccb173;font-weight:300;text-transform:uppercase;">ATHELES</h1>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:30px;">
              <div style="width:60px;height:1px;background-color:#7f6f4c;"></div>
            </td>
          </tr>
          <tr>
            <td style="background-color:#222222;border:1px solid #3a3428;border-radius:8px;padding:40px 30px;">
              <h2 style="margin:0 0 8px;font-size:22px;color:#ccb173;font-weight:400;letter-spacing:2px;text-transform:lowercase;">welcome to the club.</h2>
              <p style="margin:0 0 24px;font-size:14px;color:#999;line-height:1.6;">
                ${firstName}, your account is all set. welcome to atheles. get ready to unlock your fullest potential.
              </p>
              <p style="margin:0 0 8px;font-size:12px;color:#7f6f4c;letter-spacing:2px;text-transform:uppercase;">what's next:</p>
              <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr><td style="padding:6px 0;font-size:13px;color:#999;">&#x1F531; set up your profile and avatar</td></tr>
                <tr><td style="padding:6px 0;font-size:13px;color:#999;">&#x1F531; earn loyalty points with every purchase</td></tr>
                <tr><td style="padding:6px 0;font-size:13px;color:#999;">&#x1F531; unlock exclusive perks as you level up</td></tr>
              </table>
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td align="center" style="background-color:#ccb173;border-radius:50px;padding:14px 40px;">
                    <a href="https://atheles.co/profile" style="color:#1a1a1a;text-decoration:none;font-size:13px;font-weight:600;letter-spacing:3px;text-transform:uppercase;">View Profile</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:30px 0 10px;">
              <p style="margin:0;font-size:11px;letter-spacing:4px;color:#7f6f4c;text-transform:uppercase;">authentic superiority.</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:10px 0;">
              <a href="https://atheles.co" style="color:#666;font-size:11px;text-decoration:none;">atheles.co</a>
              <span style="color:#444;margin:0 8px;">|</span>
              <a href="https://www.instagram.com/atheles.co/" style="color:#666;font-size:11px;text-decoration:none;">@atheles.co</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  });
}

const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || "";
const rawDomain = process.env.SHOPIFY_STORE_DOMAIN || "";
const domain = rawDomain
  ? rawDomain.startsWith("https://") ? rawDomain : `https://${rawDomain}`
  : "";

async function adminRestFetch(path: string, method: string, body?: object) {
  return fetch(`${domain}/admin/api/2024-10${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": adminToken,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

function buildDobTags(existingTags: string, dob: string | undefined): string | undefined {
  if (!dob) return undefined;
  const tags = existingTags ? existingTags.split(", ").filter((t) => !t.startsWith("dob:")) : [];
  tags.push(`dob:${dob}`);
  return tags.join(", ");
}

// Upgrade a newsletter-only account and return the numeric Shopify customer ID.
async function upgradeNewsletterAccount(
  email: string,
  password: string,
  firstName: string,
  lastName: string | undefined,
  dob: string | undefined,
  acceptsMarketing: boolean,
): Promise<{ success: boolean; numericId?: number }> {
  const searchRes = await adminRestFetch(
    `/customers/search.json?query=email:${encodeURIComponent(email)}&limit=1`,
    "GET",
  );
  if (!searchRes.ok) return { success: false };

  const searchData = await searchRes.json();
  const customer = searchData.customers?.[0];
  if (!customer) return { success: false };

  const updateBody: Record<string, unknown> = {
    id: customer.id,
    first_name: firstName,
    password,
    password_confirmation: password,
    verified_email: true,
    accepts_marketing: acceptsMarketing,
  };
  if (lastName) updateBody.last_name = lastName;
  const dobTags = buildDobTags(customer.tags ?? "", dob);
  if (dobTags !== undefined) updateBody.tags = dobTags;

  const updateRes = await adminRestFetch(`/customers/${customer.id}.json`, "PUT", {
    customer: updateBody,
  });

  return { success: updateRes.ok, numericId: customer.id };
}

// Build the session user object from form data — avoids an extra Shopify fetch.
function buildUserFromForm(
  numericId: number,
  email: string,
  firstName: string,
  lastName: string | undefined,
  dob: string | undefined,
  acceptsMarketing: boolean,
) {
  return {
    id: `gid://shopify/Customer/${numericId}`,
    email,
    firstName,
    lastName: lastName || null,
    name: [firstName, lastName].filter(Boolean).join(" "),
    phone: null,
    acceptsMarketing,
    createdAt: new Date().toISOString(),
    numberOfOrders: 0,
    totalSpent: "0.00",
    dob: dob || null,
    theme: null,
  };
}

export async function POST(request: Request) {
  let email = "";
  try {
    const { email: _email, password, firstName, lastName, dob, acceptsMarketing } =
      await request.json();
    email = _email ?? "";

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "email and password are required" },
        { status: 400 },
      );
    }
    if (!firstName?.trim()) {
      return NextResponse.json(
        { success: false, error: "first name is required" },
        { status: 400 },
      );
    }
    if (password.length < 5) {
      return NextResponse.json(
        { success: false, error: "password must be at least 5 characters" },
        { status: 400 },
      );
    }

    const first = firstName.trim();
    const last = lastName?.trim() || undefined;
    const marketing = acceptsMarketing ?? false;

    const customerBody: Record<string, unknown> = {
      email,
      first_name: first,
      password,
      password_confirmation: password,
      accepts_marketing: marketing,
      verified_email: true,
      send_email_invite: false,
      send_email_welcome: false,
    };
    if (last) customerBody.last_name = last;
    if (dob) customerBody.tags = `dob:${dob}`;

    const createRes = await adminRestFetch("/customers.json", "POST", {
      customer: customerBody,
    });

    if (createRes.ok) {
      const createData = await createRes.json();
      const numericId = createData.customer?.id;

      const [tokenResult] = await Promise.all([
        authenticateCustomer(email, password),
        sendWelcomeEmail(email, first).catch(() => {}),
      ]);

      if (tokenResult) {
        await setAuthCookie(tokenResult.accessToken, tokenResult.expiresAt);
        const user = numericId
          ? buildUserFromForm(numericId, email, first, last, dob, marketing)
          : null;
        return NextResponse.json({ success: true, user });
      }
      return NextResponse.json({ success: true, user: null });
    }

    const createData = await createRes.json();
    const emailErrors: string[] = createData.errors?.email ?? [];
    const alreadyExists = emailErrors.some((e) =>
      e.toLowerCase().includes("taken") || e.toLowerCase().includes("already"),
    );

    if (alreadyExists) {
      const upgraded = await upgradeNewsletterAccount(
        email, password, first, last, dob, marketing,
      );

      if (!upgraded.success) {
        return NextResponse.json(
          {
            success: false,
            alreadyExists: true,
            error:
              "looks like you already have an account. use the forgot password link below to sign in.",
          },
          { status: 400 },
        );
      }

      const tokenResult = await authenticateCustomer(email, password);
      if (tokenResult) {
        await setAuthCookie(tokenResult.accessToken, tokenResult.expiresAt);
        const user = upgraded.numericId
          ? buildUserFromForm(upgraded.numericId, email, first, last, dob, marketing)
          : null;
        return NextResponse.json({ success: true, user, wasNewsletterSubscriber: true });
      }

      return NextResponse.json({ success: true, user: null, wasNewsletterSubscriber: true });
    }

    return NextResponse.json(
      { success: false, error: "something went wrong. please try again." },
      { status: 400 },
    );
  } catch (err) {
    console.error("[register] Error:", err);
    return NextResponse.json(
      { success: false, error: "something went wrong. please try again." },
      { status: 500 },
    );
  }
}

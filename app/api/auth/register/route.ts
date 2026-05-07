import { setAuthCookie } from "lib/auth/set-auth-cookie";
import {
  authenticateCustomer,
  getCustomerByToken,
} from "lib/auth/shopify-customer";
import { NextResponse } from "next/server";

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

// Upgrade a newsletter-only account: set name, password, DOB silently via Admin API.
async function upgradeNewsletterAccount(
  email: string,
  password: string,
  firstName: string,
  lastName: string | undefined,
  dob: string | undefined,
  acceptsMarketing: boolean,
): Promise<{ success: boolean }> {
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

  return { success: updateRes.ok };
}

async function buildUserPayload(accessToken: string, email: string) {
  const customer = await getCustomerByToken(accessToken);
  await setAuthCookie(accessToken, new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString());
  return customer
    ? {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        name: customer.displayName || customer.firstName || email.split("@")[0],
        phone: customer.phone,
        acceptsMarketing: customer.acceptsMarketing,
        createdAt: customer.createdAt,
        numberOfOrders: customer.numberOfOrders,
        totalSpent: customer.totalSpent,
        dob: customer.dob,
        theme: customer.theme,
      }
    : null;
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

    // Create via Admin REST so we can set verified_email: true and suppress all emails.
    const customerBody: Record<string, unknown> = {
      email,
      first_name: firstName.trim(),
      password,
      password_confirmation: password,
      accepts_marketing: acceptsMarketing ?? false,
      verified_email: true,
      send_email_invite: false,
      send_email_welcome: false,
    };
    if (lastName?.trim()) customerBody.last_name = lastName.trim();
    if (dob) customerBody.tags = `dob:${dob}`;

    const createRes = await adminRestFetch("/customers.json", "POST", {
      customer: customerBody,
    });

    if (createRes.ok) {
      // New account created — log them in immediately, no emails sent.
      const tokenResult = await authenticateCustomer(email, password);
      if (tokenResult) {
        const user = await buildUserPayload(tokenResult.accessToken, email);
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
      // Email is from a newsletter signup — silently upgrade the account.
      const upgraded = await upgradeNewsletterAccount(
        email,
        password,
        firstName.trim(),
        lastName?.trim() || undefined,
        dob,
        acceptsMarketing ?? false,
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
        const user = await buildUserPayload(tokenResult.accessToken, email);
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

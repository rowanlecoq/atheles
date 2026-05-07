import { setAuthCookie } from "lib/auth/set-auth-cookie";
import { authenticateCustomer } from "lib/auth/shopify-customer";
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
      send_email_welcome: true,
    };
    if (last) customerBody.last_name = last;
    if (dob) customerBody.tags = `dob:${dob}`;

    const createRes = await adminRestFetch("/customers.json", "POST", {
      customer: customerBody,
    });

    if (createRes.ok) {
      const createData = await createRes.json();
      const numericId = createData.customer?.id;

      // Authenticate and set cookie in parallel with building the user object
      const tokenResult = await authenticateCustomer(email, password);
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

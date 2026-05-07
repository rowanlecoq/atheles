import { setAuthCookie } from "lib/auth/set-auth-cookie";
import {
  createCustomerAccount,
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

// When a newsletter subscriber registers, we update their Shopify account
// directly via the Admin API (no email sent) and log them in immediately.
async function upgradeNewsletterAccount(
  email: string,
  password: string,
  firstName: string,
  lastName: string | undefined,
  dob: string | undefined,
  acceptsMarketing: boolean,
): Promise<{ success: boolean; customerId?: string }> {
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
    accepts_marketing: acceptsMarketing,
  };
  if (lastName) updateBody.last_name = lastName;
  if (dob) updateBody.tags = [
    ...(customer.tags ? customer.tags.split(", ").filter((t: string) => !t.startsWith("dob:")) : []),
    `dob:${dob}`,
  ].join(", ");

  const updateRes = await adminRestFetch(`/customers/${customer.id}.json`, "PUT", {
    customer: updateBody,
  });

  return { success: updateRes.ok, customerId: customer.id };
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

    const result = await createCustomerAccount(
      email,
      password,
      firstName.trim(),
      lastName?.trim() || undefined,
      acceptsMarketing,
      dob,
    );

    if (!result.success) {
      const err = result.error || "";
      if (err.toLowerCase().includes("taken") || err.toLowerCase().includes("already")) {
        // Email already exists (likely from newsletter) — upgrade the account
        // via Admin API so no email or Shop redirect is triggered.
        const upgraded = await upgradeNewsletterAccount(
          email,
          password,
          firstName.trim(),
          lastName?.trim() || undefined,
          dob,
          acceptsMarketing,
        );

        if (!upgraded.success) {
          return NextResponse.json(
            {
              success: false,
              alreadyExists: true,
              error:
                "looks like you're already on our list! use the forgot password link below to set your password and complete your account.",
            },
            { status: 400 },
          );
        }

        // Log them in with their new password
        const tokenResult = await authenticateCustomer(email, password);
        if (tokenResult) {
          const customer = await getCustomerByToken(tokenResult.accessToken);
          await setAuthCookie(tokenResult.accessToken, tokenResult.expiresAt);
          return NextResponse.json({
            success: true,
            user: customer
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
              : null,
          });
        }

        return NextResponse.json({ success: true, user: null });
      }

      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 },
      );
    }

    const tokenResult = await authenticateCustomer(email, password);
    if (tokenResult) {
      const customer = await getCustomerByToken(tokenResult.accessToken);
      await setAuthCookie(tokenResult.accessToken, tokenResult.expiresAt);
      return NextResponse.json({
        success: true,
        user: customer
          ? {
              id: customer.id,
              email: customer.email,
              firstName: customer.firstName,
              lastName: customer.lastName,
              name:
                customer.displayName ||
                customer.firstName ||
                email.split("@")[0],
              phone: customer.phone,
              acceptsMarketing: customer.acceptsMarketing,
              createdAt: customer.createdAt,
              numberOfOrders: customer.numberOfOrders,
              totalSpent: customer.totalSpent,
              dob: customer.dob,
              theme: customer.theme,
            }
          : null,
      });
    }

    return NextResponse.json({
      success: true,
      user: null,
      verificationRequired: true,
      message:
        "account created. please check your email to activate your account.",
    });
  } catch (err) {
    console.error("[register] Error:", err);
    return NextResponse.json(
      { success: false, error: "something went wrong. please try again." },
      { status: 500 },
    );
  }
}

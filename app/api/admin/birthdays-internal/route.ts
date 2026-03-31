import { getCustomerByToken } from "lib/auth/shopify-customer";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || "";
const domain = process.env.SHOPIFY_STORE_DOMAIN
  ? process.env.SHOPIFY_STORE_DOMAIN.startsWith("https://")
    ? process.env.SHOPIFY_STORE_DOMAIN
    : `https://${process.env.SHOPIFY_STORE_DOMAIN}`
  : "";
const adminEndpoint = domain ? `${domain}/admin/api/2024-10/graphql.json` : "";

const BIRTHDAY_TIERS = new Set(["platinum", "champion", "athlete"]);

async function adminFetch(query: string, variables: Record<string, unknown> = {}) {
  const res = await fetch(adminEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": adminToken,
    },
    body: JSON.stringify({ query, variables }),
  });
  return res.json();
}

export async function GET() {
  try {
    // Verify admin via session
    const cookieStore = await cookies();
    const token = cookieStore.get("atheles-auth-token")?.value;
    if (!token) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const customer = await getCustomerByToken(token);
    if (!customer || !customer.isAdmin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // Fetch all customers
    const data = await adminFetch(`
      query {
        customers(first: 100) {
          edges {
            node {
              email
              firstName
              lastName
              tags
            }
          }
        }
      }
    `);

    const customers = data.data?.customers?.edges?.map(
      (e: { node: Record<string, unknown> }) => e.node,
    ) || [];

    const today = new Date();
    const currentYear = today.getFullYear();
    const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

    const birthdayMembers = customers
      .map((c: { email: string; firstName: string; lastName: string; tags: string[] }) => {
        const tierTag = c.tags?.find((t: string) => t.startsWith("tier:"));
        const tier = tierTag ? tierTag.replace("tier:", "") : null;
        const dobTag = c.tags?.find((t: string) => t.startsWith("dob:"));
        const dob = dobTag ? dobTag.replace("dob:", "") : null;

        if (!tier || !BIRTHDAY_TIERS.has(tier)) return null;

        const name = `${c.firstName || ""} ${c.lastName || ""}`.trim() || c.email;

        if (!dob) {
          return { name, email: c.email, tier, dob: null, birthday: null, daysUntil: null, turningAge: null, missing: true };
        }

        const [yearStr, monthStr, dayStr] = dob.split("-");
        const birthYear = parseInt(yearStr || "0");
        const birthMonth = parseInt(monthStr || "0");
        const birthDay = parseInt(dayStr || "0");

        let nextBirthday = new Date(currentYear, birthMonth - 1, birthDay);
        if (nextBirthday < today) {
          nextBirthday = new Date(currentYear + 1, birthMonth - 1, birthDay);
        }
        const daysUntil = Math.ceil((nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const turningAge = nextBirthday.getFullYear() - birthYear;

        return {
          name,
          email: c.email,
          tier,
          dob,
          birthday: `${monthNames[birthMonth - 1]} ${birthDay}`,
          daysUntil,
          turningAge,
          missing: false,
        };
      })
      .filter(Boolean)
      .sort((a: { daysUntil: number | null }, b: { daysUntil: number | null }) => {
        if (a.daysUntil === null) return 1;
        if (b.daysUntil === null) return -1;
        return a.daysUntil - b.daysUntil;
      });

    const upcoming = birthdayMembers.filter(
      (m: { daysUntil: number | null }) => m.daysUntil !== null && m.daysUntil <= 30,
    );

    return NextResponse.json({
      total: birthdayMembers.length,
      upcoming: upcoming.length,
      upcomingIn30Days: upcoming,
      allBirthdayMembers: birthdayMembers,
    });
  } catch {
    return NextResponse.json({ error: "something went wrong" }, { status: 500 });
  }
}

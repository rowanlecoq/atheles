import { NextResponse } from "next/server";


const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || "";
const domain = process.env.SHOPIFY_STORE_DOMAIN
  ? process.env.SHOPIFY_STORE_DOMAIN.startsWith("https://")
    ? process.env.SHOPIFY_STORE_DOMAIN
    : `https://${process.env.SHOPIFY_STORE_DOMAIN}`
  : "";
const adminEndpoint = domain ? `${domain}/admin/api/2025-04/graphql.json` : "";

// Tiers that have birthday rewards perk
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
  if (!res.ok) throw new Error(`Admin API ${res.status}`);
  return res.json();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let data: Awaited<ReturnType<typeof adminFetch>>;
  try {
    data = await adminFetch(`
      query {
        customers(first: 100) {
          edges {
            node {
              email
              firstName
              lastName
              tags
              orders(first: 1) {
                edges { node { totalPriceSet { shopMoney { amount } } } }
              }
            }
          }
        }
      }
    `);
  } catch (err) {
    console.error("[admin/birthdays] Error:", err);
    return NextResponse.json({ error: "failed to fetch customers" }, { status: 500 });
  }

  const customers = data.data?.customers?.edges?.map((e: { node: Record<string, unknown> }) => e.node) || [];
  const today = new Date();
  const currentYear = today.getFullYear();

  const birthdayMembers = customers
    .map((c: { email: string; firstName: string; lastName: string; tags: string[]; orders: { edges: { node: { totalPriceSet: { shopMoney: { amount: string } } } }[] } }) => {
      const tierTag = c.tags?.find((t: string) => t.startsWith("tier:"));
      const tier = tierTag ? tierTag.replace("tier:", "") : null;
      const dobTag = c.tags?.find((t: string) => t.startsWith("dob:"));
      const dob = dobTag ? dobTag.replace("dob:", "") : null;

      if (!tier || !BIRTHDAY_TIERS.has(tier)) return null;

      const name = `${c.firstName || ""} ${c.lastName || ""}`.trim() || c.email;

      if (!dob) {
        return { name, email: c.email, tier, dob: null, birthday: null, daysUntil: null, age: null, missing: true };
      }

      const [yearStr, monthStr, dayStr] = dob.split("-");
      const birthYear = parseInt(yearStr || "0");
      const birthMonth = parseInt(monthStr || "0");
      const birthDay = parseInt(dayStr || "0");

      // Next birthday
      let nextBirthday = new Date(currentYear, birthMonth - 1, birthDay);
      if (nextBirthday < today) {
        nextBirthday = new Date(currentYear + 1, birthMonth - 1, birthDay);
      }
      const daysUntil = Math.ceil((nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const turningAge = nextBirthday.getFullYear() - birthYear;

      const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

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

  // Upcoming in next 30 days
  const upcoming = birthdayMembers.filter((m: { daysUntil: number | null }) => m.daysUntil !== null && m.daysUntil <= 30);

  return NextResponse.json({
    total: birthdayMembers.length,
    upcoming: upcoming.length,
    upcomingIn30Days: upcoming,
    allBirthdayMembers: birthdayMembers,
  });
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCustomerByToken } from "lib/auth/shopify-customer";
import { adminFetch, readMetafield, writeMetafield } from "lib/admin/utils";
import { nameToSlug, computeAge, type AthleteData } from "lib/athletes";

async function getAthleteDobFromEmail(email: string): Promise<string | null> {
  try {
    const data = await adminFetch(
      `query($email: String!) {
        customers(first: 1, query: $email) {
          edges { node { tags } }
        }
      }`,
      { email: `email:${email}` },
    );
    const tags: string[] = data.data?.customers?.edges?.[0]?.node?.tags ?? [];
    const dobTag = tags.find((t: string) => t.startsWith("dob:"));
    return dobTag ? dobTag.slice(4) : null;
  } catch {
    return null;
  }
}

async function getCurrentCustomer() {
  const cookieStore = await cookies();
  const token = cookieStore.get("atheles-auth-token")?.value;
  if (!token) return null;
  return getCustomerByToken(token);
}

export async function GET() {
  const customer = await getCurrentCustomer();
  if (!customer) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const raw = await readMetafield("athletes");
  const athletes: AthleteData[] = Array.isArray(raw) ? raw : [];
  const email = customer.email?.toLowerCase();

  // Match by linked email first, then fall back to name slug for athlete-tier accounts
  const athlete = athletes.find((a) => {
    if (email && a.linkedEmail?.toLowerCase() === email) return true;
    if (customer.isAthlete && email) {
      return nameToSlug(a.name) === nameToSlug(customer.firstName || customer.displayName || "");
    }
    return false;
  });

  return NextResponse.json({ athlete: athlete ?? null });
}

export async function PATCH(request: Request) {
  const customer = await getCurrentCustomer();
  if (!customer) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const email = customer.email?.toLowerCase();

  // Must be athlete tier OR have a linked email matching an athlete profile
  const raw0 = await readMetafield("athletes");
  const athletes0: AthleteData[] = Array.isArray(raw0) ? raw0 : [];
  const isLinked = email && athletes0.some((a) => a.linkedEmail?.toLowerCase() === email);
  if (!customer.isAthlete && !isLinked) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { description, image, images, socials, hobbies } = body;

  const athletes: AthleteData[] = athletes0;
  const idx = athletes.findIndex((a) => {
    if (email && a.linkedEmail?.toLowerCase() === email) return true;
    if (customer.isAthlete && email) {
      return nameToSlug(a.name) === nameToSlug(customer.firstName || customer.displayName || "");
    }
    return false;
  });

  if (idx === -1) {
    return NextResponse.json({ error: "athlete profile not found" }, { status: 404 });
  }

  const existing = athletes[idx]!;

  // If linkedEmail is set, refresh age from DOB
  let age = existing.age;
  if (existing.linkedEmail) {
    const dob = await getAthleteDobFromEmail(existing.linkedEmail);
    if (dob) age = computeAge(dob);
  }

  athletes[idx] = {
    ...existing,
    age,
    ...(description !== undefined && { description }),
    ...(image !== undefined && { image }),
    ...(images !== undefined && { images }),
    ...(socials !== undefined && { socials }),
    ...(hobbies !== undefined && { hobbies }),
  };

  const err = await writeMetafield("athletes", athletes);
  if (err) return NextResponse.json({ error: err }, { status: 500 });

  return NextResponse.json({ success: true, athlete: athletes[idx] });
}

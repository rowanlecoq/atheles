import { NextResponse } from "next/server";
import { adminFetch, readMetafield, verifyAdmin, writeMetafield } from "lib/admin/utils";
import { nameToSlug, computeAge } from "lib/athletes";

const DEFAULT_ATHLETES = [
  {
    name: "rowan le coq",
    age: 18,
    role: "founder & athlete",
    description: "",
    image: null,
    images: [],
    socials: [
      { platform: "tiktok", url: "https://www.tiktok.com/@rowanlecoq" },
      { platform: "instagram", url: "https://www.instagram.com/rowanlecoq" },
      { platform: "linkedin", url: "https://www.linkedin.com/in/rowanlecoq" },
      { platform: "youtube", url: "https://www.youtube.com/@rowanlecoq" },
    ],
    hobbies: [
      "baking brownies or chocolate chip banana bread",
      "working out on the daily",
      "playing hockey",
    ],
  },
];

const CACHE_HEADERS = { "Cache-Control": "s-maxage=60, stale-while-revalidate=300" };

async function getCustomerDob(email: string): Promise<string | null> {
  try {
    const data = await adminFetch(
      `query($q: String!) { customers(first: 1, query: $q) { edges { node { tags } } } }`,
      { q: `email:${email}` },
    );
    const tags: string[] = data.data?.customers?.edges?.[0]?.node?.tags ?? [];
    const dobTag = tags.find((t: string) => t.startsWith("dob:"));
    return dobTag ? dobTag.slice(4) : null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const emailQuery = searchParams.get("email");

  // Admin customer email lookup
  if (emailQuery) {
    if (!(await verifyAdmin())) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    try {
      const data = await adminFetch(
        `query($q: String!) {
          customers(first: 5, query: $q) {
            edges { node { id email firstName lastName tags } }
          }
        }`,
        { q: `email:${emailQuery}` },
      );
      const customers = (data.data?.customers?.edges ?? []).map(
        (e: { node: { email: string; firstName: string; lastName: string; tags: string[] } }) => {
          const tags: string[] = e.node.tags ?? [];
          const dobTag = tags.find((t) => t.startsWith("dob:"));
          const dob = dobTag ? dobTag.slice(4) : null;
          return {
            email: e.node.email,
            firstName: e.node.firstName,
            lastName: e.node.lastName,
            dob,
            age: dob ? computeAge(dob) : null,
          };
        },
      );
      return NextResponse.json({ customers });
    } catch {
      return NextResponse.json({ customers: [] });
    }
  }

  try {
    const raw = await readMetafield("athletes");
    if (Array.isArray(raw)) {
      // Ensure all athletes have a slug; refresh age for linked athletes
      const enriched = await Promise.all(
        (raw as Array<Record<string, unknown>>).map(async (a) => {
          const name = String(a.name || "");
          const slug = (a.slug as string) || nameToSlug(name);
          let age = Number(a.age) || 0;
          const linkedEmail = a.linkedEmail as string | undefined;
          if (linkedEmail) {
            const dob = await getCustomerDob(linkedEmail);
            if (dob) age = computeAge(dob);
          }
          return { ...a, slug, age };
        }),
      );
      return NextResponse.json({ athletes: enriched }, { headers: CACHE_HEADERS });
    }
    return NextResponse.json({ athletes: DEFAULT_ATHLETES }, { headers: CACHE_HEADERS });
  } catch {
    return NextResponse.json({ athletes: DEFAULT_ATHLETES }, { headers: CACHE_HEADERS });
  }
}

export async function POST(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { athletes } = await request.json();
  if (!Array.isArray(athletes)) {
    return NextResponse.json({ error: "athletes must be an array" }, { status: 400 });
  }

  // Ensure each athlete has a slug; refresh age from linked customer
  const enriched = await Promise.all(
    (athletes as Array<Record<string, unknown>>).map(async (a) => {
      const name = String(a.name || "");
      const slug = (a.slug as string) || nameToSlug(name);
      let age = Number(a.age) || 0;
      const linkedEmail = a.linkedEmail as string | undefined;
      if (linkedEmail) {
        const dob = await getCustomerDob(linkedEmail);
        if (dob) age = computeAge(dob);
      }
      return { ...a, slug, age };
    }),
  );

  const err = await writeMetafield("athletes", enriched);
  if (err) return NextResponse.json({ error: err }, { status: 500 });

  return NextResponse.json({ success: true, count: enriched.length });
}

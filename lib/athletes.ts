export type AthleteData = {
  name: string;
  age: number;
  role: string;
  description?: string;
  image: string | null;
  images?: string[];
  socials: { platform: string; url: string }[] | Record<string, string>;
  hobbies: string[];
};

const DEFAULT_ATHLETES: AthleteData[] = [
  {
    name: "rowan le coq",
    age: 18,
    role: "founder & athlete",
    image: null,
    socials: {
      tiktok: "https://www.tiktok.com/@rowanlecoq",
      instagram: "https://www.instagram.com/rowanlecoq",
      linkedin: "https://www.linkedin.com/in/rowanlecoq",
      youtube: "https://www.youtube.com/@rowanlecoq",
    },
    hobbies: [
      "baking brownies or chocolate chip banana bread",
      "working out on the daily",
      "playing hockey",
    ],
  },
];

export function normalizeSocials(
  socials: { platform: string; url: string }[] | Record<string, string>,
): { platform: string; url: string }[] {
  if (Array.isArray(socials)) return socials.filter((s) => s.url);
  return Object.entries(socials)
    .filter(([, v]) => v)
    .map(([k, v]) => ({ platform: k, url: v }));
}

export async function getAthletes(): Promise<AthleteData[]> {
  const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || "";
  const rawDomain = process.env.SHOPIFY_STORE_DOMAIN || "";
  const domain = rawDomain
    ? rawDomain.startsWith("https://")
      ? rawDomain
      : `https://${rawDomain}`
    : "";
  const adminEndpoint = domain ? `${domain}/admin/api/2025-04/graphql.json` : "";

  if (!adminToken || !adminEndpoint) return DEFAULT_ATHLETES;

  try {
    const res = await fetch(adminEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": adminToken,
      },
      body: JSON.stringify({
        query: `query { shop { metafield(namespace: "atheles", key: "athletes") { value } } }`,
      }),
      next: { revalidate: 60 },
    });
    if (!res.ok) return DEFAULT_ATHLETES;
    const data = await res.json();
    const raw = data.data?.shop?.metafield?.value;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    return DEFAULT_ATHLETES;
  } catch {
    return DEFAULT_ATHLETES;
  }
}

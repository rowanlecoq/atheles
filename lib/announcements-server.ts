import { unstable_cache } from "next/cache";

const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || "";
const domain = process.env.SHOPIFY_STORE_DOMAIN
  ? process.env.SHOPIFY_STORE_DOMAIN.startsWith("https://")
    ? process.env.SHOPIFY_STORE_DOMAIN
    : `https://${process.env.SHOPIFY_STORE_DOMAIN}`
  : "";
const adminEndpoint = domain ? `${domain}/admin/api/2025-04/graphql.json` : "";

const DEFAULT_ANNOUNCEMENTS = [
  "to ascend.",
  "coming soon. this summer.",
  "authentic superiority.",
  "follow us at @atheles.co to share your aesthetic.",
];

async function fetchAnnouncementsData(): Promise<string[]> {
  try {
    if (!adminEndpoint) return DEFAULT_ANNOUNCEMENTS;
    const res = await fetch(adminEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": adminToken },
      body: JSON.stringify({
        query: `query { shop { metafield(namespace: "atheles", key: "announcements") { value } } }`,
      }),
      next: { revalidate: 300, tags: ["announcements"] },
    });
    const data = await res.json();
    const raw = data.data?.shop?.metafield?.value;
    if (!raw) return DEFAULT_ANNOUNCEMENTS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_ANNOUNCEMENTS;
  } catch {
    return DEFAULT_ANNOUNCEMENTS;
  }
}

export const getAnnouncementsData = unstable_cache(
  fetchAnnouncementsData,
  ["announcements"],
  { revalidate: 300, tags: ["announcements"] },
);

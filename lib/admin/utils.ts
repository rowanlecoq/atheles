import { getCustomerByToken } from "lib/auth/shopify-customer";
import { cookies } from "next/headers";

const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || "";
const rawDomain = process.env.SHOPIFY_STORE_DOMAIN || "";
const domain = rawDomain
  ? rawDomain.startsWith("https://") ? rawDomain : `https://${rawDomain}`
  : "";
export const ADMIN_ENDPOINT = domain ? `${domain}/admin/api/2025-04/graphql.json` : "";

export async function adminFetch(
  query: string,
  variables: Record<string, unknown> = {},
) {
  if (!ADMIN_ENDPOINT) throw new Error("Shopify admin not configured");
  const res = await fetch(ADMIN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": adminToken,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`Shopify Admin API ${res.status}`);
  return res.json();
}

export async function verifyAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get("atheles-auth-token")?.value;
  if (!token) return false;
  const customer = await getCustomerByToken(token);
  return customer?.isAdmin ?? false;
}

export async function getShopId(): Promise<string | null> {
  const data = await adminFetch("query { shop { id } }");
  return data.data?.shop?.id ?? null;
}

export async function readMetafield(key: string): Promise<unknown> {
  const data = await adminFetch(
    `query { shop { metafield(namespace: "atheles", key: "${key}") { value } } }`,
  );
  const raw = data.data?.shop?.metafield?.value;
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export async function writeMetafield(key: string, value: unknown): Promise<string | null> {
  const shopId = await getShopId();
  if (!shopId) return "could not fetch shop ID";
  const result = await adminFetch(
    `mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields { key }
        userErrors { message }
      }
    }`,
    {
      metafields: [{
        ownerId: shopId,
        namespace: "atheles",
        key,
        type: "json",
        value: JSON.stringify(value),
      }],
    },
  );
  const errors = result.data?.metafieldsSet?.userErrors as { message: string }[] | undefined;
  if (errors?.length) return errors.map((e) => e.message).join(", ");
  return null;
}

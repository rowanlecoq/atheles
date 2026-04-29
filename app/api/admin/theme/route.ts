import { getCustomerByToken } from "lib/auth/shopify-customer";
import { put } from "@vercel/blob";
import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";


const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || "";
const domain = process.env.SHOPIFY_STORE_DOMAIN
  ? process.env.SHOPIFY_STORE_DOMAIN.startsWith("https://")
    ? process.env.SHOPIFY_STORE_DOMAIN
    : `https://${process.env.SHOPIFY_STORE_DOMAIN}`
  : "";
const adminEndpoint = domain ? `${domain}/admin/api/2024-10/graphql.json` : "";

async function adminFetch(query: string, variables: Record<string, unknown> = {}) {
  const res = await fetch(adminEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": adminToken },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`Admin API ${res.status}`);
  return res.json();
}

async function verifyAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("atheles-auth-token")?.value;
  if (!token) return false;
  const customer = await getCustomerByToken(token);
  return customer?.isAdmin ?? false;
}

export type SiteTheme = {
  // Brand colors
  brandGold: string;
  brandDarkGold: string;
  brandDark: string;
  // Text accent (gradient or solid)
  headingStyle: "solid" | "gradient";
  headingColor: string;
  headingGradientFrom: string;
  headingGradientTo: string;
  // Logo images
  logoDefault: string | null;
  logoHover: string | null;
  logoSmall: string | null; // mobile/footer
};

const DEFAULT_THEME: SiteTheme = {
  brandGold: "#ccb173",
  brandDarkGold: "#7f6f4c",
  brandDark: "#1a1a1a",
  headingStyle: "solid",
  headingColor: "#ccb173",
  headingGradientFrom: "#ccb173",
  headingGradientTo: "#e5c685",
  logoDefault: null,
  logoHover: null,
  logoSmall: null,
};

export async function GET() {
  try {
    const data = await adminFetch(`
      query { shop { metafield(namespace: "atheles", key: "site_theme") { value } } }
    `);
    const raw = data.data?.shop?.metafield?.value;
    if (raw) {
      try {
        return NextResponse.json({ theme: { ...DEFAULT_THEME, ...JSON.parse(raw) } });
      } catch {}
    }
    return NextResponse.json({ theme: DEFAULT_THEME });
  } catch {
    return NextResponse.json({ theme: DEFAULT_THEME });
  }
}

export async function POST(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { theme, logoFile, logoType } = await request.json();

    // Handle logo upload if present
    if (logoFile && logoType) {
      const matches = logoFile.match(/^data:(.+);base64,(.+)$/);
      if (matches && process.env.BLOB_READ_WRITE_TOKEN) {
        const contentType = matches[1] as string;
        const buffer = Buffer.from(matches[2] as string, "base64");
        if (buffer.byteLength <= 5 * 1024 * 1024) {
          const ext = contentType.split("/")[1] || "png";
          const filename = `site-theme/logo-${logoType}-${Date.now()}.${ext}`;
          const blob = await put(filename, buffer, { access: "public", contentType, addRandomSuffix: false });

          // Get current theme, update logo
          const currentData = await adminFetch(`
            query { shop { metafield(namespace: "atheles", key: "site_theme") { value } } }
          `);
          const current = currentData.data?.shop?.metafield?.value
            ? { ...DEFAULT_THEME, ...JSON.parse(currentData.data.shop.metafield.value) }
            : { ...DEFAULT_THEME };

          if (logoType === "default") current.logoDefault = blob.url;
          else if (logoType === "hover") current.logoHover = blob.url;
          else if (logoType === "small") current.logoSmall = blob.url;

          const shopData = await adminFetch(`query { shop { id } }`);
          const shopId = shopData.data?.shop?.id;
          if (shopId) {
            await adminFetch(`
              mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
                metafieldsSet(metafields: $metafields) { metafields { key } userErrors { message } }
              }
            `, { metafields: [{ ownerId: shopId, namespace: "atheles", key: "site_theme", type: "json", value: JSON.stringify(current) }] });
          }

          try { revalidateTag("site-theme", "seconds"); } catch {}
          return NextResponse.json({ success: true, theme: current });
        }
      }
      return NextResponse.json({ error: "logo upload failed" }, { status: 400 });
    }

    // Save theme settings
    if (theme) {
      const shopData = await adminFetch(`query { shop { id } }`);
      const shopId = shopData.data?.shop?.id;
      if (shopId) {
        await adminFetch(`
          mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
            metafieldsSet(metafields: $metafields) { metafields { key } userErrors { message } }
          }
        `, { metafields: [{ ownerId: shopId, namespace: "atheles", key: "site_theme", type: "json", value: JSON.stringify(theme) }] });
      }
      try { revalidateTag("site-theme", "seconds"); } catch {}
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "theme data required" }, { status: 400 });
  } catch (err) {
    console.error("[admin/theme] Error:", err);
    return NextResponse.json({ error: "something went wrong" }, { status: 500 });
  }
}

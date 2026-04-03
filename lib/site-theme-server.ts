/**
 * Server-side fetch of site theme data from Shopify metafields.
 * Called from the root layout to inject theme CSS variables into
 * the HTML — eliminates client-side theme flash.
 */

const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || "";
const domain = process.env.SHOPIFY_STORE_DOMAIN
  ? process.env.SHOPIFY_STORE_DOMAIN.startsWith("https://")
    ? process.env.SHOPIFY_STORE_DOMAIN
    : `https://${process.env.SHOPIFY_STORE_DOMAIN}`
  : "";
const adminEndpoint = domain ? `${domain}/admin/api/2024-10/graphql.json` : "";

type SiteTheme = {
  brandGold: string;
  brandDarkGold: string;
  brandDark: string;
  headingStyle: "solid" | "gradient";
  headingColor: string;
  headingGradientFrom: string;
  headingGradientTo: string;
  logoDefault: string | null;
  logoHover: string | null;
  logoSmall: string | null;
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

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const match = hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!match) return null;
  return { r: parseInt(match[1]!, 16), g: parseInt(match[2]!, 16), b: parseInt(match[3]!, 16) };
}

function darken(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const r = Math.max(0, Math.round(rgb.r * (1 - amount)));
  const g = Math.max(0, Math.round(rgb.g * (1 - amount)));
  const b = Math.max(0, Math.round(rgb.b * (1 - amount)));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function lighten(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const r = Math.min(255, rgb.r + Math.round((255 - rgb.r) * amount));
  const g = Math.min(255, rgb.g + Math.round((255 - rgb.g) * amount));
  const b = Math.min(255, rgb.b + Math.round((255 - rgb.b) * amount));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export async function getSiteThemeData(): Promise<SiteTheme> {
  try {
    if (!adminEndpoint) return DEFAULT_THEME;
    const res = await fetch(adminEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": adminToken },
      body: JSON.stringify({
        query: `query { shop { metafield(namespace: "atheles", key: "site_theme") { value } } }`,
      }),
      next: { revalidate: 300, tags: ["site-theme"] },
    });
    const data = await res.json();
    const raw = data.data?.shop?.metafield?.value;
    if (raw) {
      return { ...DEFAULT_THEME, ...JSON.parse(raw) };
    }
  } catch {}
  return DEFAULT_THEME;
}

/**
 * Returns inline style object for <html> element with all CSS variables.
 * Applied as HTML attributes — no script needed, no flash possible.
 */
export function getThemeInlineStyle(theme: SiteTheme): Record<string, string> {
  const paleGold = darken(theme.brandGold, 0.1);
  const lightGold = lighten(theme.brandGold, 0.2);
  const goldWash = darken(theme.brandGold, 0.05);
  return {
    "--color-brand-gold": theme.brandGold,
    "--color-brand-dark-gold": theme.brandDarkGold,
    "--color-brand-dark": theme.brandDark,
    "--color-brand-pale-gold": paleGold,
    "--color-brand-light-gold": lightGold,
    "--color-brand-gold-wash": goldWash,
    colorScheme: "dark",
  };
}

export function generateThemeCSS(theme: SiteTheme): string {
  const paleGold = darken(theme.brandGold, 0.1);
  const lightGold = lighten(theme.brandGold, 0.2);
  const goldWash = darken(theme.brandGold, 0.05);

  let css = `:root {
  --color-brand-gold: ${theme.brandGold};
  --color-brand-dark-gold: ${theme.brandDarkGold};
  --color-brand-dark: ${theme.brandDark};
  --color-brand-pale-gold: ${paleGold};
  --color-brand-light-gold: ${lightGold};
  --color-brand-gold-wash: ${goldWash};
}`;

  if (theme.headingStyle === "gradient") {
    css += `
.text-brand-gold, .text-brand-dark-gold, .text-brand-pale-gold, .text-brand-light-gold {
  background: linear-gradient(90deg, ${theme.headingGradientFrom}, ${theme.headingGradientTo}) !important;
  -webkit-background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
  background-clip: text !important;
}
.text-brand-dark-gold {
  background: linear-gradient(90deg, ${theme.headingGradientFrom}99, ${theme.headingGradientTo}99) !important;
  -webkit-background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
  background-clip: text !important;
}`;
  }

  return css;
}

"use client";

import { useEffect, useRef } from "react";

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

const LIGHT_MODE_VARS: Record<string, string> = {
  "--color-brand-gold": "#6e5214",
  "--color-brand-dark-gold": "#7a5e18",
  "--color-brand-pale-gold": "#614a12",
  "--color-brand-light-gold": "#8a6a20",
  "--color-brand-dark": "#e8dfc9",
  "--color-brand-grey": "#4a4030",
  "--color-brand-medium-grey": "#6a6058",
  "--color-brand-gold-wash": "#7a6228",
};

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const match = hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!match) return null;
  return { r: parseInt(match[1]!, 16), g: parseInt(match[2]!, 16), b: parseInt(match[3]!, 16) };
}

function lighten(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const r = Math.min(255, rgb.r + Math.round((255 - rgb.r) * amount));
  const g = Math.min(255, rgb.g + Math.round((255 - rgb.g) * amount));
  const b = Math.min(255, rgb.b + Math.round((255 - rgb.b) * amount));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function darken(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const r = Math.max(0, Math.round(rgb.r * (1 - amount)));
  const g = Math.max(0, Math.round(rgb.g * (1 - amount)));
  const b = Math.max(0, Math.round(rgb.b * (1 - amount)));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

const THEME_CACHE_KEY = "atheles-site-theme";
const THEME_TS_KEY = "atheles-site-theme-ts";
const THEME_TTL_MS = 5 * 60 * 1000; // 5 minutes

function applyVars(root: HTMLElement, t: SiteTheme) {
  const isLight = root.getAttribute("data-color-mode") === "light";
  if (isLight) {
    for (const [k, v] of Object.entries(LIGHT_MODE_VARS)) root.style.setProperty(k, v);
    // Clear any heading gradient in light mode — solid dark gold is used instead
    const gs = document.getElementById("atheles-heading-gradient");
    if (gs) gs.textContent = "";
    return;
  }
  root.style.setProperty("--color-brand-gold", t.brandGold);
  root.style.setProperty("--color-brand-dark-gold", t.brandDarkGold);
  root.style.setProperty("--color-brand-dark", t.brandDark);
  root.style.setProperty("--color-brand-pale-gold", darken(t.brandGold, 0.1));
  root.style.setProperty("--color-brand-light-gold", lighten(t.brandGold, 0.2));
  root.style.setProperty("--color-brand-gold-wash", darken(t.brandGold, 0.05));
  // Light mode sets grey/medium-grey as inline styles; remove them in dark mode
  // so the @theme defaults (#737373, #484848) take over instead of the dark brownish values.
  root.style.removeProperty("--color-brand-grey");
  root.style.removeProperty("--color-brand-medium-grey");

  let gradientStyle = document.getElementById("atheles-heading-gradient");
  if (!gradientStyle) {
    gradientStyle = document.createElement("style");
    gradientStyle.id = "atheles-heading-gradient";
    document.head.appendChild(gradientStyle);
  }
  if (t.headingStyle === "gradient") {
    gradientStyle.textContent = `
      .font-heading.text-brand-gold,
      .font-heading.text-brand-dark-gold,
      .font-heading.text-brand-pale-gold,
      .font-heading.text-brand-light-gold,
      h1.text-brand-gold, h2.text-brand-gold, h3.text-brand-gold,
      h1.text-brand-dark-gold, h2.text-brand-dark-gold, h3.text-brand-dark-gold,
      h1.text-brand-pale-gold, h2.text-brand-pale-gold, h3.text-brand-pale-gold,
      h1.text-brand-light-gold, h2.text-brand-light-gold, h3.text-brand-light-gold {
        background: linear-gradient(90deg, ${t.headingGradientFrom}, ${t.headingGradientTo}) !important;
        -webkit-background-clip: text !important;
        -webkit-text-fill-color: transparent !important;
        background-clip: text !important;
      }
    `;
  } else {
    gradientStyle.textContent = "";
  }
}

export function SiteThemeProvider() {
  const themeRef = useRef<SiteTheme | null>(null);

  useEffect(() => {
    const root = document.documentElement;

    const onModeChange = () => {
      if (themeRef.current) applyVars(root, themeRef.current);
    };
    window.addEventListener("atheles-color-mode-change", onModeChange);

    // Skip network fetch if cached data is fresh (< 5 min old).
    // The inline script in layout.tsx already applied the cached theme synchronously,
    // so there's no visual delay — we just avoid a redundant API call.
    try {
      const ts = Number(localStorage.getItem(THEME_TS_KEY) || 0);
      if (Date.now() - ts < THEME_TTL_MS && localStorage.getItem(THEME_CACHE_KEY)) {
        const cached = JSON.parse(localStorage.getItem(THEME_CACHE_KEY)!);
        themeRef.current = cached;
        // Still re-apply to ensure light mode inline overrides are set correctly
        applyVars(root, cached);
        return () => window.removeEventListener("atheles-color-mode-change", onModeChange);
      }
    } catch {}

    fetch("/api/admin/theme")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.theme) return;
        const t: SiteTheme = d.theme;
        themeRef.current = t;
        applyVars(root, t);
        try {
          localStorage.setItem(THEME_CACHE_KEY, JSON.stringify(t));
          localStorage.setItem(THEME_TS_KEY, String(Date.now()));
        } catch {}
      })
      .catch(() => {});

    return () => window.removeEventListener("atheles-color-mode-change", onModeChange);
  }, []);

  return null;
}

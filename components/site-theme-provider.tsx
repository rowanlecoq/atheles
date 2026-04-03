"use client";

import { useEffect } from "react";

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

export function SiteThemeProvider() {
  useEffect(() => {
    // Theme CSS variables are injected server-side. This provider only
    // needs to cache theme to sessionStorage for the logo component,
    // and set derived colors that the server-side CSS doesn't include
    // for the body background.
    fetch("/api/admin/theme")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.theme) return;
        const t = d.theme;
        const root = document.documentElement;

        // Set derived colors that server CSS also sets, but ensure
        // they're applied for any components that read them dynamically
        root.style.setProperty("--color-brand-pale-gold", darken(t.brandGold, 0.1));
        root.style.setProperty("--color-brand-light-gold", lighten(t.brandGold, 0.2));
        root.style.setProperty("--color-brand-gold-wash", darken(t.brandGold, 0.05));

        // Body background
        document.body.style.backgroundColor = t.brandDark;

        // Cache for logo component
        try {
          sessionStorage.setItem("atheles-site-theme", JSON.stringify(t));
        } catch {}
      })
      .catch(() => {});
  }, []);

  return null;
}

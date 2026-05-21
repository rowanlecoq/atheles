"use client";

import { useEffect } from "react";

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
    fetch("/api/admin/theme")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.theme) return;
        const t: SiteTheme = d.theme;
        const root = document.documentElement;

        // Core brand colors
        root.style.setProperty("--color-brand-gold", t.brandGold);
        root.style.setProperty("--color-brand-dark-gold", t.brandDarkGold);
        root.style.setProperty("--color-brand-dark", t.brandDark);

        // Derived colors — auto-generate from primary
        root.style.setProperty("--color-brand-pale-gold", darken(t.brandGold, 0.1));
        root.style.setProperty("--color-brand-light-gold", lighten(t.brandGold, 0.2));
        root.style.setProperty("--color-brand-gold-wash", darken(t.brandGold, 0.05));

        // Apply gradient only after fonts are loaded — prevents colored boxes during FOUT
        const applyGradient = () => {
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
        };

        if (document.fonts?.ready) {
          document.fonts.ready.then(applyGradient);
        } else {
          applyGradient();
        }

        // Store for logo component
        try {
          localStorage.setItem("atheles-site-theme", JSON.stringify(t));
        } catch {}
      })
      .catch(() => {});
  }, []);

  return null;
}

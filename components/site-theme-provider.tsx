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
        // CSS vars are set server-side on <html> inline style.
        // Only inject gradient heading styles (can't be done via inline style).
        let gradientStyle = document.getElementById("atheles-heading-gradient");
        if (!gradientStyle) {
          gradientStyle = document.createElement("style");
          gradientStyle.id = "atheles-heading-gradient";
          document.head.appendChild(gradientStyle);
        }
        if (t.headingStyle === "gradient") {
          gradientStyle.textContent = `
            .text-brand-gold, .text-brand-dark-gold, .text-brand-pale-gold, .text-brand-light-gold {
              background: linear-gradient(90deg, ${t.headingGradientFrom}, ${t.headingGradientTo}) !important;
              -webkit-background-clip: text !important;
              -webkit-text-fill-color: transparent !important;
              background-clip: text !important;
            }
            .text-brand-dark-gold {
              background: linear-gradient(90deg, ${t.headingGradientFrom}99, ${t.headingGradientTo}99) !important;
              -webkit-background-clip: text !important;
              -webkit-text-fill-color: transparent !important;
              background-clip: text !important;
            }
          `;
        } else {
          gradientStyle.textContent = "";
        }

        // Store for logo component
        try {
          sessionStorage.setItem("atheles-site-theme", JSON.stringify(t));
        } catch {}
      })
      .catch(() => {});
  }, []);

  return null;
}

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

export function SiteThemeProvider() {
  useEffect(() => {
    // Fetch theme from API and apply CSS custom properties
    fetch("/api/admin/theme")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.theme) return;
        const t: SiteTheme = d.theme;
        const root = document.documentElement;

        // Apply brand colors as CSS custom properties
        root.style.setProperty("--color-brand-gold", t.brandGold);
        root.style.setProperty("--color-brand-dark-gold", t.brandDarkGold);
        root.style.setProperty("--color-brand-dark", t.brandDark);

        // Store theme in sessionStorage for logo component
        try {
          sessionStorage.setItem("atheles-site-theme", JSON.stringify(t));
        } catch {}
      })
      .catch(() => {});
  }, []);

  return null;
}

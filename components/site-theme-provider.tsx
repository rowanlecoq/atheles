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
    // Theme CSS is now injected server-side via <style> tag in <head>.
    // This client-side provider only needs to cache the theme in
    // sessionStorage for the logo component to read.
    fetch("/api/admin/theme")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.theme) return;
        try {
          sessionStorage.setItem("atheles-site-theme", JSON.stringify(d.theme));
        } catch {}
      })
      .catch(() => {});
  }, []);

  return null;
}

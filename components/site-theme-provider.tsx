"use client";

import { useEffect } from "react";

export function SiteThemeProvider() {
  useEffect(() => {
    // Theme CSS is fully server-injected via <style> in <head>.
    // This only caches to sessionStorage so the logo component can read it.
    fetch("/api/admin/theme")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.theme) {
          try { sessionStorage.setItem("atheles-site-theme", JSON.stringify(d.theme)); } catch {}
        }
      })
      .catch(() => {});
  }, []);

  return null;
}

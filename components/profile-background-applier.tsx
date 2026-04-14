"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Reads the cached session (and optionally fetches a fresh one) to set/clear
 * the `data-bg` attribute on <body> so CSS gradients apply.
 *
 * On every pathname change it re-evaluates from sessionStorage.
 * On mount it also fetches /api/auth/session so the theme picked on Device A
 * is immediately visible on Device B without a manual profile visit.
 */
export function ProfileBackgroundApplier() {
  const pathname = usePathname();

  // Apply background from whatever is currently in sessionStorage
  useEffect(() => {
    const apply = () => {
      try {
        const cached = sessionStorage.getItem("atheles-session");
        if (!cached) {
          document.body.removeAttribute("data-bg");
          return;
        }
        const user = JSON.parse(cached) as { theme?: string | null; globalTheme?: boolean };
        const theme = user.theme;
        const globalTheme = user.globalTheme ?? false;
        const isProfilePage = window.location.pathname.startsWith("/profile");

        if (theme && theme !== "none" && (globalTheme || isProfilePage)) {
          document.body.setAttribute("data-bg", theme);
        } else {
          document.body.removeAttribute("data-bg");
        }
      } catch {
        document.body.removeAttribute("data-bg");
      }
    };

    apply();

    window.addEventListener("atheles-bg-change", apply);
    return () => window.removeEventListener("atheles-bg-change", apply);
  }, [pathname]);

  // Cross-device sync: fetch fresh session once per mount so a theme saved on
  // another device is picked up immediately on first page load here.
  useEffect(() => {
    // Only run for authenticated users (presence of the login cookie)
    if (!document.cookie.includes("atheles-logged-in")) return;

    fetch("/api/auth/session")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.user) return;
        // Merge theme fields into the cached session
        try {
          const cached = sessionStorage.getItem("atheles-session");
          const base = cached ? JSON.parse(cached) : {};
          const updated = { ...base, theme: data.user.theme, globalTheme: data.user.globalTheme };
          sessionStorage.setItem("atheles-session", JSON.stringify(updated));
        } catch {}
        // Re-apply with the fresh data
        window.dispatchEvent(new Event("atheles-bg-change"));
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

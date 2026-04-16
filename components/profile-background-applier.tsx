"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect } from "react";

const LS_KEY = "atheles-bg-theme";

function applyFromStorage() {
  try {
    const pathname = window.location.pathname;
    // localStorage persists across browser close — primary source
    const stored = localStorage.getItem(LS_KEY);
    if (stored) {
      const { theme, globalTheme } = JSON.parse(stored) as { theme?: string; globalTheme?: boolean };
      if (theme && theme !== "none" && (globalTheme || pathname.startsWith("/profile"))) {
        document.body.setAttribute("data-bg", theme);
      } else {
        document.body.removeAttribute("data-bg");
      }
      return;
    }
  } catch {}
  document.body.removeAttribute("data-bg");
}

/**
 * Reads localStorage (persists across browser close) and sets/clears
 * the `data-bg` attribute on <body> so CSS gradients apply.
 *
 * Also fetches a fresh session on mount for cross-device sync:
 * if the user saved a theme on Device A, Device B picks it up on the
 * next page load without a manual profile visit.
 */
export function ProfileBackgroundApplier() {
  const pathname = usePathname();

  // Re-apply on every route change — useLayoutEffect runs before the browser
  // paints so data-bg is set before the first frame, eliminating the dark flash
  // on client-side navigation (useEffect would fire after paint).
  useLayoutEffect(() => {
    applyFromStorage();
    window.addEventListener("atheles-bg-change", applyFromStorage);
    return () => window.removeEventListener("atheles-bg-change", applyFromStorage);
  }, [pathname]);

  // Cross-device sync: fetch fresh session once per mount
  useEffect(() => {
    if (!document.cookie.includes("atheles-logged-in")) return;

    fetch("/api/auth/session")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.user) return;
        const { theme, globalTheme } = data.user as { theme?: string | null; globalTheme?: boolean };
        try {
          localStorage.setItem(LS_KEY, JSON.stringify({
            theme: theme || "none",
            globalTheme: globalTheme ?? false,
          }));
        } catch {}
        // Re-apply with server-fresh data
        applyFromStorage();
        window.dispatchEvent(new Event("atheles-bg-change"));
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

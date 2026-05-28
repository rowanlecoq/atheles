"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect } from "react";

const LS_KEY = "atheles-bg-theme";

// Accept an explicit path so the hook's pathname (always current) takes priority
// over window.location.pathname, which can lag during Next.js concurrent transitions.
function applyFromStorage(pathname: string) {
  try {
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
    applyFromStorage(pathname);
    // Close over the current pathname so event-driven re-applies always use
    // the correct path value, not a stale window.location.pathname.
    const handler = () => applyFromStorage(pathname);
    window.addEventListener("atheles-bg-change", handler);
    return () => window.removeEventListener("atheles-bg-change", handler);
  }, [pathname]);

  // Cross-device sync: fetch fresh session once per mount.
  // Only writes to local storage when this device has NO local preference at all —
  // if any value exists locally (even explicit "none"), trust it. The server may
  // be stale (failed save, different session) and overwriting would cause glitches.
  useEffect(() => {
    if (!document.cookie.includes("atheles-logged-in")) return;
    if (localStorage.getItem(LS_KEY) !== null) return; // local preference exists — trust it

    fetch("/api/auth/session")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.user) return;
        const { theme, globalTheme } = data.user as { theme?: string | null; globalTheme?: boolean };
        const newTheme = theme || "none";
        if (newTheme === "none") return;
        // Double-check local is still absent (user may have clicked a theme while fetch was in-flight)
        if (localStorage.getItem(LS_KEY) !== null) return;
        try {
          localStorage.setItem(LS_KEY, JSON.stringify({ theme: newTheme, globalTheme: globalTheme ?? false }));
        } catch {}
        applyFromStorage(window.location.pathname);
        window.dispatchEvent(new Event("atheles-bg-change"));
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Reads the cached session from sessionStorage and sets/clears the
 * `data-bg` attribute on <body> so CSS gradients apply.
 *
 * Runs on every pathname change (route navigation) and also listens for
 * the `atheles-bg-change` custom event fired when the user picks a new
 * background from their profile.
 *
 * This component intentionally renders nothing — the flash-prevention
 * inline <script> in layout.tsx handles the very first paint.
 */
export function ProfileBackgroundApplier() {
  const pathname = usePathname();

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
        const isProfilePage = typeof window !== "undefined" && window.location.pathname.startsWith("/profile");

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

  return null;
}

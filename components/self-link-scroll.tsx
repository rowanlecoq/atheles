"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function SelfLinkScroll() {
  const pathname = usePathname();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor || !anchor.href) return;

      let url: URL;
      try {
        url = new URL(anchor.href);
      } catch {
        return;
      }

      // Only intercept same-origin links to the current path with no hash
      if (
        url.origin === window.location.origin &&
        url.pathname === pathname &&
        !url.hash
      ) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };

    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [pathname]);

  return null;
}

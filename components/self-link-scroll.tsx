"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function smoothScrollToTop() {
  const start = window.scrollY;
  if (start === 0) return;

  const duration = Math.min(700, start * 0.5);
  const startTime = performance.now();

  const easeInOutCubic = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  const animate = (now: number) => {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    window.scrollTo(0, start * (1 - easeInOutCubic(progress)));
    if (progress < 1) requestAnimationFrame(animate);
  };

  requestAnimationFrame(animate);
}

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

      if (
        url.origin === window.location.origin &&
        url.pathname === pathname &&
        url.search === window.location.search &&
        !url.hash
      ) {
        e.preventDefault();
        e.stopPropagation();
        const isTouchDevice = window.matchMedia(
          "(hover: none) and (pointer: coarse)"
        ).matches;
        if (!isTouchDevice) smoothScrollToTop();
      }
    };

    // capture: true so we fire before React/Next.js router intercepts the click
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [pathname]);

  return null;
}

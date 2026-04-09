"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import type { ReactNode } from "react";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // No wrapper animation — individual sections/cards handle their own entrances.
  // A wrapper opacity/y transition causes a full-screen black flash on every
  // navigation (the body background shows through opacity:0, and even y-only
  // causes a visible jump when the key remounts the entire tree).
  return <>{children}</>;
}

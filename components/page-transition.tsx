"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hasNavigated = useRef(false);

  useEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    const alreadyNavigated = hasNavigated.current;
    hasNavigated.current = true;
    if (alreadyNavigated) window.scrollTo(0, 0);
  }, [pathname]);

  return <>{children}</>;
}

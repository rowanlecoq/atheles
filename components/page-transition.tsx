"use client";

import { motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useReducedMotion } from "lib/hooks/use-reduced-motion";
import type { ReactNode } from "react";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hasNavigated = useRef(false);
  const prefersReducedMotion = useReducedMotion();

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

  // On initial page load: render children directly (no opacity:0 in HTML → LCP unblocked)
  // On subsequent navigations: fade in so route changes still feel smooth
  if (prefersReducedMotion || !hasNavigated.current) {
    return <>{children}</>;
  }

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

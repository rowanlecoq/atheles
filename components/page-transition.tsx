"use client";

import { animationEasing } from "lib/animation-config";
import { motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hasNavigated = useRef(false);
  const prevPath = useRef(pathname);

  useEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (prevPath.current !== pathname) {
      hasNavigated.current = true;
      prevPath.current = pathname;
    }
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <motion.div
      key={pathname}
      // Navigation: full fade + slide. Refresh: subtle slide only (no dark tint)
      initial={hasNavigated.current ? { opacity: 0, y: 8 } : { opacity: 1, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        ease: animationEasing,
      }}
    >
      {children}
    </motion.div>
  );
}

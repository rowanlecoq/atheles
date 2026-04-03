"use client";

import { animationEasing } from "lib/animation-config";
import { motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

let hasEverNavigated = false;

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const renderCount = useRef(0);
  renderCount.current++;

  // First render = page load/refresh. Any subsequent render with new key = navigation.
  const isFirstRender = renderCount.current === 1;

  // Mark that navigation has happened (persists across component remounts)
  if (!isFirstRender) hasEverNavigated = true;

  useEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <motion.div
      key={pathname}
      initial={hasEverNavigated ? { opacity: 0, y: 8 } : false}
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

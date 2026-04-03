"use client";

import { animationEasing } from "lib/animation-config";
import { motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    // After first render, allow animations on subsequent navigations
    if (isFirstLoad.current) isFirstLoad.current = false;
  }, [pathname]);

  return (
    <motion.div
      key={pathname}
      // First load: content fully visible immediately (no flash)
      // Subsequent navigations: subtle fade-in animation
      initial={isFirstLoad.current ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.25,
        ease: animationEasing,
      }}
    >
      {children}
    </motion.div>
  );
}

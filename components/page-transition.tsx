"use client";

import { animationEasing } from "lib/animation-config";
import { motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

// Module-level: tracks the very first pathname seen
let firstPathname: string | null = null;
let navigationCount = 0;

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Track first pathname and count navigations
  if (firstPathname === null) {
    firstPathname = pathname;
  } else if (pathname !== firstPathname || navigationCount > 0) {
    navigationCount++;
  }

  const isInitialLoad = navigationCount === 0 && pathname === firstPathname;

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
      initial={isInitialLoad ? false : { opacity: 0, y: 8 }}
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

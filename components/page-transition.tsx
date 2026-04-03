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

  // Track when a real client-side navigation happens
  useEffect(() => {
    if (prevPath.current !== pathname) {
      hasNavigated.current = true;
      prevPath.current = pathname;
    }
  }, [pathname]);

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
      // Skip entrance animation on initial load/refresh — only animate on navigation
      initial={hasNavigated.current ? { opacity: 0, y: 8 } : false}
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

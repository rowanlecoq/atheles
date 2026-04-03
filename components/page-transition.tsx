"use client";

import { animationEasing } from "lib/animation-config";
import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const navCount = useRef(0);

  // Scroll to top on every navigation
  useEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    // Count navigations — skip animation for the first one (initial page load)
    navCount.current++;
  }, [pathname]);

  // No animation wrapper at all on initial load — pure SSR HTML, no hydration mismatch
  if (navCount.current === 0) {
    return <>{children}</>;
  }

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: animationEasing }}
    >
      {children}
    </motion.div>
  );
}

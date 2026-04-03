"use client";

import { animationEasing } from "lib/animation-config";
import { motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const hasNavigated = useRef(false);
  const prevPath = useRef(pathname);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    // Only scroll to top on actual navigation, not on initial load
    if (prevPath.current !== pathname) {
      hasNavigated.current = true;
      prevPath.current = pathname;
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  if (isMobile) return <>{children}</>;

  return (
    <motion.div
      key={pathname}
      // First load: no animation, content visible immediately, scrollable
      // Navigation: smooth fade-in
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

"use client";

import { motion } from "motion/react";
import { useRef } from "react";
import type { ReactNode } from "react";

export function NavbarShell({ children }: { children: ReactNode }) {
  // Only animate on first mount. useRef persists across re-renders so
  // the motion.div always sees the same initial/animate values — Framer
  // Motion never replays initial on a re-render, only on mount.
  const mounted = useRef(false);
  const didMount = !mounted.current;
  if (didMount) mounted.current = true;

  return (
    <div className="site-header-root sticky top-0 z-50">
      <motion.div
        initial={didMount ? { opacity: 0, y: -6 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </div>
  );
}

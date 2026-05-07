"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

export function NavbarShell({ children }: { children: ReactNode }) {
  return (
    <motion.div
      className="site-header-root sticky top-0 z-50"
      initial={{ y: -10 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

export function NavbarShell({ children }: { children: ReactNode }) {
  return (
    <div className="site-header-root sticky top-0 z-50">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </div>
  );
}

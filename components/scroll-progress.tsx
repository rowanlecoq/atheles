"use client";

import { motion, useScroll, useTransform } from "motion/react";

// Zero-height invisible element that keeps framer-motion's scroll compositor
// subscription active — without it, the sticky navbar + backdrop-blur combo
// loses its GPU layer and jitters on scroll.
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const x = useTransform(scrollYProgress, [0, 1], ["-100%", "0%"]);

  return (
    <motion.div
      className="pointer-events-none fixed left-0 top-0 z-40 h-0 w-full"
      style={{ x }}
    />
  );
}

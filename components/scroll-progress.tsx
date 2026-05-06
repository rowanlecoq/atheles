"use client";

import { motion, useScroll, useTransform } from "motion/react";

// Invisible 2px-tall fixed element that maintains a GPU compositor layer at the
// top of the page. Without a non-zero-area promoted layer here, the sticky
// navbar + backdrop-blur combination jitters on scroll. No bg color = invisible.
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const x = useTransform(scrollYProgress, [0, 1], ["-100%", "0%"]);

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-40 h-[2px] w-full opacity-0"
      style={{ x }}
    />
  );
}

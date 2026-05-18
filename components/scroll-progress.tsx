"use client";

import { motion, useScroll, useTransform } from "motion/react";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const x = useTransform(scrollYProgress, [0, 1], ["-100%", "0%"]);

  return (
    <motion.div
      className="pointer-events-none fixed left-0 top-0 z-40 h-[2px] w-full bg-brand-gold/60"
      style={{ x }}
    />
  );
}

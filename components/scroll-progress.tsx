"use client";

import { motion, useScroll, useTransform } from "motion/react";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.02, 0.04], [0, 0, 1]);

  return (
    <motion.div
      className="fixed left-0 top-0 z-40 h-[2px] w-full origin-left bg-brand-gold"
      style={{ scaleX: scrollYProgress, opacity }}
    />
  );
}

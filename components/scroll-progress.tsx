"use client";

import { motion, useScroll, useTransform } from "motion/react";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.02, 0.04], [0, 0, 1]);
  // translateX is smoother than scaleX on older iOS — avoids GPU layer conflicts
  // with the scroll compositor
  const x = useTransform(scrollYProgress, [0, 1], ["-100%", "0%"]);

  return (
    <motion.div
      className="fixed left-0 top-0 z-40 h-[2px] w-full bg-brand-gold"
      style={{ x, opacity }}
    />
  );
}

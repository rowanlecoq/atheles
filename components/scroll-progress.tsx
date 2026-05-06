"use client";

import { motion, useScroll, useTransform } from "motion/react";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  // opacity permanently 0 — bar is invisible but the motion value keeps
  // will-change: transform, opacity active, which is what stabilises the
  // sticky backdrop-blur navbar during scroll
  const opacity = useTransform(scrollYProgress, [0, 1], [0, 0]);
  const x = useTransform(scrollYProgress, [0, 1], ["-100%", "0%"]);

  return (
    <motion.div
      className="fixed left-0 top-0 z-40 h-[2px] w-full bg-brand-gold"
      style={{ x, opacity }}
    />
  );
}

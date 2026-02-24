"use client";

import { useMobileViewport } from "lib/hooks/use-mobile-viewport";
import { useReducedMotion } from "lib/hooks/use-reduced-motion";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef, type ReactNode } from "react";

export function ScrollFloat({
  children,
  className,
  offset = 18,
}: {
  children: ReactNode;
  className?: string;
  offset?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isMobileViewport = useMobileViewport();
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const resolvedOffset = isMobileViewport ? offset * 0.55 : offset;
  const y = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    [resolvedOffset, 0, -resolvedOffset],
  );
  const opacity = useTransform(
    scrollYProgress,
    [0, 0.3, 1],
    isMobileViewport ? [0.9, 1, 0.95] : [0.82, 1, 0.9],
  );

  return (
    <motion.div
      ref={ref}
      style={{
        y: prefersReducedMotion ? 0 : y,
        opacity: prefersReducedMotion ? 1 : opacity,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

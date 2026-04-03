"use client";

import {
  animationDurations,
  animationDurationsMobile,
  animationEasing,
  animationViewportMargins,
  animationViewportMarginsMobile,
} from "lib/animation-config";
import { useAboveFold } from "lib/hooks/use-above-fold";
import { useMobileViewport } from "lib/hooks/use-mobile-viewport";
import { useReducedMotion } from "lib/hooks/use-reduced-motion";
import { motion, useInView } from "motion/react";
import { useRef, type ReactNode } from "react";

export function GradualBlur({
  children,
  delay = 0,
  duration = animationDurations.slow,
  className,
  once = true,
}: {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { wasAboveFold } = useAboveFold(ref);
  const isMobileViewport = useMobileViewport();
  const prefersReducedMotion = useReducedMotion();
  const isInView = useInView(ref, {
    once,
    margin: isMobileViewport
      ? animationViewportMarginsMobile.early
      : animationViewportMargins.early,
  });
  const hiddenBlur = prefersReducedMotion ? "blur(0px)" : isMobileViewport ? "blur(6px)" : "blur(12px)";
  const hiddenScale = prefersReducedMotion ? 1 : isMobileViewport ? 0.99 : 0.98;
  const hiddenY = prefersReducedMotion ? 0 : isMobileViewport ? 12 : 20;
  const transitionDuration = prefersReducedMotion
    ? Math.min(duration, animationDurations.fast)
    : isMobileViewport
      ? Math.min(duration, animationDurationsMobile.slow)
      : duration;

  const skip = wasAboveFold.current;

  return (
    <motion.div
      ref={ref}
      initial={skip ? false : { opacity: 0, filter: hiddenBlur, scale: hiddenScale, y: hiddenY }}
      animate={isInView || skip ? { opacity: 1, filter: "blur(0px)", scale: 1, y: 0 } : { opacity: 0, filter: hiddenBlur, scale: hiddenScale, y: hiddenY }}
      transition={skip ? { duration: 0 } : { duration: transitionDuration, delay, ease: animationEasing }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

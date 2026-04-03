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

export function ScaleIn({
  children,
  delay = 0,
  duration = animationDurations.normal,
  className,
}: {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { wasAboveFold } = useAboveFold(ref);
  const isMobileViewport = useMobileViewport();
  const prefersReducedMotion = useReducedMotion();
  const isInView = useInView(ref, {
    once: true,
    margin: isMobileViewport
      ? animationViewportMarginsMobile.normal
      : animationViewportMargins.normal,
  });
  const hiddenScale = prefersReducedMotion ? 1 : isMobileViewport ? 0.95 : 0.9;
  const transitionDuration = prefersReducedMotion
    ? Math.min(duration, animationDurations.fast)
    : isMobileViewport
      ? Math.min(duration, animationDurationsMobile.normal)
      : duration;

  const skip = wasAboveFold.current;

  return (
    <motion.div
      ref={ref}
      initial={skip ? false : { opacity: 0, scale: hiddenScale }}
      animate={isInView || skip ? { opacity: 1, scale: 1 } : { opacity: 0, scale: hiddenScale }}
      transition={skip ? { duration: 0 } : { duration: transitionDuration, delay, ease: animationEasing }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

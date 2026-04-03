"use client";

import {
  animationDurations,
  animationDurationsMobile,
  animationEasing,
  animationViewportMargins,
  animationViewportMarginsMobile,
} from "lib/animation-config";
import { useMobileViewport } from "lib/hooks/use-mobile-viewport";
import { useReducedMotion } from "lib/hooks/use-reduced-motion";
import { motion, useInView } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";

type Direction = "up" | "down" | "left" | "right" | "none";

const offsets: Record<Direction, { x: number; y: number }> = {
  up: { x: 0, y: 40 },
  down: { x: 0, y: -40 },
  left: { x: 40, y: 0 },
  right: { x: -40, y: 0 },
  none: { x: 0, y: 0 },
};

export function FadeIn({
  children,
  direction = "up",
  delay = 0,
  duration = animationDurations.normal,
  className,
  once = true,
}: {
  children: ReactNode;
  direction?: Direction;
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isMobileViewport = useMobileViewport();
  const prefersReducedMotion = useReducedMotion();
  // Track if this element was visible on first paint (above the fold)
  const wasVisibleOnMount = useRef<boolean | null>(null);

  useEffect(() => {
    if (wasVisibleOnMount.current !== null) return;
    // Check if element is in viewport on mount — if so, skip entrance animation
    const el = ref.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      wasVisibleOnMount.current = rect.top < window.innerHeight && rect.bottom > 0;
    }
  }, []);

  const isInView = useInView(ref, {
    once,
    margin: isMobileViewport
      ? animationViewportMarginsMobile.normal
      : animationViewportMargins.normal,
  });
  const offset = offsets[direction];
  const mobileOffsetMultiplier = isMobileViewport ? 0.65 : 1;
  const hiddenX = prefersReducedMotion ? 0 : offset.x * mobileOffsetMultiplier;
  const hiddenY = prefersReducedMotion ? 0 : offset.y * mobileOffsetMultiplier;
  const transitionDuration = prefersReducedMotion
    ? Math.min(duration, animationDurations.fast)
    : isMobileViewport
      ? Math.min(duration, animationDurationsMobile.normal)
      : duration;

  // If element was visible on initial page load, skip the fade-in animation
  // to prevent the "content starts invisible then appears" glitch
  const skipAnimation = wasVisibleOnMount.current === true;

  return (
    <motion.div
      ref={ref}
      initial={skipAnimation ? false : { opacity: 0, x: hiddenX, y: hiddenY }}
      animate={
        isInView || skipAnimation
          ? { opacity: 1, x: 0, y: 0 }
          : { opacity: 0, x: hiddenX, y: hiddenY }
      }
      transition={skipAnimation ? { duration: 0 } : {
        duration: transitionDuration,
        delay,
        ease: animationEasing,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

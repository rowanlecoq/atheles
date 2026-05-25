"use client";

import {
  animationDurations,
  animationEasing,
  animationViewportMargins,
  animationViewportMarginsMobile,
} from "lib/animation-config";
import { useMobileViewport } from "lib/hooks/use-mobile-viewport";
import { useReducedMotion } from "lib/hooks/use-reduced-motion";
import { motion, useInView } from "motion/react";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

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

  // If the element is already in the viewport when the page loads, skip the
  // animation entirely — starting at opacity:0 on above-the-fold content
  // delays LCP. useLayoutEffect fires synchronously before the browser paints,
  // so setState here causes a re-render that the user never sees as a flash.
  const [skipAnimation, setSkipAnimation] = useState(false);
  useLayoutEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        setSkipAnimation(true);
      }
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

  const transition = prefersReducedMotion
    ? { duration: animationDurations.fast, delay }
    : {
        opacity: { duration: duration * 0.8, ease: animationEasing, delay },
        x: { type: "spring" as const, stiffness: 300, damping: 30, delay },
        y: { type: "spring" as const, stiffness: 300, damping: 30, delay },
      };

  if (skipAnimation || prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: hiddenX, y: hiddenY }}
      animate={
        isInView
          ? { opacity: 1, x: 0, y: 0 }
          : { opacity: 0, x: hiddenX, y: hiddenY }
      }
      transition={transition}
      className={className}
    >
      {children}
    </motion.div>
  );
}

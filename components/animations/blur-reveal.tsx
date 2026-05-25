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
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

export function BlurReveal({
  children,
  delay = 0,
  duration = animationDurations.slow,
  className,
}: {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isMobileViewport = useMobileViewport();
  const prefersReducedMotion = useReducedMotion();
  const [skipAnimation, setSkipAnimation] = useState(false);
  useLayoutEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) setSkipAnimation(true);
    }
  }, []);
  const isInView = useInView(ref, {
    once: true,
    margin: isMobileViewport
      ? animationViewportMarginsMobile.normal
      : animationViewportMargins.normal,
  });
  const hiddenBlur = prefersReducedMotion
    ? "blur(0px)"
    : isMobileViewport
      ? "blur(6px)"
      : "blur(12px)";
  const transitionDuration = prefersReducedMotion
    ? Math.min(duration, animationDurations.fast)
    : isMobileViewport
      ? Math.min(duration, animationDurationsMobile.slow)
      : duration;

  if (skipAnimation || prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, filter: hiddenBlur }}
      animate={
        isInView
          ? { opacity: 1, filter: "blur(0px)" }
          : { opacity: 0, filter: hiddenBlur }
      }
      transition={{
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

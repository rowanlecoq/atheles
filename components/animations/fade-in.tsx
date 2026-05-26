"use client";

import {
  animationDurations,
  animationEasing,
  animationViewportMargins,
  animationViewportMarginsMobile,
} from "lib/animation-config";
import { useMobileViewport } from "lib/hooks/use-mobile-viewport";
import { useReducedMotion } from "lib/hooks/use-reduced-motion";
import { motion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

type Direction = "up" | "down" | "left" | "right" | "none";

const offsets: Record<Direction, { x: number; y: number }> = {
  up: { x: 0, y: 18 },
  down: { x: 0, y: -18 },
  left: { x: 18, y: 0 },
  right: { x: -18, y: 0 },
  none: { x: 0, y: 0 },
};

// True once the initial hard page load has settled. Any FadeIn that mounts
// after this point is from client-side navigation and should always animate.
let pageLoadSettled = false;
if (typeof window !== "undefined") {
  const mark = () => setTimeout(() => { pageLoadSettled = true; }, 100);
  if (document.readyState === "complete") mark();
  else window.addEventListener("load", mark, { once: true });
}

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
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [isInView, setIsInView] = useState(false);

  // Effect 1: decide whether to animate.
  // - Hard load, above fold: skip — SSR already painted it visible, animating causes bounce.
  // - Navigation, above fold: animate immediately (fade+slide entrance).
  // - Below fold (any case): set up IntersectionObserver.
  useEffect(() => {
    if (!ref.current || prefersReducedMotion) return;
    const rect = ref.current.getBoundingClientRect();
    const inView = rect.top < window.innerHeight && rect.bottom > 0;
    if (inView && !pageLoadSettled) return;
    setShouldAnimate(true);
    if (inView) setIsInView(true);
  }, [prefersReducedMotion]);

  // Effect 2: IntersectionObserver for below-fold elements.
  useEffect(() => {
    if (!shouldAnimate || !ref.current || isInView) return;
    const margin = isMobileViewport
      ? animationViewportMarginsMobile.normal
      : animationViewportMargins.normal;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting) {
          setIsInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setIsInView(false);
        }
      },
      { rootMargin: margin },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [shouldAnimate, isMobileViewport, once, isInView]);

  if (!shouldAnimate || prefersReducedMotion) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  const offset = offsets[direction];
  const m = isMobileViewport ? 0.7 : 1;
  const hiddenX = offset.x * m;
  const hiddenY = offset.y * m;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: hiddenX, y: hiddenY }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, x: hiddenX, y: hiddenY }}
      transition={{ duration, ease: animationEasing, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

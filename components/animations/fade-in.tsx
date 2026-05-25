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

  // Start visible — SSR HTML never has opacity:0. Only enable scroll animation
  // for elements that are below the fold at mount time.
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [isInView, setIsInView] = useState(false);

  // Effect 1: after mount, check if element is below the fold.
  useEffect(() => {
    if (!ref.current || prefersReducedMotion) return;
    const rect = ref.current.getBoundingClientRect();
    if (rect.top >= window.innerHeight || rect.bottom <= 0) {
      setShouldAnimate(true);
    }
  }, [prefersReducedMotion]);

  // Effect 2: runs after shouldAnimate flips to true, at which point ref.current
  // is the motion.div. Set up IntersectionObserver on the correct element.
  useEffect(() => {
    if (!shouldAnimate || !ref.current) return;
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
  }, [shouldAnimate, isMobileViewport, once]);

  if (!shouldAnimate || prefersReducedMotion) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  const offset = offsets[direction];
  const m = isMobileViewport ? 0.65 : 1;
  const hiddenX = offset.x * m;
  const hiddenY = offset.y * m;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: hiddenX, y: hiddenY }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, x: hiddenX, y: hiddenY }}
      transition={{
        opacity: { duration: duration * 0.8, ease: animationEasing, delay },
        x: { type: "spring", stiffness: 300, damping: 30, delay },
        y: { type: "spring", stiffness: 300, damping: 30, delay },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

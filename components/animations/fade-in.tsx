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
  // If the element is already in the viewport on mount, skip opacity so there's
  // no flash of invisible content — only the translate animates.
  const isAboveFoldRef = useRef(false);

  // Effect 1: always enable animation after mount. If already in viewport,
  // trigger immediately so entrance animations work on page navigation.
  useEffect(() => {
    if (!ref.current || prefersReducedMotion) return;
    const rect = ref.current.getBoundingClientRect();
    const inView = rect.top < window.innerHeight && rect.bottom > 0;
    isAboveFoldRef.current = inView;
    setShouldAnimate(true);
    if (inView) setIsInView(true);
  }, [prefersReducedMotion]);

  // Effect 2: for below-fold elements, observe when they scroll into view.
  useEffect(() => {
    if (!shouldAnimate || !ref.current || isAboveFoldRef.current) return;
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
  const m = isMobileViewport ? 0.7 : 1;
  const hiddenX = offset.x * m;
  const hiddenY = offset.y * m;
  const initialOpacity = isAboveFoldRef.current ? 1 : 0;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: initialOpacity, x: hiddenX, y: hiddenY }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : { opacity: initialOpacity, x: hiddenX, y: hiddenY }}
      transition={{
        duration: duration,
        ease: animationEasing,
        delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

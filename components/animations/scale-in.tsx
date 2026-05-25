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
import { motion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

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
  const isMobileViewport = useMobileViewport();
  const prefersReducedMotion = useReducedMotion();
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (!ref.current || prefersReducedMotion) return;
    const rect = ref.current.getBoundingClientRect();
    if (rect.top >= window.innerHeight || rect.bottom <= 0) {
      setShouldAnimate(true);
    }
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (!shouldAnimate || !ref.current) return;
    const margin = isMobileViewport
      ? animationViewportMarginsMobile.normal
      : animationViewportMargins.normal;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: margin },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [shouldAnimate, isMobileViewport]);

  if (!shouldAnimate || prefersReducedMotion) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  const hiddenScale = isMobileViewport ? 0.95 : 0.9;
  const transitionDuration = isMobileViewport
    ? Math.min(duration, animationDurationsMobile.normal)
    : duration;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: hiddenScale }}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: hiddenScale }}
      transition={{ duration: transitionDuration, delay, ease: animationEasing }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

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
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const isAboveFoldRef = useRef(false);

  useEffect(() => {
    if (!ref.current || prefersReducedMotion) return;
    const rect = ref.current.getBoundingClientRect();
    const inView = rect.top < window.innerHeight && rect.bottom > 0;
    isAboveFoldRef.current = inView;
    setShouldAnimate(true);
    if (inView) setIsInView(true);
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (!shouldAnimate || !ref.current || isAboveFoldRef.current) return;
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

  const hiddenBlur = isMobileViewport ? "blur(6px)" : "blur(12px)";
  const transitionDuration = isMobileViewport
    ? Math.min(duration, animationDurationsMobile.slow)
    : duration;
  const initialOpacity = isAboveFoldRef.current ? 1 : 0;
  const initialFilter = isAboveFoldRef.current ? "blur(0px)" : hiddenBlur;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: initialOpacity, filter: initialFilter }}
      animate={isInView ? { opacity: 1, filter: "blur(0px)" } : { opacity: initialOpacity, filter: initialFilter }}
      transition={{ duration: transitionDuration, delay, ease: animationEasing }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

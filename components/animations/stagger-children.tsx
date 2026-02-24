"use client";

import {
  animationDurations,
  animationDurationsMobile,
  animationEasing,
  animationStaggers,
  animationStaggersMobile,
  animationViewportMargins,
  animationViewportMarginsMobile,
} from "lib/animation-config";
import { useMobileViewport } from "lib/hooks/use-mobile-viewport";
import { useReducedMotion } from "lib/hooks/use-reduced-motion";
import { motion, useInView } from "motion/react";
import { Children, isValidElement, useRef, type ReactNode } from "react";

export function StaggerChildren({
  children,
  staggerDelay = animationStaggers.normal,
  className,
}: {
  children: ReactNode;
  staggerDelay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isMobileViewport = useMobileViewport();
  const prefersReducedMotion = useReducedMotion();
  const isInView = useInView(ref, {
    once: true,
    margin: isMobileViewport
      ? animationViewportMarginsMobile.early
      : animationViewportMargins.early,
  });
  const childNodes = Children.toArray(children);
  const hiddenY = prefersReducedMotion ? 0 : isMobileViewport ? 18 : 30;
  const transitionDuration = prefersReducedMotion
    ? animationDurations.fast
    : isMobileViewport
      ? animationDurationsMobile.normal
      : animationDurations.normal;
  const resolvedStaggerDelay = prefersReducedMotion
    ? 0.015
    : isMobileViewport
      ? Math.min(staggerDelay, animationStaggersMobile.normal)
      : staggerDelay;

  return (
    <div ref={ref} className={className}>
      {childNodes.map((child, index) => (
        <motion.div
          key={
            isValidElement(child) && child.key != null
              ? String(child.key)
              : `stagger-${String(child)}`
          }
          initial={{ opacity: 0, y: hiddenY }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: hiddenY }}
          transition={{
            duration: transitionDuration,
            delay: index * resolvedStaggerDelay,
            ease: animationEasing,
          }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
}

"use client";

import {
  animationDurations,
  animationViewportMargins,
  animationViewportMarginsMobile,
} from "lib/animation-config";
import { useMobileViewport } from "lib/hooks/use-mobile-viewport";
import { useReducedMotion } from "lib/hooks/use-reduced-motion";
import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";

type Direction = "up" | "down" | "left" | "right" | "none";

const keyframes: Record<Direction, string> = {
  up: "fi-up",
  down: "fi-down",
  left: "fi-left",
  right: "fi-right",
  none: "fi-none",
};

const EASING = "cubic-bezier(0.22,1,0.36,1)";

const anim = (dir: Direction, dur: number, del: number) =>
  `${keyframes[dir]} ${dur}s ${EASING} ${del}s both`;

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
  const triggered = useRef(false);

  // Runs synchronously before browser paint — above-fold elements get their
  // animation applied before the user ever sees them in their resting position.
  // Below-fold elements are hidden so they don't flash into view while waiting.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (prefersReducedMotion) return;
    const el = ref.current;
    if (!el) return;
    const { top, bottom } = el.getBoundingClientRect();
    const inView = top < window.innerHeight && bottom > 0;
    if (inView) {
      el.style.animation = anim(direction, duration, delay);
      triggered.current = true;
    } else {
      el.style.opacity = "0";
    }
  }, []); // intentionally mount-only

  // IntersectionObserver for below-fold elements.
  useEffect(() => {
    if (prefersReducedMotion || triggered.current) return;
    const el = ref.current;
    if (!el) return;

    const margin = isMobileViewport
      ? animationViewportMarginsMobile.normal
      : animationViewportMargins.normal;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !triggered.current) {
          triggered.current = true;
          el.style.opacity = "";
          el.style.animation = anim(direction, duration, delay);
          if (once) observer.disconnect();
        }
      },
      { rootMargin: margin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [prefersReducedMotion, isMobileViewport, direction, duration, delay, once]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

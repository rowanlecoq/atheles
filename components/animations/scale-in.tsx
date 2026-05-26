"use client";

import {
  animationDurations,
  animationDurationsMobile,
  animationViewportMargins,
  animationViewportMarginsMobile,
} from "lib/animation-config";
import { useMobileViewport } from "lib/hooks/use-mobile-viewport";
import { useReducedMotion } from "lib/hooks/use-reduced-motion";
import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";

const EASING = "cubic-bezier(0.22,1,0.36,1)";

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
  const triggered = useRef(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (prefersReducedMotion) return;
    const el = ref.current;
    if (!el) return;
    const { top, bottom } = el.getBoundingClientRect();
    const inView = top < window.innerHeight && bottom > 0;
    const d = isMobileViewport ? Math.min(duration, animationDurationsMobile.normal) : duration;
    if (inView) {
      el.style.animation = `fi-none ${d}s ${EASING} ${delay}s both`;
      triggered.current = true;
    } else {
      el.style.opacity = "0";
    }
  }, []); // intentionally mount-only

  useEffect(() => {
    if (prefersReducedMotion || triggered.current) return;
    const el = ref.current;
    if (!el) return;

    const d = isMobileViewport ? Math.min(duration, animationDurationsMobile.normal) : duration;
    const margin = isMobileViewport
      ? animationViewportMarginsMobile.normal
      : animationViewportMargins.normal;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !triggered.current) {
          triggered.current = true;
          el.style.opacity = "";
          el.style.animation = `fi-none ${d}s ${EASING} ${delay}s both`;
          observer.disconnect();
        }
      },
      { rootMargin: margin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [prefersReducedMotion, isMobileViewport, duration, delay]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

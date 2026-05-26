"use client";

import {
  animationDurations,
  animationDurationsMobile,
  animationViewportMargins,
  animationViewportMarginsMobile,
} from "lib/animation-config";
import { useMobileViewport } from "lib/hooks/use-mobile-viewport";
import { useReducedMotion } from "lib/hooks/use-reduced-motion";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

const EASING = "cubic-bezier(0.22,1,0.36,1)";

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
  const triggeredRef = useRef(false);
  const [animStyle, setAnimStyle] = useState<CSSProperties | undefined>(undefined);

  useEffect(() => {
    if (prefersReducedMotion || triggeredRef.current) return;
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const inView = rect.top < window.innerHeight && rect.bottom > 0;
    const d = isMobileViewport ? Math.min(duration, animationDurationsMobile.slow) : duration;
    const style: CSSProperties = {
      animation: `fi-none ${d}s ${EASING} ${delay}s both`,
    };

    if (inView) {
      triggeredRef.current = true;
      setAnimStyle(style);
      return;
    }

    const margin = isMobileViewport
      ? animationViewportMarginsMobile.normal
      : animationViewportMargins.normal;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !triggeredRef.current) {
          triggeredRef.current = true;
          setAnimStyle(style);
          observer.disconnect();
        }
      },
      { rootMargin: margin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [prefersReducedMotion, isMobileViewport, duration, delay]);

  return (
    <div ref={ref} className={className} style={animStyle}>
      {children}
    </div>
  );
}

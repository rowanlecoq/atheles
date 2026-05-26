"use client";

import {
  animationDurations,
  animationViewportMargins,
  animationViewportMarginsMobile,
} from "lib/animation-config";
import { useMobileViewport } from "lib/hooks/use-mobile-viewport";
import { useReducedMotion } from "lib/hooks/use-reduced-motion";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

type Direction = "up" | "down" | "left" | "right" | "none";

const keyframeNames: Record<Direction, string> = {
  up: "fi-up",
  down: "fi-down",
  left: "fi-left",
  right: "fi-right",
  none: "fi-none",
};

const EASING = "cubic-bezier(0.22,1,0.36,1)";

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
  // Ref-based guard — can never fire twice regardless of re-renders or parent updates.
  const triggeredRef = useRef(false);
  const [animStyle, setAnimStyle] = useState<CSSProperties | undefined>(undefined);

  useEffect(() => {
    if (prefersReducedMotion || triggeredRef.current) return;
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const inView = rect.top < window.innerHeight && rect.bottom > 0;
    const name = keyframeNames[direction];
    const style: CSSProperties = {
      animation: `${name} ${duration}s ${EASING} ${delay}s both`,
    };

    if (inView) {
      // In viewport (page load or navigation): animate immediately.
      triggeredRef.current = true;
      setAnimStyle(style);
      return;
    }

    // Below fold: fire when the element scrolls into view.
    const margin = isMobileViewport
      ? animationViewportMarginsMobile.normal
      : animationViewportMargins.normal;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !triggeredRef.current) {
          triggeredRef.current = true;
          setAnimStyle(style);
          if (once) observer.disconnect();
        }
      },
      { rootMargin: margin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [prefersReducedMotion, isMobileViewport, direction, duration, delay, once]);

  return (
    <div ref={ref} className={className} style={animStyle}>
      {children}
    </div>
  );
}

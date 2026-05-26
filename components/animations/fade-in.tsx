"use client";

import {
  animationDurations,
  animationViewportMargins,
  animationViewportMarginsMobile,
} from "lib/animation-config";
import { useMobileViewport } from "lib/hooks/use-mobile-viewport";
import { useAnimateInView } from "lib/hooks/use-animate-in-view";
import { type ReactNode } from "react";

type Direction = "up" | "down" | "left" | "right" | "none";

const keyframes: Record<Direction, string> = {
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
}: {
  children: ReactNode;
  direction?: Direction;
  delay?: number;
  duration?: number;
  className?: string;
}) {
  const isMobileViewport = useMobileViewport();
  const margin = isMobileViewport
    ? animationViewportMarginsMobile.normal
    : animationViewportMargins.normal;
  // Animation string is set directly on el.style — never via React style prop,
  // so React re-renders cannot touch it and restart the animation.
  const animString = `${keyframes[direction]} ${duration}s ${EASING} ${delay}s both`;
  const ref = useAnimateInView<HTMLDivElement>(animString, margin);

  return (
    <div ref={ref} className={`fi-anim${className ? ` ${className}` : ""}`}>
      {children}
    </div>
  );
}

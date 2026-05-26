"use client";

import {
  animationDurations,
  animationViewportMargins,
  animationViewportMarginsMobile,
} from "lib/animation-config";
import { useMobileViewport } from "lib/hooks/use-mobile-viewport";
import { useAnimateInView } from "lib/hooks/use-animate-in-view";
import { type CSSProperties, type ReactNode } from "react";

type Direction = "up" | "down" | "left" | "right" | "none";

const keyframes: Record<Direction, string> = {
  up: "fi-up",
  down: "fi-down",
  left: "fi-left",
  right: "fi-right",
  none: "fi-none",
};

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
  const ref = useAnimateInView<HTMLDivElement>(margin);

  return (
    <div
      ref={ref}
      className={`fi-anim${className ? ` ${className}` : ""}`}
      style={{
        "--fi-kf": keyframes[direction],
        "--fi-dur": `${duration}s`,
        "--fi-del": `${delay}s`,
      } as CSSProperties}
    >
      {children}
    </div>
  );
}

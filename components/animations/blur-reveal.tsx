"use client";

import {
  animationDurations,
  animationViewportMargins,
  animationViewportMarginsMobile,
} from "lib/animation-config";
import { useMobileViewport } from "lib/hooks/use-mobile-viewport";
import { useAnimateInView } from "lib/hooks/use-animate-in-view";
import { type CSSProperties, type ReactNode } from "react";

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
        "--fi-kf": "fi-none",
        "--fi-dur": `${duration}s`,
        "--fi-del": `${delay}s`,
      } as CSSProperties}
    >
      {children}
    </div>
  );
}

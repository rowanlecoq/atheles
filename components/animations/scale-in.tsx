"use client";

import {
  animationDurations,
  animationViewportMargins,
  animationViewportMarginsMobile,
} from "lib/animation-config";
import { useMobileViewport } from "lib/hooks/use-mobile-viewport";
import { useAnimateInView } from "lib/hooks/use-animate-in-view";
import { type ReactNode } from "react";

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
  const isMobileViewport = useMobileViewport();
  const margin = isMobileViewport
    ? animationViewportMarginsMobile.normal
    : animationViewportMargins.normal;
  const animString = `fi-none ${duration}s ${EASING} ${delay}s both`;
  const ref = useAnimateInView<HTMLDivElement>(animString, margin);

  return (
    <div ref={ref} className={`fi-anim${className ? ` ${className}` : ""}`}>
      {children}
    </div>
  );
}

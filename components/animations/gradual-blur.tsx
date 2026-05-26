"use client";

import { animationDurations } from "lib/animation-config";
import { FadeIn } from "components/animations/fade-in";
import { type ReactNode } from "react";

export function GradualBlur({
  children,
  delay = 0,
  duration = animationDurations.slow,
  className,
}: {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
}) {
  return (
    <FadeIn direction="up" delay={delay} duration={duration} className={className}>
      {children}
    </FadeIn>
  );
}

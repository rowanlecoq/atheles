"use client";

import { FadeIn, GradualBlur, ScrollFloat, StaggerChildren } from "components/animations";
import type { ReactNode } from "react";

export function AnimatedHeading({ children }: { children: ReactNode }) {
  return (
    <ScrollFloat>
      <GradualBlur>{children}</GradualBlur>
    </ScrollFloat>
  );
}

export function AnimatedFadeIn({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <FadeIn direction="up" delay={delay} className={className}>
      {children}
    </FadeIn>
  );
}

export function AnimatedStagger({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <StaggerChildren className={className}>{children}</StaggerChildren>;
}

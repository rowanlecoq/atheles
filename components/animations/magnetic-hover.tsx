"use client";

import { useMobileViewport } from "lib/hooks/use-mobile-viewport";
import { useReducedMotion } from "lib/hooks/use-reduced-motion";
import { motion, useMotionValue, useSpring } from "motion/react";
import type { MouseEvent, ReactNode } from "react";

export function MagneticHover({
  children,
  className,
  strength = 12,
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
}) {
  const isMobileViewport = useMobileViewport();
  const prefersReducedMotion = useReducedMotion();
  const motionDisabled = prefersReducedMotion || isMobileViewport;
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 260, damping: 18, mass: 0.45 });
  const springY = useSpring(y, { stiffness: 260, damping: 18, mass: 0.45 });

  const handlePointerMove = (event: MouseEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const centerX = bounds.width / 2;
    const centerY = bounds.height / 2;
    const distanceX = event.clientX - bounds.left - centerX;
    const distanceY = event.clientY - bounds.top - centerY;

    x.set((distanceX / centerX) * strength);
    y.set((distanceY / centerY) * strength);
  };

  const handlePointerLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      className={className}
      style={{
        x: motionDisabled ? 0 : springX,
        y: motionDisabled ? 0 : springY,
      }}
      onMouseMove={motionDisabled ? undefined : handlePointerMove}
      onMouseLeave={motionDisabled ? undefined : handlePointerLeave}
    >
      {children}
    </motion.div>
  );
}

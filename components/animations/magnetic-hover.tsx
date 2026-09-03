"use client";

import { useMobileViewport } from "lib/hooks/use-mobile-viewport";
import { useReducedMotion } from "lib/hooks/use-reduced-motion";
import { useRef, type MouseEvent, type ReactNode } from "react";

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
  const ref = useRef<HTMLDivElement>(null);

  const handlePointerMove = (event: MouseEvent<HTMLDivElement>) => {
    if (motionDisabled || !ref.current) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const cx = bounds.width / 2;
    const cy = bounds.height / 2;
    const dx = ((event.clientX - bounds.left - cx) / cx) * strength;
    const dy = ((event.clientY - bounds.top - cy) / cy) * strength;
    ref.current.style.transform = `translate(${dx}px,${dy}px)`;
  };

  const handlePointerLeave = () => {
    if (ref.current) ref.current.style.transform = "translate(0px,0px)";
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{ transition: "transform 0.4s cubic-bezier(0.22,1,0.36,1)" }}
      onMouseMove={motionDisabled ? undefined : handlePointerMove}
      onMouseLeave={motionDisabled ? undefined : handlePointerLeave}
    >
      {children}
    </div>
  );
}

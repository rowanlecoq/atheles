import type { ReactNode } from "react";

export function GradualBlur({
  children,
  className,
}: {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
}) {
  return <div className={className}>{children}</div>;
}

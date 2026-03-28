import type { ReactNode } from "react";

export function StaggerChildren({
  children,
  className,
}: {
  children: ReactNode;
  staggerDelay?: number;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

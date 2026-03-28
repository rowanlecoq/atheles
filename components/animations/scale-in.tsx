import type { ReactNode } from "react";

export function ScaleIn({
  children,
  className,
}: {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

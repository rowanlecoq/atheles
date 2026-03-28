import type { ReactNode } from "react";

export function BlurReveal({
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

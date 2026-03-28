import type { ReactNode } from "react";

export function FadeIn({
  children,
  className,
}: {
  children: ReactNode;
  direction?: string;
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
}) {
  return <div className={className}>{children}</div>;
}

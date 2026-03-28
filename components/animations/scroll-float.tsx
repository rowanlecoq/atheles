import type { ReactNode } from "react";

export function ScrollFloat({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
  offset?: number;
}) {
  return <div className={className}>{children}</div>;
}

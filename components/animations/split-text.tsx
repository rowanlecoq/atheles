import type { ElementType } from "react";

export function SplitText({
  text,
  as: Component = "span",
  className,
}: {
  text: string;
  as?: ElementType;
  className?: string;
  delay?: number;
  duration?: number;
  stagger?: number;
  once?: boolean;
  mode?: "chars" | "words";
}) {
  return <Component className={className}>{text}</Component>;
}

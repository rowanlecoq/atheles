"use client";

import {
  animationDurations,
  animationDurationsMobile,
  animationEasing,
  animationStaggers,
  animationStaggersMobile,
  animationViewportMargins,
  animationViewportMarginsMobile,
} from "lib/animation-config";
import { useMobileViewport } from "lib/hooks/use-mobile-viewport";
import { useReducedMotion } from "lib/hooks/use-reduced-motion";
import { motion, useInView } from "motion/react";
import { useRef, type ElementType } from "react";

type SplitMode = "chars" | "words";

type SplitTextProps = {
  text: string;
  as?: ElementType;
  className?: string;
  delay?: number;
  duration?: number;
  stagger?: number;
  once?: boolean;
  mode?: SplitMode;
};

export function SplitText({
  text,
  as: Component = "span",
  className,
  delay = 0,
  duration = animationDurations.normal,
  stagger = animationStaggers.tight,
  once = true,
  mode = "chars",
}: SplitTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isMobileViewport = useMobileViewport();
  const prefersReducedMotion = useReducedMotion();
  const isInView = useInView(ref, {
    once,
    margin: isMobileViewport
      ? animationViewportMarginsMobile.normal
      : animationViewportMargins.normal,
  });
  const hiddenY = prefersReducedMotion ? 0 : isMobileViewport ? 16 : 24;
  // Blur reveals on desktop only — mobile GPUs tear down compositing layers at blur(0px),
  // causing a post-animation flicker. blur(0.001px) as end state prevents the teardown.
  const hiddenBlur = prefersReducedMotion || isMobileViewport ? undefined : "blur(7px)";
  const visibleBlur = hiddenBlur ? "blur(0.001px)" : undefined;
  const transitionDuration = prefersReducedMotion
    ? Math.min(duration, animationDurations.fast)
    : isMobileViewport
      ? Math.min(duration, animationDurationsMobile.normal)
      : duration;
  const resolvedStagger = prefersReducedMotion
    ? Math.min(stagger, animationStaggers.tight)
    : isMobileViewport
      ? Math.min(stagger, animationStaggersMobile.tight)
      : stagger;

  const tokenCounts = new Map<string, number>();
  const rawTokens =
    mode === "chars"
      ? Array.from(text)
      : text.split(/(\s+)/).filter((token) => token.length > 0);

  const tokens = rawTokens.map((token) => {
    const count = (tokenCounts.get(token) ?? 0) + 1;
    tokenCounts.set(token, count);

    return {
      token,
      key: `${token}-${count}`,
      isWhitespace: /^\s+$/.test(token),
    };
  });

  return (
    <Component className={className}>
      <span className="sr-only">{text}</span>
      <motion.span
        ref={ref}
        aria-hidden
        className="inline"
        style={{ overflow: "visible" }}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: resolvedStagger,
              delayChildren: delay,
            },
          },
        }}
      >
        {tokens.map(({ token, key, isWhitespace }) =>
          mode === "words" && isWhitespace ? (
            <span key={key} className="whitespace-pre">
              {token}
            </span>
          ) : (
            <motion.span
              key={key}
              className={
                mode === "chars"
                  ? "inline-block whitespace-pre"
                  : "inline-block"
              }
              variants={{
                hidden: {
                  opacity: 0,
                  y: hiddenY,
                  ...(hiddenBlur ? { filter: hiddenBlur } : {}),
                },
                visible: {
                  opacity: 1,
                  y: 0,
                  ...(visibleBlur ? { filter: visibleBlur } : {}),
                  transition: {
                    duration: transitionDuration,
                    ease: animationEasing,
                  },
                },
              }}
            >
              {mode === "chars" && token === " " ? "\u00A0" : token}
            </motion.span>
          ),
        )}
      </motion.span>
    </Component>
  );
}

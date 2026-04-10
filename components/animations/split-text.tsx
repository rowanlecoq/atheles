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
  /** When true, characters start visible (blur only, no opacity:0) — prevents
   *  a flash when the component remounts on key change (e.g. collection nav). */
  blurOnly?: boolean;
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
  blurOnly = false,
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
  // Apply blur on all devices. Don't gate on isMobileViewport:
  // that hook starts false on SSR then flips true after hydration, leaving characters
  // permanently stuck at blur(7px) mid-animation on mobile.
  const hiddenBlur = prefersReducedMotion ? undefined : "blur(7px)";
  const visibleBlur = prefersReducedMotion ? undefined : "blur(0px)";
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
                  ...(blurOnly ? {} : { opacity: 0 }),
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

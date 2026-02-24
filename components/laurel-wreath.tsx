"use client";

import { motion } from "motion/react";

// "atheles" = 7 chars × 0.045 stagger + 0.1 delay + 1.2 duration ≈ 1.6s
const ENTRANCE_DELAY = 1.45;
const STEM_DRAW_DELAY = 1.75;
const LEAF_DRAW_BASE = 2.15;
const LEAF_STAGGER = 0.11;

// Paths for the RIGHT branch. Left = scaleX(-1) mirror via Framer Motion.
// ViewBox 0 0 60 130.
// Stem: C-curve from bottom-left → sweeps rightward → comes back in at top-center.
// This creates a visible crescent arc so the branch reads as "curved" not "straight".
const STEM_PATH = "M 10 126 C 32 104, 52 76, 50 44 C 48 22, 36 10, 30 4";

// Leaves fan outward following the stem's curvature:
// bottom leaves point right, top leaves rotate upward, matching the arc direction.
const LEAF_PATHS = [
  "M 20 108 C 34 104, 48 97, 54 90 C 40 97, 26 103, 20 108",
  "M 36 88 C 48 83, 56 74, 58 65 C 50 74, 40 83, 36 88",
  "M 48 68 C 54 58, 56 46, 52 38 C 48 46, 46 57, 48 68",
  "M 46 48 C 46 38, 42 26, 36 18 C 36 26, 38 37, 46 48",
  "M 36 28 C 32 18, 28 9, 26 4 C 28 9, 30 18, 36 28",
];

export function LaurelWreath({ side }: { side: "left" | "right" }) {
  const isLeft = side === "left";

  // Encode the mirror inside Framer Motion's own scaleX so there's a single
  // animated element with no competing transform sources.
  return (
    <motion.svg
      viewBox="0 0 60 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-14 w-[26px] sm:h-20 sm:w-[37px] md:h-24 md:w-[44px]"
      role="presentation"
      aria-hidden
      initial={{ opacity: 0, scaleX: isLeft ? -0.78 : 0.78, scaleY: 0.78 }}
      animate={{ opacity: 1, scaleX: isLeft ? -1 : 1, scaleY: 1 }}
      transition={{ delay: ENTRANCE_DELAY, duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <motion.path
        d={STEM_PATH}
        stroke="rgba(204, 177, 115, 0.42)"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: STEM_DRAW_DELAY, duration: 1.05, ease: "easeInOut" }}
      />
      {LEAF_PATHS.map((path, i) => (
        <motion.path
          key={path}
          d={path}
          stroke="rgba(204, 177, 115, 0.3)"
          strokeWidth="0.9"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            delay: LEAF_DRAW_BASE + i * LEAF_STAGGER,
            duration: 0.5,
            ease: "easeInOut",
          }}
        />
      ))}
    </motion.svg>
  );
}

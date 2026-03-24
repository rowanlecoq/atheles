"use client";

// Leaf delays start after the entrance fade completes (~2.15s)
const LEAF_BASE_DELAY = 2.15;
const LEAF_STAGGER = 0.11;

// Right-branch paths. Left branch = scaleX(-1) on the wrapper.
// ViewBox 0 0 60 130.
// Stem: C-curve from bottom-left → sweeps rightward → returns toward top-center.
const STEM_PATH = "M 10 126 C 32 104, 52 76, 50 44 C 48 22, 36 10, 30 4";

// Leaves fan outward following the stem's curvature:
// bottom leaves point right, upper leaves rotate upward, giving a clear arc shape.
const LEAF_PATHS = [
  "M 20 108 C 34 104, 48 97, 54 90 C 40 97, 26 103, 20 108",
  "M 36 88 C 48 83, 56 74, 58 65 C 50 74, 40 83, 36 88",
  "M 48 68 C 54 58, 56 46, 52 38 C 48 46, 46 57, 48 68",
  "M 46 48 C 46 38, 42 26, 36 18 C 36 26, 38 37, 46 48",
  "M 36 28 C 32 18, 28 9, 26 4 C 28 9, 30 18, 36 28",
];

export function LaurelWreath({ side }: { side: "left" | "right" }) {
  const isLeft = side === "left";

  return (
    // laurel-wrapper handles the fade-in entrance via CSS animation.
    // scaleX(-1) on the wrapper mirrors the right-branch paths for the left side.
    <div
      className="laurel-wrapper"
      style={isLeft ? { transform: "scaleX(-1)" } : undefined}
    >
      <svg
        viewBox="0 0 60 130"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-14 w-[26px] sm:h-20 sm:w-[37px] md:h-24 md:w-[44px]"
        role="presentation"
        aria-hidden
      >
        <path
          d={STEM_PATH}
          stroke="rgba(204, 177, 115, 0.42)"
          strokeWidth="1.4"
          strokeLinecap="round"
          fill="none"
          className="laurel-stem"
        />
        {LEAF_PATHS.map((path, i) => (
          <path
            key={path}
            d={path}
            stroke="rgba(204, 177, 115, 0.3)"
            strokeWidth="0.9"
            strokeLinecap="round"
            fill="none"
            className="laurel-leaf"
            style={{ animationDelay: `${LEAF_BASE_DELAY + i * LEAF_STAGGER}s` }}
          />
        ))}
      </svg>
    </div>
  );
}

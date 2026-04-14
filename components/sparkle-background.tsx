"use client";

import { useEffect, useState } from "react";

// Grid-based distribution: 10 cols × 9 rows = 90 stars, evenly spread
const COLS = 10;
const ROWS = 9;

// 4-pointed star via clip-path
const STAR_CLIP =
  "polygon(50% 0%, 64% 36%, 100% 50%, 64% 64%, 50% 100%, 36% 64%, 0% 50%, 36% 36%)";

type Sparkle = {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  floatY: string;
  spin: string;
  bright: boolean;
};

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function generateSparkles(): Sparkle[] {
  const cellW = 100 / COLS;
  const cellH = 100 / ROWS;
  return Array.from({ length: COLS * ROWS }, (_, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    return {
      id: i,
      // Random position within the cell for organic feel, but guaranteed spread
      x: col * cellW + rand(cellW * 0.1, cellW * 0.9),
      y: row * cellH + rand(cellH * 0.1, cellH * 0.9),
      size: rand(4, 10),
      delay: rand(0, 14),
      duration: rand(3, 9),
      floatY: `-${Math.round(rand(8, 18))}px`,
      spin: `${Math.round(rand(10, 26))}deg`,
      bright: Math.random() > 0.75, // ~25% slightly brighter
    };
  });
}

export function SparkleBackground() {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  // Client-only — avoids hydration mismatch from random values
  useEffect(() => {
    setSparkles(generateSparkles());
  }, []);

  if (sparkles.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden"
      // z-index: -1 places sparkles above the body canvas background
      // but strictly behind all page content (z ≥ 0)
      style={{ zIndex: -1 }}
    >
      {sparkles.map((s) => (
        <div
          key={s.id}
          className="sparkle-star absolute bg-brand-gold"
          style={
            {
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              clipPath: STAR_CLIP,
              "--float-y": s.floatY,
              "--spin": s.spin,
              animation: `${s.bright ? "sparkle-star-bright" : "sparkle-star-float"} ${s.duration}s ${s.delay}s ease-in-out infinite`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

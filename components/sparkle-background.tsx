"use client";

import { useEffect, useState } from "react";

// Grid: 12 cols × 10 rows = 120 stars, evenly spread across viewport
const COLS = 12;
const ROWS = 10;

const STAR_CLIP =
  "polygon(50% 0%, 64% 36%, 100% 50%, 64% 64%, 50% 100%, 36% 64%, 0% 50%, 36% 36%)";

const VARIANTS = ["sparkle-drift-a", "sparkle-drift-b", "sparkle-drift-c"] as const;

type Sparkle = {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  variant: string;
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
      x: col * cellW + rand(cellW * 0.05, cellW * 0.95),
      y: row * cellH + rand(cellH * 0.05, cellH * 0.95),
      size: rand(8, 20),
      delay: rand(0, 16),
      duration: rand(8, 18), // slow, flowy drift
      variant: VARIANTS[Math.floor(Math.random() * VARIANTS.length)]!,
    };
  });
}

export function SparkleBackground() {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  useEffect(() => {
    setSparkles(generateSparkles());
  }, []);

  if (sparkles.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: -1 }}
    >
      {sparkles.map((s) => (
        <div
          key={s.id}
          className="sparkle-star absolute bg-brand-gold"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            clipPath: STAR_CLIP,
            animation: `${s.variant} ${s.duration}s ${s.delay}s ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  );
}

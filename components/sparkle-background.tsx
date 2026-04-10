"use client";

import { useEffect, useState } from "react";

const SPARKLE_COUNT = 90;

// 4-pointed star via clip-path (inner radius ≈ 40% of outer)
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
  return Array.from({ length: SPARKLE_COUNT }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: rand(6, 15),
    delay: rand(0, 12),
    duration: rand(3, 8),
    floatY: `-${Math.round(rand(10, 22))}px`,
    spin: `${Math.round(rand(12, 28))}deg`,
    bright: Math.random() > 0.62, // ~38% are brighter
  }));
}

export function SparkleBackground() {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  // Client-only to avoid hydration mismatch
  useEffect(() => {
    setSparkles(generateSparkles());
  }, []);

  if (sparkles.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: 0 }}
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

"use client";

import { useEffect, useState } from "react";

const SPARKLE_COUNT = 55;

type Sparkle = {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  peakOpacity: number;
};

function generateSparkles(): Sparkle[] {
  return Array.from({ length: SPARKLE_COUNT }, (_, i) => {
    const size = Math.random() * 2.4 + 0.8; // 0.8–3.2px
    // Larger dots are slightly more visible; smaller ones stay subtle
    const peakOpacity =
      size > 2.2
        ? Math.random() * 0.12 + 0.10 // 0.10–0.22
        : Math.random() * 0.10 + 0.05; // 0.05–0.15
    return {
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size,
      delay: Math.random() * 9,      // stagger up to 9 s so they don't all pulse together
      duration: Math.random() * 4 + 2, // 2–6 s per cycle
      peakOpacity,
    };
  });
}

export function SparkleBackground() {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  // Generate on the client only to avoid hydration mismatch
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
          className="sparkle-dot absolute rounded-full bg-brand-gold"
          style={
            {
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              "--peak-opacity": s.peakOpacity,
              animation: `sparkle-twinkle ${s.duration}s ${s.delay}s ease-in-out infinite`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

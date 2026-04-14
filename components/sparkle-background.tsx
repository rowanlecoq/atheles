"use client";

import { useReducedMotion } from "lib/hooks/use-reduced-motion";
import { useCallback, useEffect, useRef } from "react";

type Star = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  outerR: number;
  alpha: number;
  phase: number;
  rotation: number;
  rotSpeed: number;
};

// 4-pointed star path — same shape as before but drawn on canvas
function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outerR: number,
  rotation: number,
) {
  const innerR = outerR * 0.38;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i * Math.PI) / 4 + rotation;
    if (i === 0) ctx.moveTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
    else ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
  }
  ctx.closePath();
}

const COUNT = 90;

export function SparkleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const animIdRef = useRef(0);
  const prefersReducedMotion = useReducedMotion();

  const initStars = useCallback((width: number, height: number) => {
    starsRef.current = Array.from({ length: COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.22,     // slow horizontal drift
      vy: (Math.random() - 0.5) * 0.10,     // slow vertical drift
      outerR: 2.5 + Math.random() * 5.5,    // 2.5–8px → star diameter 5–16px
      alpha: 0.04 + Math.random() * 0.05,   // 4–9% — always present, never blinks
      phase: Math.random() * Math.PI * 2,   // offset for sine undulation
      rotation: Math.random() * Math.PI,
      rotSpeed: (Math.random() - 0.5) * 0.004, // very slow spin
    }));
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (starsRef.current.length === 0) initStars(canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    let time = 0;
    const draw = () => {
      animIdRef.current = requestAnimationFrame(draw);
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      time += 0.005; // slow time advance for gentle undulation

      for (const s of starsRef.current) {
        s.x += s.vx;
        s.y += s.vy + Math.sin(time + s.phase) * 0.10; // sine wave sway
        s.rotation += s.rotSpeed;

        // Wrap around edges — stars never disappear
        if (s.x < -20) s.x = w + 20;
        if (s.x > w + 20) s.x = -20;
        if (s.y < -20) s.y = h + 20;
        if (s.y > h + 20) s.y = -20;

        ctx.fillStyle = `rgba(204, 177, 115, ${s.alpha})`;
        drawStar(ctx, s.x, s.y, s.outerR, s.rotation);
        ctx.fill();
      }
    };
    animIdRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animIdRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [prefersReducedMotion, initStars]);

  if (prefersReducedMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: -1 }}
    />
  );
}

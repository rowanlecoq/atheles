"use client";

import { useMobileViewport } from "lib/hooks/use-mobile-viewport";
import { useReducedMotion } from "lib/hooks/use-reduced-motion";
import { useCallback, useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  phase: number;
};

export function GoldParticles({ count = 18 }: { count?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animIdRef = useRef(0);
  const visibleRef = useRef(false);
  const isMobile = useMobileViewport();
  const prefersReducedMotion = useReducedMotion();

  const initParticles = useCallback(
    (width: number, height: number) => {
      particlesRef.current = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.15,
        radius: 1 + Math.random() * 2,
        alpha: 0.06 + Math.random() * 0.09,
        phase: Math.random() * Math.PI * 2,
      }));
    },
    [count],
  );

  useEffect(() => {
    if (isMobile || prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry?.isIntersecting ?? false;
      },
      { threshold: 0.1 },
    );
    observer.observe(canvas);

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      canvas.width = w;
      canvas.height = h;
      initParticles(w, h);
    };
    resize();
    window.addEventListener("resize", resize);

    let time = 0;
    const draw = () => {
      animIdRef.current = requestAnimationFrame(draw);
      if (!visibleRef.current) return;

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      time += 0.008;

      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy + Math.sin(time + p.phase) * 0.15;

        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(204, 177, 115, ${p.alpha})`;
        ctx.fill();
      }
    };
    animIdRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animIdRef.current);
      observer.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, [isMobile, prefersReducedMotion, initParticles]);

  if (isMobile || prefersReducedMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-[1]"
      aria-hidden
    />
  );
}

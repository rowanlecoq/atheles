"use client";

import { useCallback, useEffect, useRef } from "react";
import { useReducedMotion } from "lib/hooks/use-reduced-motion";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  alpha: number;
  targetAlpha: number;
  fadeSpeed: number;
  color: [number, number, number]; // rgb
  isStar: boolean;
  rotation: number;
  rotSpeed: number;
  phase: number;
};

// Per-theme particle config
const THEMES = {
  gold: {
    count: 70,
    colors: [[255, 210, 60], [220, 185, 90], [255, 240, 160], [190, 160, 80]] as [number, number, number][],
    minR: 1.2, maxR: 4.5,
    minAlpha: 0.03, maxAlpha: 0.16,
    speed: 0.14,
    isStar: false,
  },
  water: {
    count: 65,
    colors: [[0, 225, 240], [0, 170, 230], [120, 245, 255], [0, 195, 215]] as [number, number, number][],
    minR: 1.2, maxR: 5.0,
    minAlpha: 0.04, maxAlpha: 0.20,
    speed: 0.18,
    isStar: false,
  },
  tropical: {
    count: 70,
    colors: [[20, 215, 100], [0, 175, 230], [255, 155, 30], [80, 235, 140]] as [number, number, number][],
    minR: 1.2, maxR: 5.0,
    minAlpha: 0.04, maxAlpha: 0.20,
    speed: 0.16,
    isStar: false,
  },
  midnight: {
    count: 110,
    colors: [[255, 255, 255], [225, 185, 255], [255, 185, 225], [210, 165, 255]] as [number, number, number][],
    minR: 0.8, maxR: 4.0,
    minAlpha: 0.04, maxAlpha: 0.75,
    speed: 0.06,
    isStar: true,
  },
  sunset: {
    count: 70,
    colors: [[255, 90, 145], [255, 145, 50], [200, 75, 225], [255, 125, 90]] as [number, number, number][],
    minR: 1.2, maxR: 4.5,
    minAlpha: 0.03, maxAlpha: 0.18,
    speed: 0.14,
    isStar: false,
  },
} as const;

type ThemeKey = keyof typeof THEMES;

// 4-pointed star path
function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  outerR: number, rotation: number,
) {
  const innerR = outerR * 0.35;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i * Math.PI) / 4 + rotation;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

export function ThemeBackgroundCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{
    particles: Particle[];
    animId: number;
    theme: string | null;
    time: number;
  }>({ particles: [], animId: 0, theme: null, time: 0 });
  const prefersReducedMotion = useReducedMotion();

  const buildParticles = useCallback((key: ThemeKey, w: number, h: number): Particle[] => {
    const cfg = THEMES[key];
    const cols = Math.max(1, Math.ceil(Math.sqrt(cfg.count * (w / h))));
    const rows = Math.ceil(cfg.count / cols);
    const cellW = w / cols;
    const cellH = h / rows;

    return Array.from({ length: cfg.count }, (_, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const color = cfg.colors[i % cfg.colors.length]!;
      const alpha = cfg.minAlpha + Math.random() * (cfg.maxAlpha - cfg.minAlpha);
      return {
        x: col * cellW + Math.random() * cellW,
        y: row * cellH + Math.random() * cellH,
        vx: (Math.random() - 0.5) * cfg.speed,
        vy: (Math.random() - 0.5) * cfg.speed * 0.5,
        r: cfg.minR + Math.random() * (cfg.maxR - cfg.minR),
        alpha,
        targetAlpha: cfg.minAlpha + Math.random() * (cfg.maxAlpha - cfg.minAlpha),
        fadeSpeed: 0.004 + Math.random() * 0.012,
        color,
        isStar: cfg.isStar,
        rotation: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 0.006,
        phase: Math.random() * Math.PI * 2,
      };
    });
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const state = stateRef.current;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const getCurrentTheme = () => document.body.getAttribute("data-bg") as ThemeKey | null;

    const draw = () => {
      state.animId = requestAnimationFrame(draw);
      const theme = getCurrentTheme();

      // Reinitialise on theme change
      if (theme !== state.theme) {
        state.theme = theme;
        state.particles = theme && theme in THEMES
          ? buildParticles(theme as ThemeKey, canvas.width, canvas.height)
          : [];
      }

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      if (state.particles.length === 0) return;

      state.time += 0.008;
      const cfg = THEMES[theme as ThemeKey];

      for (const p of state.particles) {
        // Move
        p.x += p.vx;
        p.y += p.vy + Math.sin(state.time + p.phase) * 0.09;
        if (p.isStar) p.rotation += p.rotSpeed;

        // Wrap around edges
        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        if (p.y > h + 20) p.y = -20;

        // Twinkle: drift toward target, then pick new target
        p.alpha += (p.targetAlpha - p.alpha) * p.fadeSpeed;
        if (Math.abs(p.alpha - p.targetAlpha) < 0.005) {
          p.targetAlpha = cfg.minAlpha + Math.random() * (cfg.maxAlpha - cfg.minAlpha);
        }

        // Draw
        const [r, g, b] = p.color;
        ctx.fillStyle = `rgba(${r},${g},${b},${p.alpha.toFixed(3)})`;

        if (p.isStar) {
          drawStar(ctx, p.x, p.y, p.r, p.rotation);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        }
        ctx.fill();
      }
    };

    state.animId = requestAnimationFrame(draw);

    // Also re-init when bg changes via custom event
    const onBgChange = () => {
      const theme = getCurrentTheme();
      state.theme = null; // force reinit on next frame
      state.particles = theme && theme in THEMES
        ? buildParticles(theme as ThemeKey, canvas.width, canvas.height)
        : [];
    };
    window.addEventListener("atheles-bg-change", onBgChange);

    return () => {
      cancelAnimationFrame(state.animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("atheles-bg-change", onBgChange);
    };
  }, [prefersReducedMotion, buildParticles]);

  if (prefersReducedMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: 0 }}
    />
  );
}

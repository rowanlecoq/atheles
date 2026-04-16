"use client";

import { useCallback, useEffect, useRef } from "react";
import { useReducedMotion } from "lib/hooks/use-reduced-motion";

type Particle = {
  x: number; y: number;
  vx: number; vy: number;
  r: number;
  alpha: number; targetAlpha: number; fadeSpeed: number;
  color: [number, number, number];
  isStar: boolean;
  rotation: number; rotSpeed: number;
  phase: number;
};

// Per-theme particle config — gold, midnight, sunset use star shapes for sparkle
const THEMES = {
  gold: {
    count: 70,
    colors: [[255, 218, 42], [232, 182, 28], [255, 240, 90], [218, 165, 18], [248, 205, 58]] as [number,number,number][],
    minR: 1.0, maxR: 3.5,
    minAlpha: 0.07, maxAlpha: 0.75,
    speed: 0.06, isStar: true,
  },
  water: {
    count: 65,
    colors: [[0, 215, 242], [55, 228, 255], [100, 235, 250], [0, 185, 218], [140, 245, 255]] as [number,number,number][],
    minR: 1.0, maxR: 3.5,
    minAlpha: 0.05, maxAlpha: 0.30,
    speed: 0.12, isStar: false,
  },
  tropical: {
    count: 65,
    colors: [[0, 205, 245], [12, 205, 95], [252, 155, 28], [0, 175, 225], [58, 218, 168]] as [number,number,number][],
    minR: 1.0, maxR: 3.5,
    minAlpha: 0.05, maxAlpha: 0.32,
    speed: 0.11, isStar: false,
  },
  midnight: {
    count: 150,
    colors: [[255, 255, 255], [218, 175, 255], [255, 175, 228], [192, 148, 255], [248, 215, 255]] as [number,number,number][],
    minR: 1.0, maxR: 3.5,
    minAlpha: 0.06, maxAlpha: 0.82,
    speed: 0.04, isStar: true,
  },
  sunset: {
    count: 70,
    colors: [[255, 168, 188], [255, 185, 95], [205, 142, 255], [255, 148, 75], [242, 188, 228]] as [number,number,number][],
    minR: 1.0, maxR: 3.5,
    minAlpha: 0.06, maxAlpha: 0.75,
    speed: 0.07, isStar: true,
  },
} as const;

type ThemeKey = keyof typeof THEMES;

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, outerR: number, rotation: number) {
  const innerR = outerR * 0.35;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i * Math.PI) / 4 + rotation;
    if (i === 0) ctx.moveTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
    else ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
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
    // Use Math.round (not ceil) so cols*rows ≈ count with no partial last row
    const cols = Math.max(1, Math.round(Math.sqrt(cfg.count * (w / h))));
    const rows = Math.max(1, Math.round(cfg.count / cols));
    const total = cols * rows; // exact fill — no sparse last row
    const cellW = w / cols;
    const cellH = h / rows;
    return Array.from({ length: total }, (_, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const color = cfg.colors[i % cfg.colors.length]!;
      return {
        x: col * cellW + Math.random() * cellW,
        y: row * cellH + Math.random() * cellH,
        vx: (Math.random() - 0.5) * cfg.speed,
        vy: (Math.random() - 0.5) * cfg.speed * 0.5,
        r: cfg.minR + Math.random() * (cfg.maxR - cfg.minR),
        alpha: cfg.minAlpha + Math.random() * (cfg.maxAlpha - cfg.minAlpha),
        targetAlpha: cfg.minAlpha + Math.random() * (cfg.maxAlpha - cfg.minAlpha),
        fadeSpeed: 0.003 + Math.random() * 0.010,
        color,
        isStar: cfg.isStar,
        rotation: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 0.005,
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

    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // Debounced rebuild so address-bar show/hide on mobile doesn't leave sparse areas
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (state.theme && state.theme in THEMES) {
          state.particles = buildParticles(state.theme as ThemeKey, canvas.width, canvas.height);
        }
      }, 250);
    };
    resize();
    window.addEventListener("resize", resize);

    const getTheme = () => document.body.getAttribute("data-bg") as ThemeKey | null;

    const draw = () => {
      state.animId = requestAnimationFrame(draw);
      const theme = getTheme();

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

      state.time += 0.007;
      const cfg = THEMES[theme as ThemeKey];

      for (const p of state.particles) {
        p.x += p.vx;
        p.y += p.vy + Math.sin(state.time + p.phase) * 0.08;
        if (p.isStar) p.rotation += p.rotSpeed;

        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        if (p.y > h + 20) p.y = -20;

        p.alpha += (p.targetAlpha - p.alpha) * p.fadeSpeed;
        if (Math.abs(p.alpha - p.targetAlpha) < 0.004) {
          p.targetAlpha = cfg.minAlpha + Math.random() * (cfg.maxAlpha - cfg.minAlpha);
        }

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

    const onBgChange = () => {
      const t = getTheme();
      // Skip expensive particle rebuild if theme hasn't actually changed
      if (t === state.theme) return;
      state.theme = t;
      state.particles = t && t in THEMES
        ? buildParticles(t as ThemeKey, canvas.width, canvas.height)
        : [];
    };
    window.addEventListener("atheles-bg-change", onBgChange);

    return () => {
      cancelAnimationFrame(state.animId);
      if (resizeTimer) clearTimeout(resizeTimer);
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

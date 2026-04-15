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

// Per-theme particle config — all non-star themes use the same size range for consistency
const THEMES = {
  gold: {
    count: 50,
    colors: [[215, 175, 55], [245, 225, 145], [255, 210, 80], [190, 155, 60], [255, 240, 160]] as [number,number,number][],
    minR: 1.0, maxR: 3.5,
    minAlpha: 0.06, maxAlpha: 0.26,
    speed: 0.10, isStar: false,
  },
  water: {
    count: 50,
    colors: [[0, 200, 218], [40, 220, 248], [95, 225, 242], [0, 172, 198], [120, 240, 255]] as [number,number,number][],
    minR: 1.0, maxR: 3.5,
    minAlpha: 0.06, maxAlpha: 0.26,
    speed: 0.12, isStar: false,
  },
  tropical: {
    count: 50,
    colors: [[28, 202, 80], [0, 168, 60], [228, 135, 22], [18, 170, 235], [100, 220, 130]] as [number,number,number][],
    minR: 1.0, maxR: 3.5,
    minAlpha: 0.06, maxAlpha: 0.26,
    speed: 0.11, isStar: false,
  },
  midnight: {
    count: 130,
    colors: [[255, 255, 255], [220, 185, 255], [255, 185, 225], [200, 160, 255], [255, 220, 255]] as [number,number,number][],
    minR: 1.0, maxR: 3.5,
    minAlpha: 0.06, maxAlpha: 0.80,
    speed: 0.04, isStar: true,
  },
  sunset: {
    count: 50,
    colors: [[255, 80, 140], [255, 130, 45], [185, 65, 215], [255, 100, 80], [255, 160, 80]] as [number,number,number][],
    minR: 1.0, maxR: 3.5,
    minAlpha: 0.06, maxAlpha: 0.26,
    speed: 0.10, isStar: false,
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
    const cols = Math.max(1, Math.ceil(Math.sqrt(cfg.count * (w / h))));
    const rows = Math.ceil(cfg.count / cols);
    const cellW = w / cols;
    const cellH = h / rows;
    return Array.from({ length: cfg.count }, (_, i) => {
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

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
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
      state.theme = null;
      state.particles = t && t in THEMES
        ? buildParticles(t as ThemeKey, canvas.width, canvas.height)
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

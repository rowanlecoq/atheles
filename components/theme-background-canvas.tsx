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

type ShineState = { pos: number; wait: number };

// Per-theme config — opacities intentionally subtle to match site aesthetic
const THEMES = {
  gold: {
    count: 55,
    colors: [[210, 170, 50], [185, 155, 75], [240, 220, 140], [160, 130, 55]] as [number,number,number][],
    minR: 1.0, maxR: 3.8,
    minAlpha: 0.02, maxAlpha: 0.11,
    speed: 0.12, isStar: false, shine: false,
  },
  water: {
    count: 55,
    colors: [[0, 190, 205], [0, 130, 200], [90, 215, 230], [0, 165, 190]] as [number,number,number][],
    minR: 1.0, maxR: 4.2,
    minAlpha: 0.02, maxAlpha: 0.14,
    speed: 0.15, isStar: false, shine: true,
  },
  tropical: {
    count: 58,
    colors: [[12, 185, 85], [0, 150, 195], [220, 130, 20], [55, 200, 115]] as [number,number,number][],
    minR: 1.0, maxR: 4.2,
    minAlpha: 0.02, maxAlpha: 0.14,
    speed: 0.13, isStar: false, shine: true,
  },
  midnight: {
    count: 100,
    colors: [[255, 255, 255], [215, 175, 255], [255, 175, 215], [195, 155, 255]] as [number,number,number][],
    minR: 0.7, maxR: 3.5,
    minAlpha: 0.03, maxAlpha: 0.65,
    speed: 0.05, isStar: true, shine: false,
  },
  sunset: {
    count: 55,
    colors: [[210, 65, 120], [210, 120, 40], [165, 55, 195], [210, 95, 75]] as [number,number,number][],
    minR: 1.0, maxR: 3.8,
    minAlpha: 0.02, maxAlpha: 0.12,
    speed: 0.12, isStar: false, shine: false,
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
    shine: ShineState | null;
  }>({ particles: [], animId: 0, theme: null, time: 0, shine: null });
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
        state.shine = null;
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

      // Draw particles
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

      // Shine sweep for ocean and tropical
      if (cfg.shine) {
        if (!state.shine) state.shine = { pos: -0.15, wait: 220 };
        const s = state.shine;

        if (s.wait > 0) {
          s.wait--;
        } else {
          s.pos += 0.0012;

          // Fade envelope: ramp in over first 15%, full through middle, ramp out last 15%
          const norm = (s.pos + 0.15) / 1.45;
          const env = norm < 0.15 ? norm / 0.15 : norm > 0.85 ? (1 - norm) / 0.15 : 1;
          const opacity = Math.max(0, Math.min(1, env)) * 0.22;

          if (opacity > 0.002) {
            const cx = s.pos * w;
            const beamW = w * 0.12;
            const shineRGB = theme === "water" ? "145,235,245" : "160,245,185";

            ctx.save();
            ctx.translate(cx, h * 0.5);
            ctx.rotate(-Math.PI / 7); // ~26° tilt
            const grad = ctx.createLinearGradient(-beamW, 0, beamW, 0);
            grad.addColorStop(0,   `rgba(${shineRGB},0)`);
            grad.addColorStop(0.35, `rgba(${shineRGB},${(opacity * 0.5).toFixed(3)})`);
            grad.addColorStop(0.5,  `rgba(${shineRGB},${opacity.toFixed(3)})`);
            grad.addColorStop(0.65, `rgba(${shineRGB},${(opacity * 0.5).toFixed(3)})`);
            grad.addColorStop(1,   `rgba(${shineRGB},0)`);
            ctx.fillStyle = grad;
            ctx.fillRect(-beamW, -h * 1.5, beamW * 2, h * 3);
            ctx.restore();
          }

          if (s.pos > 1.3) {
            s.pos = -0.15;
            s.wait = 280 + Math.floor(Math.random() * 220); // ~5–8 s cooldown at 60fps
          }
        }
      } else {
        state.shine = null;
      }
    };

    state.animId = requestAnimationFrame(draw);

    const onBgChange = () => {
      const t = getTheme();
      state.theme = null;
      state.shine = null;
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

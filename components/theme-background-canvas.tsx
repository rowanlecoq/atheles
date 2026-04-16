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
    colors: [[255, 210, 60], [220, 185, 90], [255, 240, 160], [190, 160, 80]] as [number,number,number][],
    minR: 1.0, maxR: 3.5,
    minAlpha: 0.04, maxAlpha: 0.72,
    speed: 0.06, isStar: true,
  },
  water: {
    count: 65,
    colors: [[0, 225, 240], [0, 170, 230], [120, 245, 255], [0, 195, 215]] as [number,number,number][],
    minR: 1.0, maxR: 3.5,
    minAlpha: 0.04, maxAlpha: 0.24,
    speed: 0.12, isStar: false,
  },
  tropical: {
    count: 70,
    colors: [[20, 215, 100], [0, 175, 230], [255, 155, 30], [80, 235, 140]] as [number,number,number][],
    minR: 1.0, maxR: 3.5,
    minAlpha: 0.04, maxAlpha: 0.24,
    speed: 0.14, isStar: false,
  },
  midnight: {
    count: 130,
    colors: [[255, 255, 255], [225, 185, 255], [255, 185, 225], [210, 165, 255]] as [number,number,number][],
    minR: 1.0, maxR: 3.5,
    minAlpha: 0.04, maxAlpha: 0.78,
    speed: 0.04, isStar: true,
  },
  sunset: {
    count: 70,
    colors: [[255, 90, 145], [255, 145, 50], [200, 75, 225], [255, 125, 90]] as [number,number,number][],
    minR: 1.0, maxR: 3.5,
    minAlpha: 0.04, maxAlpha: 0.72,
    speed: 0.07, isStar: true,
  },
} as const;

type ThemeKey = keyof typeof THEMES;

// Diagonal light rays — water caustics for ocean, sun rays for tropical.
//
// Each ray is drawn as 4 layered strips (tight core → wide halo) to create
// a Gaussian-like soft falloff on every browser. This means old iOS Safari
// (which ignores ctx.filter entirely) still sees blurry-looking beams.
// On supporting browsers (Chrome 47+, Safari 18+, FF 49+) ctx.filter adds
// extra blur on top for an even softer result.
function drawRays(ctx: CanvasRenderingContext2D, w: number, h: number, theme: ThemeKey, time: number) {
  const hasFilter = "filter" in ctx;
  // hMult=strip height multiplier, opMult=opacity multiplier per layer
  // Together these form a bell-curve profile in the vertical direction
  const layers = [
    { hMult: 0.25, opMult: 1.00 },
    { hMult: 0.60, opMult: 0.45 },
    { hMult: 1.40, opMult: 0.18 },
    { hMult: 2.80, opMult: 0.06 },
  ] as const;

  if (theme === "water") {
    if (hasFilter) ctx.filter = "blur(14px)";
    for (let i = 0; i < 8; i++) {
      const angle = (-10 + i * 3) * (Math.PI / 180);
      const baseH = 35 + (i % 4) * 12;
      const baseOp = 0.048 + (i % 3) * 0.016;
      const cy = h * (0.05 + i * 0.12) + Math.sin(time * 0.4 + i) * 20;
      ctx.save();
      ctx.translate(w / 2, cy);
      ctx.rotate(angle);
      for (const { hMult, opMult } of layers) {
        const lh = baseH * hMult;
        const op = baseOp * opMult;
        const g = ctx.createLinearGradient(-w * 1.5, 0, w * 1.5, 0);
        g.addColorStop(0,    "transparent");
        g.addColorStop(0.15, `rgba(34,211,238,${op.toFixed(4)})`);
        g.addColorStop(0.5,  `rgba(6,182,212,${(op * 1.4).toFixed(4)})`);
        g.addColorStop(0.85, `rgba(34,211,238,${op.toFixed(4)})`);
        g.addColorStop(1,    "transparent");
        ctx.fillStyle = g;
        ctx.fillRect(-w * 1.5, -lh / 2, w * 3, lh);
      }
      ctx.restore();
    }
    if (hasFilter) ctx.filter = "none";
  }

  if (theme === "tropical") {
    if (hasFilter) ctx.filter = "blur(10px)";
    for (let i = 0; i < 5; i++) {
      const angle = (25 + i * 3) * (Math.PI / 180);
      const baseH = 30 + i * 10;
      const baseOp = 0.055 + i * 0.008;
      const cy = h * (0.08 + i * 0.18) + Math.sin(time * 0.35 + i * 1.5) * 15;
      const rgb = i % 2 === 1 ? "245,158,11" : "16,185,129";
      ctx.save();
      ctx.translate(w / 2, cy);
      ctx.rotate(angle);
      for (const { hMult, opMult } of layers) {
        const lh = baseH * hMult;
        const op = baseOp * opMult;
        const g = ctx.createLinearGradient(-w * 1.5, 0, w * 1.5, 0);
        g.addColorStop(0,   "transparent");
        g.addColorStop(0.2, `rgba(${rgb},${op.toFixed(4)})`);
        g.addColorStop(0.5, `rgba(${rgb},${(op * 1.5).toFixed(4)})`);
        g.addColorStop(0.8, `rgba(${rgb},${op.toFixed(4)})`);
        g.addColorStop(1,   "transparent");
        ctx.fillStyle = g;
        ctx.fillRect(-w * 1.5, -lh / 2, w * 3, lh);
      }
      ctx.restore();
    }
    if (hasFilter) ctx.filter = "none";
  }
}

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
    let firstResize = true;
    let lastW = 0;
    let lastH = 0;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // Skip rebuild entirely on initial call — draw loop handles the first particle build
      if (firstResize) { firstResize = false; lastW = canvas.width; lastH = canvas.height; return; }
      // Ignore height-only changes < 150px (iOS address-bar show/hide adds ~50px).
      // Canvas dimensions still update so drawing isn't distorted, but we don't
      // restart the particle animation — no glitch, no expand flash.
      const wDelta = Math.abs(canvas.width - lastW);
      const hDelta = Math.abs(canvas.height - lastH);
      if (wDelta < 30 && hDelta < 150) return;
      lastW = canvas.width;
      lastH = canvas.height;
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

      // Draw diagonal light rays beneath the particles (ocean + tropical)
      drawRays(ctx, w, h, theme as ThemeKey, state.time);

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

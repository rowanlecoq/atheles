"use client";

import { useCallback, useLayoutEffect, useRef } from "react";
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
// Each ray is a SINGLE very wide strip (180–300 px) at very low opacity.
// Adjacent strips overlap, blending into each other rather than appearing
// as distinct bands. The result is atmospheric diagonal tinting, not lines.
//
// ctx.filter blur is applied on supporting browsers (Chrome 47+, Safari 18+,
// FF 49+) for extra softness. On older iOS Safari (no ctx.filter) the wide
// overlapping strips already look hazy and diffuse at these low opacities.
// Gaussian-like weights for 7-pass blur simulation on mobile.
const BLUR_OFFSETS  = [-18, -12, -6,  0,  6, 12, 18] as const;
const BLUR_WEIGHTS  = [0.25, 0.55, 0.82, 1.0, 0.82, 0.55, 0.25] as const;
const BLUR_WEIGHT_SUM = BLUR_WEIGHTS.reduce((s, w) => s + w, 0); // ≈ 4.24

function drawBeam(
  ctx: CanvasRenderingContext2D,
  w: number,
  cy: number, angle: number, stripH: number, opacity: number,
  rgbaEdge: (o: number) => string,
  rgbaMid:  (o: number) => string,
  hasFilter: boolean,
) {
  if (hasFilter) {
    ctx.save();
    ctx.translate(w / 2, cy);
    ctx.rotate(angle);
    const g = ctx.createLinearGradient(-w * 1.5, 0, w * 1.5, 0);
    g.addColorStop(0,   "transparent");
    g.addColorStop(0.1, rgbaEdge(opacity));
    g.addColorStop(0.5, rgbaMid(opacity * 1.35));
    g.addColorStop(0.9, rgbaEdge(opacity));
    g.addColorStop(1,   "transparent");
    ctx.fillStyle = g;
    ctx.fillRect(-w * 1.5, -stripH / 2, w * 3, stripH);
    ctx.restore();
  } else {
    // Stack 7 thin strips at Gaussian-weighted offsets to simulate blur.
    // Each strip contributes (weight / weightSum) of the total opacity so
    // the centre — where all strips overlap — equals the target opacity.
    for (let p = 0; p < 7; p++) {
      const o = opacity * (BLUR_WEIGHTS[p]! / BLUR_WEIGHT_SUM);
      ctx.save();
      ctx.translate(w / 2, cy + BLUR_OFFSETS[p]!);
      ctx.rotate(angle);
      const g = ctx.createLinearGradient(-w * 1.5, 0, w * 1.5, 0);
      g.addColorStop(0,   "transparent");
      g.addColorStop(0.1, rgbaEdge(o));
      g.addColorStop(0.5, rgbaMid(o * 1.35));
      g.addColorStop(0.9, rgbaEdge(o));
      g.addColorStop(1,   "transparent");
      ctx.fillStyle = g;
      ctx.fillRect(-w * 1.5, -stripH / 2, w * 3, stripH);
      ctx.restore();
    }
  }
}

function drawRays(ctx: CanvasRenderingContext2D, w: number, h: number, theme: ThemeKey, time: number) {
  const hasFilter = "filter" in ctx;
  if (hasFilter) ctx.filter = "blur(20px)";

  if (theme === "water") {
    for (let i = 0; i < 8; i++) {
      const angle   = (-10 + i * 3) * (Math.PI / 180);
      const stripH  = 30 + (i % 4) * 10;   // 30–60 px — narrow
      const opacity = 0.055 + (i % 3) * 0.018;
      const cy = h * (0.05 + i * 0.12) + Math.sin(time * 0.4 + i) * 20;
      drawBeam(ctx, w, cy, angle, stripH, opacity,
        (o) => `rgba(34,211,238,${o.toFixed(4)})`,
        (o) => `rgba(6,182,212,${o.toFixed(4)})`,
        hasFilter);
    }
  }

  if (theme === "tropical") {
    for (let i = 0; i < 5; i++) {
      const angle   = (25 + i * 3) * (Math.PI / 180);
      const stripH  = 30 + i * 10;          // 30–70 px
      const opacity = 0.060 + i * 0.015;
      const cy = h * (0.08 + i * 0.18) + Math.sin(time * 0.35 + i * 1.5) * 15;
      const rgb = i % 2 === 1 ? "245,158,11" : "16,185,129";
      drawBeam(ctx, w, cy, angle, stripH, opacity,
        (o) => `rgba(${rgb},${o.toFixed(4)})`,
        (o) => `rgba(${rgb},${o.toFixed(4)})`,
        hasFilter);
    }
  }

  if (hasFilter) ctx.filter = "none";
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

  useLayoutEffect(() => {
    if (prefersReducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const state = stateRef.current;
    // Read matchMedia directly — don't rely on isTouch state which only updates
    // after paint (useEffect), causing the animated desktop path to briefly run.
    const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;

    const getTheme = () => document.body.getAttribute("data-bg") as ThemeKey | null;

    // Touch devices: the canvas is server-rendered as an empty transparent element.
    // The browser paints before JS runs, so any drawing we do here appears AFTER
    // the initial paint — visible as a lighting change. Skip all drawing on touch
    // so the CSS gradient is the sole background with no transition.
    if (isTouchDevice) return;

    // Animated path (desktop)
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    let firstResize = true;
    let lastW = 0;
    let lastH = 0;
    const resize = () => {
      const newW = window.innerWidth;
      const newH = window.innerHeight;
      // Initial call: set dimensions and bail — prime draw handles first particle build.
      if (firstResize) {
        canvas.width = newW;
        canvas.height = newH;
        firstResize = false; lastW = newW; lastH = newH; return;
      }
      // Delta check BEFORE touching canvas dimensions. Setting canvas.width/height
      // always clears the canvas even when the value is unchanged — so iOS address-bar
      // show/hide (±50px height change) was blanking the canvas every scroll event.
      const wDelta = Math.abs(newW - lastW);
      const hDelta = Math.abs(newH - lastH);
      if (wDelta < 30 && hDelta < 150) return;
      canvas.width = newW;
      canvas.height = newH;
      lastW = newW;
      lastH = newH;
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (state.theme && state.theme in THEMES) {
          state.particles = buildParticles(state.theme as ThemeKey, canvas.width, canvas.height);
        }
      }, 250);
    };
    resize();
    window.addEventListener("resize", resize);

    // Rendering logic separated from loop scheduling so it can be called once
    // synchronously (prime draw) before the browser's first paint, eliminating
    // the brief flash where the canvas is blank.
    const renderFrame = () => {
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

    const loop = () => {
      state.animId = requestAnimationFrame(loop);
      renderFrame();
    };

    // Prime the canvas synchronously — fires before first browser paint so there
    // is never a frame where the canvas is blank on top of the CSS gradient.
    renderFrame();
    state.animId = requestAnimationFrame(loop);

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
      className="pointer-events-none fixed inset-0 animate-canvas-reveal"
      style={{ zIndex: 0 }}
    />
  );
}

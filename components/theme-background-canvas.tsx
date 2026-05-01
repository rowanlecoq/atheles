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

// Mobile gradient background data — mirrors CSS --theme-gradient values.
// On touch devices the canvas paints its own background so there is a single
// composited layer instead of a CSS div + canvas fighting each other.
//
// Layers are listed bottom-to-top (reverse of CSS stack order).
// Radial entry: [cx, cy, rx, ry,  r,   g,   b,   alpha, fadeStop]
//   cx/cy = center as fraction of canvas w/h
//   rx/ry = half-radii as fractions (CSS size 140% → rx = 0.70)
//   fadeStop = gradient stop where color reaches 0 (matches "transparent N%")
type RLayer = readonly [number,number,number,number,number,number,number,number,number];
type LStop  = readonly [number,number,number,number,number]; // r,g,b,a,pos
const MOBILE_BG: Record<ThemeKey, { base: string; radial: RLayer[]; linear?: LStop[] }> = {
  gold: { base: '#110e04', radial: [
    [0.50, 1.00, 1.00, 0.50, 180, 140,  60, 0.40, 0.60],
    [0.50, 0.30, 0.65, 0.50, 220, 200, 140, 0.16, 0.55], // cx centred (was 0.60)
    [0.50, 0.50, 0.55, 0.55, 220, 200, 140, 0.18, 0.55],
    [0.70, 0.65, 0.60, 0.70, 180, 140,  60, 0.26, 0.60],
    [0.50, 0.35, 0.70, 0.60, 193, 163, 104, 0.34, 0.60], // cx centred (was 0.30)
  ]},
  water: { base: '#020a10', radial: [
    [0.50, 1.00, 1.00, 0.50,  20, 100, 200, 0.40, 0.60],
    [0.50, 0.70, 0.65, 0.50,   0, 160, 200, 0.16, 0.55], // cx centred (was 0.15)
    [0.50, 0.50, 0.55, 0.55,  40, 210, 240, 0.18, 0.55],
    [0.70, 0.65, 0.60, 0.70,  20, 100, 200, 0.26, 0.60],
    [0.50, 0.35, 0.70, 0.60,  30, 180, 220, 0.30, 0.60], // cx centred (was 0.30)
  ]},
  tropical: { base: '#020b05', radial: [
    [0.50, 1.00, 1.20, 0.55,  16, 185, 129, 0.32, 0.65],  // bottom wide green wash
    [0.78, 0.72, 0.72, 0.55, 250, 180,  50, 0.22, 0.58],  // lower-right amber haze
    [0.50, 0.48, 0.68, 0.68,  20, 200, 160, 0.20, 0.58],  // centre teal (wider, softer)
    [0.48, 0.22, 0.68, 0.72, 245, 158,  11, 0.24, 0.62],  // upper-centre amber (softer)
    [0.18, 0.65, 0.82, 0.68,  16, 185, 129, 0.28, 0.62],  // left green (was 0.70 → 0.28)
  ]},
  midnight: { base: '#04000a', radial: [
    [0.50, 1.00, 1.00, 0.50,  70,  50, 200, 0.50, 0.60],
    [0.50, 0.15, 0.55, 0.45, 100,  30, 200, 0.45, 0.55], // cx centred, cy lifted (was 0.20,0.05)
    [0.50, 0.50, 0.55, 0.55, 110,  60, 240, 0.42, 0.55],
    [0.70, 0.65, 0.60, 0.70,  80,  80, 220, 0.55, 0.60],
    [0.50, 0.35, 0.70, 0.60,  50,  30, 140, 0.70, 0.60], // cx centred (was 0.30)
  ]},
  sunset: { base: '#0e0206', radial: [
    [0.50, 1.00, 1.00, 0.50, 249, 115,  22, 0.45, 0.60],  // orange bottom
    [0.20, 0.12, 0.55, 0.52, 147,  51, 234, 0.50, 0.60],  // violet upper-left
    [0.78, 0.28, 0.65, 0.55, 255,  80, 150, 0.52, 0.60],  // hot pink upper-right
    [0.15, 0.52, 0.60, 0.55, 219,  39, 119, 0.44, 0.55],  // deep pink mid-left
    [0.80, 0.68, 0.55, 0.55, 255, 100, 160, 0.36, 0.55],  // pink lower-right
    [0.50, 0.55, 1.00, 0.28, 249, 115,  22, 0.26, 0.55],  // orange center wash
  ], linear: [
    [147,  51, 234, 0.28, 0.00],  // violet at top
    [147,  51, 234, 0.00, 0.35],  // fade to transparent
    [249, 115,  22, 0.00, 0.68],  // transparent
    [249, 115,  22, 0.24, 1.00],  // orange at bottom
  ]},
};

// Draw the theme gradient directly onto the canvas (used on mobile so the
// gradient + particles are a single composited layer with no CSS overlay fighting it).
function drawGradientBg(ctx: CanvasRenderingContext2D, w: number, h: number, theme: ThemeKey) {
  const T = MOBILE_BG[theme];
  ctx.fillStyle = T.base;
  ctx.fillRect(0, 0, w, h);
  for (const [cx, cy, rx, ry, r, g, b, a, fade] of T.radial) {
    const px = cx * w, py = cy * h;
    const prx = rx * w, pry = ry * h;
    ctx.save();
    ctx.translate(px, py);
    ctx.scale(prx, pry);
    const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    gr.addColorStop(0,    `rgba(${r},${g},${b},${a})`);
    gr.addColorStop(fade, `rgba(${r},${g},${b},0)`);
    if (fade < 1) gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = gr;
    ctx.fillRect(-1, -1, 2, 2);
    ctx.restore();
  }
  if (T.linear) {
    const lg = ctx.createLinearGradient(0, 0, 0, h);
    for (const [r, g, b, a, pos] of T.linear) lg.addColorStop(pos, `rgba(${r},${g},${b},${a})`);
    ctx.fillStyle = lg;
    ctx.fillRect(0, 0, w, h);
  }
}

// Diagonal light rays — water caustics for ocean, sun rays for tropical.
const BLUR_OFFSETS  = [-18, -12, -6,  0,  6, 12, 18] as const;
const BLUR_WEIGHTS  = [0.25, 0.55, 0.82, 1.0, 0.82, 0.55, 0.25] as const;
const BLUR_WEIGHT_SUM = BLUR_WEIGHTS.reduce((s, w) => s + w, 0);

function drawBeam(
  ctx: CanvasRenderingContext2D,
  w: number,
  cx: number, // horizontal origin as fraction of width (0–1)
  cy: number, angle: number, stripH: number, opacity: number,
  rgbaEdge: (o: number) => string,
  rgbaMid:  (o: number) => string,
  hasFilter: boolean,
) {
  if (hasFilter) {
    ctx.save();
    ctx.translate(w * cx, cy);
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
    for (let p = 0; p < 7; p++) {
      const o = opacity * (BLUR_WEIGHTS[p]! / BLUR_WEIGHT_SUM);
      ctx.save();
      ctx.translate(w * cx, cy + BLUR_OFFSETS[p]!);
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
      const stripH  = 30 + (i % 4) * 10;
      const opacity = 0.055 + (i % 3) * 0.018;
      const cy = h * (0.05 + i * 0.12) + Math.sin(time * 0.4 + i) * 20;
      drawBeam(ctx, w, 0.5, cy, angle, stripH, opacity,
        (o) => `rgba(34,211,238,${o.toFixed(4)})`,
        (o) => `rgba(6,182,212,${o.toFixed(4)})`,
        hasFilter);
    }
  }

  if (theme === "tropical") {
    // Spread rays horizontally across the canvas, all going same ~30° direction
    for (let i = 0; i < 9; i++) {
      const cx    = 0.03 + i * 0.115;   // evenly spaced 3% → 99% of width
      const angle = (28 + i * 1.5) * (Math.PI / 180); // ~28°–41°, gentle variation
      const stripH  = 38 + i * 10;
      const opacity = 0.048 + (i % 3) * 0.018;
      const cy = h * (0.48 + (i % 3) * 0.06) + Math.sin(time * 0.35 + i * 1.5) * 18;
      const rgb = i % 3 === 0 ? "16,185,129" : i % 3 === 1 ? "245,158,11" : "0,210,175";
      drawBeam(ctx, w, cx, cy, angle, stripH, opacity,
        (o) => `rgba(${rgb},${o.toFixed(4)})`,
        (o) => `rgba(${rgb},${o.toFixed(4)})`,
        hasFilter);
    }
  }

  if (theme === "sunset") {
    for (let i = 0; i < 6; i++) {
      const angle   = (-12 + i * 4.5) * (Math.PI / 180);
      const stripH  = 28 + i * 7;
      const opacity = 0.048 + i * 0.010;
      const cy = h * (0.06 + i * 0.16) + Math.sin(time * 0.28 + i * 1.3) * 14;
      const rgb = i % 3 === 0 ? "147,51,234" : i % 3 === 1 ? "255,80,150" : "255,130,60";
      drawBeam(ctx, w, 0.5, cy, angle, stripH, opacity,
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
  const isTouch = window.matchMedia("(pointer: coarse)").matches;
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
    const count = isTouch ? Math.round(cfg.count * 0.5) : cfg.count;
    const cols = Math.max(1, Math.round(Math.sqrt(count * (w / h))));
    const rows = Math.max(1, Math.round(count / cols));
    const total = cols * rows;
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
  }, [isTouch]);

  useLayoutEffect(() => {
    if (prefersReducedMotion || isTouch) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const state = stateRef.current;

    const getTheme = () => document.body.getAttribute("data-bg") as ThemeKey | null;

    // Detect Chrome Android. On Chrome Android 100lvh changes when the URL bar
    // shows/hides, stretching any bitmap sized to it (zoom artefact). GPU canvas
    // layers also desync from the scroll compositor, making the gradient slide.
    const ua = navigator.userAgent;
    const isChromeAndroid = isTouch &&
      /Chrome\//.test(ua) && /Android/.test(ua) &&
      !/EdgA\/|OPR\/|SamsungBrowser\//.test(ua);

    // Promote the canvas to a GPU compositing layer on non-Android devices.
    // On Chrome Android we deliberately skip this (see below) because
    // will-change:transform creates an opaque GPU backing store that sits above
    // the CSS gradient overlay and blocks it — even when the canvas pixels are
    // transparent.
    if (!isChromeAndroid) {
      canvas.style.willChange = "transform";
    }

    let vvTimer: ReturnType<typeof setTimeout> | null = null;
    let onVVResize: (() => void) | null = null;

    if (isChromeAndroid) {
      // Chrome Android fix:
      // 1. CSS overlay provides the gradient — it uses CSS background on a
      //    position:fixed element. CSS backgrounds in fixed elements are handled
      //    natively by Chrome's compositor and NEVER flash during scroll, unlike
      //    canvas GPU layers which briefly show an empty backing store.
      // 2. Canvas has no will-change:transform so it is NOT a separate opaque
      //    GPU layer. Without that layer the transparent canvas truly shows
      //    the overlay gradient below instead of blocking it.
      // 3. Canvas only draws particles/rays on a clearRect background.
      // 4. Both overlay and canvas use calc(100svh + 80px) — svh is constant
      //    regardless of URL-bar animation so neither element ever zooms.
      const overlay = document.getElementById("theme-gradient-overlay") as HTMLElement | null;
      if (overlay) {
        // Lock to small-viewport height — svh is constant regardless of URL-bar
        // animation so the gradient never resizes or "grows" during scroll.
        overlay.style.height = "100svh";
      }

      canvas.style.height = "100svh";

      const vv = window.visualViewport;

      // Bitmap height matches svh in px. URL-bar animation only changes the
      // visual viewport height; ignoring it prevents the zoom/grow artefact.
      const svhPx = Math.round(vv ? vv.height : window.innerHeight);
      const initW = document.documentElement.clientWidth;
      canvas.width = initW;
      canvas.height = svhPx;
      if (state.theme && state.theme in THEMES) {
        state.particles = buildParticles(state.theme as ThemeKey, initW, canvas.height);
      }

      // Only rebuild bitmap on genuine orientation change (width changes).
      // URL-bar animation only changes height — ignoring it prevents zoom.
      let lastVVWidth = initW;
      onVVResize = () => {
        const newW = Math.round(vv ? vv.width : document.documentElement.clientWidth);
        if (Math.abs(newW - lastVVWidth) < 20) return;
        lastVVWidth = newW;
        const newH = Math.round(vv ? vv.height : window.innerHeight);
        if (vvTimer) clearTimeout(vvTimer);
        vvTimer = setTimeout(() => {
          canvas.width = newW;
          canvas.height = newH;
          if (state.theme && state.theme in THEMES) {
            state.particles = buildParticles(state.theme as ThemeKey, newW, newH);
          }
        }, 300);
      };

      if (vv) vv.addEventListener("resize", onVVResize, { passive: true });
    }

    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    let firstResize = true;
    let lastW = 0;
    let lastH = 0;
    const resize = () => {
      if (isChromeAndroid) return;
      const newW = document.documentElement.clientWidth;
      let newH = canvas.offsetHeight;
      if (!newH) {
        void document.body.offsetHeight;
        newH = canvas.offsetHeight || window.innerHeight;
      }
      if (firstResize) {
        canvas.width = newW;
        canvas.height = newH;
        firstResize = false; lastW = newW; lastH = newH; return;
      }
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

    let isScrolling = false;
    let scrollTimer: ReturnType<typeof setTimeout> | null = null;
    const onScroll = () => {
      isScrolling = true;
      if (scrollTimer) clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => { isScrolling = false; }, 150);
    };
    if (isChromeAndroid) window.addEventListener("scroll", onScroll, { passive: true });

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

      if (!isChromeAndroid && theme && theme in THEMES) {
        // iOS: canvas draws the gradient (background-attachment:fixed is broken
        // on iOS Safari so CSS alone can't do it correctly).
        drawGradientBg(ctx, w, h, theme as ThemeKey);
      } else {
        // Chrome Android: CSS overlay handles the gradient; canvas is transparent
        // so the overlay shows through. Only particles/rays are drawn here.
        ctx.clearRect(0, 0, w, h);
      }

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

    const TARGET_MS = 1000 / 30; // 30fps cap
    let lastFrameTime = 0;

    const loop = (ts: number) => {
      state.animId = requestAnimationFrame(loop);
      if (document.hidden) return;
      // Chrome Android: skip frame during scroll — keeps the GPU layer stable
      // so the compositor doesn't show a stale or empty texture (the "line").
      if (isChromeAndroid && isScrolling) return;
      if (ts - lastFrameTime < TARGET_MS) return;
      lastFrameTime = ts;
      renderFrame();
    };

    renderFrame();
    state.animId = requestAnimationFrame(loop);

    const onBgChange = () => {
      const t = getTheme();
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
      if (scrollTimer) clearTimeout(scrollTimer);
      window.removeEventListener("resize", resize);
      window.removeEventListener("atheles-bg-change", onBgChange);
      if (isChromeAndroid) {
        window.removeEventListener("scroll", onScroll);
        if (onVVResize) window.visualViewport?.removeEventListener("resize", onVVResize);
      }
      if (vvTimer) clearTimeout(vvTimer);
    };
  }, [prefersReducedMotion, isTouch, buildParticles]);

  if (prefersReducedMotion || isTouch) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 animate-canvas-reveal"
      style={{ zIndex: 0, transform: "translateZ(0)", WebkitBackfaceVisibility: "hidden", backfaceVisibility: "hidden", height: "100svh" }}
    />
  );
}

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
    count: 40,
    colors: [[255, 210, 60], [220, 185, 90], [255, 240, 160], [190, 160, 80]] as [number,number,number][],
    minR: 1.0, maxR: 3.5,
    minAlpha: 0.04, maxAlpha: 0.72,
    speed: 0.06, isStar: true,
  },
  water: {
    count: 38,
    colors: [[0, 225, 240], [0, 170, 230], [120, 245, 255], [0, 195, 215]] as [number,number,number][],
    minR: 1.0, maxR: 3.5,
    minAlpha: 0.04, maxAlpha: 0.24,
    speed: 0.12, isStar: false,
  },
  tropical: {
    count: 40,
    colors: [[20, 230, 110], [0, 195, 255], [255, 175, 30], [80, 255, 160]] as [number,number,number][],
    minR: 1.0, maxR: 3.5,
    minAlpha: 0.06, maxAlpha: 0.55,
    speed: 0.14, isStar: false,
  },
  midnight: {
    count: 60,
    colors: [[255, 255, 255], [225, 185, 255], [255, 185, 225], [210, 165, 255]] as [number,number,number][],
    minR: 1.0, maxR: 3.5,
    minAlpha: 0.04, maxAlpha: 0.78,
    speed: 0.04, isStar: true,
  },
  sunset: {
    count: 40,
    colors: [[255, 90, 145], [255, 145, 50], [200, 75, 225], [255, 125, 90]] as [number,number,number][],
    minR: 1.0, maxR: 3.5,
    minAlpha: 0.04, maxAlpha: 0.72,
    speed: 0.07, isStar: true,
  },
} as const;

type ThemeKey = keyof typeof THEMES;

// Gradient background data used by drawGradientBg on desktop.
// Layers listed bottom-to-top. Radial entry: [cx, cy, rx, ry, r, g, b, alpha, fadeStop]
//   cx/cy = centre as fraction of canvas w/h
//   rx/ry = half-radii as fractions (CSS 140% → rx = 0.70)
//   fadeStop = gradient stop where colour reaches 0
type RLayer = readonly [number,number,number,number,number,number,number,number,number];
type LStop  = readonly [number,number,number,number,number]; // r,g,b,a,pos
const MOBILE_BG: Record<ThemeKey, { base: string; radial: RLayer[]; linear?: LStop[] }> = {
  gold: { base: '#0a0700', radial: [
    [0.50, 0.62, 1.45, 0.80, 190, 158, 88,  0.20, 0.88],  // wide soft warm ambient
    [0.50, 0.48, 0.88, 0.72, 210, 182, 118, 0.32, 0.72],  // brand-gold core (#ccb173 range)
    [0.50, 0.28, 0.55, 0.48, 228, 200, 138, 0.14, 0.65],  // bright upper highlight
  ]},
  water: { base: '#020a10', radial: [
    [0.50, 1.22, 1.00, 0.40,  20, 100, 200, 0.14, 0.48],
    [0.50, 0.70, 0.65, 0.50,   0, 160, 200, 0.16, 0.55],
    [0.50, 0.50, 0.55, 0.55,  40, 210, 240, 0.18, 0.55],
    [0.70, 0.65, 0.60, 0.70,  20, 100, 200, 0.26, 0.60],
    [0.50, 0.35, 0.70, 0.60,  30, 180, 220, 0.30, 0.60],
  ]},
  tropical: { base: '#020d06', radial: [
    [0.50, 0.85, 1.20, 0.50,  10, 130,  72, 0.24, 0.60],  // bottom dark forest green
    [0.78, 0.72, 0.72, 0.55, 255, 190,  50, 0.26, 0.55],  // lower-right amber haze
    [0.50, 0.48, 0.68, 0.68,  12, 155, 100, 0.24, 0.55],  // centre dark teal
    [0.48, 0.22, 0.68, 0.72, 255, 170,  11, 0.27, 0.58],  // upper-centre amber
    [0.18, 0.65, 0.82, 0.68,   8, 138,  78, 0.32, 0.58],  // left dark green
    [0.72, 0.88, 0.65, 0.52, 255, 162,  18, 0.24, 0.56],  // lower-right amber accent
    [0.28, 0.90, 0.62, 0.48,  10, 142,  82, 0.22, 0.58],  // lower-left dark teal
  ]},
  midnight: { base: '#02000c', radial: [
    [0.12, 0.10, 0.62, 0.55,  55,  18, 205, 0.20, 0.72],  // deep indigo top-left
    [0.42, 0.28, 0.70, 0.64,  95,  28, 232, 0.18, 0.75],  // purple upper-center
    [0.72, 0.50, 0.74, 0.68,  15,  52, 210, 0.22, 0.75],  // cobalt blue center-right
    [0.82, 0.78, 0.60, 0.58,  80,  20, 218, 0.20, 0.72],  // deep violet lower-right
    [0.22, 0.70, 0.62, 0.58,  38,  10, 185, 0.16, 0.70],  // navy lower-left
    [0.50, 0.42, 0.68, 0.60, 110,  40, 240, 0.14, 0.68],  // bright violet center
    [0.06, 0.88, 0.55, 0.50,  58,  14, 200, 0.18, 0.68],  // bottom-left fill
  ]},
  sunset: { base: '#0e0206', radial: [
    [0.50, 1.18, 1.10, 0.40, 255, 140,  20, 0.22, 0.48],  // orange bottom horizon
    [0.20, 0.12, 0.55, 0.52, 147,  51, 234, 0.50, 0.60],  // violet upper-left
    [0.78, 0.28, 0.65, 0.55, 255,  80, 150, 0.52, 0.60],  // hot pink upper-right
    [0.15, 0.52, 0.60, 0.55, 219,  39, 119, 0.44, 0.55],  // deep pink mid-left
    [0.80, 0.68, 0.55, 0.55, 255, 100, 160, 0.36, 0.55],  // pink lower-right
    [0.50, 0.55, 1.00, 0.28, 249, 115,  22, 0.26, 0.55],  // orange center wash
  ], linear: [
    [147,  51, 234, 0.28, 0.00],  // violet at top
    [147,  51, 234, 0.00, 0.35],  // fade to transparent
    [249, 115,  22, 0.00, 0.68],  // transparent
    [255, 140,  20, 0.20, 1.00],  // orange at bottom
  ]},
};

// Light-mode palette — same colour families, light base instead of near-black.
// Dark areas become lighter tints of the theme colour; glows stay vibrant.
const LIGHT_BG: Record<ThemeKey, { base: string; radial: RLayer[]; linear?: LStop[] }> = {
  gold: { base: '#faf5e8', radial: [
    [0.50, 0.62, 1.45, 0.80, 175, 135, 45,  0.32, 0.88],  // wide warm amber wash
    [0.50, 0.48, 0.88, 0.72, 200, 162, 72,  0.48, 0.72],  // deep gold core
    [0.50, 0.28, 0.55, 0.48, 215, 182, 92,  0.26, 0.65],  // bright upper bloom
  ]},
  water: { base: '#e4f7ff', radial: [
    [0.50, 1.22, 1.00, 0.40,   0, 110, 200, 0.30, 0.48],
    [0.50, 0.70, 0.65, 0.50,   0, 150, 205, 0.36, 0.55],
    [0.50, 0.50, 0.55, 0.55,  20, 190, 235, 0.40, 0.55],
    [0.70, 0.65, 0.60, 0.70,   0,  90, 195, 0.44, 0.60],
    [0.50, 0.35, 0.70, 0.60,  10, 165, 218, 0.48, 0.60],
  ]},
  tropical: { base: '#e8fdf3', radial: [
    [0.50, 0.85, 1.20, 0.50,   0, 145,  75, 0.38, 0.60],  // bottom green
    [0.78, 0.72, 0.72, 0.55, 240, 175,  20, 0.42, 0.55],  // lower-right amber
    [0.50, 0.48, 0.68, 0.68,   0, 158, 100, 0.38, 0.55],  // centre teal
    [0.48, 0.22, 0.68, 0.72, 235, 158,   0, 0.42, 0.58],  // upper amber
    [0.18, 0.65, 0.82, 0.68,   0, 145,  80, 0.48, 0.58],  // left green
    [0.72, 0.88, 0.65, 0.52, 240, 148,  10, 0.38, 0.56],  // lower-right amber accent
    [0.28, 0.90, 0.62, 0.48,   0, 148,  85, 0.36, 0.58],  // lower-left teal
  ]},
  midnight: { base: '#eee9ff', radial: [
    [0.12, 0.10, 0.62, 0.55,  80,  38, 220, 0.40, 0.72],  // indigo top-left
    [0.42, 0.28, 0.70, 0.64, 118,  48, 248, 0.36, 0.75],  // purple upper-center
    [0.72, 0.50, 0.74, 0.68,  38,  78, 225, 0.42, 0.75],  // cobalt center-right
    [0.82, 0.78, 0.60, 0.58, 105,  40, 240, 0.38, 0.72],  // violet lower-right
    [0.22, 0.70, 0.62, 0.58,  55,  20, 200, 0.30, 0.70],  // navy lower-left
    [0.50, 0.42, 0.68, 0.60, 138,  62, 255, 0.28, 0.68],  // bright violet center
    [0.06, 0.88, 0.55, 0.50,  75,  28, 215, 0.34, 0.68],  // bottom-left fill
  ]},
  sunset: { base: '#fff1f5', radial: [
    [0.50, 1.18, 1.10, 0.40, 255, 140,  20, 0.36, 0.48],  // orange bottom
    [0.20, 0.12, 0.55, 0.52, 155,  55, 248, 0.70, 0.60],  // violet upper-left
    [0.78, 0.28, 0.65, 0.55, 255,  78, 148, 0.70, 0.60],  // hot pink upper-right
    [0.15, 0.52, 0.60, 0.55, 225,  45, 125, 0.58, 0.55],  // deep pink mid-left
    [0.80, 0.68, 0.55, 0.55, 255, 108, 165, 0.54, 0.55],  // pink lower-right
    [0.50, 0.55, 1.00, 0.28, 252, 118,  28, 0.44, 0.55],  // orange center wash
  ], linear: [
    [155,  55, 248, 0.20, 0.00],  // violet tint at top
    [155,  55, 248, 0.00, 0.35],
    [252, 118,  28, 0.00, 0.68],
    [255, 148,  28, 0.16, 1.00],  // orange tint at bottom
  ]},
};

// Draw the theme gradient directly onto the canvas (used on mobile so the
// gradient + particles are a single composited layer with no CSS overlay fighting it).
function drawGradientBg(ctx: CanvasRenderingContext2D, w: number, h: number, theme: ThemeKey, lightMode: boolean) {
  const T = lightMode ? LIGHT_BG[theme] : MOBILE_BG[theme];
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
      const stripH  = 24 + (i % 4) * 8;
      const opacity = 0.060 + (i % 3) * 0.022;
      const cy = h * (0.05 + i * 0.12) + Math.sin(time * 0.4 + i) * 20;
      drawBeam(ctx, w, 0.5, cy, angle, stripH, opacity,
        (o) => `rgba(34,211,238,${o.toFixed(4)})`,
        (o) => `rgba(6,182,212,${o.toFixed(4)})`,
        hasFilter);
    }
    // small bottom-left fill rays — positive angles match main bottom rays (~+8°–+11°)
    const blFill = [
      [0.10, 0.80,  8, 16, 0.040],
      [0.06, 0.90, 10, 20, 0.044],
      [0.15, 0.96, 11, 14, 0.034],
    ] as const;
    for (const [cx, cyF, deg, sH, op] of blFill) {
      const cy = h * cyF + Math.sin(time * 0.3 + cx * 10) * 8;
      drawBeam(ctx, w, cx, cy, deg * (Math.PI / 180), sH, op,
        (o) => `rgba(34,211,238,${o.toFixed(4)})`,
        (o) => `rgba(6,182,212,${o.toFixed(4)})`,
        hasFilter);
    }
  }

  if (theme === "tropical") {
    for (let i = 0; i < 8; i++) {
      const angle  = (-6 + i * 3.5) * (Math.PI / 180);
      const stripH = 28 + (i % 4) * 12;
      const opacity = 0.052 + (i % 3) * 0.018;
      const cy = h * (0.05 + i * 0.12) + Math.sin(time * 0.35 + i * 1.5) * 16;
      const rgb = i % 3 === 0 ? "16,185,129" : i % 3 === 1 ? "245,158,11" : "0,210,175";
      drawBeam(ctx, w, 0.5, cy, angle, stripH, opacity,
        (o) => `rgba(${rgb},${o.toFixed(4)})`,
        (o) => `rgba(${rgb},${o.toFixed(4)})`,
        hasFilter);
    }
  }

  if (theme === "sunset") {
    for (let i = 0; i < 6; i++) {
      const angle   = (-12 + i * 4.5) * (Math.PI / 180);
      const stripH  = 24 + i * 5;
      const opacity = 0.058 + i * 0.012;
      const cy = h * (0.06 + i * 0.16) + Math.sin(time * 0.28 + i * 1.3) * 14;
      const rgb = i % 3 === 0 ? "147,51,234" : i % 3 === 1 ? "255,80,150" : "255,130,60";
      drawBeam(ctx, w, 0.5, cy, angle, stripH, opacity,
        (o) => `rgba(${rgb},${o.toFixed(4)})`,
        (o) => `rgba(${rgb},${o.toFixed(4)})`,
        hasFilter);
    }
    // small bottom-left fill rays — positive angles match main bottom rays (~+6°–+10°)
    const blFill = [
      [0.10, 0.80,  6, 16, 0.040, "255,130,60"],
      [0.06, 0.90,  8, 20, 0.044, "255,80,150"],
      [0.15, 0.96, 10, 14, 0.034, "255,130,60"],
    ] as const;
    for (const [cx, cyF, deg, sH, op, rgb] of blFill) {
      const cy = h * cyF + Math.sin(time * 0.28 + cx * 10) * 8;
      drawBeam(ctx, w, cx, cy, deg * (Math.PI / 180), sH, op,
        (o) => `rgba(${rgb},${o.toFixed(4)})`,
        (o) => `rgba(${rgb},${o.toFixed(4)})`,
        hasFilter);
    }
  }

  if (theme === "gold") {
    // 8 beams, ocean coverage geometry. Colors stay close to brand gold #ccb173
    // (204,177,115) — edge slightly deeper, mid slightly brighter, never yellow.
    for (let i = 0; i < 8; i++) {
      const angle   = (-8 + i * 3) * (Math.PI / 180);
      const stripH  = 24 + (i % 4) * 8;
      const opacity = 0.052 + (i % 3) * 0.018;
      const cy = h * (0.05 + i * 0.12) + Math.sin(time * 0.28 + i) * 20;
      const eRgb = i % 3 === 0 ? "192,162,88"  : i % 3 === 1 ? "200,170,96"  : "184,154,80";
      const mRgb = i % 3 === 0 ? "222,194,128" : i % 3 === 1 ? "230,202,136" : "216,188,120";
      drawBeam(ctx, w, 0.5, cy, angle, stripH, opacity,
        (o) => `rgba(${eRgb},${o.toFixed(4)})`,
        (o) => `rgba(${mRgb},${o.toFixed(4)})`,
        hasFilter);
    }
    const goldFill = [
      [0.10, 0.80,  8, 16, 0.038, "222,194,128", "192,162,88"],
      [0.06, 0.90, 10, 20, 0.042, "216,188,120", "184,154,80"],
      [0.15, 0.96, 11, 14, 0.032, "230,202,136", "200,170,96"],
    ] as const;
    for (const [cx, cyF, deg, sH, op, mRgb, eRgb] of goldFill) {
      const cy = h * cyF + Math.sin(time * 0.28 + cx * 10) * 8;
      drawBeam(ctx, w, cx, cy, deg * (Math.PI / 180), sH, op,
        (o) => `rgba(${eRgb},${o.toFixed(4)})`,
        (o) => `rgba(${mRgb},${o.toFixed(4)})`,
        hasFilter);
    }
  }

  if (theme === "midnight") {
    // 8 beams, ocean coverage geometry. 4-color palette mixes indigo-purple,
    // cobalt blue, deep violet, and soft lavender for a rich multi-tone night sky.
    for (let i = 0; i < 8; i++) {
      const angle   = (-5 + i * 3) * (Math.PI / 180);
      const stripH  = 24 + (i % 4) * 8;
      const opacity = 0.062 + (i % 4) * 0.016;
      const cy = h * (0.05 + i * 0.12) + Math.sin(time * 0.22 + i) * 14;
      const eRgb = i % 4 === 0 ? "75,35,200"   : i % 4 === 1 ? "15,55,205"   : i % 4 === 2 ? "90,22,215"   : "120,68,238";
      const mRgb = i % 4 === 0 ? "155,118,255" : i % 4 === 1 ? "80,138,255"  : i % 4 === 2 ? "148,92,248"  : "188,155,255";
      drawBeam(ctx, w, 0.5, cy, angle, stripH, opacity,
        (o) => `rgba(${eRgb},${o.toFixed(4)})`,
        (o) => `rgba(${mRgb},${o.toFixed(4)})`,
        hasFilter);
    }
    const midFill = [
      [0.10, 0.80, 12, 16, 0.044, "155,118,255", "75,35,200"],
      [0.06, 0.90, 14, 20, 0.048, "80,138,255",  "15,55,205"],
      [0.15, 0.96, 16, 14, 0.038, "148,92,248",  "90,22,215"],
    ] as const;
    for (const [cx, cyF, deg, sH, op, mRgb, eRgb] of midFill) {
      const cy = h * cyF + Math.sin(time * 0.22 + cx * 10) * 8;
      drawBeam(ctx, w, cx, cy, deg * (Math.PI / 180), sH, op,
        (o) => `rgba(${eRgb},${o.toFixed(4)})`,
        (o) => `rgba(${mRgb},${o.toFixed(4)})`,
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
    const count = cfg.count;
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
  }, []);

  useLayoutEffect(() => {
    if (prefersReducedMotion || isTouch) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const state = stateRef.current;

    const getTheme = () => document.body.getAttribute("data-bg") as ThemeKey | null;
    const getLightMode = () => document.documentElement.getAttribute("data-color-mode") === "light";

    canvas.style.willChange = "transform";

    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    let lastW = 0;
    let lastH = 0;
    const resize = () => {
      const newW = document.documentElement.clientWidth;
      const newH = canvas.offsetHeight || window.innerHeight;
      if (Math.abs(newW - lastW) < 30 && Math.abs(newH - lastH) < 150) return;
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

      if (theme && theme in THEMES) {
        drawGradientBg(ctx, w, h, theme as ThemeKey, getLightMode());
      } else {
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

    const TARGET_MS = 1000 / 30; // 30 fps cap
    let lastFrameTime = 0;

    const loop = (ts: number) => {
      state.animId = requestAnimationFrame(loop);
      if (document.hidden) return;
      if (!state.theme) return; // no theme active — skip draw, keep loop parked
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
      // Draw synchronously so the canvas has the gradient painted before
      // the browser's next frame — prevents the body CSS gradient from
      // flashing through the still-transparent canvas.
      renderFrame();
    };
    window.addEventListener("atheles-bg-change", onBgChange);

    // Re-paint immediately when the user switches colour mode so the
    // light/dark palette swap is instant (no waiting for next frame).
    const onColorModeChange = () => { renderFrame(); };
    window.addEventListener("atheles-color-mode-change", onColorModeChange);

    return () => {
      cancelAnimationFrame(state.animId);
      if (resizeTimer) clearTimeout(resizeTimer);
      window.removeEventListener("resize", resize);
      window.removeEventListener("atheles-bg-change", onBgChange);
      window.removeEventListener("atheles-color-mode-change", onColorModeChange);
      canvas.style.willChange = "auto";
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

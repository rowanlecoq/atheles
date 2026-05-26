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
// lightColors: same hue as the light-mode base, ~25% darker in luminance.
//   This creates natural depth/shimmer rather than high-contrast dark bugs.
const THEMES = {
  gold: {
    count: 40,
    colors:      [[255, 210, 60],  [220, 185, 90],  [255, 240, 160], [190, 160, 80]]  as [number,number,number][],
    lightColors: [[188, 140, 28],  [172, 122, 16],  [200, 158, 40],  [162, 110, 10]]  as [number,number,number][],
    minR: 1.0, maxR: 3.5,
    minAlpha: 0.04, maxAlpha: 0.72,
    speed: 0.06, isStar: true,
  },
  water: {
    count: 38,
    colors:      [[0, 225, 240],   [0, 170, 230],   [120, 245, 255], [0, 195, 215]]   as [number,number,number][],
    lightColors: [[0,  135, 128],  [0,  118, 112],  [10, 148, 140],  [0, 108, 102]]   as [number,number,number][],
    minR: 1.0, maxR: 3.5,
    minAlpha: 0.08, maxAlpha: 0.50,
    speed: 0.12, isStar: false,
  },
  tropical: {
    count: 40,
    colors:      [[20, 230, 110],  [0, 195, 255],   [255, 175, 30],  [80, 255, 160]]  as [number,number,number][],
    lightColors: [[22, 152,  72],  [18, 128,  58],  [152, 105,  0],  [30, 165,  85]]  as [number,number,number][],
    minR: 1.0, maxR: 3.5,
    minAlpha: 0.06, maxAlpha: 0.55,
    speed: 0.14, isStar: false,
  },
  midnight: {
    count: 60,
    colors:      [[255, 255, 255], [225, 185, 255], [255, 185, 225], [210, 165, 255]] as [number,number,number][],
    lightColors: [[128,  35, 205], [108,  18, 185], [145,  52, 218], [118,  28, 195]] as [number,number,number][],
    minR: 1.0, maxR: 3.5,
    minAlpha: 0.04, maxAlpha: 0.78,
    speed: 0.04, isStar: true,
  },
  sunset: {
    count: 40,
    colors:      [[255, 90, 145],  [255, 145, 50],  [200, 75, 225],  [255, 125, 90]]  as [number,number,number][],
    lightColors: [[190,  28, 115], [172,  48,  10], [148,  18, 178], [182,  42, 130]] as [number,number,number][],
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

// Light-mode palette — properly saturated light backgrounds.
// Base colours are ~L80 in HSL so they're visibly coloured, not near-white.
// Radial blobs use deeper/darker versions at 0.55–0.80 opacity to create
// rich colour pools against the already-tinted base.
const LIGHT_BG: Record<ThemeKey, { base: string; radial: RLayer[]; linear?: LStop[] }> = {
  // Warm amber-honey base matching brand gold (#ccb173) lightened — not yellow
  gold: { base: '#e8c878', radial: [
    [0.50, 0.62, 1.45, 0.80, 165, 105,   0, 0.55, 0.88],
    [0.50, 0.48, 0.88, 0.72, 190, 138,  18, 0.68, 0.72],
    [0.50, 0.28, 0.55, 0.48, 210, 162,  40, 0.46, 0.65],
  ]},
  // Warm teal base — tropical water over sand, not cold arctic blue.
  // Sandy amber pools mixed with deep warm teal for a coral-reef feel.
  water: { base: '#3ecfc8', radial: [
    [0.50, 1.22, 1.00, 0.40, 168, 118,  28, 0.45, 0.50],  // sandy amber bottom
    [0.50, 0.70, 0.65, 0.50,   0, 128, 122, 0.62, 0.55],  // deep warm teal
    [0.50, 0.50, 0.55, 0.55,   5, 152, 145, 0.58, 0.55],  // warm teal centre
    [0.70, 0.65, 0.60, 0.70, 158, 108,  18, 0.42, 0.60],  // amber right
    [0.50, 0.35, 0.70, 0.60,   0, 118, 112, 0.65, 0.60],  // upper deep teal
  ]},
  // Warm lime-green base; jungle greens + golden amber sunlight pools
  tropical: { base: '#78e895', radial: [
    [0.50, 0.85, 1.20, 0.50,   0, 110,  45, 0.62, 0.60],
    [0.78, 0.72, 0.72, 0.55, 205, 148,   0, 0.70, 0.55],
    [0.50, 0.48, 0.68, 0.68,   0, 118,  68, 0.62, 0.55],
    [0.48, 0.22, 0.68, 0.72, 200, 140,   0, 0.70, 0.58],
    [0.18, 0.65, 0.82, 0.68,   0, 105,  52, 0.72, 0.58],
    [0.72, 0.88, 0.65, 0.52, 208, 128,  10, 0.62, 0.56],
    [0.28, 0.90, 0.62, 0.48,   0, 112,  58, 0.58, 0.58],
  ]},
  // Warm rose-orchid base; deep violet/magenta pools — warm cosmic feel
  midnight: { base: '#c072e8', radial: [
    [0.12, 0.10, 0.62, 0.55, 120,  20, 195, 0.62, 0.72],
    [0.42, 0.28, 0.70, 0.64, 155,  25, 225, 0.58, 0.75],
    [0.72, 0.50, 0.74, 0.68,  75,  35, 205, 0.62, 0.75],
    [0.82, 0.78, 0.60, 0.58, 140,  20, 222, 0.58, 0.72],
    [0.22, 0.70, 0.62, 0.58, 100,  12, 185, 0.52, 0.70],
    [0.50, 0.42, 0.68, 0.60, 168,  45, 245, 0.48, 0.68],
    [0.06, 0.88, 0.55, 0.50, 118,  15, 202, 0.54, 0.68],
  ]},
  // Coral-orange base; warm magenta + deep orange pools — no cold purple
  sunset: { base: '#f87858', radial: [
    [0.50, 1.18, 1.10, 0.40, 215,  82,   5, 0.65, 0.48],
    [0.20, 0.12, 0.55, 0.52, 188,  22, 155, 0.76, 0.60],
    [0.78, 0.28, 0.65, 0.55, 235,  38, 112, 0.75, 0.60],
    [0.15, 0.52, 0.60, 0.55, 192,  15,  90, 0.68, 0.55],
    [0.80, 0.68, 0.55, 0.55, 242,  68, 125, 0.65, 0.55],
    [0.50, 0.55, 1.00, 0.28, 232,  90,   8, 0.58, 0.55],
  ], linear: [
    [188,  22, 155, 0.26, 0.00],
    [188,  22, 155, 0.00, 0.35],
    [232,  90,   8, 0.00, 0.68],
    [242, 110,  12, 0.24, 1.00],
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

function drawRays(ctx: CanvasRenderingContext2D, w: number, h: number, theme: ThemeKey, time: number, lightMode: boolean) {
  // In light mode: darken ray colours so they contrast against the bright base,
  // and boost opacity ~5× so the beams are actually visible.
  const m = lightMode ? 5.0 : 1.0;
  const hasFilter = "filter" in ctx;
  if (hasFilter) ctx.filter = "blur(20px)";

  if (theme === "water") {
    const eCol = lightMode ? "0,118,112"  : "34,211,238";
    const mCol = lightMode ? "0,138,130"  : "6,182,212";
    for (let i = 0; i < 8; i++) {
      const angle   = (-10 + i * 3) * (Math.PI / 180);
      const stripH  = 24 + (i % 4) * 8;
      const opacity = (0.060 + (i % 3) * 0.022) * m;
      const cy = h * (0.05 + i * 0.12) + Math.sin(time * 0.4 + i) * 20;
      drawBeam(ctx, w, 0.5, cy, angle, stripH, opacity,
        (o) => `rgba(${eCol},${o.toFixed(4)})`,
        (o) => `rgba(${mCol},${o.toFixed(4)})`,
        hasFilter);
    }
    const blFill = [
      [0.10, 0.80,  8, 16, 0.040],
      [0.06, 0.90, 10, 20, 0.044],
      [0.15, 0.96, 11, 14, 0.034],
    ] as const;
    for (const [cx, cyF, deg, sH, op] of blFill) {
      const cy = h * cyF + Math.sin(time * 0.3 + cx * 10) * 8;
      drawBeam(ctx, w, cx, cy, deg * (Math.PI / 180), sH, op * m,
        (o) => `rgba(${eCol},${o.toFixed(4)})`,
        (o) => `rgba(${mCol},${o.toFixed(4)})`,
        hasFilter);
    }
  }

  if (theme === "tropical") {
    for (let i = 0; i < 8; i++) {
      const angle  = (-6 + i * 3.5) * (Math.PI / 180);
      const stripH = 28 + (i % 4) * 12;
      const opacity = (0.052 + (i % 3) * 0.018) * m;
      const cy = h * (0.05 + i * 0.12) + Math.sin(time * 0.35 + i * 1.5) * 16;
      const rgb = lightMode
        ? (i % 3 === 0 ? "0,100,52" : i % 3 === 1 ? "148,85,0" : "0,120,80")
        : (i % 3 === 0 ? "16,185,129" : i % 3 === 1 ? "245,158,11" : "0,210,175");
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
      const opacity = (0.058 + i * 0.012) * m;
      const cy = h * (0.06 + i * 0.16) + Math.sin(time * 0.28 + i * 1.3) * 14;
      const rgb = lightMode
        ? (i % 3 === 0 ? "98,12,195"  : i % 3 === 1 ? "180,25,85"  : "180,72,5")
        : (i % 3 === 0 ? "147,51,234" : i % 3 === 1 ? "255,80,150" : "255,130,60");
      drawBeam(ctx, w, 0.5, cy, angle, stripH, opacity,
        (o) => `rgba(${rgb},${o.toFixed(4)})`,
        (o) => `rgba(${rgb},${o.toFixed(4)})`,
        hasFilter);
    }
    const blFill = lightMode
      ? [[0.10, 0.80, 6, 16, 0.040, "180,72,5"], [0.06, 0.90, 8, 20, 0.044, "180,25,85"], [0.15, 0.96, 10, 14, 0.034, "180,72,5"]] as const
      : [[0.10, 0.80, 6, 16, 0.040, "255,130,60"], [0.06, 0.90, 8, 20, 0.044, "255,80,150"], [0.15, 0.96, 10, 14, 0.034, "255,130,60"]] as const;
    for (const [cx, cyF, deg, sH, op, rgb] of blFill) {
      const cy = h * cyF + Math.sin(time * 0.28 + cx * 10) * 8;
      drawBeam(ctx, w, cx, cy, deg * (Math.PI / 180), sH * m, op * m,
        (o) => `rgba(${rgb},${o.toFixed(4)})`,
        (o) => `rgba(${rgb},${o.toFixed(4)})`,
        hasFilter);
    }
  }

  if (theme === "gold") {
    for (let i = 0; i < 8; i++) {
      const angle   = (-8 + i * 3) * (Math.PI / 180);
      const stripH  = 24 + (i % 4) * 8;
      const opacity = (0.052 + (i % 3) * 0.018) * m;
      const cy = h * (0.05 + i * 0.12) + Math.sin(time * 0.28 + i) * 20;
      const eRgb = lightMode
        ? (i % 3 === 0 ? "138,78,0"  : i % 3 === 1 ? "148,88,5"  : "128,70,0")
        : (i % 3 === 0 ? "192,162,88"  : i % 3 === 1 ? "200,170,96"  : "184,154,80");
      const mRgb = lightMode
        ? (i % 3 === 0 ? "158,98,8"  : i % 3 === 1 ? "165,105,10" : "148,90,5")
        : (i % 3 === 0 ? "222,194,128" : i % 3 === 1 ? "230,202,136" : "216,188,120");
      drawBeam(ctx, w, 0.5, cy, angle, stripH, opacity,
        (o) => `rgba(${eRgb},${o.toFixed(4)})`,
        (o) => `rgba(${mRgb},${o.toFixed(4)})`,
        hasFilter);
    }
    const goldFillDark = [
      [0.10, 0.80,  8, 16, 0.038, "158,98,8",   "138,78,0"],
      [0.06, 0.90, 10, 20, 0.042, "148,90,5",   "128,70,0"],
      [0.15, 0.96, 11, 14, 0.032, "165,105,10", "148,88,5"],
    ] as const;
    const goldFillLight = [
      [0.10, 0.80,  8, 16, 0.038, "222,194,128", "192,162,88"],
      [0.06, 0.90, 10, 20, 0.042, "216,188,120", "184,154,80"],
      [0.15, 0.96, 11, 14, 0.032, "230,202,136", "200,170,96"],
    ] as const;
    for (const [cx, cyF, deg, sH, op, mRgb, eRgb] of (lightMode ? goldFillDark : goldFillLight)) {
      const cy = h * cyF + Math.sin(time * 0.28 + cx * 10) * 8;
      drawBeam(ctx, w, cx, cy, deg * (Math.PI / 180), sH, op * m,
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
      const opacity = (0.062 + (i % 4) * 0.016) * m;
      const cy = h * (0.05 + i * 0.12) + Math.sin(time * 0.22 + i) * 14;
      const eRgb = lightMode
        ? (i % 4 === 0 ? "42,8,155"    : i % 4 === 1 ? "8,30,160"    : i % 4 === 2 ? "55,5,168"    : "78,35,185")
        : (i % 4 === 0 ? "75,35,200"   : i % 4 === 1 ? "15,55,205"   : i % 4 === 2 ? "90,22,215"   : "120,68,238");
      const mRgb = lightMode
        ? (i % 4 === 0 ? "68,28,175"   : i % 4 === 1 ? "30,75,180"   : i % 4 === 2 ? "85,35,192"   : "105,65,210")
        : (i % 4 === 0 ? "155,118,255" : i % 4 === 1 ? "80,138,255"  : i % 4 === 2 ? "148,92,248"  : "188,155,255");
      drawBeam(ctx, w, 0.5, cy, angle, stripH, opacity,
        (o) => `rgba(${eRgb},${o.toFixed(4)})`,
        (o) => `rgba(${mRgb},${o.toFixed(4)})`,
        hasFilter);
    }
    const midFill = [
      [0.10, 0.80, 12, 16, 0.044, lightMode ? "68,28,175"  : "155,118,255", lightMode ? "42,8,155"  : "75,35,200"],
      [0.06, 0.90, 14, 20, 0.048, lightMode ? "30,75,180"  : "80,138,255",  lightMode ? "8,30,160"  : "15,55,205"],
      [0.15, 0.96, 16, 14, 0.038, lightMode ? "85,35,192"  : "148,92,248",  lightMode ? "55,5,168"  : "90,22,215"],
    ] as const;
    for (const [cx, cyF, deg, sH, op, mRgb, eRgb] of midFill) {
      const cy = h * cyF + Math.sin(time * 0.22 + cx * 10) * 8;
      drawBeam(ctx, w, cx, cy, deg * (Math.PI / 180), sH, op * m,
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

      const lm = getLightMode();
      drawRays(ctx, w, h, theme as ThemeKey, state.time, lm);

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

        // In light mode: swap to per-theme light palette (medium-dark saturated tints)
        // so sparkles read as coloured glints, not dark bugs.
        const col = lm ? cfg.lightColors[p.color === cfg.colors[0] ? 0 : p.color === cfg.colors[1] ? 1 : p.color === cfg.colors[2] ? 2 : 3]! : p.color;
        const [r, g, b] = col;
        const pa = lm ? Math.min(p.alpha * 1.4, 0.70) : p.alpha;
        ctx.fillStyle = `rgba(${r},${g},${b},${pa.toFixed(3)})`;
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

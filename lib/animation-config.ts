export const animationEasing = [0.22, 1, 0.36, 1] as const;

export const animationDurations = {
  fast: 0.18,
  normal: 0.28,
  slow: 0.45,
  hero: 0.7,
} as const;

export const animationDurationsMobile = {
  fast: 0.16,
  normal: 0.25,
  slow: 0.38,
  hero: 0.55,
} as const;

export const animationStaggers = {
  tight: 0.03,
  hero: 0.045,
  normal: 0.06,
  wide: 0.12,
} as const;

export const animationStaggersMobile = {
  tight: 0.02,
  normal: 0.04,
  wide: 0.08,
} as const;

export const animationViewportMargins = {
  normal: "-100px",
  early: "-80px",
  shop: "-50px",
} as const;

export const animationViewportMarginsMobile = {
  normal: "-60px",
  early: "-40px",
  shop: "-30px",
} as const;

export const mobileUiBaseline = {
  minViewportWidth: 375,
  touchTarget: 44,
  breakpointMd: 768,
} as const;

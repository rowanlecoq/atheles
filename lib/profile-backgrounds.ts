export const PROFILE_BACKGROUNDS = [
  {
    id: "gold",
    label: "gold",
    swatch: [
      "radial-gradient(ellipse 145% 120% at 35% 32%, rgba(200,165,88,0.68) 0%, transparent 70%)",
      "radial-gradient(ellipse 120% 145% at 70% 72%, rgba(175,132,48,0.58) 0%, transparent 70%)",
      "#110e04",
    ].join(", "),
  },
  {
    id: "water",
    label: "ocean",
    swatch: [
      "radial-gradient(ellipse 145% 120% at 35% 32%, rgba(36,186,226,0.68) 0%, transparent 70%)",
      "radial-gradient(ellipse 120% 145% at 70% 72%, rgba(18,94,208,0.62) 0%, transparent 70%)",
      "#020a10",
    ].join(", "),
  },
  {
    id: "tropical",
    label: "tropical",
    swatch: [
      "radial-gradient(ellipse 145% 145% at 22% 65%, rgba(16,185,129,0.70) 0%, transparent 68%)",
      "radial-gradient(ellipse 145% 145% at 78% 28%, rgba(245,158,11,0.62) 0%, transparent 68%)",
      "#020b05",
    ].join(", "),
  },
  {
    id: "midnight",
    label: "midnight",
    swatch: [
      "radial-gradient(ellipse 145% 120% at 38% 32%, rgba(75,40,195,0.80) 0%, transparent 70%)",
      "radial-gradient(ellipse 120% 145% at 68% 70%, rgba(98,98,238,0.72) 0%, transparent 70%)",
      "#04000a",
    ].join(", "),
  },
  {
    id: "sunset",
    label: "sunset",
    swatch: [
      "radial-gradient(ellipse 125% 105% at 22% 20%, rgba(147,51,234,0.72) 0%, transparent 62%)",
      "radial-gradient(ellipse 115% 105% at 76% 28%, rgba(255,72,140,0.74) 0%, transparent 62%)",
      "radial-gradient(ellipse 145% 85% at 50% 90%, rgba(249,115,22,0.62) 0%, transparent 62%)",
      "#0e0206",
    ].join(", "),
  },
] as const;

export type ProfileBackgroundId = typeof PROFILE_BACKGROUNDS[number]["id"];

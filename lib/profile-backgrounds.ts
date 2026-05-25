export const PROFILE_BACKGROUNDS = [
  {
    id: "gold",
    label: "gold",
    swatch: [
      "radial-gradient(circle at 38% 32%, rgba(220,178,88,0.80) 0%, rgba(180,138,50,0.40) 50%, transparent 72%)",
      "radial-gradient(circle at 68% 70%, rgba(180,138,50,0.70) 0%, transparent 60%)",
      "#110e04",
    ].join(", "),
  },
  {
    id: "water",
    label: "ocean",
    swatch: [
      "radial-gradient(circle at 36% 32%, rgba(38,188,228,0.80) 0%, rgba(20,110,210,0.35) 50%, transparent 72%)",
      "radial-gradient(circle at 68% 70%, rgba(18,96,210,0.75) 0%, transparent 62%)",
      "#020a10",
    ].join(", "),
  },
  {
    id: "tropical",
    label: "tropical",
    swatch: [
      "radial-gradient(circle at 24% 64%, rgba(18,192,134,0.82) 0%, transparent 65%)",
      "radial-gradient(circle at 76% 28%, rgba(245,158,11,0.72) 0%, transparent 62%)",
      "#020b05",
    ].join(", "),
  },
  {
    id: "midnight",
    label: "midnight",
    swatch: [
      "radial-gradient(circle at 40% 32%, rgba(80,44,200,0.88) 0%, rgba(50,30,140,0.45) 50%, transparent 72%)",
      "radial-gradient(circle at 66% 68%, rgba(100,100,240,0.80) 0%, transparent 62%)",
      "#04000a",
    ].join(", "),
  },
  {
    id: "sunset",
    label: "sunset",
    swatch: [
      "radial-gradient(circle at 22% 20%, rgba(147,51,234,0.80) 0%, transparent 58%)",
      "radial-gradient(circle at 74% 28%, rgba(255,72,140,0.82) 0%, transparent 58%)",
      "radial-gradient(circle at 50% 88%, rgba(249,115,22,0.72) 0%, transparent 55%)",
      "#0e0206",
    ].join(", "),
  },
] as const;

export type ProfileBackgroundId = typeof PROFILE_BACKGROUNDS[number]["id"];

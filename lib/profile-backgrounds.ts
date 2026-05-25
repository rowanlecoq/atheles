export const PROFILE_BACKGROUNDS = [
  {
    id: "gold",
    label: "gold",
    swatch: [
      "radial-gradient(ellipse 110% 100% at 38% 28%, rgba(255,228,90,0.92) 0%, transparent 62%)",
      "radial-gradient(ellipse 100% 110% at 68% 72%, rgba(200,138,40,0.85) 0%, transparent 62%)",
      "radial-gradient(ellipse 90% 90% at 50% 50%, rgba(220,195,110,0.45) 0%, transparent 60%)",
      "#110e04",
    ].join(", "),
  },
  {
    id: "water",
    label: "ocean",
    swatch: [
      "radial-gradient(ellipse 110% 100% at 38% 32%, rgba(38,210,245,0.90) 0%, transparent 62%)",
      "radial-gradient(ellipse 100% 110% at 68% 68%, rgba(18,95,200,0.85) 0%, transparent 62%)",
      "radial-gradient(ellipse 90% 90% at 50% 50%, rgba(30,180,220,0.40) 0%, transparent 60%)",
      "#020a10",
    ].join(", "),
  },
  {
    id: "tropical",
    label: "tropical",
    swatch: [
      "radial-gradient(ellipse 110% 110% at 22% 62%, rgba(18,210,140,0.90) 0%, transparent 62%)",
      "radial-gradient(ellipse 110% 110% at 75% 28%, rgba(248,162,14,0.88) 0%, transparent 62%)",
      "radial-gradient(ellipse 90% 90% at 50% 50%, rgba(22,195,155,0.35) 0%, transparent 60%)",
      "#020b05",
    ].join(", "),
  },
  {
    id: "midnight",
    label: "midnight",
    swatch: [
      "radial-gradient(ellipse 110% 100% at 38% 28%, rgba(120,60,255,0.92) 0%, transparent 62%)",
      "radial-gradient(ellipse 100% 110% at 68% 70%, rgba(78,78,225,0.85) 0%, transparent 62%)",
      "radial-gradient(ellipse 90% 90% at 50% 50%, rgba(100,55,235,0.45) 0%, transparent 58%)",
      "#04000a",
    ].join(", "),
  },
  {
    id: "sunset",
    label: "sunset",
    swatch: [
      "radial-gradient(ellipse 100% 90% at 22% 18%, rgba(158,55,240,0.88) 0%, transparent 60%)",
      "radial-gradient(ellipse 95% 90% at 76% 28%, rgba(255,85,155,0.85) 0%, transparent 58%)",
      "radial-gradient(ellipse 100% 85% at 50% 82%, rgba(249,118,22,0.88) 0%, transparent 60%)",
      "#0e0206",
    ].join(", "),
  },
] as const;

export type ProfileBackgroundId = typeof PROFILE_BACKGROUNDS[number]["id"];

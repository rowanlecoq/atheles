export const PROFILE_BACKGROUNDS = [
  {
    id: "gold",
    label: "gold",
    swatch: [
      "radial-gradient(ellipse 130% 110% at 38% 32%, rgba(193,163,104,0.42) 0%, transparent 65%)",
      "radial-gradient(ellipse 110% 130% at 68% 68%, rgba(180,140,60,0.34) 0%, transparent 65%)",
      "radial-gradient(ellipse 200% 100% at 50% 100%, rgba(180,140,60,0.50) 0%, transparent 60%)",
      "#110e04",
    ].join(", "),
  },
  {
    id: "water",
    label: "ocean",
    swatch: [
      "radial-gradient(ellipse 130% 110% at 38% 32%, rgba(30,180,220,0.38) 0%, transparent 65%)",
      "radial-gradient(ellipse 110% 130% at 68% 68%, rgba(20,100,200,0.34) 0%, transparent 65%)",
      "radial-gradient(ellipse 200% 100% at 50% 100%, rgba(20,100,200,0.50) 0%, transparent 60%)",
      "#020a10",
    ].join(", "),
  },
  {
    id: "tropical",
    label: "tropical",
    swatch: [
      "radial-gradient(ellipse 130% 130% at 22% 62%, rgba(16,185,129,0.38) 0%, transparent 65%)",
      "radial-gradient(ellipse 130% 130% at 76% 28%, rgba(245,158,11,0.30) 0%, transparent 65%)",
      "radial-gradient(ellipse 200% 100% at 50% 100%, rgba(16,185,129,0.48) 0%, transparent 60%)",
      "#020b05",
    ].join(", "),
  },
  {
    id: "midnight",
    label: "midnight",
    swatch: [
      "radial-gradient(ellipse 130% 110% at 42% 32%, rgba(50,30,140,0.80) 0%, transparent 65%)",
      "radial-gradient(ellipse 110% 130% at 68% 68%, rgba(80,80,220,0.65) 0%, transparent 65%)",
      "radial-gradient(ellipse 200% 100% at 50% 100%, rgba(70,50,200,0.60) 0%, transparent 60%)",
      "#04000a",
    ].join(", "),
  },
  {
    id: "sunset",
    label: "sunset",
    swatch: [
      "radial-gradient(ellipse 120% 100% at 22% 18%, rgba(147,51,234,0.60) 0%, transparent 60%)",
      "radial-gradient(ellipse 110% 100% at 74% 28%, rgba(255,80,150,0.62) 0%, transparent 60%)",
      "radial-gradient(ellipse 130% 80% at 50% 88%, rgba(249,115,22,0.52) 0%, transparent 58%)",
      "#0e0206",
    ].join(", "),
  },
] as const;

export type ProfileBackgroundId = typeof PROFILE_BACKGROUNDS[number]["id"];

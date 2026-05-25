export const PROFILE_BACKGROUNDS = [
  {
    id: "gold",
    label: "gold",
    swatch: [
      "radial-gradient(ellipse 140% 120% at 50% 35%, rgba(193,163,104,0.55) 0%, transparent 60%)",
      "radial-gradient(ellipse 120% 140% at 72% 68%, rgba(180,140,60,0.44) 0%, transparent 60%)",
      "radial-gradient(ellipse 110% 110% at 50% 50%, rgba(220,200,140,0.30) 0%, transparent 55%)",
      "radial-gradient(ellipse 200% 100% at 50% 100%, rgba(180,140,60,0.62) 0%, transparent 60%)",
      "#110e04",
    ].join(", "),
  },
  {
    id: "water",
    label: "ocean",
    swatch: [
      "radial-gradient(ellipse 140% 120% at 50% 35%, rgba(30,180,220,0.50) 0%, transparent 60%)",
      "radial-gradient(ellipse 120% 140% at 72% 68%, rgba(20,100,200,0.46) 0%, transparent 60%)",
      "radial-gradient(ellipse 110% 110% at 50% 50%, rgba(40,210,240,0.28) 0%, transparent 55%)",
      "radial-gradient(ellipse 200% 100% at 50% 100%, rgba(20,100,200,0.62) 0%, transparent 60%)",
      "#020a10",
    ].join(", "),
  },
  {
    id: "tropical",
    label: "tropical",
    swatch: [
      "radial-gradient(ellipse 140% 120% at 20% 58%, rgba(16,185,129,0.52) 0%, transparent 60%)",
      "radial-gradient(ellipse 120% 140% at 78% 30%, rgba(245,158,11,0.44) 0%, transparent 60%)",
      "radial-gradient(ellipse 110% 110% at 50% 50%, rgba(20,200,160,0.26) 0%, transparent 55%)",
      "radial-gradient(ellipse 200% 100% at 50% 100%, rgba(16,185,129,0.58) 0%, transparent 60%)",
      "#020b05",
    ].join(", "),
  },
  {
    id: "midnight",
    label: "midnight",
    swatch: [
      "radial-gradient(ellipse 140% 120% at 50% 35%, rgba(50,30,140,0.80) 0%, transparent 60%)",
      "radial-gradient(ellipse 120% 140% at 72% 68%, rgba(80,80,220,0.68) 0%, transparent 60%)",
      "radial-gradient(ellipse 110% 110% at 50% 50%, rgba(110,60,240,0.55) 0%, transparent 55%)",
      "radial-gradient(ellipse 200% 100% at 50% 100%, rgba(70,50,200,0.62) 0%, transparent 60%)",
      "#04000a",
    ].join(", "),
  },
  {
    id: "sunset",
    label: "sunset",
    swatch: [
      "linear-gradient(180deg, rgba(147,51,234,0.32) 0%, transparent 40%)",
      "radial-gradient(ellipse 110% 104% at 20% 14%, rgba(147,51,234,0.65) 0%, transparent 60%)",
      "radial-gradient(ellipse 130% 110% at 78% 28%, rgba(255,80,150,0.68) 0%, transparent 60%)",
      "radial-gradient(ellipse 120% 110% at 18% 54%, rgba(219,39,119,0.55) 0%, transparent 55%)",
      "radial-gradient(ellipse 200% 100% at 50% 100%, rgba(249,115,22,0.58) 0%, transparent 60%)",
      "#0e0206",
    ].join(", "),
  },
] as const;

export type ProfileBackgroundId = typeof PROFILE_BACKGROUNDS[number]["id"];

export const PROFILE_BACKGROUNDS = [
  {
    id: "gold",
    label: "gold",
    swatch: [
      "radial-gradient(ellipse 115% 105% at 28% 25%, #ffe870 0%, rgba(255,232,112,0) 62%)",
      "radial-gradient(ellipse 105% 115% at 74% 76%, #e0a020 0%, rgba(224,160,32,0) 62%)",
      "radial-gradient(ellipse 80% 80% at 52% 52%, rgba(255,210,80,0.5) 0%, rgba(255,210,80,0) 60%)",
      "#9a6010",
    ].join(", "),
  },
  {
    id: "water",
    label: "ocean",
    swatch: [
      "radial-gradient(ellipse 115% 105% at 28% 28%, #38d8f8 0%, rgba(56,216,248,0) 62%)",
      "radial-gradient(ellipse 105% 115% at 74% 72%, #1060d8 0%, rgba(16,96,216,0) 62%)",
      "radial-gradient(ellipse 80% 80% at 52% 50%, rgba(30,170,230,0.45) 0%, rgba(30,170,230,0) 58%)",
      "#082060",
    ].join(", "),
  },
  {
    id: "tropical",
    label: "tropical",
    swatch: [
      "radial-gradient(ellipse 115% 115% at 20% 65%, #18f0a0 0%, rgba(18,240,160,0) 60%)",
      "radial-gradient(ellipse 115% 115% at 78% 26%, #f8b020 0%, rgba(248,176,32,0) 60%)",
      "radial-gradient(ellipse 70% 70% at 50% 50%, rgba(22,210,150,0.4) 0%, rgba(22,210,150,0) 58%)",
      "#1a7838",
    ].join(", "),
  },
  {
    id: "midnight",
    label: "midnight",
    swatch: [
      "radial-gradient(ellipse 115% 105% at 28% 25%, #a060ff 0%, rgba(160,96,255,0) 62%)",
      "radial-gradient(ellipse 105% 115% at 74% 74%, #4848e0 0%, rgba(72,72,224,0) 62%)",
      "radial-gradient(ellipse 80% 80% at 52% 52%, rgba(110,60,240,0.45) 0%, rgba(110,60,240,0) 58%)",
      "#1e0870",
    ].join(", "),
  },
  {
    id: "sunset",
    label: "sunset",
    swatch: [
      "radial-gradient(ellipse 105% 95% at 20% 18%, #b840f0 0%, rgba(184,64,240,0) 58%)",
      "radial-gradient(ellipse 95% 90% at 78% 26%, #ff4888 0%, rgba(255,72,136,0) 56%)",
      "radial-gradient(ellipse 105% 90% at 50% 86%, #f87020 0%, rgba(248,112,32,0) 58%)",
      "#500038",
    ].join(", "),
  },
] as const;

export type ProfileBackgroundId = typeof PROFILE_BACKGROUNDS[number]["id"];

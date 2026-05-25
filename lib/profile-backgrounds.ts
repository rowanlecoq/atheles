export const PROFILE_BACKGROUNDS = [
  {
    id: "gold",
    label: "gold",
    swatch: [
      "linear-gradient(135deg, rgba(210,168,78,0.62) 0%, rgba(152,112,36,0.48) 100%)",
      "#110e04",
    ].join(", "),
  },
  {
    id: "water",
    label: "ocean",
    swatch: [
      "linear-gradient(135deg, rgba(34,184,224,0.62) 0%, rgba(16,82,198,0.58) 100%)",
      "#020a10",
    ].join(", "),
  },
  {
    id: "tropical",
    label: "tropical",
    swatch: [
      "linear-gradient(225deg, rgba(16,185,129,0.65) 0%, rgba(245,158,11,0.58) 100%)",
      "#020b05",
    ].join(", "),
  },
  {
    id: "midnight",
    label: "midnight",
    swatch: [
      "linear-gradient(135deg, rgba(98,98,238,0.72) 0%, rgba(68,32,182,0.78) 100%)",
      "#04000a",
    ].join(", "),
  },
  {
    id: "sunset",
    label: "sunset",
    swatch: [
      "linear-gradient(155deg, rgba(147,51,234,0.70) 0%, rgba(255,72,140,0.70) 50%, rgba(249,115,22,0.60) 100%)",
      "#0e0206",
    ].join(", "),
  },
] as const;

export type ProfileBackgroundId = typeof PROFILE_BACKGROUNDS[number]["id"];

export const PROFILE_BACKGROUNDS = [
  {
    id: "gold",
    label: "gold",
    swatch: "linear-gradient(145deg, #fad060 0%, #c88010 50%, #e8a820 100%)",
  },
  {
    id: "water",
    label: "ocean",
    swatch: "linear-gradient(145deg, #48e0ff 0%, #1490e0 50%, #38c8f8 100%)",
  },
  {
    id: "tropical",
    label: "tropical",
    swatch: "linear-gradient(145deg, #f8a818 0%, #14d888 55%, #08b060 100%)",
  },
  {
    id: "midnight",
    label: "midnight",
    swatch: "linear-gradient(145deg, #a060ff 0%, #5020d0 55%, #8840f8 100%)",
  },
  {
    id: "sunset",
    label: "sunset",
    swatch: "linear-gradient(145deg, #9830e8 0%, #f060a0 45%, #f89030 100%)",
  },
] as const;

export type ProfileBackgroundId = typeof PROFILE_BACKGROUNDS[number]["id"];

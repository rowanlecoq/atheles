export const PROFILE_BACKGROUNDS = [
  {
    id: "gold",
    label: "gold",
    swatch: "linear-gradient(135deg, #ffe480 0%, #d4a820 50%, #7a5800 100%)",
  },
  {
    id: "water",
    label: "ocean",
    swatch: "linear-gradient(135deg, #7aeef8 0%, #0090cc 50%, #011840 100%)",
  },
  {
    id: "tropical",
    label: "tropical",
    swatch: "linear-gradient(135deg, #80e88a 0%, #22a8e8 38%, #d88220 72%, #021505 100%)",
  },
  {
    id: "midnight",
    label: "midnight",
    swatch: "linear-gradient(135deg, #c058ff 0%, #ff3ec8 50%, #080015 100%)",
  },
  {
    id: "sunset",
    label: "sunset",
    swatch: "linear-gradient(135deg, #ff4888 0%, #ff8820 45%, #c03ae0 75%, #0e0208 100%)",
  },
] as const;

export type ProfileBackgroundId = typeof PROFILE_BACKGROUNDS[number]["id"];

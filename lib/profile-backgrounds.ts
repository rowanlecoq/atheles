export const PROFILE_BACKGROUNDS = [
  {
    id: "gold",
    label: "gold",
    swatch: "conic-gradient(from 200deg at 40% 45%, #c8941e 0deg, #f0d060 80deg, #dca830 150deg, #7a4a08 220deg, #c8941e 360deg)",
  },
  {
    id: "water",
    label: "ocean",
    swatch: "conic-gradient(from 160deg at 45% 50%, #0a2a5e 0deg, #1469d2 80deg, #1eb9e1 160deg, #0d4fa8 240deg, #030c14 310deg, #0a2a5e 360deg)",
  },
  {
    id: "tropical",
    label: "tropical",
    swatch: "conic-gradient(from 120deg at 45% 50%, #031408 0deg, #10c387 80deg, #8de030 150deg, #faa50f 220deg, #e07010 290deg, #031408 360deg)",
  },
  {
    id: "midnight",
    label: "midnight",
    swatch: "conic-gradient(from 200deg at 45% 45%, #060010 0deg, #5f37d7 90deg, #9060f0 160deg, #4141af 230deg, #1a0050 300deg, #060010 360deg)",
  },
  {
    id: "sunset",
    label: "sunset",
    swatch: "conic-gradient(from 180deg at 50% 50%, #120208 0deg, #9b37f0 70deg, #e12d7d 140deg, #fc7819 210deg, #fc7819 260deg, #e12d7d 300deg, #120208 360deg)",
  },
] as const;

export type ProfileBackgroundId = typeof PROFILE_BACKGROUNDS[number]["id"];

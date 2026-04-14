export const PROFILE_BACKGROUNDS = [
  {
    id: "gold",
    label: "gold",
    swatch: "radial-gradient(ellipse at 30% 40%, #7f6f4c 0%, #4a3c20 45%, #2a2010 100%)",
  },
  {
    id: "water",
    label: "water",
    swatch: "radial-gradient(ellipse at 30% 60%, #0d4a7a 0%, #082e4d 45%, #041828 100%)",
  },
  {
    id: "tropical",
    label: "tropical",
    swatch: "radial-gradient(ellipse at 40% 60%, #0f5c30 0%, #083a1e 45%, #041a0e 100%)",
  },
  {
    id: "midnight",
    label: "midnight",
    swatch: "radial-gradient(ellipse at 50% 30%, #2e1a5c 0%, #1a0d3d 45%, #0d0620 100%)",
  },
  {
    id: "sunset",
    label: "sunset",
    swatch: "radial-gradient(ellipse at 40% 30%, #7a2a10 0%, #4d1608 45%, #280b04 100%)",
  },
] as const;

export type ProfileBackgroundId = typeof PROFILE_BACKGROUNDS[number]["id"];

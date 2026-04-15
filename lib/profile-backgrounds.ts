export const PROFILE_BACKGROUNDS = [
  {
    id: "gold",
    label: "gold",
    swatch: "radial-gradient(ellipse at 30% 35%, #ffd23c 0%, #c4870a 45%, #3a2804 100%)",
  },
  {
    id: "water",
    label: "ocean",
    swatch: "radial-gradient(ellipse at 30% 65%, #00dce6 0%, #0078d4 45%, #020a10 100%)",
  },
  {
    id: "tropical",
    label: "tropical",
    swatch: "radial-gradient(ellipse at 35% 60%, #0fd764 0%, #00a5e1 38%, #ff9b1a 68%, #020b05 100%)",
  },
  {
    id: "midnight",
    label: "midnight",
    swatch: "radial-gradient(ellipse at 40% 30%, #b937ff 0%, #ff37b9 50%, #040009 100%)",
  },
  {
    id: "sunset",
    label: "sunset",
    swatch: "radial-gradient(ellipse at 40% 25%, #ff4690 0%, #ff8728 45%, #b937e1 75%, #0e0206 100%)",
  },
] as const;

export type ProfileBackgroundId = typeof PROFILE_BACKGROUNDS[number]["id"];

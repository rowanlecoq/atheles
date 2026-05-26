export const PROFILE_BACKGROUNDS = [
  {
    id: "gold",
    label: "gold",
    swatch: "linear-gradient(135deg, #f0d060 0%, #ccb070 30%, #8a5e20 65%, #3a2008 100%)",
  },
  {
    id: "water",
    label: "ocean",
    swatch: "linear-gradient(135deg, #38d8f8 0%, #0888c0 38%, #043c70 68%, #011428 100%)",
  },
  {
    id: "tropical",
    label: "tropical",
    swatch: "linear-gradient(135deg, #f0a820 0%, #18d870 38%, #089850 65%, #022810 100%)",
  },
  {
    id: "midnight",
    label: "midnight",
    swatch: "linear-gradient(135deg, #a030f8 0%, #5018d0 35%, #2808a0 65%, #06001c 100%)",
  },
  {
    id: "sunset",
    label: "sunset",
    swatch: "linear-gradient(135deg, #9820e0 0%, #f03888 40%, #f88028 78%, #3a0410 100%)",
  },
] as const;

export type ProfileBackgroundId = typeof PROFILE_BACKGROUNDS[number]["id"];

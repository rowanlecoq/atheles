export const PROFILE_BACKGROUNDS = [
  {
    id: "gold",
    label: "gold",
    swatch: "linear-gradient(135deg, #ffd23c 0%, #d2a532 50%, #6e4400 100%)",
  },
  {
    id: "water",
    label: "ocean",
    swatch: "linear-gradient(135deg, #64f0ff 0%, #0096e6 45%, #010d1e 100%)",
  },
  {
    id: "tropical",
    label: "tropical",
    swatch: "linear-gradient(135deg, #0fd264 0%, #00a5e1 38%, #ff9619 72%, #020c05 100%)",
  },
  {
    id: "midnight",
    label: "midnight",
    swatch: "linear-gradient(135deg, #b937ff 0%, #ff37b9 50%, #040009 100%)",
  },
  {
    id: "sunset",
    label: "sunset",
    swatch: "linear-gradient(135deg, #ff468c 0%, #ff8728 45%, #b937e1 75%, #0e0206 100%)",
  },
] as const;

export type ProfileBackgroundId = typeof PROFILE_BACKGROUNDS[number]["id"];

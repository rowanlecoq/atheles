export const PROFILE_BACKGROUNDS = [
  {
    id: "gold",
    label: "gold",
    swatch: "linear-gradient(135deg, #ffda2a 0%, #e8b61c 45%, #7a4a00 100%)",
  },
  {
    id: "water",
    label: "ocean",
    swatch: "linear-gradient(135deg, #aff8ff 0%, #00c8e8 35%, #0055b0 70%, #000c1a 100%)",
  },
  {
    id: "tropical",
    label: "tropical",
    swatch: "linear-gradient(135deg, #00cdf5 0%, #0cbf60 40%, #fc9b1c 72%, #01090a 100%)",
  },
  {
    id: "midnight",
    label: "midnight",
    swatch: "linear-gradient(135deg, #b63ef8 0%, #f826af 50%, #010006 100%)",
  },
  {
    id: "sunset",
    label: "sunset",
    swatch: "linear-gradient(135deg, #ff4888 0%, #ffda3e 40%, #c03ae0 75%, #050002 100%)",
  },
] as const;

export type ProfileBackgroundId = typeof PROFILE_BACKGROUNDS[number]["id"];

export const PROFILE_BACKGROUNDS = [
  {
    id: "gold",
    label: "gold",
    swatch: "radial-gradient(circle at 38% 38%, #f0b93a 0%, #c47d0e 42%, #6b3e00 75%, #1a0e00 100%)",
  },
  {
    id: "water",
    label: "ocean",
    swatch: "radial-gradient(circle at 38% 38%, #22d3ee 0%, #0284c7 45%, #024070 75%, #020a10 100%)",
  },
  {
    id: "tropical",
    label: "tropical",
    swatch: "radial-gradient(circle at 38% 38%, #34d399 0%, #0d9488 42%, #065f46 75%, #020b05 100%)",
  },
  {
    id: "midnight",
    label: "midnight",
    swatch: "radial-gradient(circle at 38% 38%, #c084fc 0%, #7c3aed 42%, #4c1d95 75%, #04000a 100%)",
  },
  {
    id: "sunset",
    label: "sunset",
    swatch: "radial-gradient(circle at 38% 38%, #fb7185 0%, #e11d48 42%, #9d174d 75%, #0e0206 100%)",
  },
] as const;

export type ProfileBackgroundId = typeof PROFILE_BACKGROUNDS[number]["id"];

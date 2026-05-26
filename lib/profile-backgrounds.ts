export const PROFILE_BACKGROUNDS = [
  {
    id: "gold",
    label: "gold",
    swatch: "radial-gradient(circle at 38% 36%, #f5d060 0%, #c89020 45%, #7a5010 75%, #110e04 100%)",
  },
  {
    id: "water",
    label: "ocean",
    swatch: "radial-gradient(circle at 38% 36%, #50e0ff 0%, #1890d0 45%, #084890 75%, #020a10 100%)",
  },
  {
    id: "tropical",
    label: "tropical",
    swatch: "radial-gradient(circle at 62% 36%, #f0a820 0%, #18d890 40%, #088858 72%, #020b05 100%)",
  },
  {
    id: "midnight",
    label: "midnight",
    swatch: "radial-gradient(circle at 38% 36%, #9858f8 0%, #5028c0 45%, #280888 75%, #04000a 100%)",
  },
  {
    id: "sunset",
    label: "sunset",
    swatch: "radial-gradient(circle at 38% 36%, #ff70c8 0%, #d030a0 38%, #9020d0 68%, #0e0206 100%)",
  },
] as const;

export type ProfileBackgroundId = typeof PROFILE_BACKGROUNDS[number]["id"];

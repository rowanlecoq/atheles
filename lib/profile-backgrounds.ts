export const PROFILE_BACKGROUNDS = [
  {
    id: "gold",
    label: "gold",
    // Warm amber orb upper-left fading to dark, mirrors body[data-bg="gold"]
    swatch: "radial-gradient(ellipse 120% 100% at 30% 35%, #c1a368 0%, #7a5820 55%, #110e04 100%)",
  },
  {
    id: "water",
    label: "ocean",
    // Teal upper-left + navy lower-right, mirrors body[data-bg="water"]
    swatch: "radial-gradient(ellipse 120% 100% at 25% 30%, #1eb4dc 0%, #0a5ab4 50%, #020a10 100%)",
  },
  {
    id: "tropical",
    label: "tropical",
    // Emerald lower-left + amber upper-right, mirrors body[data-bg="tropical"]
    swatch: "radial-gradient(ellipse 110% 110% at 25% 70%, #10b981 0%, #059669 40%, #020b05 100%), radial-gradient(ellipse 80% 80% at 80% 20%, #f59e0b 0%, transparent 60%)",
  },
  {
    id: "midnight",
    label: "midnight",
    // Deep indigo upper-left + violet lower-right, mirrors body[data-bg="midnight"]
    swatch: "radial-gradient(ellipse 120% 100% at 30% 35%, #3c3ca0 0%, #5a32c8 50%, #04000a 100%)",
  },
  {
    id: "sunset",
    label: "sunset",
    // Purple-pink-orange top-to-bottom, mirrors body[data-bg="sunset"]
    swatch: "linear-gradient(160deg, #9333ea 0%, #db2777 35%, #f97316 70%, #fb923c 100%)",
  },
] as const;

export type ProfileBackgroundId = typeof PROFILE_BACKGROUNDS[number]["id"];

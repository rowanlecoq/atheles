export const PROFILE_BACKGROUNDS = [
  {
    id: "gold",
    label: "gold",
    // Warm amber upper-left + deep burnt gold lower-right — matches body[data-bg="gold"]
    swatch: "radial-gradient(ellipse 90% 90% at 28% 32%, rgba(193,163,104,1) 0%, transparent 62%), radial-gradient(ellipse 80% 80% at 72% 68%, rgba(180,140,60,0.95) 0%, transparent 60%), #110e04",
  },
  {
    id: "water",
    label: "ocean",
    // Teal upper-left + deep navy lower-right — matches body[data-bg="water"]
    swatch: "radial-gradient(ellipse 90% 90% at 28% 32%, rgba(30,180,220,1) 0%, transparent 62%), radial-gradient(ellipse 80% 80% at 72% 68%, rgba(20,100,200,0.95) 0%, transparent 60%), #020a10",
  },
  {
    id: "tropical",
    label: "tropical",
    // Emerald lower-left + amber upper-right — matches body[data-bg="tropical"]
    swatch: "radial-gradient(ellipse 90% 90% at 28% 72%, rgba(16,185,129,1) 0%, transparent 62%), radial-gradient(ellipse 80% 80% at 75% 28%, rgba(245,158,11,0.95) 0%, transparent 60%), #020b05",
  },
  {
    id: "midnight",
    label: "midnight",
    // Deep indigo upper-left + violet lower-right — matches body[data-bg="midnight"]
    swatch: "radial-gradient(ellipse 90% 90% at 28% 32%, rgba(90,50,200,1) 0%, transparent 62%), radial-gradient(ellipse 80% 80% at 72% 68%, rgba(60,60,160,0.95) 0%, transparent 60%), #04000a",
  },
  {
    id: "sunset",
    label: "sunset",
    // Purple upper + pink mid + orange lower — matches body[data-bg="sunset"]
    swatch: "radial-gradient(ellipse 90% 60% at 50% 15%, rgba(147,51,234,0.95) 0%, transparent 70%), radial-gradient(ellipse 80% 60% at 50% 85%, rgba(249,115,22,0.95) 0%, transparent 70%), radial-gradient(ellipse 70% 70% at 50% 50%, rgba(219,39,119,0.6) 0%, transparent 65%), #0e0206",
  },
] as const;

export type ProfileBackgroundId = typeof PROFILE_BACKGROUNDS[number]["id"];

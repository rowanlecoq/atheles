export const PROFILE_BACKGROUNDS = [
  {
    id: "gold",
    label: "gold",
    swatch: "radial-gradient(ellipse 140% 140% at 25% 28%, rgba(220,185,100,1) 0%, transparent 60%), radial-gradient(ellipse 130% 130% at 75% 72%, rgba(190,148,55,0.98) 0%, transparent 60%), radial-gradient(ellipse 110% 110% at 50% 50%, rgba(160,120,50,0.55) 0%, transparent 70%), #1a1000",
  },
  {
    id: "water",
    label: "ocean",
    swatch: "radial-gradient(ellipse 140% 140% at 25% 28%, rgba(30,185,225,1) 0%, transparent 60%), radial-gradient(ellipse 130% 130% at 75% 72%, rgba(20,105,210,0.98) 0%, transparent 60%), radial-gradient(ellipse 110% 110% at 50% 50%, rgba(15,90,180,0.5) 0%, transparent 70%), #030c14",
  },
  {
    id: "tropical",
    label: "tropical",
    swatch: "radial-gradient(ellipse 140% 140% at 25% 72%, rgba(16,195,135,1) 0%, transparent 60%), radial-gradient(ellipse 130% 130% at 78% 25%, rgba(250,165,15,0.98) 0%, transparent 60%), radial-gradient(ellipse 110% 110% at 50% 50%, rgba(10,150,80,0.45) 0%, transparent 70%), #030e06",
  },
  {
    id: "midnight",
    label: "midnight",
    swatch: "radial-gradient(ellipse 140% 140% at 25% 28%, rgba(95,55,215,1) 0%, transparent 60%), radial-gradient(ellipse 130% 130% at 75% 72%, rgba(65,65,175,0.98) 0%, transparent 60%), radial-gradient(ellipse 110% 110% at 50% 50%, rgba(55,35,155,0.5) 0%, transparent 70%), #060010",
  },
  {
    id: "sunset",
    label: "sunset",
    swatch: "radial-gradient(ellipse 130% 120% at 50% 10%, rgba(155,55,240,0.98) 0%, transparent 65%), radial-gradient(ellipse 120% 130% at 50% 90%, rgba(252,120,25,0.98) 0%, transparent 65%), radial-gradient(ellipse 110% 110% at 50% 50%, rgba(225,45,125,0.7) 0%, transparent 65%), #120208",
  },
] as const;

export type ProfileBackgroundId = typeof PROFILE_BACKGROUNDS[number]["id"];

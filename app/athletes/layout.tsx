import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "our athletes",
  description:
    "meet rowan le coq and the athletes who represent atheles — founder, athlete, and the face of the new era of gymwear and streetwear.",
  openGraph: {
    title: "our athletes | atheles 🔱",
    description:
      "meet rowan le coq and the athletes who represent atheles — founder, athlete, and the face of the new era of gymwear and streetwear.",
    type: "profile",
    url: "https://atheles.co/athletes",
  },
};

export default function AthletesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

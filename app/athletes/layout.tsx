import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "our athletes",
  description:
    "meet the athletes who represent atheles — training in hockey, fitness, and more. rowan le coq (founder & athlete, age 18) leads a team of driven individuals building the new era of gymwear and streetwear.",
  openGraph: {
    title: "our athletes | atheles 🔱",
    description:
      "meet the athletes who represent atheles — training in hockey, fitness, and more. rowan le coq (founder & athlete, age 18) leads a team of driven individuals building the new era.",
    type: "profile",
    url: "https://atheles.co/athletes",
  },
};

export default function AthletesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

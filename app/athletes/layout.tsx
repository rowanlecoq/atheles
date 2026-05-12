import type { Metadata } from "next";
import { getAthletes } from "lib/athletes";

export async function generateMetadata(): Promise<Metadata> {
  const athletes = await getAthletes();

  const athleteList = athletes
    .map((a) => {
      const parts = [a.name, a.role];
      if (a.hobbies.length > 0) parts.push(a.hobbies.join(", "));
      return parts.join(". ");
    })
    .join(". ");

  const description = `meet the atheles athletes. ${athleteList}.`;

  return {
    title: "our athletes",
    description,
    openGraph: {
      title: "our athletes | atheles 🔱",
      description,
      type: "profile",
      url: "https://atheles.co/athletes",
    },
  };
}

export default function AthletesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

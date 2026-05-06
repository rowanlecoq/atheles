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

const defaultAthletes = [
  {
    name: "rowan le coq",
    jobTitle: "founder & athlete",
    url: "https://atheles.co/athletes",
    sameAs: [
      "https://www.tiktok.com/@rowanlecoq",
      "https://www.instagram.com/rowanlecoq",
      "https://www.linkedin.com/in/rowanlecoq",
      "https://www.youtube.com/@rowanlecoq",
    ],
    affiliation: { "@type": "Organization", name: "Atheles", url: "https://atheles.co" },
  },
];

export default function AthletesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {defaultAthletes.map((athlete) => (
        <script
          key={athlete.name}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              name: athlete.name,
              jobTitle: athlete.jobTitle,
              url: athlete.url,
              sameAs: athlete.sameAs,
              affiliation: athlete.affiliation,
            }),
          }}
        />
      ))}
      {children}
    </>
  );
}

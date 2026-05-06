import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "our athletes",
  description:
    "meet the atheles athletes — rowan le coq, founder & athlete. want to be part of the team? apply here.",
  openGraph: {
    title: "our athletes — atheles",
    description:
      "rowan le coq is the founder & athlete behind atheles. follow on tiktok, instagram, youtube and linkedin.",
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

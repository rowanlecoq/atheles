import Footer from "components/layout/footer";
import { getAthletes, normalizeSocials } from "lib/athletes";
import { baseUrl } from "lib/utils";
import { AthletesContent } from "./athletes-content";

export default async function AthletesPage() {
  const athletes = await getAthletes();

  return (
    <>
      {athletes.map((athlete) => {
        const socials = normalizeSocials(athlete.socials);
        const jsonLd = {
          "@context": "https://schema.org",
          "@type": "Person",
          name: athlete.name,
          jobTitle: athlete.role,
          ...(athlete.description ? { description: athlete.description } : {}),
          ...(athlete.image ? { image: athlete.image } : {}),
          url: `${baseUrl}/athletes`,
          affiliation: {
            "@type": "Organization",
            name: "Atheles",
            url: baseUrl,
          },
          sameAs: socials
            .filter((s) => s.url.startsWith("http"))
            .map((s) => s.url),
        };
        return (
          <script
            key={athlete.name}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        );
      })}
      <AthletesContent initialAthletes={athletes} />
      <Footer />
    </>
  );
}

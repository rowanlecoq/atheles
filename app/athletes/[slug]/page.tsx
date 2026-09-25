import { notFound } from "next/navigation";
import { getAthletes, nameToSlug, normalizeSocials } from "lib/athletes";
import AthleteProfilePage from "./athlete-profile-page";
import type { Metadata } from "next";

export const revalidate = 60;

export async function generateStaticParams() {
  const athletes = await getAthletes();
  return athletes.map((a) => ({ slug: a.slug || nameToSlug(a.name) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const athletes = await getAthletes();
  const athlete = athletes.find((a) => (a.slug || nameToSlug(a.name)) === slug);
  if (!athlete) return {};
  return {
    title: athlete.name.toLowerCase(),
    description: athlete.description?.toLowerCase() || `${athlete.name.toLowerCase()} — ${athlete.role.toLowerCase()} at atheles.`,
  };
}

export default async function AthleteSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const athletes = await getAthletes();
  const athlete = athletes.find((a) => (a.slug || nameToSlug(a.name)) === slug);
  if (!athlete) notFound();

  const socials = normalizeSocials(athlete.socials);

  return <AthleteProfilePage athlete={{ ...athlete, socials }} />;
}

import Footer from "components/layout/footer";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "our athletes",
  description:
    "meet the athletes who represent atheles. want to be part of the team? apply here.",
};

const athletes = [
  {
    name: "rowan le coq",
    age: 18,
    role: "founder & athlete",
    image: null as string | null, // placeholder until custom image uploaded
    socials: {
      tiktok: "https://www.tiktok.com/@rowanlecoq",
      instagram: "https://www.instagram.com/rowanlecoq",
      linkedin: "https://www.linkedin.com/in/rowanlecoq",
      youtube: "https://www.youtube.com/@rowanlecoq",
    },
    hobbies: [
      "baking brownies or chocolate chip banana bread",
      "working out on the daily",
      "playing hockey",
    ],
  },
];

const requirements = [
  "post consistently on socials.",
  "stay true to your aesthetic.",
  "focus on your journey.",
  "highlight what makes you unique.",
  "tag @atheles.co in your posts and hashtags like #atheles #athelesathlete to promote engagement.",
  "have an active platform.",
];

export default function AthletesPage() {
  return (
    <>
      <div className="mx-auto min-h-[calc(100vh-200px)] max-w-4xl px-4 py-16 sm:px-6">
        <h1 className="mb-2 font-heading text-3xl uppercase tracking-wider text-brand-gold sm:text-4xl">
          our athletes.
        </h1>
        <div className="mb-2 h-px w-24 bg-brand-dark-gold/40" />
        <p className="mb-10 text-sm text-brand-grey">
          atheles athletes are on the way. stay tuned.
        </p>

        {/* Athletes grid */}
        <div className="mb-14 grid gap-6 sm:grid-cols-2">
          {athletes.map((athlete) => (
            <div
              key={athlete.name}
              className="overflow-hidden rounded-lg border border-brand-dark-gold/20 bg-brand-dark"
            >
              {/* Image */}
              <div className="relative aspect-[4/5] w-full bg-brand-medium-grey/10">
                {athlete.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={athlete.image}
                    alt={athlete.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2">
                    <span className="text-3xl">🔱</span>
                    <span className="text-xs uppercase tracking-wider text-brand-dark-gold">
                      photo coming soon
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-5">
                <div className="mb-1 flex items-baseline justify-between">
                  <h2 className="font-heading text-lg text-brand-gold">
                    {athlete.name}
                  </h2>
                  <span className="text-xs text-brand-grey">
                    age {athlete.age}
                  </span>
                </div>
                <p className="mb-4 text-xs uppercase tracking-wider text-brand-dark-gold">
                  {athlete.role}
                </p>

                {/* Hobbies */}
                <div className="mb-4">
                  <p className="mb-2 text-[10px] uppercase tracking-wider text-brand-grey">
                    interests
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {athlete.hobbies.map((hobby) => (
                      <span
                        key={hobby}
                        className="rounded-full border border-brand-dark-gold/20 px-2.5 py-1 text-[11px] text-brand-grey"
                      >
                        {hobby}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Socials */}
                <div className="flex gap-3">
                  {athlete.socials.tiktok && (
                    <a
                      href={athlete.socials.tiktok}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-grey transition-colors hover:text-brand-gold"
                      aria-label="TikTok"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.56a8.24 8.24 0 004.78 1.52V6.69h-1.02z" />
                      </svg>
                    </a>
                  )}
                  {athlete.socials.instagram && (
                    <a
                      href={athlete.socials.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-grey transition-colors hover:text-brand-gold"
                      aria-label="Instagram"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                        <rect x="2" y="2" width="20" height="20" rx="5" />
                        <circle cx="12" cy="12" r="5" />
                        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                      </svg>
                    </a>
                  )}
                  {athlete.socials.youtube && (
                    <a
                      href={athlete.socials.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-grey transition-colors hover:text-brand-gold"
                      aria-label="YouTube"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                        <path d="M23.5 6.19a3.02 3.02 0 00-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.55A3.02 3.02 0 00.5 6.19 31.56 31.56 0 000 12a31.56 31.56 0 00.5 5.81 3.02 3.02 0 002.12 2.14c1.88.55 9.38.55 9.38.55s7.5 0 9.38-.55a3.02 3.02 0 002.12-2.14A31.56 31.56 0 0024 12a31.56 31.56 0 00-.5-5.81zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" />
                      </svg>
                    </a>
                  )}
                  {athlete.socials.linkedin && (
                    <a
                      href={athlete.socials.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-grey transition-colors hover:text-brand-gold"
                      aria-label="LinkedIn"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                        <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05a3.74 3.74 0 013.37-1.85c3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 110-4.12 2.06 2.06 0 010 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.23 0H1.77A1.75 1.75 0 000 1.73v20.54A1.75 1.75 0 001.77 24h20.46A1.75 1.75 0 0024 22.27V1.73A1.75 1.75 0 0022.23 0z" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Requirements section */}
        <div className="mb-12 rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-6 sm:p-8">
          <h2 className="mb-1 font-heading text-xl text-brand-gold">
            want to become an atheles athlete?
          </h2>
          <p className="mb-6 text-sm text-brand-grey">
            we&apos;re building a team of driven individuals who represent the
            new era. here&apos;s what we look for:
          </p>

          <h3 className="mb-3 text-xs uppercase tracking-wider text-brand-pale-gold">
            requirements
          </h3>
          <ul className="mb-8 space-y-2.5">
            {requirements.map((req) => (
              <li key={req} className="flex items-start gap-2.5 text-sm text-brand-grey">
                <span className="mt-0.5 text-xs text-brand-gold">🔱</span>
                {req}
              </li>
            ))}
          </ul>

          <div className="border-t border-brand-dark-gold/20 pt-6 text-center">
            <p className="mb-4 text-sm text-brand-grey">
              think you have what it takes? reach out and tell us about yourself.
            </p>
            <Link
              href="/contact"
              className="inline-block rounded-full bg-brand-gold px-8 py-3 text-sm uppercase tracking-wider text-brand-dark transition-opacity hover:opacity-90"
            >
              apply now
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

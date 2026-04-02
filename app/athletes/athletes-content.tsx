"use client";

import { useEffect, useState } from "react";

type Social = { platform: string; url: string };

type Athlete = {
  name: string;
  age: number;
  role: string;
  description?: string;
  image: string | null;
  socials: Social[] | Record<string, string>;
  hobbies: string[];
};

const defaultAthletes: Athlete[] = [
  {
    name: "rowan le coq",
    age: 18,
    role: "founder & athlete",
    description: "",
    image: null,
    socials: [
      { platform: "tiktok", url: "https://www.tiktok.com/@rowanlecoq" },
      { platform: "instagram", url: "https://www.instagram.com/rowanlecoq" },
      { platform: "linkedin", url: "https://www.linkedin.com/in/rowanlecoq" },
      { platform: "youtube", url: "https://www.youtube.com/@rowanlecoq" },
    ],
    hobbies: ["baking brownies or chocolate chip banana bread", "working out on the daily", "playing hockey"],
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

function normalizeSocials(socials: Social[] | Record<string, string>): Social[] {
  if (Array.isArray(socials)) return socials.filter((s) => s.url);
  return Object.entries(socials).filter(([, v]) => v).map(([k, v]) => ({ platform: k, url: v }));
}

function socialUrl(s: Social): string {
  if (s.url.includes("@") && !s.url.startsWith("http")) return `mailto:${s.url}`;
  if (s.url.startsWith("http")) return s.url;
  return `https://${s.url}`;
}

export function AthletesContent() {
  const [athletes, setAthletes] = useState<Athlete[]>(defaultAthletes);

  useEffect(() => {
    fetch("/api/admin/athletes")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.athletes?.length > 0) setAthletes(d.athletes); })
      .catch(() => {});
  }, []);

  return (
    <div className="mx-auto min-h-[calc(100vh-200px)] max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="mb-2 text-center font-heading text-3xl tracking-wider text-brand-gold sm:text-4xl">
        our athletes
      </h1>
      <p className="mb-10 text-center text-sm text-brand-grey">
        atheles athletes are on the way. stay tuned.
      </p>

      <div className="mb-14 grid gap-6 sm:grid-cols-2">
        {athletes.map((athlete) => (
          <div key={athlete.name} className="overflow-hidden rounded-lg border border-brand-dark-gold/20 bg-brand-dark">
            <div className="relative aspect-[4/5] w-full bg-brand-medium-grey/10">
              {athlete.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={athlete.image} alt={athlete.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2">
                  <span className="text-3xl">🔱</span>
                  <span className="text-xs uppercase tracking-wider text-brand-dark-gold">photo coming soon</span>
                </div>
              )}
            </div>
            <div className="p-5">
              <div className="mb-1 flex items-baseline justify-between">
                <h2 className="font-heading text-lg text-brand-gold">{athlete.name}</h2>
                <span className="text-xs text-brand-grey">age {athlete.age}</span>
              </div>
              <p className="mb-3 text-xs uppercase tracking-wider text-brand-dark-gold">{athlete.role}</p>

              {/* Description */}
              {athlete.description && (
                <p className="mb-4 text-xs leading-relaxed text-brand-grey">{athlete.description}</p>
              )}

              {/* Hobbies */}
              {athlete.hobbies.length > 0 && (
                <div className="mb-4">
                  <p className="mb-2 text-[10px] uppercase tracking-wider text-brand-grey">interests</p>
                  <div className="flex flex-wrap gap-1.5">
                    {athlete.hobbies.map((hobby) => (
                      <span key={hobby} className="rounded-full border border-brand-dark-gold/20 px-2.5 py-1 text-[11px] text-brand-grey">{hobby}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Socials */}
              {normalizeSocials(athlete.socials).length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {normalizeSocials(athlete.socials).map((s) => (
                    <a
                      key={s.platform + s.url}
                      href={socialUrl(s)}
                      target={socialUrl(s).startsWith("mailto:") ? undefined : "_blank"}
                      rel="noopener noreferrer"
                      className="text-xs text-brand-grey transition-colors hover:text-brand-gold"
                    >
                      {s.platform}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mb-12 rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-6 sm:p-8">
        <h2 className="mb-1 font-heading text-xl text-brand-gold">want to become an atheles athlete?</h2>
        <p className="mb-6 text-sm text-brand-grey">
          we&apos;re building a team of driven individuals who represent the new era. here&apos;s what we look for:
        </p>
        <h3 className="mb-3 text-xs uppercase tracking-wider text-brand-pale-gold">requirements</h3>
        <ul className="space-y-2.5">
          {requirements.map((req) => (
            <li key={req} className="flex items-start gap-2.5 text-sm text-brand-grey">
              <span className="mt-0.5 text-xs text-brand-gold">🔱</span>
              {req}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

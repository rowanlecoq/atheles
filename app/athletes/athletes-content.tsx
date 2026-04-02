"use client";

import { useEffect, useState } from "react";

type Athlete = {
  name: string;
  age: number;
  role: string;
  image: string | null;
  socials: { tiktok: string; instagram: string; linkedin: string; youtube: string; snapchat?: string; email?: string };
  hobbies: string[];
};

const defaultAthletes: Athlete[] = [
  {
    name: "rowan le coq",
    age: 18,
    role: "founder & athlete",
    image: null,
    socials: {
      tiktok: "https://www.tiktok.com/@rowanlecoq",
      instagram: "https://www.instagram.com/rowanlecoq",
      linkedin: "https://www.linkedin.com/in/rowanlecoq",
      youtube: "https://www.youtube.com/@rowanlecoq",
      snapchat: "",
      email: "",
    },
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
              <p className="mb-4 text-xs uppercase tracking-wider text-brand-dark-gold">{athlete.role}</p>
              <div className="mb-4">
                <p className="mb-2 text-[10px] uppercase tracking-wider text-brand-grey">interests</p>
                <div className="flex flex-wrap gap-1.5">
                  {athlete.hobbies.map((hobby) => (
                    <span key={hobby} className="rounded-full border border-brand-dark-gold/20 px-2.5 py-1 text-[11px] text-brand-grey">{hobby}</span>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                {athlete.socials.tiktok && (
                  <a href={athlete.socials.tiktok} target="_blank" rel="noopener noreferrer" className="text-brand-grey transition-colors hover:text-brand-gold" aria-label="TikTok">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" /></svg>
                  </a>
                )}
                {athlete.socials.instagram && (
                  <a href={athlete.socials.instagram} target="_blank" rel="noopener noreferrer" className="text-brand-grey transition-colors hover:text-brand-gold" aria-label="Instagram">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="5" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>
                  </a>
                )}
                {athlete.socials.youtube && (
                  <a href={athlete.socials.youtube} target="_blank" rel="noopener noreferrer" className="text-brand-grey transition-colors hover:text-brand-gold" aria-label="YouTube">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><rect x="2" y="4" width="20" height="16" rx="4" /><polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none" /></svg>
                  </a>
                )}
                {athlete.socials.linkedin && (
                  <a href={athlete.socials.linkedin} target="_blank" rel="noopener noreferrer" className="text-brand-grey transition-colors hover:text-brand-gold" aria-label="LinkedIn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg>
                  </a>
                )}
                {athlete.socials.snapchat && (
                  <a href={`https://www.snapchat.com/add/${athlete.socials.snapchat}`} target="_blank" rel="noopener noreferrer" className="text-brand-grey transition-colors hover:text-brand-gold" aria-label="Snapchat">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M12 2C8 2 5.5 4.5 5.5 8v2.5c0 .5-.5 1-1.5 1.2-.5.1-1 .5-1 1s.5.9 1 1c1 .2 1.5.5 1.5 1 0 .3-.2.6-.5.9-.8.8-1 1.3-1 1.8 0 .8.8 1.2 1.5 1.4 1 .3 1.5.5 1.5 1.2 0 1 2 2 5 2s5-1 5-2c0-.7.5-.9 1.5-1.2.7-.2 1.5-.6 1.5-1.4 0-.5-.2-1-1-1.8-.3-.3-.5-.6-.5-.9 0-.5.5-.8 1.5-1 .5-.1 1-.5 1-1s-.5-.9-1-1c-1-.2-1.5-.7-1.5-1.2V8c0-3.5-2.5-6-6.5-6z" /></svg>
                  </a>
                )}
                {athlete.socials.email && (
                  <a href={`mailto:${athlete.socials.email}`} className="text-brand-grey transition-colors hover:text-brand-gold" aria-label="Email">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 4L12 13 2 4" /></svg>
                  </a>
                )}
              </div>
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

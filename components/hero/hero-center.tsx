"use client";

import { FadeIn, MagneticHover } from "components/animations";
import Link from "next/link";
import { useEffect, useState } from "react";

const greetings = [
  "welcome back",
  "good to see you",
  "hey",
  "what's good",
  "let's go",
  "rise up",
  "ready to ascend",
];

export function HeroCenter() {
  const [userName, setUserName] = useState<string | null>(null);
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    // Pick a random greeting
    setGreeting(greetings[Math.floor(Math.random() * greetings.length)]!);

    // Check if logged in
    if (!document.cookie.includes("atheles-logged-in=1")) return;
    try {
      const cached = sessionStorage.getItem("atheles-session");
      if (cached) {
        const u = JSON.parse(cached);
        if (u.firstName || u.name) {
          setUserName(u.firstName || u.name.split(" ")[0]);
        }
        return;
      }
    } catch {}
    fetch("/api/auth/session")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) {
          setUserName(data.user.firstName || data.user.name?.split(" ")[0] || null);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
      {userName && greeting && (
        <FadeIn direction="up" delay={0.15}>
          <p className="mb-1 text-xs lowercase tracking-[0.08em] text-brand-dark-gold sm:text-sm">
            {greeting}, {userName.toLowerCase()}.
          </p>
        </FadeIn>
      )}

      <FadeIn direction="up" delay={0.3}>
        <p className="mb-2 text-sm lowercase tracking-[0.06em] text-brand-grey sm:text-base sm:tracking-[0.08em]">
          welcome to atheles.
        </p>
      </FadeIn>

      <FadeIn delay={0.45} direction="none">
        <div className="mx-auto my-5 h-px w-28 bg-brand-dark-gold/40" />
      </FadeIn>

      <FadeIn direction="up" delay={0.65}>
        <MagneticHover className="inline-block">
          <Link
            href="/search"
            className="inline-block border border-brand-gold px-7 py-3 text-sm uppercase tracking-[0.18em] text-brand-gold transition-colors duration-300 hover:bg-brand-gold hover:text-brand-dark sm:px-8 sm:tracking-[0.24em]"
          >
            enter store
          </Link>
        </MagneticHover>
      </FadeIn>

      <FadeIn direction="up" delay={0.85}>
        <p className="mt-6 max-w-sm text-xs leading-relaxed tracking-wide text-brand-dark-gold animate-[beta-pulse_3s_ease-in-out_infinite] sm:text-[13px]">
          currently in beta. if there are any issues please send a message to{" "}
          <a
            href="https://www.instagram.com/atheles.co/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-grey transition-colors hover:text-brand-gold"
          >
            @atheles.co
          </a>{" "}
          or{" "}
          <a
            href="mailto:athelesbrand@gmail.com"
            className="text-brand-grey transition-colors hover:text-brand-gold"
          >
            athelesbrand@gmail.com
          </a>
        </p>
      </FadeIn>
    </div>
  );
}

"use client";

import { FadeIn, MagneticHover } from "components/animations";
import Link from "next/link";

export function HeroCenter() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
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
    </div>
  );
}

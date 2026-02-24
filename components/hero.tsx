"use client";

import { animationDurations, animationStaggers } from "lib/animation-config";
import { FadeIn, MagneticHover, SplitText } from "components/animations";
import { GoldParticles } from "components/gold-particles";
import { LaurelWreath } from "components/laurel-wreath";
import Image from "next/image";
import Link from "next/link";

const categories = [
  { label: "compressions", href: "/search" },
  { label: "oversized", href: "/search" },
  { label: "sweatpants", href: "/search" },
];

export function Hero() {
  return (
    <section className="relative flex min-h-[92vh] items-center justify-center overflow-hidden px-4 py-20 sm:px-6">
      <Image
        src="/statues/greek-god-hero.png?v=2"
        alt=""
        fill
        priority
        className="object-cover object-center opacity-10 grayscale"
        sizes="100vw"
      />
      <div
        className="absolute inset-0 opacity-34"
        style={{
          backgroundImage: "url('/greek-pattern.svg')",
          backgroundSize: "1300px 1300px",
          backgroundRepeat: "repeat",
          backgroundPosition: "center top",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/76 via-brand-dark/70 to-brand-dark/90" />
      <GoldParticles count={22} />

      <div className="relative z-10 mx-auto max-w-3xl text-center">
        {/* Title — laurels are absolutely positioned so they never affect text layout */}
        <div className="mb-5 flex justify-center">
          <div className="relative">
            <SplitText
              as="h1"
              text="atheles"
              delay={0.1}
              stagger={animationStaggers.hero}
              duration={animationDurations.hero}
              className="whitespace-nowrap font-heading text-5xl tracking-[0.06em] text-brand-gold sm:text-7xl sm:tracking-[0.08em] md:text-8xl lg:text-9xl"
            />
            <div className="absolute right-full top-1/2 -translate-y-1/2 pr-1 sm:pr-2 md:pr-3">
              <LaurelWreath side="left" />
            </div>
            <div className="absolute left-full top-1/2 -translate-y-1/2 pl-1 sm:pl-2 md:pl-3">
              <LaurelWreath side="right" />
            </div>
          </div>
        </div>

        <FadeIn direction="up" delay={0.45}>
          <p className="mb-2 text-[11px] lowercase tracking-[0.06em] text-brand-grey sm:text-sm sm:tracking-[0.08em]">
            welcome to atheles.
          </p>
        </FadeIn>

        <FadeIn direction="up" delay={0.58}>
          <p className="text-[11px] lowercase tracking-[0.06em] text-brand-pale-gold sm:text-sm sm:tracking-[0.08em]">
            opening on 5.6.26.
          </p>
        </FadeIn>

        <FadeIn delay={0.68} direction="none">
          <div className="mx-auto my-6 h-px w-32 bg-brand-dark-gold/40" />
        </FadeIn>

        <SplitText
          as="p"
          text="greek god inspired athletic wear"
          delay={0.72}
          mode="words"
          className="mb-6 text-[10px] uppercase tracking-[0.22em] text-brand-grey sm:text-xs sm:tracking-[0.28em]"
        />

        <FadeIn direction="up" delay={0.88}>
          <MagneticHover className="inline-block">
            <Link
              href="/search"
              className="inline-block border border-brand-gold px-6 py-3 text-xs uppercase tracking-[0.18em] text-brand-gold transition-colors duration-300 hover:bg-brand-gold hover:text-brand-dark sm:px-8 sm:tracking-[0.24em]"
            >
              shop for more
            </Link>
          </MagneticHover>
        </FadeIn>

        <div className="mt-8 flex items-center justify-center gap-6 sm:gap-8">
          {categories.map((cat, i) => (
            <FadeIn key={cat.label} direction="up" delay={1.0 + i * 0.08}>
              <Link
                href={cat.href}
                className="text-[10px] uppercase tracking-[0.18em] text-brand-dark-gold transition-colors duration-300 hover:text-brand-gold sm:text-xs sm:tracking-[0.22em]"
              >
                {cat.label}
              </Link>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

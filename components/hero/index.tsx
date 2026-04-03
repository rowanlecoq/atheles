"use client";

import { GoldParticles } from "components/gold-particles";
import { useSiteImage, isVideoSrc } from "lib/hooks/use-site-images";
import Image from "next/image";
import { HeroCategoryNav } from "./hero-category-nav";
import { HeroCenter } from "./hero-center";

export function Hero() {
  const heroBg = useSiteImage("hero_bg");
  const heroLeft = useSiteImage("hero_left");
  const heroRight = useSiteImage("hero_right");

  return (
    <section className="relative overflow-x-hidden bg-brand-dark">
      {/* Background — supports video or image */}
      {isVideoSrc(heroBg) ? (
        <video
          src={heroBg}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover opacity-15 grayscale"
        />
      ) : (
        <Image
          src={heroBg}
          alt=""
          fill
          priority
          className="object-cover object-center opacity-10 grayscale"
          sizes="100vw"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/76 via-brand-dark/70 to-brand-dark/90" />
      <GoldParticles count={16} />

      {/* 3-column grid: image | center | image */}
      <div className="relative z-10 mx-auto grid h-[420px] grid-cols-1 py-4 md:h-[580px] md:grid-cols-[minmax(170px,1fr)_2fr_minmax(170px,1fr)] md:gap-3 md:py-4 lg:h-[620px] lg:gap-4">
        {/* === Left panel === */}
        <div className="hidden overflow-hidden rounded-sm md:block">
          <div className="relative h-full w-full">
            {isVideoSrc(heroLeft) ? (
              <video src={heroLeft} autoPlay muted loop playsInline className="h-full w-full object-cover opacity-50 grayscale" />
            ) : (
              <Image src={heroLeft} alt="" fill className="object-cover object-top opacity-50 grayscale" sizes="(min-width: 768px) 25vw, 0px" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/60 via-transparent to-brand-dark/30" />
          </div>
        </div>

        {/* === Center: Category nav + hero content === */}
        <div className="relative flex flex-col px-4">
          <HeroCategoryNav />
          <HeroCenter />
        </div>

        {/* === Right panel === */}
        <div className="hidden overflow-hidden rounded-sm md:block">
          <div className="relative h-full w-full">
            {isVideoSrc(heroRight) ? (
              <video src={heroRight} autoPlay muted loop playsInline className="h-full w-full object-cover opacity-50 grayscale" />
            ) : (
              <Image src={heroRight} alt="" fill className="object-cover object-top opacity-50 grayscale" sizes="(min-width: 768px) 25vw, 0px" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/60 via-transparent to-brand-dark/30" />
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-brand-dark to-transparent" />
    </section>
  );
}

"use client";

import { GoldParticles } from "components/gold-particles";
import { SlideshowMedia } from "components/slideshow-media";
import { HeroCategoryNav } from "./hero-category-nav";
import { HeroCenter } from "./hero-center";

export function Hero() {
  return (
    <section className="theme-section relative overflow-hidden bg-brand-dark">
      {/* Background — slideshow with crossfade */}
      <SlideshowMedia
        slotKey="hero_bg"
        className="object-cover object-center"
        iframeClass="absolute inset-0 h-[120%] w-[120%] -left-[10%] -top-[10%] pointer-events-none"
        sizes="100vw"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/76 via-brand-dark/70 to-brand-dark/90" />
      <GoldParticles count={16} />

      {/* 3-column grid: image | center | image */}
      <div className="relative z-10 mx-auto grid h-[420px] grid-cols-1 py-4 md:h-[580px] md:grid-cols-[minmax(170px,1fr)_2fr_minmax(170px,1fr)] md:gap-3 md:py-4 lg:h-[620px] lg:gap-4">
        {/* === Left panel === */}
        <div className="hidden overflow-hidden rounded-sm md:block">
          <div className="relative h-full w-full overflow-hidden">
            <SlideshowMedia
              slotKey="hero_left"
              className="object-cover object-top"
              iframeClass="h-full w-full pointer-events-none"
              sizes="(min-width: 768px) 25vw, 0px"
              priority
            />
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-brand-dark/60 via-transparent to-brand-dark/30" />
          </div>
        </div>

        {/* === Center: Category nav + hero content === */}
        <div className="relative flex flex-col px-4">
          <HeroCategoryNav />
          <HeroCenter />
        </div>

        {/* === Right panel === */}
        <div className="hidden overflow-hidden rounded-sm md:block">
          <div className="relative h-full w-full overflow-hidden">
            <SlideshowMedia
              slotKey="hero_right"
              className="object-cover object-top"
              iframeClass="h-full w-full pointer-events-none"
              sizes="(min-width: 768px) 25vw, 0px"
              priority
            />
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-brand-dark/60 via-transparent to-brand-dark/30" />
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="hero-bottom-fade absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-brand-dark to-transparent" />
    </section>
  );
}

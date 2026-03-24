"use client";

import { FadeIn } from "components/animations";
import Image from "next/image";

export function HeroVideoPanel() {
  return (
    <FadeIn delay={0.3} direction="right" className="h-full">
      <div className="flex h-full flex-col overflow-hidden rounded-sm border border-brand-dark-gold/25 bg-[#1e1e1e]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-brand-dark-gold/15 px-4 py-2.5">
          <span className="text-[10px] uppercase tracking-[0.2em] text-brand-dark-gold">
            the brand
          </span>
          <span className="text-[9px] uppercase tracking-[0.15em] text-brand-dark-gold/50">
            coming soon
          </span>
        </div>

        {/* Image */}
        <div className="group relative flex-1 overflow-hidden">
          <Image
            src="/statues/trajan-louvre.jpg"
            alt="the atheles story"
            fill
            className="object-cover opacity-50 grayscale transition-all duration-700 group-hover:opacity-70 group-hover:grayscale-0"
            sizes="(min-width: 768px) 25vw, 0px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/80 via-brand-dark/20 to-transparent" />

          {/* Bottom label */}
          <div className="absolute bottom-3 left-4 right-4">
            <p className="text-xs uppercase tracking-[0.15em] text-brand-gold">
              the atheles story
            </p>
            <p className="mt-1 text-[9px] tracking-wider text-brand-grey/70">
              behind the brand
            </p>
          </div>
        </div>
      </div>
    </FadeIn>
  );
}

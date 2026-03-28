import { FadeIn, GradualBlur, ScrollFloat, SplitText } from "components/animations";
import Image from "next/image";

export function BrandStory() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:pb-20 sm:pt-10 md:px-6">
      <div className="grid gap-10 md:grid-cols-2 md:gap-16">
        {/* Text content */}
        <FadeIn direction="right" className="flex flex-col justify-center">
          <ScrollFloat>
            <SplitText
              as="h2"
              text="Forged in the Spirit of the Gods"
              mode="words"
              className="mb-6 text-balance font-heading text-2xl font-bold tracking-[0.08em] text-brand-gold sm:text-3xl sm:tracking-wider md:text-4xl"
            />
          </ScrollFloat>
          <p className="mb-6 text-sm leading-relaxed text-brand-grey">
            Atheles draws from the timeless power of Greek mythology &mdash; where
            gods and athletes were one. Every garment is crafted to embody the
            strength, discipline, and beauty of the classical ideal.
          </p>
          <p className="mb-6 text-sm leading-relaxed text-brand-grey">
            From heavyweight 460 GSM cotton fleece to precision-engineered
            compression wear, our pieces are built for those who train with
            purpose. Greek-inspired design meets modern performance fabric,
            creating athletic wear worthy of Olympus.
          </p>
          <p className="text-sm leading-relaxed text-brand-grey">
            This is not fast fashion. This is{" "}
            <span className="text-brand-pale-gold">authentic superiority</span>.
          </p>
        </FadeIn>

        {/* Statue image */}
        <GradualBlur className="flex items-center justify-center">
          <div className="relative h-[200px] w-full overflow-hidden rounded-lg border border-brand-dark-gold/20 bg-brand-dark sm:h-[240px] md:h-[280px]">
            <Image
              src="/statues/roman-emperor-pergamon.jpg"
              alt=""
              fill
              className="object-cover object-[center_24%] opacity-70 grayscale"
              sizes="(min-width: 768px) 50vw, 100vw"
            />
            <div className="absolute inset-0 bg-brand-dark/30" />
          </div>
        </GradualBlur>
      </div>
    </section>
  );
}

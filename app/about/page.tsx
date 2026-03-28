import Image from "next/image";
import Footer from "components/layout/footer";
import { FadeIn, BlurReveal, ScaleIn } from "components/animations";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "about",
  description:
    "discover the story behind atheles, designed for those who demand authentic superiority.",
};

export default function AboutPage() {
  return (
    <>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:py-12">
        {/* Hero */}
        <FadeIn className="mb-12 text-center">
          <BlurReveal>
            <h1 className="mb-4 font-heading text-4xl leading-tight text-brand-gold sm:text-5xl md:text-6xl">
              Our Story
            </h1>
          </BlurReveal>
          <p className="text-[11px] uppercase tracking-[0.18em] text-brand-pale-gold sm:text-xs sm:tracking-[0.3em]">
            Where Ancient Artistry Meets Modern Performance
          </p>
        </FadeIn>

        {/* Hero statue image */}
        <ScaleIn className="mb-16">
          <div className="relative h-80 w-full overflow-hidden rounded-lg bg-brand-dark md:h-96">
            <Image
              src="/statues/doryphoros.jpg"
              alt="Doryphoros male athlete sculpture"
              fill
              className="object-cover object-[center_20%] grayscale"
              sizes="(min-width: 768px) 896px, 100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-transparent to-transparent" />
          </div>
        </ScaleIn>

        {/* Brand Origin */}
        <FadeIn>
          <section className="mb-16">
            <div className="mb-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-brand-dark-gold/20" />
              <h2 className="font-heading text-xl text-brand-light-gold sm:text-2xl">
                The Origin
              </h2>
              <div className="h-px flex-1 bg-brand-dark-gold/20" />
            </div>
            <div className="grid gap-8 md:grid-cols-2">
              <div className="space-y-4 text-sm leading-relaxed text-brand-grey">
                <p>
                  ATHELES was born from a singular vision: to create athletic wear
                  that embodies the strength, beauty, and discipline of the ancient
                  Greek gods. The name itself is derived from the Greek word for
                  athlete — those who competed not just for victory, but for the
                  pursuit of human excellence.
                </p>
                <p>
                  In ancient Greece, athletes were revered as living embodiments of
                  divine potential. They trained their bodies to mirror the
                  perfection of the gods depicted in marble and bronze. ATHELES
                  channels this same ethos into every garment we create.
                </p>
              </div>
              <ScaleIn className="flex items-center justify-center">
                <div className="relative h-64 w-full overflow-hidden rounded-lg bg-brand-dark">
                  <Image
                    src="/statues/apollo-belvedere.jpg"
                    alt="Apollo Belvedere male marble sculpture"
                    fill
                    className="object-cover object-[center_28%] grayscale"
                    sizes="(min-width: 768px) 400px, 100vw"
                  />
                  <div className="absolute inset-0 bg-brand-gold/5" />
                </div>
              </ScaleIn>
            </div>
          </section>
        </FadeIn>

        {/* Logo Section */}
        <FadeIn>
          <section className="mb-16 flex flex-col items-center">
            <div className="mb-8 rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-8">
              <Image
                src="/logo-atheles.webp"
                alt="ATHELES logo"
                width={300}
                height={100}
                className="opacity-90"
              />
            </div>
            <p className="max-w-lg text-center text-xs leading-relaxed text-brand-grey">
              Our logo, rendered in gothic blackletter, bridges the gap between
              classical antiquity and modern street culture — a typographic
              declaration that tradition and innovation are not opposites, but
              allies.
            </p>
          </section>
        </FadeIn>

        {/* Philosophy */}
        <FadeIn>
          <section className="mb-16">
            <div className="mb-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-brand-dark-gold/20" />
              <h2 className="font-heading text-xl text-brand-light-gold sm:text-2xl">
                Philosophy
              </h2>
              <div className="h-px flex-1 bg-brand-dark-gold/20" />
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {[
                {
                  title: "Craftsmanship",
                  text: "Every stitch, every seam, every fabric choice is deliberate. We use premium materials — heavyweight cottons, 4-way stretch performance blends, custom hardware — because the gods never settled for less.",
                },
                {
                  title: "Performance",
                  text: "From 310 GSM compression tops engineered for shoulder definition and hourglass silhouettes, to 450 GSM sweatpants built for durability through thousands of training sessions. Function is not sacrificed for form.",
                },
                {
                  title: "Identity",
                  text: "ATHELES is more than clothing. It's a statement of intent. When you wear ATHELES, you declare that you pursue excellence in every domain — in the gym, on the street, and in life.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-6"
                >
                  <h3 className="mb-3 font-heading text-lg text-brand-gold">
                    {item.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-brand-grey">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </FadeIn>

        {/* Brand Values */}
        <FadeIn>
          <section className="mb-16">
            <div className="mb-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-brand-dark-gold/20" />
              <h2 className="text-center font-heading text-xl text-brand-light-gold sm:text-2xl">
                Authentic Superiority
              </h2>
              <div className="h-px flex-1 bg-brand-dark-gold/20" />
            </div>
            <div className="rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-8 text-center">
              <p className="mb-6 text-sm leading-relaxed text-brand-grey">
                Our tagline is not arrogance — it is aspiration. &ldquo;Authentic
                Superiority&rdquo; means striving for the highest version of
                yourself, authentically and without compromise. It is the same
                pursuit that drove Greek athletes to compete naked under the sun,
                baring everything, hiding nothing.
              </p>
              <p className="text-xs uppercase tracking-[0.2em] text-brand-gold">
                Est. 2026 &middot; Designed with divine intent
              </p>
            </div>
          </section>
        </FadeIn>

        {/* Color Palette */}
        <FadeIn>
          <section>
            <div className="mb-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-brand-dark-gold/20" />
              <h2 className="font-heading text-xl text-brand-light-gold sm:text-2xl">
                Our Palette
              </h2>
              <div className="h-px flex-1 bg-brand-dark-gold/20" />
            </div>
            <p className="mb-6 text-sm text-brand-grey">
              Inspired by ancient Greek temples at dusk — dark stone lit by golden
              hour light. All color effects in our garments are achieved through
              fabric dye and pigment only. No metallic, foil, or glossy finishes.
            </p>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {[
                { name: "Dark Grey", hex: "#1A1A1A" },
                { name: "Dark Gold", hex: "#7F6F4C" },
                { name: "Gold", hex: "#CCB173" },
                { name: "Pale Gold", hex: "#B09E73" },
                { name: "Light Gold", hex: "#E5C685" },
                { name: "Medium Grey", hex: "#484848" },
              ].map((color) => (
                <div key={color.hex} className="text-center">
                  <div
                    className="mx-auto mb-2 h-12 w-12 rounded-full border border-brand-dark-gold/30"
                    style={{ backgroundColor: color.hex }}
                  />
                  <p className="text-[10px] text-brand-grey">{color.name}</p>
                  <p className="text-[10px] text-brand-grey/60">{color.hex}</p>
                </div>
              ))}
            </div>
          </section>
        </FadeIn>
      </div>
      <Footer />
    </>
  );
}

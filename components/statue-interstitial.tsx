import { SplitText } from "components/animations";
import Image from "next/image";

export function StatueInterstitial() {
  return (
    <section className="relative flex h-[180px] items-center justify-center overflow-hidden sm:h-[220px]">
      <Image
        src="/statues/hadrian-cuirassed.jpg"
        alt=""
        fill
        className="object-cover object-[center_30%] opacity-10 grayscale"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/60 via-transparent to-brand-dark/60" />

      <div className="relative z-10 text-center">
        <SplitText
          as="p"
          text="to ascend"
          className="font-heading text-2xl tracking-[0.12em] text-brand-gold sm:text-3xl sm:tracking-[0.2em] md:text-4xl"
        />
        <div className="mx-auto mt-4 h-px w-32 bg-brand-dark-gold/40" />
      </div>
    </section>
  );
}

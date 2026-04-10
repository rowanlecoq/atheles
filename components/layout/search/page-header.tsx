"use client";

import { SplitText } from "components/animations/split-text";
import { SlideshowMedia } from "components/slideshow-media";
import { usePathname } from "next/navigation";

const collectionTitles: Record<string, string> = {
  mens: "mens",
  womens: "womens",
  accessories: "accessories",
  compressions: "compressions",
  tees: "tees",
  "t-shirts": "tees",
  sweatpants: "sweatpants",
  "og-series": "og series",
};

export default function SearchPageHeader() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const collection = segments.length > 1 ? segments[segments.length - 1]! : null;
  const title = collection ? collectionTitles[collection] || collection : "store";

  return (
    <div className="relative overflow-hidden border-b border-brand-dark-gold/20 bg-brand-dark" style={{ minHeight: 130 }}>
      {/* Hero background image — slideshow */}
      <SlideshowMedia
        slotKey="store_header"
        className="object-cover object-center"
        sizes="100vw"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/30 via-brand-dark/60 to-brand-dark" />
      {/* Content */}
      <div className="relative px-4 pb-8 pt-10 sm:pb-10 sm:pt-14" style={{ paddingTop: 40, paddingBottom: 32 }}>
        <div className="mx-auto max-w-(--breakpoint-2xl) text-center">
          <SplitText
            key={title}
            text={title}
            as="h1"
            className="mb-2 font-heading text-3xl tracking-[0.08em] text-brand-gold sm:text-4xl md:text-5xl"
            duration={0.25}
            stagger={0.02}
          />
        </div>
      </div>
    </div>
  );
}

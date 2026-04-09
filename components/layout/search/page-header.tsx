"use client";

import { motion } from "motion/react";
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
    <div className="relative min-h-[180px] overflow-hidden border-b border-brand-dark-gold/20 bg-brand-dark sm:min-h-[220px]">
      {/* Hero background image — slideshow */}
      <SlideshowMedia
        slotKey="store_header"
        className="object-cover object-center"
        sizes="100vw"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/30 via-brand-dark/60 to-brand-dark" />
      {/* Content */}
      <div className="relative px-4 pb-8 pt-10 sm:pb-10 sm:pt-14">
        <div className="mx-auto max-w-(--breakpoint-2xl) text-center">
          <motion.h1
            key={title}
            initial={{ y: 10, filter: "blur(8px)" }}
            animate={{ y: 0, filter: "blur(0.001px)" }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mb-2 font-heading text-3xl tracking-[0.08em] text-brand-gold sm:text-4xl md:text-5xl"
          >
            {title}
          </motion.h1>
        </div>
      </div>
    </div>
  );
}

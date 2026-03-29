"use client";

import { SplitText } from "components/animations";
import Image from "next/image";
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
  // /search/mens → ["search", "mens"] → collection = "mens"
  const collection = segments.length > 1 ? segments[segments.length - 1]! : null;
  const title = collection ? collectionTitles[collection] || collection : "shop";

  return (
    <div className="relative overflow-hidden border-b border-brand-dark-gold/10">
      {/* Hero background image */}
      <div className="absolute inset-0">
        <Image
          src="/statues/doryphoros.jpg"
          alt=""
          fill
          className="object-cover object-top opacity-15"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/40 via-brand-dark/70 to-brand-dark" />
      </div>
      {/* Content */}
      <div className="relative px-4 pb-8 pt-10 sm:pb-10 sm:pt-14">
        <div className="mx-auto max-w-(--breakpoint-2xl) text-center">
          <SplitText
            as="h1"
            text={title}
            className="mb-2 font-heading text-3xl tracking-[0.08em] text-brand-gold sm:text-4xl md:text-5xl"
          />
        </div>
      </div>
    </div>
  );
}

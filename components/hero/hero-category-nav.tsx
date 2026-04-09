"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";

type Category = {
  title: string;
  href: string;
  comingSoon?: boolean;
  subcategories: { title: string; href: string }[];
};

const categories: Category[] = [
  {
    title: "Mens",
    href: "/search/mens",
    subcategories: [
      { title: "Compressions", href: "/search/compressions" },
      { title: "Tees", href: "/search/t-shirts" },
      { title: "Sweatpants", href: "/search/sweatpants" },
    ],
  },
  {
    title: "Accessories",
    href: "/search/accessories",
    comingSoon: true,
    subcategories: [],
  },
  {
    title: "Womens",
    href: "/search/womens",
    comingSoon: true,
    subcategories: [],
  },
];

export function HeroCategoryNav() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEnter = useCallback((index: number) => {
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current);
      closeTimeout.current = null;
    }
    setActiveIndex(index);
  }, []);

  const handleLeave = useCallback(() => {
    closeTimeout.current = setTimeout(() => {
      setActiveIndex(null);
    }, 150);
  }, []);

  return (
    <div className="animate-hero-nav-enter relative hidden md:block">
      <nav className="py-4">
        <div className="flex items-center justify-center gap-6 lg:gap-8">
          {categories.map((cat, i) => {
            const hasDropdown = cat.subcategories.length > 0 || cat.comingSoon;
            return (
              <div
                key={cat.title}
                className="relative"
                onMouseEnter={hasDropdown ? () => handleEnter(i) : undefined}
                onMouseLeave={hasDropdown ? handleLeave : undefined}
              >
                <Link
                  href={cat.href}
                  className={`group relative block py-1 text-sm uppercase tracking-[0.2em] transition-colors duration-200 ${
                    activeIndex === i
                      ? "text-brand-gold"
                      : "text-brand-pale-gold hover:text-brand-gold"
                  }`}
                >
                  {cat.title}
                  <span
                    className={`absolute -bottom-0.5 left-0 h-px bg-brand-gold transition-all duration-300 ${
                      activeIndex === i ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  />
                </Link>
              </div>
            );
          })}
        </div>
      </nav>

      {/* Dropdown panels */}
      {categories
        .filter((c) => c.subcategories.length > 0 || c.comingSoon)
        .map((cat) => {
          const i = categories.indexOf(cat);
          return (
            <div
              key={cat.title}
              className={`absolute left-1/2 z-30 w-fit -translate-x-1/2 rounded-sm border border-brand-dark-gold/20 bg-brand-dark/95 backdrop-blur-sm transition-all duration-200 ${
                activeIndex === i
                  ? "pointer-events-auto visible translate-y-0 opacity-100"
                  : "pointer-events-none invisible -translate-y-1 opacity-0"
              }`}
              onMouseEnter={() => handleEnter(i)}
              onMouseLeave={handleLeave}
            >
              <div className="mx-auto w-fit px-8 py-5">
                {cat.comingSoon ? (
                  <p className="text-center font-heading text-sm italic tracking-wide text-brand-gold">
                    Coming Soon
                  </p>
                ) : (
                  <div className="flex items-center justify-center gap-8">
                    {cat.subcategories.map((sub) => (
                      <Link
                        key={sub.title}
                        href={sub.href}
                        className="text-center text-sm uppercase tracking-wider text-brand-grey transition-colors duration-200 hover:text-brand-gold"
                      >
                        {sub.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
    </div>
  );
}

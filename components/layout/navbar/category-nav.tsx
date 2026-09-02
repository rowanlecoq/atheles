"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
// Hidden on homepage since HeroCategoryNav handles it there

type Category = {
  title: string;
  href: string;
  comingSoon?: boolean;
  subcategories: { title: string; href: string }[];
};

const categories: Category[] = [
  {
    title: "mens",
    href: "/search/mens",
    subcategories: [
      { title: "compressions", href: "/search/compressions" },
      { title: "tees", href: "/search/tees" },
      { title: "sweatpants", href: "/search/sweatpants" },
    ],
  },
  {
    title: "accessories",
    href: "/search/accessories",
    comingSoon: true,
    subcategories: [],
  },
  {
    title: "womens",
    href: "/search/womens",
    comingSoon: true,
    subcategories: [],
  },
];

export function CategoryNav() {
  const pathname = usePathname();
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

  useEffect(() => {
    return () => {
      if (closeTimeout.current) clearTimeout(closeTimeout.current);
    };
  }, []);

  // Check if a category or any of its subcategories match the current path
  const isActive = (cat: Category) =>
    pathname === cat.href ||
    cat.subcategories.some((sub) => pathname === sub.href);

  // Hide on homepage — HeroCategoryNav is used there instead.
  // Don't use CSS visibility tricks (backdrop-blur bleeds through even at height 0).
  if (!pathname || pathname === "/") return null;

  return (
    <div className="relative hidden md:block">
      {/* Category bar */}
      <nav className="category-nav-bar border-b border-brand-dark-gold/20 bg-brand-dark/90 backdrop-blur-sm">
        <div className="mx-auto flex items-center justify-center gap-8 px-6 py-2.5">
          {categories.map((cat, i) => {
            const hasDropdown = cat.subcategories.length > 0 && !cat.comingSoon;
            const current = isActive(cat);
            return (
              <div
                key={cat.title}
                className="relative"
                onMouseEnter={hasDropdown ? () => handleEnter(i) : undefined}
                onMouseLeave={hasDropdown ? handleLeave : undefined}
              >
                {cat.comingSoon ? (
                  <span className="relative block cursor-default py-1 text-xs uppercase tracking-[0.2em] text-brand-grey/40">
                    {cat.title}
                  </span>
                ) : (
                  <Link
                    href={cat.href}
                    className={`group relative block py-1 text-xs uppercase tracking-[0.2em] transition-colors duration-200 ${
                      activeIndex === i || current
                        ? "text-brand-gold"
                        : "text-brand-grey hover:text-brand-gold"
                    }`}
                  >
                    {cat.title}
                    <span
                      className={`absolute -bottom-0.5 left-0 h-px bg-brand-gold transition-all duration-300 ${
                        activeIndex === i || current
                          ? "w-full"
                          : "w-0 group-hover:w-full"
                      }`}
                    />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* Dropdown panels — coming-soon categories excluded until launch */}
      {categories
        .filter((c) => c.subcategories.length > 0 && !c.comingSoon)
        .map((cat) => {
          const i = categories.indexOf(cat);
          return (
            <div
              key={cat.title}
              className={`absolute top-full left-1/2 z-30 mt-1 w-fit -translate-x-1/2 rounded-sm border border-brand-dark-gold/20 bg-brand-dark/95 backdrop-blur-sm transition-all duration-200 ${
                activeIndex === i
                  ? "pointer-events-auto visible translate-y-0 opacity-100"
                  : "pointer-events-none invisible -translate-y-1 opacity-0"
              }`}
              onMouseEnter={() => handleEnter(i)}
              onMouseLeave={handleLeave}
            >
              <div className="mx-auto w-fit px-8 py-5">
                <div className="flex items-center justify-center gap-8">
                  {cat.subcategories.map((sub) => (
                    <Link
                      key={sub.title}
                      href={sub.href}
                      className={`text-center text-sm uppercase tracking-wider transition-colors duration-200 hover:text-brand-gold ${
                        pathname === sub.href
                          ? "text-brand-gold"
                          : "text-brand-grey"
                      }`}
                    >
                      {sub.title}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
}

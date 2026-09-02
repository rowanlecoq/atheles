"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

export function CarouselControls({
  title,
  subtitle,
  viewAllHref,
  children,
}: {
  title: string;
  subtitle?: string;
  viewAllHref?: string;
  children: React.ReactNode;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    // Check after mount + slight delay for layout
    const timer = setTimeout(checkScroll, 100);
    window.addEventListener("resize", checkScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll]);

  const scroll = useCallback(
    (direction: "left" | "right") => {
      const el = scrollRef.current;
      if (!el) return;
      const card = el.querySelector("[data-card]") as HTMLElement | null;
      const cardWidth = card?.offsetWidth ?? 300;
      const gap = 20;
      const amount = (cardWidth + gap) * (direction === "left" ? -1 : 1);
      el.scrollBy({ left: amount, behavior: "smooth" });
      setTimeout(checkScroll, 400);
    },
    [checkScroll],
  );

  return (
    <div>
      {/* Header row: subtitle, title, view all, arrows */}
      <div className="flex items-end justify-between">
        <div>
          {subtitle && (
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-dark-gold">
              {subtitle}
            </p>
          )}
          <div className="mt-1.5 flex items-baseline gap-5">
            <h2 className="font-heading text-xl font-bold tracking-wide text-white sm:text-2xl md:text-3xl">
              {title}
            </h2>
            {viewAllHref && (
              <Link
                href={viewAllHref}
                className="text-sm tracking-wide text-brand-grey underline underline-offset-4 transition-colors hover:text-brand-gold"
              >
                View All
              </Link>
            )}
          </div>
        </div>

        {/* Arrow buttons */}
        <div className="hidden items-center gap-2 sm:flex">
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-dark-gold/30 text-brand-grey transition-all duration-200 hover:border-brand-gold hover:text-brand-gold disabled:cursor-not-allowed disabled:opacity-25"
            aria-label="Scroll left"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-dark-gold/30 text-brand-grey transition-all duration-200 hover:border-brand-gold hover:text-brand-gold disabled:cursor-not-allowed disabled:opacity-25"
            aria-label="Scroll right"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Product row: scrollable on mobile, grid on desktop */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="mt-6 flex gap-4 overflow-x-auto scroll-smooth scrollbar-hide sm:mt-8 md:grid md:auto-cols-fr md:grid-flow-col md:gap-5 md:overflow-x-visible"
      >
        {children}
      </div>
    </div>
  );
}

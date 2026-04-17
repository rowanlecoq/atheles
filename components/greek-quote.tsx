"use client";

import { FadeIn } from "components/animations";
import { SlideshowMedia } from "components/slideshow-media";
import { useEffect, useState } from "react";

const defaultQuotes = [
  { text: "Excellence is not a gift. It is a skill that takes practice.", author: "Plato" },
  { text: "No man is free who is not master of himself.", author: "Epictetus" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
  { text: "Know thyself.", author: "Inscription at the Temple of Apollo, Delphi" },
];

type Quote = { text: string; author: string };

export function GreekQuote() {
  const [quote, setQuote] = useState<Quote>(defaultQuotes[0]!);

  useEffect(() => {
    setQuote(defaultQuotes[Math.floor(Math.random() * defaultQuotes.length)]!);

    fetch("/api/admin/quotes")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.quotes?.length > 0) {
          setQuote(d.quotes[Math.floor(Math.random() * d.quotes.length)]);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section className="relative overflow-hidden border-t border-brand-dark-gold/20 bg-brand-dark/75 py-12 sm:py-16">
      <SlideshowMedia
        slotKey="interstitial"
        className="object-cover object-center"
        iframeClass="absolute inset-0 h-[120%] w-[120%] -left-[10%] -top-[10%] pointer-events-none"
        sizes="100vw"
      />
      <FadeIn className="relative z-10 mx-auto max-w-2xl px-4 text-center">
        <p className="mb-3 font-heading text-sm italic leading-relaxed text-brand-pale-gold sm:text-base">
          &ldquo;{quote.text}&rdquo;
        </p>
        <p className="text-[11px] uppercase tracking-[0.2em] text-brand-grey sm:text-xs">
          &mdash; {quote.author}
        </p>
      </FadeIn>
    </section>
  );
}


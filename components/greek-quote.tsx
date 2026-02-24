"use client";

import { FadeIn } from "components/animations";
import { useEffect, useState } from "react";

const quotes = [
  { text: "Excellence is not a gift. It is a skill that takes practice.", author: "Plato" },
  { text: "No man is free who is not master of himself.", author: "Epictetus" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
  { text: "The soul that is within me no man can degrade.", author: "Frederick Douglass, via Stoic tradition" },
  { text: "He who is not a good servant will not be a good master.", author: "Plato" },
  { text: "Strength does not come from physical capacity. It comes from an indomitable will.", author: "Ancient proverb" },
  { text: "The mind is everything. What you think, you become.", author: "Attributed to Greek philosophy" },
  { text: "Victory belongs to the most tenacious.", author: "Ancient Olympic creed" },
  { text: "Know thyself.", author: "Inscription at the Temple of Apollo, Delphi" },
  { text: "The only true wisdom is in knowing you know nothing.", author: "Socrates" },
];

export function GreekQuote() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(Math.floor(Math.random() * quotes.length));
  }, []);

  const quote = quotes[index] ?? { text: "Know thyself.", author: "Inscription at the Temple of Apollo, Delphi" };

  return (
    <FadeIn direction="up" className="border-t border-brand-dark-gold/20 py-12 sm:py-16">
      <div className="mx-auto max-w-2xl px-4 text-center">
        <p className="mb-3 font-heading text-sm italic leading-relaxed text-brand-pale-gold sm:text-base">
          &ldquo;{quote.text}&rdquo;
        </p>
        <p className="text-[11px] uppercase tracking-[0.2em] text-brand-grey sm:text-xs">
          &mdash; {quote.author}
        </p>
      </div>
    </FadeIn>
  );
}

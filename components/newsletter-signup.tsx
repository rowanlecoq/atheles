"use client";

import { FadeIn, GradualBlur, SplitText } from "components/animations";
import { useState } from "react";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      setEmail("");
    }
  };

  return (
    <section className="border-y border-brand-dark-gold/20 py-20">
      <div className="mx-auto max-w-2xl px-4 text-center">
        {/* Heading */}
        <SplitText
          as="h2"
          text="join the club for free"
          className="mb-4 font-heading text-2xl font-bold tracking-[0.06em] text-brand-gold sm:text-3xl sm:tracking-wider md:text-4xl"
        />
        <div className="mx-auto mb-6 h-px w-24 bg-brand-dark-gold/40" />
        <FadeIn direction="up" delay={0.2}>
          <p className="mb-8 text-sm text-brand-grey">
            Be the first to know about new drops, exclusive offers, and the
            Atheles journey.
          </p>
        </FadeIn>

        {/* Form */}
        <GradualBlur delay={0.3}>
          {submitted ? (
            <div className="border border-brand-dark-gold/40 bg-brand-dark/40 px-8 py-4 backdrop-blur-sm">
              <p className="text-sm uppercase tracking-wider text-brand-pale-gold">
                Welcome to the club.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-3 bg-brand-dark/40 p-3 backdrop-blur-sm sm:flex-row"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="flex-1 border border-brand-dark-gold/40 bg-transparent px-4 py-3 text-sm text-white placeholder:text-brand-grey"
              />
              <button
                type="submit"
                className="border border-brand-gold bg-transparent px-8 py-3 text-sm uppercase tracking-[0.2em] text-brand-gold transition-all duration-300 hover:bg-brand-gold hover:text-brand-dark"
              >
                Subscribe
              </button>
            </form>
          )}
        </GradualBlur>
      </div>
    </section>
  );
}

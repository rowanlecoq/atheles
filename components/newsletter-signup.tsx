"use client";

import Image from "next/image";
import { useState } from "react";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data.success) {
        setSubmitted(true);
        setEmail("");
      } else {
        setError(data.error || "failed to subscribe. please try again.");
      }
    } catch {
      setError("something went wrong. please try again.");
    }

    setLoading(false);
  };

  return (
    <section className="relative overflow-hidden border-y border-brand-dark-gold/20 bg-brand-dark py-20">
      <Image
        src="/statues/hadrian-cuirassed.jpg"
        alt=""
        fill
        className="object-cover object-[center_30%] opacity-10 grayscale"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/60 via-transparent to-brand-dark/60" />
      <div className="relative z-10 mx-auto max-w-2xl px-4 text-center">
        {/* Heading */}
        <h2 className="mb-4 animate-fade-in font-heading text-2xl font-bold tracking-[0.06em] text-brand-gold sm:text-3xl sm:tracking-wider md:text-4xl">
          join the club for free
        </h2>
        <div className="mx-auto mb-6 h-px w-24 bg-brand-dark-gold/40" />
        <p className="mb-8 animate-fade-in text-sm text-brand-grey [animation-delay:200ms]">
          Be the first to know about new drops, exclusive offers, and the
          Atheles journey.
        </p>

        {/* Form */}
        <div className="animate-fade-in [animation-delay:400ms]">
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
                disabled={loading}
                className="border border-brand-gold bg-transparent px-8 py-3 text-sm uppercase tracking-[0.2em] text-brand-gold transition-all duration-300 hover:bg-brand-gold hover:text-brand-dark disabled:opacity-50"
              >
                {loading ? "..." : "Subscribe"}
              </button>
            </form>
          )}
          {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
        </div>
      </div>
    </section>
  );
}

"use client";

import { SlideshowMedia } from "components/slideshow-media";
import { useEffect, useState } from "react";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [alreadySubscribed, setAlreadySubscribed] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    if (!document.cookie.includes("atheles-logged-in=1")) return;
    try {
      const cached = localStorage.getItem("atheles-session");
      if (cached) {
        const u = JSON.parse(cached);
        setLoggedIn(true);
        setUserEmail(u.email || "");
        if (u.acceptsMarketing === true) {
          setAlreadySubscribed(true);
          return;
        }
      }
    } catch {}
    fetch("/api/auth/session")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.user) {
          setLoggedIn(true);
          setUserEmail(d.user.email || "");
          if (d.user.acceptsMarketing) {
            setAlreadySubscribed(true);
            try {
              const cached = localStorage.getItem("atheles-session");
              if (cached) {
                const u = JSON.parse(cached);
                u.acceptsMarketing = true;
                localStorage.setItem("atheles-session", JSON.stringify(u));
              }
            } catch {}
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleSubscribe = async (subscribeEmail: string) => {
    if (!subscribeEmail) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: subscribeEmail }),
      });

      const data = await res.json();

      if (data.success) {
        setAlreadySubscribed(true);
        if (!data.alreadySubscribed) setSubmitted(true);
        setEmail("");
        try {
          const cached = localStorage.getItem("atheles-session");
          if (cached) {
            const u = JSON.parse(cached);
            u.acceptsMarketing = true;
            localStorage.setItem("atheles-session", JSON.stringify(u));
          }
        } catch {}
      } else {
        setError(data.error || "failed to subscribe. please try again.");
      }
    } catch {
      setError("something went wrong. please try again.");
    }

    setLoading(false);
  };

  return (
    <section className="theme-section relative overflow-hidden border-t border-brand-dark-gold/20 py-14 sm:py-16">
      <SlideshowMedia
        slotKey="newsletter"
        className="object-cover object-center"
        iframeClass="absolute inset-0 h-[120%] w-[120%] -left-[10%] -top-[10%] pointer-events-none"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-brand-dark/65" />

      <div className="relative z-10 mx-auto max-w-lg px-6 text-center">
        {alreadySubscribed ? (
          <div className="animate-fade-in space-y-4">
            <h2 className="font-heading text-3xl font-light text-brand-gold sm:text-4xl">
              you&apos;re in.
            </h2>
            <div className="mx-auto h-px w-24 bg-brand-gold/50" />
            <p className="text-sm leading-relaxed text-brand-grey">
              thank you for joining. you&apos;ll be the first to know about new drops,
              exclusive offers, and upcoming releases.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="animate-fade-in space-y-4">
              <h2 className="font-heading text-3xl font-light text-brand-gold sm:text-4xl">
                join the club.
              </h2>
              <div className="mx-auto h-px w-24 bg-brand-gold/50" />
              <p className="text-sm leading-relaxed text-brand-grey [animation-delay:150ms]">
                be the first to know about new drops, exclusive offers, and
                upcoming releases. free, always.
              </p>
            </div>

            <div className="animate-fade-in [animation-delay:300ms]">
              {submitted ? (
                <p className="text-sm tracking-[0.15em] text-brand-pale-gold">
                  welcome to the club.
                </p>
              ) : loggedIn ? (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleSubscribe(userEmail)}
                  className="w-full rounded-lg bg-brand-gold px-6 py-3 font-heading text-sm uppercase tracking-wider text-brand-dark transition-colors hover:bg-brand-light-gold disabled:opacity-50"
                >
                  {loading ? "joining..." : "join now"}
                </button>
              ) : (
                <form
                  onSubmit={(e) => { e.preventDefault(); handleSubscribe(email); }}
                  className="mx-auto flex max-w-sm flex-col gap-3"
                >
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="enter your email"
                    required
                    className="w-full rounded-lg border border-brand-dark-gold/20 bg-white/[0.03] px-4 py-2.5 text-center text-sm text-white placeholder:text-white/25 focus:border-brand-gold/40 focus:outline-none transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-lg bg-brand-gold px-6 py-3 font-heading text-sm uppercase tracking-wider text-brand-dark transition-colors hover:bg-brand-light-gold disabled:opacity-50"
                  >
                    {loading ? "subscribing..." : "subscribe"}
                  </button>
                </form>
              )}
              {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

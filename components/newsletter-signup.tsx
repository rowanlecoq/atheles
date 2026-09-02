"use client";

import { SlideshowMedia } from "components/slideshow-media";
import { WavyDivider } from "components/wavy-divider";
import { useEffect, useState } from "react";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [alreadySubscribed, setAlreadySubscribed] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  // Check if user is already subscribed (acceptsMarketing)
  useEffect(() => {
    // Gate: guests never need to call the session API
    if (!document.cookie.includes("atheles-logged-in=1")) return;
    try {
      const cached = localStorage.getItem("atheles-session");
      if (cached) {
        const u = JSON.parse(cached);
        setLoggedIn(true);
        setUserEmail(u.email || "");
        if (u.acceptsMarketing === true) {
          setAlreadySubscribed(true);
          return; // Confirmed subscribed — skip API
        }
        // Logged in but acceptsMarketing not confirmed — fall through to fetch
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
            // Sync into cache so next visit skips the API
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
        // Update session cache so it persists
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
    <section className="theme-section relative overflow-hidden py-20">
      <WavyDivider className="absolute inset-x-0 top-0" />
      <SlideshowMedia
        slotKey="newsletter"
        className="object-cover object-center"
        iframeClass="absolute inset-0 h-[120%] w-[120%] -left-[10%] -top-[10%] pointer-events-none"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-brand-dark/60" />
      <div className="newsletter-top-fade absolute inset-0 bg-gradient-to-b from-brand-dark/30 via-transparent to-transparent" />
      <div className="relative z-10 mx-auto max-w-2xl px-4 text-center">
        {alreadySubscribed ? (
          <>
            <h2 className="mb-4 animate-fade-in font-heading text-2xl font-bold tracking-[0.06em] text-brand-gold sm:text-3xl sm:tracking-wider md:text-4xl">
              you&apos;re in the club 🔱
            </h2>
            <div className="mx-auto mb-6 h-px w-24 bg-brand-gold/60" />
            <p className="animate-fade-in text-sm text-brand-grey [animation-delay:200ms]">
              thank you so much for joining. you will be the first to know about
              new drops, exclusive offers, and upcoming releases.
            </p>
          </>
        ) : (
          <>
            <h2 className="mb-4 animate-fade-in font-heading text-2xl font-bold tracking-[0.06em] text-brand-gold sm:text-3xl sm:tracking-wider md:text-4xl">
              join the club 🔱 for free.
            </h2>
            <div className="mx-auto mb-6 h-px w-24 bg-brand-gold/60" />
            <p className="mb-8 animate-fade-in text-sm text-brand-grey [animation-delay:200ms]">
              be the first to know about new drops, exclusive offers, and upcoming
              releases.
            </p>

            <div className="animate-fade-in [animation-delay:400ms]">
              {submitted ? (
                <p className="text-sm uppercase tracking-[0.2em] text-brand-pale-gold">
                  welcome to the club.
                </p>
              ) : loggedIn ? (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleSubscribe(userEmail)}
                  className="border border-brand-gold/70 px-10 py-3 text-xs uppercase tracking-[0.25em] text-brand-gold transition-all duration-300 hover:bg-brand-gold/10 disabled:opacity-50"
                >
                  {loading ? "..." : "join now"}
                </button>
              ) : (
                <form
                  onSubmit={(e) => { e.preventDefault(); handleSubscribe(email); }}
                  className="mx-auto flex max-w-sm flex-col gap-4"
                >
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="enter your email"
                    required
                    className="w-full border-0 border-b border-brand-dark-gold/40 bg-transparent py-2.5 text-center text-sm tracking-wide text-white placeholder:text-brand-grey/60 transition-colors duration-200 focus:border-brand-pale-gold/60 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full border border-brand-gold/70 py-3 text-xs uppercase tracking-[0.25em] text-brand-gold transition-all duration-300 hover:bg-brand-gold/10 disabled:opacity-50"
                  >
                    {loading ? "..." : "subscribe"}
                  </button>
                </form>
              )}
              {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

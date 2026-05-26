"use client";

import { useState } from "react";

const fieldClass =
  "w-full rounded-lg border border-brand-dark-gold/20 bg-brand-dark px-4 py-3 text-sm text-white placeholder:text-brand-grey/40 focus:border-brand-gold/50 focus:outline-none transition-colors duration-150";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          subject: formData.get("subject"),
          message: formData.get("message"),
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSubmitted(true);
      } else {
        setError(data.error || "failed to send message. please try again.");
      }
    } catch {
      setError("something went wrong. please try again.");
    }
    setLoading(false);
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-8 text-center">
        <h3 className="mb-2 font-heading text-xl text-brand-gold">
          Message Sent
        </h3>
        <p className="text-sm text-brand-grey">
          Thank you for reaching out. We&apos;ll get back to you soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="mb-1.5 block text-xs uppercase tracking-wider text-brand-pale-gold"
          >
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className={fieldClass}
            placeholder="your name"
          />
        </div>
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-xs uppercase tracking-wider text-brand-pale-gold"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className={fieldClass}
            placeholder="your@email.com"
          />
        </div>
        <div>
          <label
            htmlFor="subject"
            className="mb-1.5 block text-xs uppercase tracking-wider text-brand-pale-gold"
          >
            Subject
          </label>
          <select
            id="subject"
            name="subject"
            required
            className={fieldClass}
          >
            <option value="">select a subject</option>
            <option value="order inquiry">order inquiry</option>
            <option value="sizing help">sizing help</option>
            <option value="returns & exchanges">returns &amp; exchanges</option>
            <option value="collaboration">collaboration</option>
            <option value="ambassadorship">ambassadorship</option>
            <option value="sponsorship">sponsorship</option>
            <option value="wholesale inquiry">wholesale inquiry</option>
            <option value="feedback">feedback</option>
            <option value="other">other</option>
          </select>
        </div>
        <div>
          <label
            htmlFor="message"
            className="mb-1.5 block text-xs uppercase tracking-wider text-brand-pale-gold"
          >
            Message
          </label>
          <textarea
            id="message"
            name="message"
            required
            rows={5}
            className={`${fieldClass} resize-none`}
            placeholder="how can we help?"
          />
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="group relative flex w-full items-center justify-center overflow-hidden rounded-full bg-brand-gold p-4 font-heading text-sm uppercase text-brand-dark transition-all duration-300 disabled:opacity-50"
        >
          <div
            className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            style={{
              background:
                "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.15) 48%, rgba(255,255,255,0.22) 50%, rgba(255,255,255,0.15) 52%, transparent 70%)",
              animation: "cartShimmer 2s ease-in-out infinite",
            }}
          />
          <span className="relative z-10 tracking-wider transition-all duration-300 group-hover:tracking-[0.2em]">
            {loading ? "Sending..." : "Send Message"}
          </span>
        </button>
      </form>
  );
}

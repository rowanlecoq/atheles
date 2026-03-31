"use client";

import { useState } from "react";

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
          className="mb-1 block text-xs uppercase tracking-wider text-brand-pale-gold"
        >
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="w-full rounded border border-brand-dark-gold/30 bg-brand-dark px-4 py-2.5 text-sm text-white placeholder:text-brand-grey/50 focus:border-brand-gold focus:outline-none"
          placeholder="Your name"
        />
      </div>
      <div>
        <label
          htmlFor="email"
          className="mb-1 block text-xs uppercase tracking-wider text-brand-pale-gold"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full rounded border border-brand-dark-gold/30 bg-brand-dark px-4 py-2.5 text-sm text-white placeholder:text-brand-grey/50 focus:border-brand-gold focus:outline-none"
          placeholder="your@email.com"
        />
      </div>
      <div>
        <label
          htmlFor="subject"
          className="mb-1 block text-xs uppercase tracking-wider text-brand-pale-gold"
        >
          Subject
        </label>
        <select
          id="subject"
          name="subject"
          required
          className="w-full rounded border border-brand-dark-gold/30 bg-brand-dark px-4 py-2.5 text-sm text-white focus:border-brand-gold focus:outline-none"
        >
          <option value="">select a subject</option>
          <option value="order inquiry">order inquiry</option>
          <option value="sizing help">sizing help</option>
          <option value="returns & exchanges">returns & exchanges</option>
          <option value="collaboration">collaboration</option>
          <option value="sponsorship">sponsorship</option>
          <option value="wholesale inquiry">wholesale inquiry</option>
          <option value="feedback">feedback</option>
          <option value="other">other</option>
        </select>
      </div>
      <div>
        <label
          htmlFor="message"
          className="mb-1 block text-xs uppercase tracking-wider text-brand-pale-gold"
        >
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          className="w-full resize-none rounded border border-brand-dark-gold/30 bg-brand-dark px-4 py-2.5 text-sm text-white placeholder:text-brand-grey/50 focus:border-brand-gold focus:outline-none"
          placeholder="How can we help?"
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-brand-gold px-6 py-3 font-heading text-sm uppercase tracking-wider text-brand-dark transition-colors hover:bg-brand-light-gold disabled:opacity-50"
      >
        {loading ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}

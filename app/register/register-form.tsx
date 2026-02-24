"use client";

import { useState } from "react";

export function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    // Placeholder - will be connected to Shopify Customer API
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setError("Account creation coming soon. Stay tuned for launch.");
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="firstName"
            className="mb-1 block text-xs uppercase tracking-wider text-brand-pale-gold"
          >
            First Name
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            required
            className="w-full rounded border border-brand-dark-gold/30 bg-brand-dark px-4 py-2.5 text-sm text-white placeholder:text-brand-grey/50 focus:border-brand-gold focus:outline-none"
            placeholder="First name"
          />
        </div>
        <div>
          <label
            htmlFor="lastName"
            className="mb-1 block text-xs uppercase tracking-wider text-brand-pale-gold"
          >
            Last Name
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            required
            className="w-full rounded border border-brand-dark-gold/30 bg-brand-dark px-4 py-2.5 text-sm text-white placeholder:text-brand-grey/50 focus:border-brand-gold focus:outline-none"
            placeholder="Last name"
          />
        </div>
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
          htmlFor="password"
          className="mb-1 block text-xs uppercase tracking-wider text-brand-pale-gold"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          className="w-full rounded border border-brand-dark-gold/30 bg-brand-dark px-4 py-2.5 text-sm text-white placeholder:text-brand-grey/50 focus:border-brand-gold focus:outline-none"
          placeholder="Min. 8 characters"
        />
      </div>
      {error && (
        <p className="text-xs text-brand-gold">{error}</p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-brand-gold px-6 py-3 font-heading text-sm uppercase tracking-wider text-brand-dark transition-colors hover:bg-brand-light-gold disabled:opacity-50"
      >
        {loading ? "Creating Account..." : "Create Account"}
      </button>
      <p className="text-center text-[10px] text-brand-grey/60">
        By creating an account, you agree to our terms of service and privacy
        policy.
      </p>
    </form>
  );
}

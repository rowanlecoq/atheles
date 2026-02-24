"use client";

import { useState } from "react";

export function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    // Placeholder - will be connected to Shopify Customer API
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setError("Account system coming soon. Stay tuned for launch.");
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          className="w-full rounded border border-brand-dark-gold/30 bg-brand-dark px-4 py-2.5 text-sm text-white placeholder:text-brand-grey/50 focus:border-brand-gold focus:outline-none"
          placeholder="••••••••"
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
        {loading ? "Signing In..." : "Sign In"}
      </button>
    </form>
  );
}

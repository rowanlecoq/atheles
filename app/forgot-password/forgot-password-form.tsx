"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await fetch("/api/auth/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {
      // Silently handle - always show success
    }

    setSubmitted(true);
    setLoading(false);
  };

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md items-center px-4 py-10 sm:py-12">
      <div className="w-full">
        <div className="mb-8 text-center">
          <h1 className="mb-2 font-heading text-3xl text-brand-gold sm:text-4xl">forgot password</h1>
          <p className="text-sm text-brand-grey">we&apos;ll send you a reset link.</p>
        </div>
        <div className="rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-8">
          {submitted ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-brand-dark-gold/30">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-brand-gold">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <p className="text-sm text-brand-pale-gold">
                if an account exists for <span className="text-brand-gold">{email}</span>, you&apos;ll receive a password reset email shortly.
              </p>
              <p className="text-xs text-brand-grey">
                check your inbox and follow the link to reset your password.
              </p>
              <div className="pt-2">
                <Link href="/login" className="text-xs text-brand-gold underline underline-offset-4 hover:text-brand-light-gold">
                  back to sign in
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-1 block text-xs uppercase tracking-wider text-brand-pale-gold">email</label>
                <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded border border-brand-dark-gold/30 bg-brand-dark px-4 py-2.5 text-sm text-white placeholder:text-brand-grey/50 focus:border-brand-gold focus:outline-none"
                  placeholder="your@email.com" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full rounded bg-brand-gold px-6 py-3 font-heading text-sm uppercase tracking-wider text-brand-dark transition-colors hover:bg-brand-light-gold disabled:opacity-50">
                {loading ? "sending..." : "send reset link"}
              </button>
            </form>
          )}
          <div className="mt-6 text-center">
            <p className="text-xs text-brand-grey">
              remember your password?{" "}
              <Link href="/login" className="text-brand-gold underline underline-offset-4 hover:text-brand-light-gold">sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

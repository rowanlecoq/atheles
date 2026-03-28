"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dob, setDob] = useState("");
  const [acceptsMarketing, setAcceptsMarketing] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, dob: dob || undefined, acceptsMarketing }),
      });
      const data = await res.json();

      if (data.success && data.user) {
        router.push("/profile");
        router.refresh();
      } else if (data.success && !data.user) {
        setVerificationSent(true);
      } else {
        setError(data.error || "failed to create account.");
      }
    } catch {
      setError("something went wrong.");
    }
    setLoading(false);
  };

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md items-center px-4 py-10 sm:py-12">
      <div className="w-full">
        <div className="mb-8 text-center">
          <h1 className="mb-2 font-heading text-3xl text-brand-gold sm:text-4xl">create account</h1>
          <p className="text-sm text-brand-grey">join the atheles club.</p>
        </div>
        <div className="rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-8">
          {verificationSent ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-brand-dark-gold/30">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-brand-gold">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <p className="text-sm text-brand-pale-gold">
                we&apos;ve sent a verification email to <span className="text-brand-gold">{email}</span>.
              </p>
              <p className="text-xs text-brand-grey">
                click the link in the email to activate your account and sign in.
              </p>
              <div className="pt-2">
                <Link href="/login" className="text-xs text-brand-gold underline underline-offset-4 hover:text-brand-light-gold">
                  go to sign in
                </Link>
              </div>
            </div>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="mb-1 block text-xs uppercase tracking-wider text-brand-pale-gold">display name</label>
              <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full rounded border border-brand-dark-gold/30 bg-brand-dark px-4 py-2.5 text-sm text-white placeholder:text-brand-grey/50 focus:border-brand-gold focus:outline-none"
                placeholder="your name" />
            </div>
            <div>
              <label htmlFor="email" className="mb-1 block text-xs uppercase tracking-wider text-brand-pale-gold">email</label>
              <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded border border-brand-dark-gold/30 bg-brand-dark px-4 py-2.5 text-sm text-white placeholder:text-brand-grey/50 focus:border-brand-gold focus:outline-none"
                placeholder="your@email.com" />
            </div>
            <div>
              <label htmlFor="password" className="mb-1 block text-xs uppercase tracking-wider text-brand-pale-gold">password</label>
              <div className="relative">
                <input id="password" type={showPassword ? "text" : "password"} required minLength={5} value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded border border-brand-dark-gold/30 bg-brand-dark px-4 py-2.5 pr-10 text-sm text-white placeholder:text-brand-grey/50 focus:border-brand-gold focus:outline-none"
                  placeholder="min. 5 characters" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-grey/50 hover:text-brand-gold transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="dob" className="mb-1 block text-xs uppercase tracking-wider text-brand-pale-gold">date of birth</label>
              <input id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)}
                className="w-full rounded border border-brand-dark-gold/30 bg-brand-dark px-4 py-2.5 text-sm text-white placeholder:text-brand-grey/50 focus:border-brand-gold focus:outline-none [color-scheme:dark]" />
            </div>
            <label className="flex cursor-pointer items-start gap-3 pt-1">
              <input type="checkbox" checked={acceptsMarketing} onChange={(e) => setAcceptsMarketing(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-brand-dark-gold/30 bg-brand-dark accent-brand-gold" />
              <span className="text-xs leading-relaxed text-brand-grey">
                sign me up for the atheles club newsletter to receive exclusive drops, birthday rewards, and member perks.
              </span>
            </label>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full rounded bg-brand-gold px-6 py-3 font-heading text-sm uppercase tracking-wider text-brand-dark transition-colors hover:bg-brand-light-gold disabled:opacity-50">
              {loading ? "creating account..." : "create account"}
            </button>
          </form>
          )}
          <div className="mt-6 text-center">
            <p className="text-xs text-brand-grey">
              already have an account?{" "}
              <Link href="/login" className="text-brand-gold underline underline-offset-4 hover:text-brand-light-gold">sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

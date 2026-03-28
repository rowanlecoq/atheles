"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("invalid email or password.");
    } else {
      router.push("/profile");
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <div className="rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="mb-1 block text-xs uppercase tracking-wider text-brand-pale-gold"
          >
            email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-brand-dark-gold/30 bg-brand-dark px-4 py-2.5 text-sm text-white placeholder:text-brand-grey/50 focus:border-brand-gold focus:outline-none"
            placeholder="your@email.com"
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-xs uppercase tracking-wider text-brand-pale-gold"
          >
            password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border border-brand-dark-gold/30 bg-brand-dark px-4 py-2.5 text-sm text-white placeholder:text-brand-grey/50 focus:border-brand-gold focus:outline-none"
            placeholder="••••••••"
          />
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-brand-gold px-6 py-3 font-heading text-sm uppercase tracking-wider text-brand-dark transition-colors hover:bg-brand-light-gold disabled:opacity-50"
        >
          {loading ? "signing in..." : "sign in"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-xs text-brand-grey">
          don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="text-brand-gold underline underline-offset-4 hover:text-brand-light-gold"
          >
            create one
          </Link>
        </p>
      </div>
    </div>
  );
}

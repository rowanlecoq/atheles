"use client";

import Footer from "components/layout/footer";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();

      if (data.success) {
        router.push("/profile");
        router.refresh();
      } else {
        setError(data.error || "failed to create account.");
      }
    } catch {
      setError("something went wrong.");
    }
    setLoading(false);
  };

  return (
    <>
      <div className="mx-auto flex min-h-[60vh] max-w-md items-center px-4 py-10 sm:py-12">
        <div className="w-full">
          <div className="mb-8 text-center">
            <h1 className="mb-2 font-heading text-3xl text-brand-gold sm:text-4xl">create account</h1>
            <p className="text-sm text-brand-grey">join the atheles club.</p>
          </div>
          <div className="rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-8">
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
                <input id="password" type="password" required minLength={5} value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded border border-brand-dark-gold/30 bg-brand-dark px-4 py-2.5 text-sm text-white placeholder:text-brand-grey/50 focus:border-brand-gold focus:outline-none"
                  placeholder="min. 5 characters" />
              </div>
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full rounded bg-brand-gold px-6 py-3 font-heading text-sm uppercase tracking-wider text-brand-dark transition-colors hover:bg-brand-light-gold disabled:opacity-50">
                {loading ? "creating account..." : "create account"}
              </button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-xs text-brand-grey">
                already have an account?{" "}
                <Link href="/login" className="text-brand-gold underline underline-offset-4 hover:text-brand-light-gold">sign in</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

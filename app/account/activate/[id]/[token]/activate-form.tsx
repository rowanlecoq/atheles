"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ActivateForm({
  customerId,
  activationToken,
}: {
  customerId: string;
  activationToken: string;
}) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, activationToken, password }),
      });
      const data = await res.json();

      if (data.success) {
        router.push("/profile");
        router.refresh();
      } else {
        setError(data.error || "failed to activate account.");
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
          <h1 className="mb-2 font-heading text-3xl text-brand-gold sm:text-4xl">
            welcome to atheles
          </h1>
          <p className="text-sm text-brand-grey">
            choose a password to finish setting up your account.
          </p>
        </div>
        <div className="rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-xs uppercase tracking-wider text-brand-pale-gold"
              >
                set your password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={5}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded border border-brand-dark-gold/30 bg-brand-dark px-4 py-2.5 pr-10 text-sm text-white placeholder:text-brand-grey/50 focus:border-brand-gold focus:outline-none"
                  placeholder="enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-grey/50 transition-colors hover:text-brand-gold"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded bg-brand-gold px-6 py-3 font-heading text-sm uppercase tracking-wider text-brand-dark transition-colors hover:bg-brand-light-gold disabled:opacity-50"
            >
              {loading ? "setting up..." : "continue"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

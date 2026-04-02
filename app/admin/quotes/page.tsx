"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminQuotesPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => {
        if (d?.user?.isAdmin) setAuthorized(true);
        else router.replace("/");
      })
      .catch(() => router.replace("/"));
  }, [router]);

  if (!authorized) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-brand-grey">checking access...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-6">
        <a href="/admin" className="text-xs text-brand-grey hover:text-brand-gold">
          ← back to dashboard
        </a>
        <h1 className="mt-2 font-heading text-2xl text-brand-gold">
          manage quotes
        </h1>
        <p className="mt-1 text-sm text-brand-grey">
          edit the rotating quotes shown on the homepage. a random quote is picked on each visit.
        </p>
      </div>

      <div className="rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-6 text-center">
        <p className="mb-2 text-sm text-brand-pale-gold">quotes are managed in code.</p>
        <p className="text-xs text-brand-grey">
          to add, edit, or remove quotes, update the quotes array in<br />
          <code className="text-brand-gold">components/greek-quote.tsx</code>
        </p>
      </div>

      <div className="mt-6 rounded-lg border border-brand-dark-gold/20 bg-brand-dark-gold/5 p-4">
        <p className="mb-2 text-xs text-brand-pale-gold font-medium">current quotes:</p>
        <ul className="space-y-2">
          <li className="text-xs text-brand-grey">&quot;Excellence is not a gift. It is a skill that takes practice.&quot; — Plato</li>
          <li className="text-xs text-brand-grey">&quot;No man is free who is not master of himself.&quot; — Epictetus</li>
          <li className="text-xs text-brand-grey">&quot;We are what we repeatedly do.&quot; — Aristotle</li>
          <li className="text-xs text-brand-grey">&quot;The soul that is within me no man can degrade.&quot; — Frederick Douglass</li>
          <li className="text-xs text-brand-grey">&quot;He who is not a good servant will not be a good master.&quot; — Plato</li>
          <li className="text-xs text-brand-grey">&quot;Strength does not come from physical capacity.&quot; — Ancient proverb</li>
          <li className="text-xs text-brand-grey">&quot;The mind is everything. What you think, you become.&quot; — Greek philosophy</li>
        </ul>
        <p className="mt-3 text-[10px] text-brand-grey/60">to update these, edit the code file directly or ask your developer.</p>
      </div>
    </div>
  );
}

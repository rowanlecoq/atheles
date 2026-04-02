"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminAthletesPage() {
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
          manage athlete profiles
        </h1>
        <p className="mt-1 text-sm text-brand-grey">
          edit the athletes shown on the /athletes page. changes are saved to code — contact your developer to update photos.
        </p>
      </div>

      <div className="rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-6 text-center">
        <p className="mb-2 text-sm text-brand-pale-gold">athlete profiles are managed in code.</p>
        <p className="text-xs text-brand-grey">
          to add, edit, or remove an athlete profile, update the athletes array in<br />
          <code className="text-brand-gold">app/athletes/page.tsx</code>
        </p>
        <div className="mt-6">
          <a
            href="/athletes"
            className="inline-block rounded-full border border-brand-gold/40 px-6 py-2.5 text-xs uppercase tracking-wider text-brand-gold transition-colors hover:bg-brand-gold/10"
          >
            view athletes page
          </a>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-brand-dark-gold/20 bg-brand-dark-gold/5 p-4">
        <p className="text-xs text-brand-grey">
          <strong className="text-brand-pale-gold">how to add an athlete:</strong><br />
          1. assign <code className="text-brand-gold">tier:athlete</code> tag to the customer in shopify<br />
          2. add their info to the athletes array in the code<br />
          3. upload their photo to /public/ and reference it in the image field
        </p>
      </div>
    </div>
  );
}

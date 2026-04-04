"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type SiteLock = {
  locked: boolean;
  message: string;
  countdownTo: string | null;
};

const DEFAULT_LOCK: SiteLock = {
  locked: false,
  message: "we're currently updating the site. check back soon.",
  countdownTo: null,
};

export default function AdminSiteLockPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [lock, setLock] = useState<SiteLock>(DEFAULT_LOCK);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [useCountdown, setUseCountdown] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => {
        if (d?.user?.isAdmin) {
          setAuthorized(true);
          fetch("/api/admin/site-lock")
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
              if (d?.lock) {
                setLock({ ...DEFAULT_LOCK, ...d.lock });
                setUseCountdown(!!d.lock.countdownTo);
              }
            })
            .catch(() => {})
            .finally(() => setLoading(false));
        } else {
          router.replace("/");
        }
      })
      .catch(() => router.replace("/"));
  }, [router]);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const payload: SiteLock = {
        ...lock,
        countdownTo: useCountdown ? lock.countdownTo : null,
      };
      const res = await fetch("/api/admin/site-lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lock: payload }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {}
    setSaving(false);
  };

  // Format a local datetime string for the input
  const toLocalDatetime = (iso: string | null): string => {
    if (!iso) {
      // Default to 1 hour from now
      const d = new Date(Date.now() + 60 * 60 * 1000);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      return d.toISOString().slice(0, 16);
    }
    const d = new Date(iso);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  if (!authorized) return <div className="flex min-h-[60vh] items-center justify-center"><p className="text-sm text-brand-grey">checking access...</p></div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-6">
        <a href="/admin" className="text-xs text-brand-grey hover:text-brand-gold">← back to dashboard</a>
        <h1 className="mt-2 font-heading text-2xl text-brand-gold">site lock</h1>
        <p className="mt-1 text-sm text-brand-grey">lock the entire website for maintenance, renovations, or emergencies. admins can still access the site normally.</p>
      </div>

      {loading ? <p className="text-sm text-brand-grey">loading...</p> : (
        <>
          {/* Lock Toggle */}
          <div className="mb-6 rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-medium text-brand-pale-gold">website status</h2>
                <p className="mt-0.5 text-xs text-brand-grey">
                  {lock.locked ? "the site is currently locked — only admins can access it." : "the site is live and accessible to everyone."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLock((prev) => ({ ...prev, locked: !prev.locked }))}
                className={`relative inline-flex h-7 w-13 items-center rounded-full transition-colors ${lock.locked ? "bg-red-500/80" : "bg-brand-dark-gold/30"}`}
              >
                <span className={`inline-block h-5 w-5 rounded-full bg-white transition-transform ${lock.locked ? "translate-x-7" : "translate-x-1"}`} />
              </button>
            </div>

            {lock.locked && (
              <div className="mt-3 flex items-center gap-2 rounded bg-red-500/10 px-3 py-2">
                <span className="text-sm">🔒</span>
                <p className="text-xs text-red-300">site is locked — all visitors will see the maintenance page.</p>
              </div>
            )}
          </div>

          {/* Lock Message */}
          <div className="mb-6 rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-5">
            <h2 className="mb-3 text-sm font-medium text-brand-pale-gold">maintenance message</h2>
            <p className="mb-3 text-xs text-brand-grey">this message is shown to visitors when the site is locked.</p>
            <textarea
              value={lock.message}
              onChange={(e) => setLock((prev) => ({ ...prev, message: e.target.value }))}
              rows={3}
              className="w-full rounded border border-brand-dark-gold/20 bg-transparent px-3 py-2 text-sm text-white placeholder:text-brand-grey/50 focus:border-brand-gold focus:outline-none"
              placeholder="we're currently updating the site. check back soon."
            />
          </div>

          {/* Countdown */}
          <div className="mb-6 rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-medium text-brand-pale-gold">countdown timer</h2>
                <p className="mt-0.5 text-xs text-brand-grey">show visitors when the site will be back.</p>
              </div>
              <button
                type="button"
                onClick={() => setUseCountdown((prev) => !prev)}
                className={`relative inline-flex h-7 w-13 items-center rounded-full transition-colors ${useCountdown ? "bg-brand-gold/60" : "bg-brand-dark-gold/30"}`}
              >
                <span className={`inline-block h-5 w-5 rounded-full bg-white transition-transform ${useCountdown ? "translate-x-7" : "translate-x-1"}`} />
              </button>
            </div>

            {useCountdown && (
              <div className="mt-4">
                <label className="mb-1 block text-[10px] uppercase tracking-wider text-brand-grey">reopen date & time</label>
                <input
                  type="datetime-local"
                  value={toLocalDatetime(lock.countdownTo)}
                  onChange={(e) => {
                    const local = new Date(e.target.value);
                    setLock((prev) => ({ ...prev, countdownTo: local.toISOString() }));
                  }}
                  className="rounded border border-brand-dark-gold/20 bg-transparent px-3 py-2 text-sm text-white focus:border-brand-gold focus:outline-none [color-scheme:dark]"
                />
                {lock.countdownTo && (
                  <p className="mt-2 text-xs text-brand-grey">
                    visitors will see a countdown to {new Date(lock.countdownTo).toLocaleString()}.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="mb-6 rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-5">
            <h2 className="mb-3 text-sm font-medium text-brand-pale-gold">preview</h2>
            <div className="overflow-hidden rounded-lg border border-brand-dark-gold/10 bg-black/40 p-8 text-center">
              <p className="mb-2 text-3xl">🔒</p>
              <h3 className="mb-2 font-heading text-lg text-brand-gold">we&apos;ll be back</h3>
              <p className="mx-auto max-w-sm text-sm text-brand-grey">{lock.message || "we're currently updating the site. check back soon."}</p>
              {useCountdown && lock.countdownTo && (
                <div className="mt-4 inline-flex gap-4">
                  {["days", "hours", "min", "sec"].map((unit) => (
                    <div key={unit} className="text-center">
                      <div className="rounded bg-brand-dark-gold/10 px-3 py-2 font-heading text-xl text-brand-gold">00</div>
                      <p className="mt-1 text-[10px] uppercase tracking-wider text-brand-grey">{unit}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Save */}
          <div className="flex items-center gap-3">
            <button type="button" onClick={save} disabled={saving} className="rounded-full bg-brand-gold px-6 py-2.5 text-sm uppercase tracking-wider text-brand-dark transition-opacity hover:opacity-90 disabled:opacity-50">
              {saving ? "saving..." : "save changes"}
            </button>
            {saved && <span className="text-xs text-green-400">saved! changes take effect immediately.</span>}
          </div>

          <div className="mt-6 rounded-lg border border-brand-dark-gold/20 bg-brand-dark-gold/5 p-4">
            <p className="text-xs text-brand-grey">
              <strong className="text-brand-pale-gold">note:</strong> when the site is locked, all visitors are redirected to a maintenance page. admin accounts can still browse and manage the site normally. the lock persists across deploys via shopify metafields.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

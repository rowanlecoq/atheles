"use client";

import { useEffect, useState } from "react";
import { ClipboardDocumentIcon, CheckIcon } from "@heroicons/react/24/outline";

type LockSettings = {
  isLocked: boolean;
  password: string;
  countdownEndsAt: string;
  message: string;
};

export default function SiteLockPage() {
  const [settings, setSettings] = useState<LockSettings>({
    isLocked: false,
    password: "",
    countdownEndsAt: "",
    message: "Something big is coming.",
  });
  const [waitlist, setWaitlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/site-lock").then((r) => r.json()),
      fetch("/api/waitlist").then((r) => r.json()),
    ])
      .then(([lockData, waitlistData]) => {
        const lock = lockData.lock;
        setSettings({
          isLocked: !!lock.isLocked,
          password: lock.password || "",
          countdownEndsAt: lock.countdownEndsAt || "",
          message: lock.message || "Something big is coming.",
        });
        setWaitlist(waitlistData.waitlist || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await fetch("/api/admin/site-lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...settings,
          countdownEndsAt: settings.countdownEndsAt || null,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
    setSaving(false);
  };

  const exportCsv = () => {
    const content = "email\n" + waitlist.join("\n");
    const blob = new Blob([content], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `atheles-waitlist-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyAll = () => {
    navigator.clipboard.writeText(waitlist.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const removeEmail = async (email: string) => {
    try {
      await fetch("/api/waitlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setWaitlist((prev) => prev.filter((e) => e !== email));
    } catch {}
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <p className="text-sm text-brand-grey">loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8">
        <a href="/admin" className="text-xs text-brand-grey hover:text-brand-gold">
          ← back to dashboard
        </a>
        <h1 className="mt-4 font-heading text-3xl text-brand-gold">site lock</h1>
        <p className="mt-1 text-sm text-brand-grey">
          lock the site and show a coming-soon page with countdown and waitlist.
        </p>
      </div>

      {/* Lock toggle */}
      <div className="mb-4 rounded-xl border border-brand-dark-gold/20 bg-brand-dark p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">site lock</p>
            <p className="mt-0.5 text-xs text-brand-grey">
              when on, visitors see the coming-soon page instead of the store.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSettings((s) => ({ ...s, isLocked: !s.isLocked }))}
            className={`relative h-6 w-11 flex-none rounded-full transition-colors duration-200 ${
              settings.isLocked ? "bg-brand-gold" : "bg-brand-dark-gold/30"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                settings.isLocked ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
        {settings.isLocked && (
          <div className="mt-3 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
            site is locked — visitors cannot access the store.
          </div>
        )}
      </div>

      {/* Settings */}
      <div className="mb-4 space-y-4 rounded-xl border border-brand-dark-gold/20 bg-brand-dark p-6">
        <p className="text-sm font-medium text-white">settings</p>

        <div>
          <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-brand-dark-gold">
            headline message
          </label>
          <input
            type="text"
            value={settings.message}
            onChange={(e) => setSettings((s) => ({ ...s, message: e.target.value }))}
            placeholder="Something big is coming."
            className="w-full rounded-lg border border-brand-dark-gold/25 bg-brand-medium-grey/10 px-3 py-2 text-sm text-white outline-none focus:border-brand-gold/50"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-brand-dark-gold">
            bypass password
          </label>
          <input
            type="text"
            value={settings.password}
            onChange={(e) => setSettings((s) => ({ ...s, password: e.target.value }))}
            placeholder="leave empty to hide the password entry"
            className="w-full rounded-lg border border-brand-dark-gold/25 bg-brand-medium-grey/10 px-3 py-2 text-sm text-white outline-none focus:border-brand-gold/50"
          />
          <p className="mt-1 text-[11px] text-brand-dark-gold/60">
            visitors who know this password can bypass the lock.
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-brand-dark-gold">
            countdown ends at
          </label>
          <input
            type="datetime-local"
            value={settings.countdownEndsAt}
            onChange={(e) => setSettings((s) => ({ ...s, countdownEndsAt: e.target.value }))}
            className="w-full rounded-lg border border-brand-dark-gold/25 bg-brand-medium-grey/10 px-3 py-2 text-sm text-white outline-none focus:border-brand-gold/50 [color-scheme:dark]"
          />
          <p className="mt-1 text-[11px] text-brand-dark-gold/60">
            leave empty to hide the countdown timer.
          </p>
        </div>
      </div>

      <div className="mb-8 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-lg border border-brand-gold/40 px-6 py-2.5 text-sm text-brand-gold transition-colors hover:bg-brand-gold/10 disabled:opacity-50"
        >
          {saved ? "saved!" : saving ? "saving..." : "save settings"}
        </button>
        <a
          href="/coming-soon"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-brand-grey transition-colors hover:text-brand-gold"
        >
          preview page →
        </a>
      </div>

      {/* Waitlist */}
      <div className="rounded-xl border border-brand-dark-gold/20 bg-brand-dark p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">waitlist</p>
            <p className="mt-0.5 text-xs text-brand-grey">
              {waitlist.length} email{waitlist.length !== 1 ? "s" : ""} collected
            </p>
          </div>
          {waitlist.length > 0 && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={copyAll}
                className="flex items-center gap-1.5 rounded-lg border border-brand-dark-gold/30 px-3 py-1.5 text-xs text-brand-grey transition-colors hover:border-brand-gold/40 hover:text-brand-gold"
              >
                {copied ? <CheckIcon className="h-3 w-3" /> : <ClipboardDocumentIcon className="h-3 w-3" />}
                {copied ? "copied" : "copy all"}
              </button>
              <button
                type="button"
                onClick={exportCsv}
                className="rounded-lg border border-brand-dark-gold/30 px-3 py-1.5 text-xs text-brand-grey transition-colors hover:border-brand-gold/40 hover:text-brand-gold"
              >
                export csv
              </button>
            </div>
          )}
        </div>

        {waitlist.length === 0 ? (
          <p className="text-xs text-brand-dark-gold/50">no signups yet.</p>
        ) : (
          <div className="max-h-72 space-y-0.5 overflow-y-auto">
            {waitlist.map((email) => (
              <div
                key={email}
                className="group flex items-center justify-between rounded-lg px-3 py-1.5 transition-colors hover:bg-brand-dark-gold/5"
              >
                <span className="text-xs text-brand-grey">{email}</span>
                <button
                  type="button"
                  onClick={() => removeEmail(email)}
                  className="hidden text-[10px] text-brand-dark-gold/50 transition-colors hover:text-red-400 group-hover:block"
                >
                  remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

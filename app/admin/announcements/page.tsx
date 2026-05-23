"use client";

import { useEffect, useState } from "react";
import { XMarkIcon, PlusIcon } from "@heroicons/react/24/outline";

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/announcements")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.announcements) setAnnouncements(d.announcements); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ announcements }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {}
    setSaving(false);
  };

  const updateAt = (index: number, value: string) =>
    setAnnouncements((prev) => prev.map((a, i) => (i === index ? value : a)));

  const removeAt = (index: number) =>
    setAnnouncements((prev) => prev.filter((_, i) => i !== index));

  const addNew = () => setAnnouncements((prev) => [...prev, ""]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8">
        <a href="/admin" className="inline-flex items-center gap-1.5 text-xs text-brand-grey hover:text-brand-gold">
          ← back to dashboard
        </a>
        <h1 className="mt-3 font-heading text-2xl text-brand-gold">announcements</h1>
        <p className="mt-1 text-sm text-brand-grey">
          messages rotate every 5 seconds in the announcement bar.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-11 animate-pulse rounded-lg bg-white/5" />
          ))}
        </div>
      ) : (
        <>
          <div className="space-y-2.5">
            {announcements.map((text, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={text}
                  onChange={(e) => updateAt(i, e.target.value)}
                  placeholder={`announcement ${i + 1}...`}
                  className="flex-1 rounded-lg border border-brand-dark-gold/20 bg-brand-dark px-3 py-2.5 text-sm text-white placeholder:text-brand-grey/30 focus:border-brand-gold focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  className="flex h-10 w-10 flex-none items-center justify-center rounded-lg border border-brand-dark-gold/20 text-brand-grey/60 transition-colors hover:border-red-400/30 hover:text-red-400"
                  aria-label="remove"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addNew}
            className="mt-3 flex items-center gap-1.5 text-xs text-brand-gold transition-colors hover:text-brand-pale-gold"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            add announcement
          </button>

          <div className="mt-8 flex items-center gap-4">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="rounded-full bg-brand-gold px-6 py-2.5 text-sm uppercase tracking-wider text-brand-dark transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "saving..." : "save changes"}
            </button>
            {saved && (
              <span className="text-xs text-green-400">saved!</span>
            )}
          </div>

          <p className="mt-8 text-xs text-brand-grey/50">
            keep messages short and uppercase-friendly — they display in small caps. changes take effect when users refresh.
          </p>
        </>
      )}
    </div>
  );
}

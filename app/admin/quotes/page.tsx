"use client";

import { useEffect, useState } from "react";
import { XMarkIcon, PlusIcon } from "@heroicons/react/24/outline";

type Quote = { text: string; author: string };

export default function AdminQuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/quotes")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.quotes) setQuotes(d.quotes); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quotes }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {}
    setSaving(false);
  };

  const updateAt = (index: number, field: "text" | "author", value: string) =>
    setQuotes((prev) => prev.map((q, i) => (i === index ? { ...q, [field]: value } : q)));

  const removeAt = (index: number) =>
    setQuotes((prev) => prev.filter((_, i) => i !== index));

  const addNew = () =>
    setQuotes((prev) => [...prev, { text: "", author: "" }]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8">
        <a href="/admin" className="text-xs text-brand-grey hover:text-brand-gold">
          ← back to dashboard
        </a>
        <h1 className="mt-3 font-heading text-2xl text-brand-gold">quotes</h1>
        <p className="mt-1 text-sm text-brand-grey">rotating quotes shown on the homepage.</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {quotes.map((q, i) => (
              <div key={i} className="rounded-xl border border-brand-dark-gold/20 bg-brand-dark p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-brand-grey/50">
                    quote {i + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeAt(i)}
                    className="rounded p-0.5 text-brand-grey/40 transition-colors hover:text-red-400"
                  >
                    <XMarkIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
                <textarea
                  value={q.text}
                  onChange={(e) => updateAt(i, "text", e.target.value)}
                  placeholder="quote text..."
                  rows={2}
                  className="mb-2 w-full resize-none rounded-lg border border-brand-dark-gold/15 bg-white/3 px-3 py-2 text-sm text-white placeholder:text-brand-grey/30 focus:border-brand-gold focus:outline-none"
                />
                <input
                  type="text"
                  value={q.author}
                  onChange={(e) => updateAt(i, "author", e.target.value)}
                  placeholder="— author"
                  className="w-full rounded-lg border border-brand-dark-gold/15 bg-white/3 px-3 py-2 text-sm text-brand-grey placeholder:text-brand-grey/30 focus:border-brand-gold focus:outline-none"
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addNew}
            className="mt-3 flex items-center gap-1.5 text-xs text-brand-gold transition-colors hover:text-brand-pale-gold"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            add quote
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
            {saved && <span className="text-xs text-green-400">saved!</span>}
          </div>
        </>
      )}
    </div>
  );
}

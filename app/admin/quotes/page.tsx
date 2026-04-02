"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Quote = { text: string; author: string };

export default function AdminQuotesPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => {
        if (d?.user?.isAdmin) {
          setAuthorized(true);
          fetch("/api/admin/quotes")
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => { if (d?.quotes) setQuotes(d.quotes); })
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

  const updateAt = (index: number, field: "text" | "author", value: string) => {
    setQuotes((prev) => prev.map((q, i) => (i === index ? { ...q, [field]: value } : q)));
  };

  const removeAt = (index: number) => {
    setQuotes((prev) => prev.filter((_, i) => i !== index));
  };

  const addNew = () => {
    setQuotes((prev) => [...prev, { text: "", author: "" }]);
  };

  if (!authorized) {
    return <div className="flex min-h-[60vh] items-center justify-center"><p className="text-sm text-brand-grey">checking access...</p></div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-6">
        <a href="/admin" className="text-xs text-brand-grey hover:text-brand-gold">← back to dashboard</a>
        <h1 className="mt-2 font-heading text-2xl text-brand-gold">manage quotes</h1>
        <p className="mt-1 text-sm text-brand-grey">edit the rotating quotes shown on the homepage.</p>
      </div>

      {loading ? (
        <p className="text-sm text-brand-grey">loading...</p>
      ) : (
        <>
          <div className="space-y-4">
            {quotes.map((q, i) => (
              <div key={i} className="rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] text-brand-grey">quote {i + 1}</span>
                  <button type="button" onClick={() => removeAt(i)} className="text-xs text-brand-grey hover:text-red-400">remove</button>
                </div>
                <textarea
                  value={q.text}
                  onChange={(e) => updateAt(i, "text", e.target.value)}
                  placeholder="quote text..."
                  rows={2}
                  className="mb-2 w-full resize-none rounded border border-brand-dark-gold/20 bg-transparent px-3 py-2 text-sm text-white placeholder:text-brand-grey/40 focus:border-brand-gold focus:outline-none"
                />
                <input
                  type="text"
                  value={q.author}
                  onChange={(e) => updateAt(i, "author", e.target.value)}
                  placeholder="author..."
                  className="w-full rounded border border-brand-dark-gold/20 bg-transparent px-3 py-2 text-sm text-white placeholder:text-brand-grey/40 focus:border-brand-gold focus:outline-none"
                />
              </div>
            ))}
          </div>

          <button type="button" onClick={addNew} className="mt-3 text-xs text-brand-gold hover:text-brand-pale-gold">+ add quote</button>

          <div className="mt-6 flex items-center gap-3">
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

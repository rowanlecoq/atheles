"use client";

import { useEffect, useState } from "react";

type HomepageContent = {
  carouselTitle: string;
  carouselSubtitle: string;
  carouselViewAllHref: string;
  featuredTitle: string;
};

const DEFAULTS: HomepageContent = {
  carouselTitle: "Coming Soon: This Summer",
  carouselSubtitle: "mens",
  carouselViewAllHref: "/search",
  featuredTitle: "best selling",
};

export default function AdminHomepagePage() {
  const [content, setContent] = useState<HomepageContent>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/homepage-content")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setContent({ ...DEFAULTS, ...d }); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const res = await fetch("/api/admin/homepage-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const d = await res.json();
        setError(d.error || "failed to save");
      }
    } catch {
      setError("something went wrong");
    }
    setSaving(false);
  };

  const field = (
    key: keyof HomepageContent,
    label: string,
    hint: string,
    placeholder?: string,
  ) => (
    <div>
      <label className="mb-1.5 block text-xs uppercase tracking-wider text-brand-grey">
        {label}
      </label>
      <input
        type="text"
        value={content[key]}
        onChange={(e) => setContent((prev) => ({ ...prev, [key]: e.target.value }))}
        placeholder={placeholder ?? DEFAULTS[key]}
        className="w-full rounded-lg border border-brand-dark-gold/20 bg-brand-dark px-3 py-2.5 text-sm text-white placeholder:text-brand-grey/30 focus:border-brand-gold focus:outline-none"
      />
      <p className="mt-1 text-xs text-brand-grey/50">{hint}</p>
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8">
        <a href="/admin" className="inline-flex items-center gap-1.5 text-xs text-brand-grey hover:text-brand-gold">
          ← back to dashboard
        </a>
        <h1 className="mt-3 font-heading text-2xl text-brand-gold">homepage content</h1>
        <p className="mt-1 text-sm text-brand-grey">
          edit the text shown in the homepage product carousel and featured section.
        </p>
      </div>

      {loading ? (
        <div className="space-y-6">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-white/5" />
          ))}
        </div>
      ) : (
        <>
          <div className="space-y-6">
            <div className="rounded-xl border border-brand-dark-gold/15 bg-brand-dark p-5">
              <h2 className="mb-4 text-sm font-medium text-white">product carousel</h2>
              <div className="space-y-4">
                {field("carouselTitle", "title", 'the large heading above the carousel. e.g. "New Arrivals" or "Summer Drop"', "Coming Soon: This Summer")}
                {field("carouselSubtitle", "subtitle (optional)", 'small label shown above the title. e.g. "mens" or "new drop" — leave blank to hide.', "mens")}
                {field("carouselViewAllHref", "view all link", 'the path the "view all" button links to. e.g. /search or /search/mens', "/search")}
              </div>
            </div>

            <div className="rounded-xl border border-brand-dark-gold/15 bg-brand-dark p-5">
              <h2 className="mb-4 text-sm font-medium text-white">featured section</h2>
              <div className="space-y-4">
                {field("featuredTitle", "section title", 'heading for the 3-item featured grid. e.g. "best selling" or "fan favourites"', "best selling")}
              </div>
            </div>
          </div>

          {error && <p className="mt-4 text-xs text-red-400">{error}</p>}

          <div className="mt-8 flex items-center gap-4">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="rounded-full bg-brand-gold px-6 py-2.5 text-sm uppercase tracking-wider text-brand-dark transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "saving..." : "save changes"}
            </button>
            {saved && <span className="text-xs text-green-400">saved! changes go live within 60 seconds.</span>}
          </div>

          <p className="mt-8 text-xs text-brand-grey/50">
            changes are cached for up to 60 seconds — visitors will see the update shortly after saving.
          </p>
        </>
      )}
    </div>
  );
}

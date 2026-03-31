"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminAnnouncementsPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [announcements, setAnnouncements] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => {
        if (d?.user?.isAdmin) {
          setAuthorized(true);
          fetchAnnouncements();
        } else {
          router.replace("/");
        }
      })
      .catch(() => router.replace("/"));
  }, [router]);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch("/api/admin/announcements");
      if (res.ok) {
        const d = await res.json();
        setAnnouncements(d.announcements || []);
      }
    } catch {}
    setLoading(false);
  };

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

  const updateAt = (index: number, value: string) => {
    setAnnouncements((prev) => prev.map((a, i) => (i === index ? value : a)));
  };

  const removeAt = (index: number) => {
    setAnnouncements((prev) => prev.filter((_, i) => i !== index));
  };

  const addNew = () => {
    setAnnouncements((prev) => [...prev, ""]);
  };

  if (!authorized) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-brand-grey">checking access...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-6">
        <a href="/admin" className="text-xs text-brand-grey hover:text-brand-gold">
          ← back to dashboard
        </a>
        <h1 className="mt-2 font-heading text-2xl text-brand-gold">
          announcements
        </h1>
        <p className="mt-1 text-sm text-brand-grey">
          edit the messages shown in the announcement bar at the top of the site.
          they rotate every 5 seconds.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-brand-grey">loading...</p>
      ) : (
        <>
          <div className="space-y-3">
            {announcements.map((text, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={text}
                  onChange={(e) => updateAt(i, e.target.value)}
                  placeholder="announcement text..."
                  className="flex-1 rounded-lg border border-brand-dark-gold/20 bg-brand-dark px-3 py-2.5 text-sm text-white placeholder:text-brand-grey/40 focus:border-brand-gold focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  className="flex h-10 w-10 flex-none items-center justify-center rounded-lg border border-brand-dark-gold/20 text-brand-grey transition-colors hover:border-red-400/40 hover:text-red-400"
                  aria-label="Remove"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addNew}
            className="mt-3 text-xs text-brand-gold transition-colors hover:text-brand-pale-gold"
          >
            + add announcement
          </button>

          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="rounded-full bg-brand-gold px-6 py-2.5 text-sm uppercase tracking-wider text-brand-dark transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "saving..." : "save changes"}
            </button>
            {saved && (
              <span className="text-xs text-green-400">saved! changes will appear on next page load.</span>
            )}
          </div>

          <div className="mt-8 rounded-lg border border-brand-dark-gold/20 bg-brand-dark-gold/5 p-4">
            <p className="text-xs text-brand-grey">
              <strong className="text-brand-pale-gold">note:</strong> announcements are stored in shopify and will persist across deploys.
              changes take effect when users refresh or visit a new page. keep messages short
              and uppercase-friendly since they display in small caps.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

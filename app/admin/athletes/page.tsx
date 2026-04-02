"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Athlete = {
  name: string;
  age: number;
  role: string;
  image: string | null;
  socials: {
    tiktok: string;
    instagram: string;
    linkedin: string;
    youtube: string;
  };
  hobbies: string[];
};

export default function AdminAthletesPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => {
        if (d?.user?.isAdmin) {
          setAuthorized(true);
          fetch("/api/admin/athletes")
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => { if (d?.athletes) setAthletes(d.athletes); })
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
      const res = await fetch("/api/admin/athletes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ athletes }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {}
    setSaving(false);
  };

  const updateAt = (index: number, field: string, value: unknown) => {
    setAthletes((prev) => prev.map((a, i) => (i === index ? { ...a, [field]: value } : a)));
  };

  const updateSocial = (index: number, platform: string, value: string) => {
    setAthletes((prev) => prev.map((a, i) => (i === index ? { ...a, socials: { ...a.socials, [platform]: value } } : a)));
  };

  const removeAt = (index: number) => {
    setAthletes((prev) => prev.filter((_, i) => i !== index));
  };

  const addNew = () => {
    setAthletes((prev) => [...prev, {
      name: "",
      age: 18,
      role: "athlete",
      image: null,
      socials: { tiktok: "", instagram: "", linkedin: "", youtube: "" },
      hobbies: [],
    }]);
  };

  if (!authorized) {
    return <div className="flex min-h-[60vh] items-center justify-center"><p className="text-sm text-brand-grey">checking access...</p></div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-6">
        <a href="/admin" className="text-xs text-brand-grey hover:text-brand-gold">← back to dashboard</a>
        <h1 className="mt-2 font-heading text-2xl text-brand-gold">manage athlete profiles</h1>
        <p className="mt-1 text-sm text-brand-grey">edit the athletes shown on the /athletes page.</p>
      </div>

      {loading ? (
        <p className="text-sm text-brand-grey">loading...</p>
      ) : (
        <>
          <div className="space-y-6">
            {athletes.map((a, i) => (
              <div key={i} className="rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs text-brand-gold">athlete {i + 1}</span>
                  <button type="button" onClick={() => removeAt(i)} className="text-xs text-brand-grey hover:text-red-400">remove</button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[10px] uppercase tracking-wider text-brand-grey">name</label>
                    <input type="text" value={a.name} onChange={(e) => updateAt(i, "name", e.target.value)} className="w-full rounded border border-brand-dark-gold/20 bg-transparent px-3 py-2 text-sm text-white focus:border-brand-gold focus:outline-none" />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] uppercase tracking-wider text-brand-grey">role</label>
                    <input type="text" value={a.role} onChange={(e) => updateAt(i, "role", e.target.value)} className="w-full rounded border border-brand-dark-gold/20 bg-transparent px-3 py-2 text-sm text-white focus:border-brand-gold focus:outline-none" />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] uppercase tracking-wider text-brand-grey">age</label>
                    <input type="number" value={a.age} onChange={(e) => updateAt(i, "age", parseInt(e.target.value) || 0)} className="w-full rounded border border-brand-dark-gold/20 bg-transparent px-3 py-2 text-sm text-white focus:border-brand-gold focus:outline-none" />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] uppercase tracking-wider text-brand-grey">image url (optional)</label>
                    <input type="text" value={a.image || ""} onChange={(e) => updateAt(i, "image", e.target.value || null)} placeholder="https://..." className="w-full rounded border border-brand-dark-gold/20 bg-transparent px-3 py-2 text-sm text-white placeholder:text-brand-grey/40 focus:border-brand-gold focus:outline-none" />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="mb-1 block text-[10px] uppercase tracking-wider text-brand-grey">hobbies (comma separated)</label>
                  <input
                    type="text"
                    value={a.hobbies.join(", ")}
                    onChange={(e) => updateAt(i, "hobbies", e.target.value.split(",").map((h: string) => h.trim()).filter(Boolean))}
                    placeholder="working out, reading, cooking..."
                    className="w-full rounded border border-brand-dark-gold/20 bg-transparent px-3 py-2 text-sm text-white placeholder:text-brand-grey/40 focus:border-brand-gold focus:outline-none"
                  />
                </div>

                <div className="mt-3">
                  <label className="mb-1 block text-[10px] uppercase tracking-wider text-brand-grey">socials</label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input type="text" value={a.socials.tiktok} onChange={(e) => updateSocial(i, "tiktok", e.target.value)} placeholder="tiktok url" className="w-full rounded border border-brand-dark-gold/20 bg-transparent px-3 py-2 text-xs text-white placeholder:text-brand-grey/40 focus:border-brand-gold focus:outline-none" />
                    <input type="text" value={a.socials.instagram} onChange={(e) => updateSocial(i, "instagram", e.target.value)} placeholder="instagram url" className="w-full rounded border border-brand-dark-gold/20 bg-transparent px-3 py-2 text-xs text-white placeholder:text-brand-grey/40 focus:border-brand-gold focus:outline-none" />
                    <input type="text" value={a.socials.youtube} onChange={(e) => updateSocial(i, "youtube", e.target.value)} placeholder="youtube url" className="w-full rounded border border-brand-dark-gold/20 bg-transparent px-3 py-2 text-xs text-white placeholder:text-brand-grey/40 focus:border-brand-gold focus:outline-none" />
                    <input type="text" value={a.socials.linkedin} onChange={(e) => updateSocial(i, "linkedin", e.target.value)} placeholder="linkedin url" className="w-full rounded border border-brand-dark-gold/20 bg-transparent px-3 py-2 text-xs text-white placeholder:text-brand-grey/40 focus:border-brand-gold focus:outline-none" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button type="button" onClick={addNew} className="mt-4 text-xs text-brand-gold hover:text-brand-pale-gold">+ add athlete</button>

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

          <div className="mt-4">
            <a href="/athletes" className="text-xs text-brand-grey hover:text-brand-gold">view athletes page →</a>
          </div>
        </>
      )}
    </div>
  );
}

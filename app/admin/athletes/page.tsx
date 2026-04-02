"use client";

import { useEffect, useRef, useState } from "react";
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
    snapchat: string;
    email: string;
  };
  hobbies: string[];
};

const emptySocials = { tiktok: "", instagram: "", linkedin: "", youtube: "", snapchat: "", email: "" };

export default function AdminAthletesPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState<number | null>(null);
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => {
        if (d?.user?.isAdmin) {
          setAuthorized(true);
          fetch("/api/admin/athletes")
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
              if (d?.athletes) {
                // Backfill missing social fields for old data
                setAthletes(d.athletes.map((a: Athlete) => ({
                  ...a,
                  socials: { ...emptySocials, ...a.socials },
                })));
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
      socials: { ...emptySocials },
      hobbies: [],
    }]);
  };

  const handleImageUpload = async (index: number, file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert("image must be under 5mb.");
      return;
    }
    setUploading(index);

    // Resize image
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const maxSize = 800;
        let w = img.width;
        let h = img.height;
        if (w > maxSize || h > maxSize) {
          if (w > h) { h = Math.round((h * maxSize) / w); w = maxSize; }
          else { w = Math.round((w * maxSize) / h); h = maxSize; }
        }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d")?.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

        try {
          const res = await fetch("/api/admin/athletes/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: dataUrl }),
          });
          const d = await res.json();
          if (d.url) {
            updateAt(index, "image", d.url);
          }
        } catch {}
        setUploading(null);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
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

                {/* Image upload */}
                <div className="mb-4">
                  <label className="mb-1 block text-[10px] uppercase tracking-wider text-brand-grey">photo</label>
                  <div className="flex items-center gap-3">
                    {a.image ? (
                      <div className="relative h-16 w-16 overflow-hidden rounded-lg">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={a.image} alt="" className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-brand-medium-grey/10 text-xl">🔱</div>
                    )}
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        disabled={uploading === i}
                        onClick={() => fileRefs.current[i]?.click()}
                        className="text-xs text-brand-gold hover:text-brand-pale-gold disabled:opacity-50"
                      >
                        {uploading === i ? "uploading..." : a.image ? "change photo" : "upload photo"}
                      </button>
                      {a.image && (
                        <button
                          type="button"
                          onClick={() => updateAt(i, "image", null)}
                          className="text-xs text-brand-grey hover:text-red-400"
                        >
                          remove photo
                        </button>
                      )}
                    </div>
                    <input
                      ref={(el) => { fileRefs.current[i] = el; }}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(i, file);
                        e.target.value = "";
                      }}
                      className="hidden"
                    />
                  </div>
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
                    <input type="text" value={a.socials.snapchat} onChange={(e) => updateSocial(i, "snapchat", e.target.value)} placeholder="snapchat username" className="w-full rounded border border-brand-dark-gold/20 bg-transparent px-3 py-2 text-xs text-white placeholder:text-brand-grey/40 focus:border-brand-gold focus:outline-none" />
                    <input type="text" value={a.socials.email} onChange={(e) => updateSocial(i, "email", e.target.value)} placeholder="email address" className="w-full rounded border border-brand-dark-gold/20 bg-transparent px-3 py-2 text-xs text-white placeholder:text-brand-grey/40 focus:border-brand-gold focus:outline-none" />
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

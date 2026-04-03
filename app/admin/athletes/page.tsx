"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Social = { platform: string; url: string };

const SOCIAL_PLATFORMS = [
  "tiktok",
  "instagram",
  "youtube",
  "linkedin",
  "snapchat",
  "email",
  "twitter",
  "facebook",
  "website",
];

type Athlete = {
  name: string;
  age: number;
  role: string;
  description: string;
  image: string | null;
  images: string[];
  socials: Social[];
  hobbies: string[];
};

export default function AdminAthletesPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState("");

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
                // Normalize old format (object socials) to new format (array)
                setAthletes(d.athletes.map((a: Record<string, unknown>) => ({
                  ...a,
                  description: a.description || "",
                  images: a.images || [],
                  socials: Array.isArray(a.socials)
                    ? a.socials
                    : Object.entries(a.socials || {})
                        .filter(([, v]) => v)
                        .map(([k, v]) => ({ platform: k, url: v as string })),
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

  const removeAt = (index: number) => {
    setAthletes((prev) => prev.filter((_, i) => i !== index));
  };

  const addNew = () => {
    setAthletes((prev) => [...prev, {
      name: "", age: 18, role: "athlete", description: "", image: null, images: [], socials: [], hobbies: [],
    }]);
  };

  const addSocial = (athleteIdx: number) => {
    setAthletes((prev) => prev.map((a, i) =>
      i === athleteIdx ? { ...a, socials: [...a.socials, { platform: "", url: "" }] } : a
    ));
  };

  const updateSocial = (athleteIdx: number, socialIdx: number, field: "platform" | "url", value: string) => {
    setAthletes((prev) => prev.map((a, i) =>
      i === athleteIdx ? {
        ...a,
        socials: a.socials.map((s, j) => j === socialIdx ? { ...s, [field]: value } : s),
      } : a
    ));
  };

  const removeSocial = (athleteIdx: number, socialIdx: number) => {
    setAthletes((prev) => prev.map((a, i) =>
      i === athleteIdx ? { ...a, socials: a.socials.filter((_, j) => j !== socialIdx) } : a
    ));
  };

  const addHobby = (athleteIdx: number) => {
    setAthletes((prev) => prev.map((a, i) =>
      i === athleteIdx ? { ...a, hobbies: [...a.hobbies, ""] } : a
    ));
  };

  const updateHobby = (athleteIdx: number, hobbyIdx: number, value: string) => {
    setAthletes((prev) => prev.map((a, i) =>
      i === athleteIdx ? { ...a, hobbies: a.hobbies.map((h, j) => j === hobbyIdx ? value : h) } : a
    ));
  };

  const removeHobby = (athleteIdx: number, hobbyIdx: number) => {
    setAthletes((prev) => prev.map((a, i) =>
      i === athleteIdx ? { ...a, hobbies: a.hobbies.filter((_, j) => j !== hobbyIdx) } : a
    ));
  };

  const addExtraImage = async (athleteIdx: number, file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("image must be under 5mb.");
      setTimeout(() => setUploadError(""), 3000);
      return;
    }
    setUploading(athleteIdx);
    try {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await fetch("/api/admin/athletes/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      const d = await res.json();
      if (d.url) {
        setAthletes((prev) => prev.map((a, i) =>
          i === athleteIdx ? { ...a, images: [...(a.images || []), d.url] } : a
        ));
      } else {
        setUploadError(d.error || "upload failed.");
        setTimeout(() => setUploadError(""), 3000);
      }
    } catch {
      setUploadError("upload failed.");
      setTimeout(() => setUploadError(""), 3000);
    }
    setUploading(null);
  };

  const removeExtraImage = (athleteIdx: number, imgIdx: number) => {
    setAthletes((prev) => prev.map((a, i) =>
      i === athleteIdx ? { ...a, images: (a.images || []).filter((_, j) => j !== imgIdx) } : a
    ));
  };

  const handleImageUpload = async (index: number, file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("image must be under 5mb.");
      setTimeout(() => setUploadError(""), 3000);
      return;
    }
    setUploading(index);
    setUploadError("");

    try {
      // Convert to base64 directly (simpler, avoid canvas issues)
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/admin/athletes/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      const d = await res.json();
      if (d.url) {
        updateAt(index, "image", d.url);
      } else {
        setUploadError(d.error || "upload failed.");
        setTimeout(() => setUploadError(""), 3000);
      }
    } catch {
      setUploadError("upload failed.");
      setTimeout(() => setUploadError(""), 3000);
    }
    setUploading(null);
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

      {uploadError && <p className="mb-4 text-xs text-red-400">{uploadError}</p>}

      {loading ? (
        <p className="text-sm text-brand-grey">loading...</p>
      ) : (
        <>
          <div className="space-y-6">
            {athletes.map((a, i) => (
              <div key={i} className="rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-xs text-brand-gold">athlete {i + 1}</span>
                  <button type="button" onClick={() => removeAt(i)} className="text-xs text-brand-grey hover:text-red-400">remove</button>
                </div>

                {/* Photo */}
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
                      <label className="cursor-pointer text-xs text-brand-gold hover:text-brand-pale-gold">
                        {uploading === i ? "uploading..." : a.image ? "change photo" : "upload photo"}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          disabled={uploading === i}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(i, file);
                            e.target.value = "";
                          }}
                          className="hidden"
                        />
                      </label>
                      {a.image && (
                        <button type="button" onClick={() => updateAt(i, "image", null)} className="text-left text-xs text-brand-grey hover:text-red-400">remove photo</button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Name, Role, Age */}
                <div className="grid gap-3 sm:grid-cols-3">
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

                {/* Description */}
                <div className="mt-3">
                  <label className="mb-1 block text-[10px] uppercase tracking-wider text-brand-grey">description</label>
                  <textarea
                    value={a.description}
                    onChange={(e) => updateAt(i, "description", e.target.value)}
                    placeholder="a short bio about this athlete..."
                    rows={3}
                    className="w-full resize-none rounded border border-brand-dark-gold/20 bg-transparent px-3 py-2 text-sm text-white placeholder:text-brand-grey/40 focus:border-brand-gold focus:outline-none"
                  />
                </div>

                {/* Hobbies */}
                <div className="mt-3">
                  <label className="mb-2 block text-[10px] uppercase tracking-wider text-brand-grey">interests</label>
                  <div className="space-y-2">
                    {a.hobbies.map((h, j) => (
                      <div key={j} className="flex gap-2">
                        <input type="text" value={h} onChange={(e) => updateHobby(i, j, e.target.value)} placeholder="e.g. working out" className="flex-1 rounded border border-brand-dark-gold/20 bg-transparent px-3 py-2 text-sm text-white placeholder:text-brand-grey/40 focus:border-brand-gold focus:outline-none" />
                        <button type="button" onClick={() => removeHobby(i, j)} className="flex-none text-xs text-brand-grey hover:text-red-400">×</button>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={() => addHobby(i)} className="mt-2 text-xs text-brand-gold hover:text-brand-pale-gold">+ add interest</button>
                </div>

                {/* Extra Photos */}
                <div className="mt-3">
                  <label className="mb-2 block text-[10px] uppercase tracking-wider text-brand-grey">gallery photos</label>
                  <div className="flex flex-wrap gap-2">
                    {(a.images || []).map((img, j) => (
                      <div key={j} className="group relative h-16 w-16 overflow-hidden rounded-lg">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img} alt="" className="h-full w-full object-cover" />
                        <button type="button" onClick={() => removeExtraImage(i, j)} className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs text-white opacity-0 group-hover:opacity-100">×</button>
                      </div>
                    ))}
                    <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-lg border border-brand-dark-gold/20 text-xs text-brand-gold hover:border-brand-gold/40">
                      +
                      <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => { const f = e.target.files?.[0]; if (f) addExtraImage(i, f); e.target.value = ""; }} className="hidden" />
                    </label>
                  </div>
                </div>

                {/* Dynamic Socials */}
                <div className="mt-3">
                  <label className="mb-2 block text-[10px] uppercase tracking-wider text-brand-grey">socials</label>
                  <div className="space-y-2">
                    {a.socials.map((s, j) => (
                      <div key={j} className="flex gap-2">
                        <select
                          value={s.platform}
                          onChange={(e) => updateSocial(i, j, "platform", e.target.value)}
                          className="w-1/3 rounded border border-brand-dark-gold/20 bg-brand-dark px-3 py-2 text-xs text-white focus:border-brand-gold focus:outline-none"
                        >
                          <option value="">select</option>
                          {SOCIAL_PLATFORMS.map((p) => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={s.url}
                          onChange={(e) => updateSocial(i, j, "url", e.target.value)}
                          placeholder="url or username"
                          className="flex-1 rounded border border-brand-dark-gold/20 bg-transparent px-3 py-2 text-xs text-white placeholder:text-brand-grey/40 focus:border-brand-gold focus:outline-none"
                        />
                        <button type="button" onClick={() => removeSocial(i, j)} className="flex-none text-xs text-brand-grey hover:text-red-400">×</button>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={() => addSocial(i)} className="mt-2 text-xs text-brand-gold hover:text-brand-pale-gold">+ add social</button>
                </div>
              </div>
            ))}
          </div>

          <button type="button" onClick={addNew} className="mt-4 text-xs text-brand-gold hover:text-brand-pale-gold">+ add athlete</button>

          <div className="mt-6 flex items-center gap-3">
            <button type="button" onClick={save} disabled={saving} className="rounded-full bg-brand-gold px-6 py-2.5 text-sm uppercase tracking-wider text-brand-dark transition-opacity hover:opacity-90 disabled:opacity-50">
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

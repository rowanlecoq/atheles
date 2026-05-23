"use client";

import { upload } from "@vercel/blob/client";
import { useEffect, useState } from "react";
import { UserCircleIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";

type Social = { platform: string; url: string };

const SOCIAL_PLATFORMS = [
  "tiktok", "instagram", "youtube", "linkedin",
  "snapchat", "email", "twitter", "facebook", "website",
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

function getYouTubeId(url: string) {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]+)/);
  return m?.[1] ?? null;
}

function isVideo(url: string) {
  return url.includes("youtube.com") || url.includes("youtu.be") ||
    url.includes("tiktok.com") || url.includes("instagram.com") ||
    url.endsWith(".mp4") || url.endsWith(".webm");
}

function MediaThumb({ src }: { src: string }) {
  const ytId = getYouTubeId(src);
  if (ytId) return (
    <div className="relative h-full w-full">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt="" className="h-full w-full object-cover" />
      <div className="absolute inset-0 flex items-center justify-center bg-black/30"><span className="text-sm text-white">▶</span></div>
    </div>
  );
  if (isVideo(src)) return (
    <div className="flex h-full w-full items-center justify-center bg-white/5 text-lg text-brand-grey">▶</div>
  );
  {/* eslint-disable-next-line @next/next/no-img-element */}
  return <img src={src} alt="" className="h-full w-full object-cover" />;
}

export default function AdminAthletesPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    fetch("/api/admin/athletes")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.athletes) {
          setAthletes(d.athletes.map((a: Record<string, unknown>) => ({
            name: a.name || "",
            age: a.age || 18,
            role: a.role || "",
            description: a.description || "",
            image: a.image || null,
            images: Array.isArray(a.images) ? a.images : [],
            socials: Array.isArray(a.socials)
              ? a.socials
              : Object.entries((a.socials as Record<string, string>) || {})
                  .filter(([, v]) => v)
                  .map(([k, v]) => ({ platform: k, url: v })),
            hobbies: Array.isArray(a.hobbies) ? a.hobbies : [],
          })));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    setSaveError("");
    try {
      const res = await fetch("/api/admin/athletes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ athletes }),
      });
      const d = await res.json();
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setSaveError(d.error || "save failed");
      }
    } catch {
      setSaveError("save failed");
    }
    setSaving(false);
  };

  const update = (index: number, field: string, value: unknown) =>
    setAthletes((prev) => prev.map((a, i) => (i === index ? { ...a, [field]: value } : a)));

  const uploadPhoto = async (athleteIdx: number, file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("image must be under 10mb.");
      setTimeout(() => setUploadError(""), 4000);
      return;
    }
    setUploading(`photo-${athleteIdx}`);
    setUploadError("");
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const blob = await upload(`athlete-${Date.now()}.${ext}`, file, {
        access: "public",
        handleUploadUrl: "/api/admin/athletes/upload",
      });
      update(athleteIdx, "image", blob.url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "upload failed.");
      setTimeout(() => setUploadError(""), 4000);
    }
    setUploading(null);
  };

  const uploadGalleryFile = async (athleteIdx: number, file: File) => {
    const vid = file.type.startsWith("video/");
    const maxSize = vid ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError(`file too large (max ${vid ? "50" : "10"}mb).`);
      setTimeout(() => setUploadError(""), 4000);
      return;
    }
    setUploading(`gallery-${athleteIdx}`);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const blob = await upload(`athlete-gallery-${Date.now()}.${ext}`, file, {
        access: "public",
        handleUploadUrl: "/api/admin/athletes/upload",
      });
      setAthletes((prev) => prev.map((a, i) =>
        i === athleteIdx ? { ...a, images: [...(a.images || []), blob.url] } : a,
      ));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "upload failed.");
      setTimeout(() => setUploadError(""), 4000);
    }
    setUploading(null);
  };

  const addGalleryUrl = (athleteIdx: number, url: string) => {
    if (!url) return;
    setAthletes((prev) => prev.map((a, i) =>
      i === athleteIdx ? { ...a, images: [...(a.images || []), url] } : a,
    ));
  };

  const removeGallery = (athleteIdx: number, imgIdx: number) =>
    setAthletes((prev) => prev.map((a, i) =>
      i === athleteIdx ? { ...a, images: (a.images || []).filter((_, j) => j !== imgIdx) } : a,
    ));

  const addSocial = (i: number) =>
    setAthletes((prev) => prev.map((a, idx) =>
      idx === i ? { ...a, socials: [...a.socials, { platform: "", url: "" }] } : a,
    ));

  const updateSocial = (i: number, j: number, field: "platform" | "url", value: string) =>
    setAthletes((prev) => prev.map((a, idx) =>
      idx === i ? { ...a, socials: a.socials.map((s, k) => k === j ? { ...s, [field]: value } : s) } : a,
    ));

  const removeSocial = (i: number, j: number) =>
    setAthletes((prev) => prev.map((a, idx) =>
      idx === i ? { ...a, socials: a.socials.filter((_, k) => k !== j) } : a,
    ));

  const addHobby = (i: number) =>
    setAthletes((prev) => prev.map((a, idx) =>
      idx === i ? { ...a, hobbies: [...a.hobbies, ""] } : a,
    ));

  const updateHobby = (i: number, j: number, value: string) =>
    setAthletes((prev) => prev.map((a, idx) =>
      idx === i ? { ...a, hobbies: a.hobbies.map((h, k) => k === j ? value : h) } : a,
    ));

  const removeHobby = (i: number, j: number) =>
    setAthletes((prev) => prev.map((a, idx) =>
      idx === i ? { ...a, hobbies: a.hobbies.filter((_, k) => k !== j) } : a,
    ));

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8">
        <a href="/admin" className="text-xs text-brand-grey hover:text-brand-gold">← back to dashboard</a>
        <h1 className="mt-3 font-heading text-2xl text-brand-gold">athlete profiles</h1>
        <p className="mt-1 text-sm text-brand-grey">edit the athletes shown on the /athletes page.</p>
      </div>

      {uploadError && (
        <div className="mb-4 rounded-lg border border-red-400/20 bg-red-400/5 px-4 py-2.5">
          <p className="text-xs text-red-400">{uploadError}</p>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {athletes.map((a, i) => (
              <div key={i} className="rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-xs font-medium text-brand-gold">athlete {i + 1}{a.name ? ` — ${a.name.toLowerCase()}` : ""}</span>
                  <button type="button" onClick={() => setAthletes((prev) => prev.filter((_, idx) => idx !== i))} className="text-xs text-brand-grey hover:text-red-400">remove</button>
                </div>

                {/* Photo */}
                <div className="mb-4 flex items-center gap-4">
                  <div className="relative h-16 w-16 flex-none overflow-hidden rounded-lg bg-white/5">
                    {a.image
                      ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={a.image} alt="" className="h-full w-full object-cover" />
                      : <div className="flex h-full w-full items-center justify-center"><UserCircleIcon className="h-8 w-8 text-brand-grey/30" /></div>
                    }
                  </div>
                  <div className="space-y-1">
                    <label className={`cursor-pointer text-xs text-brand-gold hover:text-brand-pale-gold ${uploading === `photo-${i}` ? "opacity-50" : ""}`}>
                      {uploading === `photo-${i}` ? "uploading..." : a.image ? "change photo" : "upload photo"}
                      <input type="file" accept="image/png,image/jpeg,image/webp" disabled={!!uploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPhoto(i, f); e.target.value = ""; }} className="hidden" />
                    </label>
                    {a.image && <button type="button" onClick={() => update(i, "image", null)} className="block text-xs text-brand-grey hover:text-red-400">remove photo</button>}
                  </div>
                </div>

                {/* Name, Role, Age */}
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { label: "name", field: "name", type: "text", value: a.name },
                    { label: "role", field: "role", type: "text", value: a.role },
                    { label: "age", field: "age", type: "number", value: String(a.age) },
                  ].map(({ label, field, type, value }) => (
                    <div key={field}>
                      <label className="mb-1 block text-[10px] uppercase tracking-wider text-brand-grey">{label}</label>
                      <input
                        type={type}
                        value={value}
                        onChange={(e) => update(i, field, type === "number" ? (parseInt(e.target.value) || 0) : e.target.value)}
                        className="w-full rounded border border-brand-dark-gold/20 bg-transparent px-3 py-2 text-sm text-white focus:border-brand-gold focus:outline-none"
                      />
                    </div>
                  ))}
                </div>

                {/* Description */}
                <div className="mt-3">
                  <label className="mb-1 block text-[10px] uppercase tracking-wider text-brand-grey">bio</label>
                  <textarea value={a.description} onChange={(e) => update(i, "description", e.target.value)} placeholder="short bio..." rows={3} className="w-full resize-none rounded border border-brand-dark-gold/20 bg-transparent px-3 py-2 text-sm text-white placeholder:text-brand-grey/40 focus:border-brand-gold focus:outline-none" />
                </div>

                {/* Interests */}
                <div className="mt-3">
                  <label className="mb-2 block text-[10px] uppercase tracking-wider text-brand-grey">interests</label>
                  <div className="space-y-2">
                    {a.hobbies.map((h, j) => (
                      <div key={j} className="flex gap-2">
                        <input type="text" value={h} onChange={(e) => updateHobby(i, j, e.target.value)} placeholder="e.g. working out" className="flex-1 rounded border border-brand-dark-gold/20 bg-transparent px-3 py-2 text-sm text-white placeholder:text-brand-grey/40 focus:border-brand-gold focus:outline-none" />
                        <button type="button" onClick={() => removeHobby(i, j)} className="flex-none p-1 text-brand-grey/40 transition-colors hover:text-red-400"><XMarkIcon className="h-3.5 w-3.5" /></button>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={() => addHobby(i)} className="mt-2 flex items-center gap-1.5 text-xs text-brand-gold hover:text-brand-pale-gold"><PlusIcon className="h-3.5 w-3.5" />add interest</button>
                </div>

                {/* Gallery */}
                <div className="mt-3">
                  <label className="mb-2 block text-[10px] uppercase tracking-wider text-brand-grey">gallery</label>
                  <div className="flex flex-wrap gap-2">
                    {(a.images || []).map((src, j) => (
                      <div key={j} className="group relative h-16 w-16 overflow-hidden rounded-lg border border-white/10">
                        <MediaThumb src={src} />
                        <button type="button" onClick={() => removeGallery(i, j)} className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100"><XMarkIcon className="h-4 w-4" /></button>
                      </div>
                    ))}
                    <label className={`flex h-16 w-16 cursor-pointer items-center justify-center rounded-lg border border-dashed border-brand-dark-gold/30 text-brand-gold transition-colors hover:border-brand-gold/60 ${uploading === `gallery-${i}` ? "opacity-50" : ""}`}>
                      {uploading === `gallery-${i}` ? <span className="text-[10px]">...</span> : <span className="text-lg leading-none">+</span>}
                      <input type="file" accept="image/png,image/jpeg,image/webp,video/mp4,video/webm" disabled={!!uploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadGalleryFile(i, f); e.target.value = ""; }} className="hidden" />
                    </label>
                  </div>
                  <input
                    type="text"
                    placeholder="paste video/image url and press enter..."
                    className="mt-2 w-full rounded border border-brand-dark-gold/20 bg-transparent px-3 py-1.5 text-xs text-white placeholder:text-brand-grey/40 focus:border-brand-gold focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const val = (e.target as HTMLInputElement).value.trim();
                        if (val) { addGalleryUrl(i, val); (e.target as HTMLInputElement).value = ""; }
                      }
                    }}
                  />
                </div>

                {/* Socials */}
                <div className="mt-3">
                  <label className="mb-2 block text-[10px] uppercase tracking-wider text-brand-grey">socials</label>
                  <div className="space-y-2">
                    {a.socials.map((s, j) => (
                      <div key={j} className="flex gap-2">
                        <select value={s.platform} onChange={(e) => updateSocial(i, j, "platform", e.target.value)} className="w-1/3 rounded border border-brand-dark-gold/20 bg-brand-dark px-2 py-2 text-xs text-white focus:border-brand-gold focus:outline-none">
                          <option value="">select</option>
                          {SOCIAL_PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <input type="text" value={s.url} onChange={(e) => updateSocial(i, j, "url", e.target.value)} placeholder="url or username" className="flex-1 rounded border border-brand-dark-gold/20 bg-transparent px-3 py-2 text-xs text-white placeholder:text-brand-grey/40 focus:border-brand-gold focus:outline-none" />
                        <button type="button" onClick={() => removeSocial(i, j)} className="flex-none p-1 text-brand-grey/40 transition-colors hover:text-red-400"><XMarkIcon className="h-3.5 w-3.5" /></button>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={() => addSocial(i)} className="mt-2 flex items-center gap-1.5 text-xs text-brand-gold hover:text-brand-pale-gold"><PlusIcon className="h-3.5 w-3.5" />add social</button>
                </div>
              </div>
            ))}
          </div>

          <button type="button" onClick={() => setAthletes((prev) => [...prev, { name: "", age: 18, role: "athlete", description: "", image: null, images: [], socials: [], hobbies: [] }])} className="mt-4 flex items-center gap-1.5 text-xs text-brand-gold hover:text-brand-pale-gold"><PlusIcon className="h-3.5 w-3.5" />add athlete</button>

          <div className="mt-6 flex items-center gap-3">
            <button type="button" onClick={save} disabled={saving} className="rounded-full bg-brand-gold px-6 py-2.5 text-sm uppercase tracking-wider text-brand-dark transition-opacity hover:opacity-90 disabled:opacity-50">
              {saving ? "saving..." : "save changes"}
            </button>
            {saved && <span className="text-xs text-green-400">saved!</span>}
            {saveError && <span className="text-xs text-red-400">{saveError}</span>}
          </div>

          <div className="mt-4">
            <a href="/athletes" className="text-xs text-brand-grey hover:text-brand-gold">view athletes page →</a>
          </div>
        </>
      )}
    </div>
  );
}

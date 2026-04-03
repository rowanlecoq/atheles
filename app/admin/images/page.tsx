"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const IMAGE_SLOTS = [
  { key: "hero_bg", label: "homepage background", description: "the large background image behind the hero section" },
  { key: "hero_left", label: "homepage left panel", description: "left statue/image on desktop hero (hidden on mobile)" },
  { key: "hero_right", label: "homepage right panel", description: "right statue/image on desktop hero (hidden on mobile)" },
  { key: "store_header", label: "store page header", description: "background image for collection/store page headers" },
  { key: "newsletter", label: "newsletter section", description: "background behind 'join the club' section" },
  { key: "brand_story", label: "brand story image", description: "image in the brand story section on homepage" },
  { key: "interstitial", label: "quote section", description: "background behind the rotating quotes section" },
];

export default function AdminImagesPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [images, setImages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => {
        if (d?.user?.isAdmin) {
          setAuthorized(true);
          fetch("/api/admin/images")
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => { if (d?.images) setImages(d.images); })
            .catch(() => {})
            .finally(() => setLoading(false));
        } else {
          router.replace("/");
        }
      })
      .catch(() => router.replace("/"));
  }, [router]);

  const uploadImage = async (key: string, file: File) => {
    const isVideo = file.type.startsWith("video/");
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(`file too large (max ${isVideo ? "50" : "10"}mb)`);
      return;
    }
    setUploading(key);
    try {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await fetch("/api/admin/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, file: dataUrl }),
      });
      const d = await res.json();
      if (d.url) {
        setImages((prev) => ({ ...prev, [key]: d.url }));
        setSaved(key);
        setTimeout(() => setSaved(null), 2000);
      }
    } catch {}
    setUploading(null);
  };

  const resetImage = async (key: string) => {
    try {
      const res = await fetch("/api/admin/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, file: null }),
      });
      const d = await res.json();
      if (d.url) {
        setImages((prev) => ({ ...prev, [key]: d.url }));
        setSaved(key);
        setTimeout(() => setSaved(null), 2000);
      }
    } catch {}
  };

  if (!authorized) {
    return <div className="flex min-h-[60vh] items-center justify-center"><p className="text-sm text-brand-grey">checking access...</p></div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-6">
        <a href="/admin" className="text-xs text-brand-grey hover:text-brand-gold">← back to dashboard</a>
        <h1 className="mt-2 font-heading text-2xl text-brand-gold">site images</h1>
        <p className="mt-1 text-sm text-brand-grey">replace placeholder images across the website. changes take effect on next page load.</p>
      </div>

      {loading ? (
        <p className="text-sm text-brand-grey">loading...</p>
      ) : (
        <div className="space-y-4">
          {IMAGE_SLOTS.map((slot) => {
            const current = images[slot.key] || "";
            const isVideo = current.endsWith(".mp4") || current.endsWith(".webm");
            return (
              <div key={slot.key} className="rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-4">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{slot.label}</p>
                    <p className="text-xs text-brand-grey">{slot.description}</p>
                  </div>
                  {saved === slot.key && <span className="text-xs text-green-400">saved!</span>}
                </div>
                <div className="flex items-center gap-3">
                  {/* Preview */}
                  <div className="relative h-16 w-24 flex-none overflow-hidden rounded bg-brand-medium-grey/10">
                    {isVideo ? (
                      <div className="flex h-full w-full items-center justify-center text-lg text-brand-grey">▶</div>
                    ) : current ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={current} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[8px] text-brand-grey">no image</div>
                    )}
                  </div>
                  {/* Actions */}
                  <div className="flex flex-col gap-1">
                    <label className={`cursor-pointer text-xs text-brand-gold hover:text-brand-pale-gold ${uploading === slot.key ? "opacity-50" : ""}`}>
                      {uploading === slot.key ? "uploading..." : "upload new"}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,video/mp4,video/webm"
                        disabled={uploading === slot.key}
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(slot.key, f); e.target.value = ""; }}
                        className="hidden"
                      />
                    </label>
                    <button type="button" onClick={() => resetImage(slot.key)} className="text-left text-xs text-brand-grey hover:text-red-400">
                      reset to default
                    </button>
                  </div>
                </div>
                {/* Paste URL for large files / external videos */}
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="or paste a video/image url and press enter..."
                    className="w-full rounded border border-brand-dark-gold/20 bg-transparent px-3 py-1.5 text-xs text-white placeholder:text-brand-grey/40 focus:border-brand-gold focus:outline-none"
                    onKeyDown={async (e) => {
                      if (e.key === "Enter") {
                        const val = (e.target as HTMLInputElement).value.trim();
                        if (!val) return;
                        setUploading(slot.key);
                        try {
                          const res = await fetch("/api/admin/images", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ key: slot.key, file: val }),
                          });
                          const d = await res.json();
                          if (d.url) {
                            setImages((prev) => ({ ...prev, [slot.key]: d.url }));
                            setSaved(slot.key);
                            setTimeout(() => setSaved(null), 2000);
                            (e.target as HTMLInputElement).value = "";
                          }
                        } catch {}
                        setUploading(null);
                      }
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

type SlotData = {
  media: string[];
  transition: "crossfade" | "slide" | "fade";
  interval: number;
  grayscale: boolean;
  opacity: number;
};

const IMAGE_SLOTS = [
  { key: "hero_bg", label: "homepage background", description: "the large background image behind the hero section" },
  { key: "hero_left", label: "homepage left panel", description: "left statue/image on desktop hero (hidden on mobile)" },
  { key: "hero_right", label: "homepage right panel", description: "right statue/image on desktop hero (hidden on mobile)" },
  { key: "store_header", label: "store page header", description: "background image for collection/store page headers" },
  { key: "newsletter", label: "newsletter section", description: "background behind 'join the club' section" },
  { key: "brand_story", label: "brand story image", description: "image in the brand story section on homepage" },
  { key: "interstitial", label: "quote section", description: "background behind the rotating quotes section" },
];

const TRANSITIONS = [
  { value: "crossfade", label: "crossfade" },
  { value: "slide", label: "slide" },
  { value: "fade", label: "fade" },
] as const;

const INTERVALS = [
  { value: 3000, label: "3s" },
  { value: 4000, label: "4s" },
  { value: 5000, label: "5s" },
  { value: 6000, label: "6s" },
  { value: 8000, label: "8s" },
  { value: 10000, label: "10s" },
  { value: 15000, label: "15s" },
];

function isVideoUrl(url: string) {
  return url.endsWith(".mp4") || url.endsWith(".webm");
}

function isYouTubeUrl(url: string) {
  return url.includes("youtube.com") || url.includes("youtu.be");
}

function getYouTubeThumb(url: string) {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]+)/);
  return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null;
}

function MediaThumb({ src, className = "" }: { src: string; className?: string }) {
  const ytThumb = getYouTubeThumb(src);
  if (ytThumb) {
    return (
      <div className={`relative ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ytThumb} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center bg-black/40"><span className="text-lg text-white">▶</span></div>
      </div>
    );
  }
  if (isVideoUrl(src)) {
    return (
      <div className={`flex items-center justify-center bg-brand-medium-grey/20 text-brand-grey ${className}`}>
        <span className="text-lg">▶</span>
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" className={`object-cover ${className}`} />;
}

/* ── Slideshow preview (A/B layer crossfade) ── */
function SlideshowPreview({ slot }: { slot: SlotData }) {
  const [activeLayer, setActiveLayer] = useState<0 | 1>(0);
  const [layers, setLayers] = useState<[string, string]>([
    slot.media[0] || "",
    slot.media[0] || "",
  ]);
  const idxRef = useRef(0);

  useEffect(() => {
    if (slot.media.length <= 1) return;
    const timer = setInterval(() => {
      idxRef.current = (idxRef.current + 1) % slot.media.length;
      const nextSrc = slot.media[idxRef.current] || "";
      setActiveLayer((al) => {
        const newActive: 0 | 1 = al === 0 ? 1 : 0;
        setLayers((ls) => {
          const copy: [string, string] = [...ls];
          copy[newActive] = nextSrc;
          return copy;
        });
        return newActive;
      });
    }, Math.max(slot.interval, 2000));
    return () => clearInterval(timer);
  }, [slot.media.length, slot.interval, slot.media]);

  if (!layers[0]) {
    return <div className="flex h-full w-full items-center justify-center text-xs text-brand-grey">no media</div>;
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-brand-dark">
      {[0, 1].map((i) => (
        <div
          key={i}
          className="absolute inset-0"
          style={{
            opacity: activeLayer === i ? slot.opacity / 100 : 0,
            zIndex: activeLayer === i ? 1 : 0,
            filter: slot.grayscale ? "grayscale(1)" : "none",
            transition: "opacity 1.5s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <MediaThumb src={layers[i as 0 | 1]!} className="h-full w-full" />
        </div>
      ))}
      {/* Slide count badge */}
      {slot.media.length > 1 && (
        <div className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-0.5 text-[10px] text-white backdrop-blur-sm">
          {idxRef.current + 1}/{slot.media.length}
        </div>
      )}
    </div>
  );
}

/* ── Slot editor ── */
function SlotEditor({
  slotKey,
  slotDef,
  data,
  onUpdate,
}: {
  slotKey: string;
  slotDef: (typeof IMAGE_SLOTS)[number];
  data: SlotData;
  onUpdate: (key: string, data: SlotData) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const flash = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const uploadFile = async (file: File) => {
    const isVideo = file.type.startsWith("video/");
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) { alert(`file too large (max ${isVideo ? "50" : "10"}mb)`); return; }
    setUploading(true);
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
        body: JSON.stringify({ key: slotKey, file: dataUrl }),
      });
      const d = await res.json();
      if (d.slotData) { onUpdate(slotKey, d.slotData); flash(); }
    } catch {}
    setUploading(false);
  };

  const addUrl = async (url: string) => {
    if (!url) return;
    setUploading(true);
    try {
      const res = await fetch("/api/admin/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: slotKey, file: url }),
      });
      const d = await res.json();
      if (d.slotData) { onUpdate(slotKey, d.slotData); flash(); }
    } catch {}
    setUploading(false);
  };

  const removeMedia = (idx: number) => {
    const next = { ...data, media: data.media.filter((_, i) => i !== idx) };
    onUpdate(slotKey, next);
    saveSlot(next);
  };

  const moveMedia = (from: number, to: number) => {
    if (to < 0 || to >= data.media.length) return;
    const arr = [...data.media];
    const [item] = arr.splice(from, 1);
    arr.splice(to, 0, item!);
    const next = { ...data, media: arr };
    onUpdate(slotKey, next);
    saveSlot(next);
  };

  const updateTransition = (transition: SlotData["transition"]) => {
    const next = { ...data, transition };
    onUpdate(slotKey, next);
    saveSlot(next);
  };

  const updateInterval = (interval: number) => {
    const next = { ...data, interval };
    onUpdate(slotKey, next);
    saveSlot(next);
  };

  const toggleGrayscale = () => {
    const next = { ...data, grayscale: !data.grayscale };
    onUpdate(slotKey, next);
    saveSlot(next);
  };

  const updateOpacity = (opacity: number) => {
    const next = { ...data, opacity };
    onUpdate(slotKey, next);
    // Debounce save — only save on mouseup via onChangeCommitted
  };

  const commitOpacity = () => {
    saveSlot(data);
  };

  const resetSlot = async () => {
    try {
      const res = await fetch("/api/admin/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: slotKey, file: null }),
      });
      const d = await res.json();
      if (d.url) {
        onUpdate(slotKey, { media: [d.url], transition: "crossfade", interval: 6000, grayscale: true, opacity: 50 });
        flash();
      }
    } catch {}
  };

  const saveSlot = async (slotData: SlotData) => {
    try {
      await fetch("/api/admin/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot: slotKey, slotData }),
      });
      flash();
    } catch {}
  };

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx !== null && dragIdx !== idx) {
      moveMedia(dragIdx, idx);
      setDragIdx(idx);
    }
  };
  const handleDragEnd = () => setDragIdx(null);

  return (
    <div className="rounded-lg border border-brand-dark-gold/20 bg-brand-dark">
      {/* Header row — always visible */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-4"
      >
        <div className="flex items-center gap-3">
          {/* Mini preview */}
          <div className="h-10 w-16 flex-shrink-0 overflow-hidden rounded bg-brand-medium-grey/10">
            {data.media[0] ? <MediaThumb src={data.media[0]} className={`h-full w-full ${data.grayscale ? "grayscale" : ""}`} /> : null}
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-white">{slotDef.label}</p>
            <p className="text-xs text-brand-grey">
              {data.media.length} {data.media.length === 1 ? "item" : "items"}
              {` · ${data.opacity}%`}
              {!data.grayscale && " · color"}
              {data.media.length > 1 && ` · ${data.transition} · ${data.interval / 1000}s`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saved && <span className="text-xs text-green-400">saved!</span>}
          <span className={`text-brand-grey transition-transform ${expanded ? "rotate-180" : ""}`}>▾</span>
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-brand-dark-gold/10 p-4 pt-3">
          {/* Live slideshow preview */}
          <div className="mb-4 aspect-video w-full overflow-hidden rounded-lg bg-brand-medium-grey/10">
            <SlideshowPreview slot={data} />
          </div>

          {/* Media grid — drag to reorder */}
          <div className="mb-3">
            <p className="mb-2 text-xs font-medium text-brand-grey">media ({data.media.length})</p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {data.media.map((src, i) => (
                <div
                  key={`${src}-${i}`}
                  draggable
                  onDragStart={() => handleDragStart(i)}
                  onDragOver={(e) => handleDragOver(e, i)}
                  onDragEnd={handleDragEnd}
                  className={`group relative aspect-video cursor-grab overflow-hidden rounded border transition-all ${
                    dragIdx === i ? "border-brand-gold opacity-60" : "border-brand-dark-gold/20"
                  }`}
                >
                  <MediaThumb src={src} className="h-full w-full" />
                  {/* Order badge */}
                  <div className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[9px] text-white">{i + 1}</div>
                  {/* Actions overlay */}
                  <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/0 opacity-0 transition-all group-hover:bg-black/50 group-hover:opacity-100">
                    {i > 0 && (
                      <button type="button" onClick={() => moveMedia(i, i - 1)} className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] text-white hover:bg-white/40">←</button>
                    )}
                    <button type="button" onClick={() => removeMedia(i)} className="rounded bg-red-500/70 px-1.5 py-0.5 text-[10px] text-white hover:bg-red-500">✕</button>
                    {i < data.media.length - 1 && (
                      <button type="button" onClick={() => moveMedia(i, i + 1)} className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] text-white hover:bg-white/40">→</button>
                    )}
                  </div>
                </div>
              ))}

              {/* Add button */}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex aspect-video items-center justify-center rounded border border-dashed border-brand-dark-gold/30 text-brand-grey transition-colors hover:border-brand-gold hover:text-brand-gold"
              >
                {uploading ? (
                  <span className="text-xs">...</span>
                ) : (
                  <span className="text-xl leading-none">+</span>
                )}
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,video/mp4,video/webm"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = ""; }}
            />
          </div>

          {/* URL input */}
          <input
            type="text"
            placeholder="paste a video/image/youtube url and press enter..."
            className="mb-3 w-full rounded border border-brand-dark-gold/20 bg-transparent px-3 py-1.5 text-xs text-white placeholder:text-brand-grey/40 focus:border-brand-gold focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const val = (e.target as HTMLInputElement).value.trim();
                if (val) { addUrl(val); (e.target as HTMLInputElement).value = ""; }
              }
            }}
          />

          {/* Settings */}
          <div className="space-y-2.5 rounded-lg border border-brand-dark-gold/15 bg-brand-dark-gold/5 px-3 py-2.5">
            {/* Top row: color toggle + opacity slider */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Color mode toggle */}
              <button
                type="button"
                onClick={toggleGrayscale}
                className="flex items-center gap-2.5 rounded-md border border-brand-dark-gold/20 bg-brand-dark px-3 py-1.5 text-xs transition-colors hover:border-brand-gold/40"
              >
                <div className={`relative h-[18px] w-9 rounded-full transition-colors ${data.grayscale ? "bg-brand-medium-grey/50" : "bg-brand-gold"}`}>
                  <div className={`absolute top-[3px] h-3 w-3 rounded-full bg-white shadow transition-all ${data.grayscale ? "left-[3px]" : "left-[21px]"}`} />
                </div>
                <span className={`font-medium ${data.grayscale ? "text-brand-grey" : "text-brand-gold"}`}>
                  {data.grayscale ? "black & white" : "full color"}
                </span>
              </button>

              <div className="h-5 w-px bg-brand-dark-gold/20" />

              {/* Opacity slider */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-brand-grey">opacity</label>
                <input
                  type="range"
                  min={5}
                  max={100}
                  step={5}
                  value={data.opacity}
                  onChange={(e) => updateOpacity(Number(e.target.value))}
                  onMouseUp={commitOpacity}
                  onTouchEnd={commitOpacity}
                  className="h-1.5 w-20 cursor-pointer appearance-none rounded-full bg-brand-medium-grey/30 accent-brand-gold sm:w-28"
                />
                <span className="min-w-[2ch] text-xs text-brand-grey">{data.opacity}%</span>
              </div>
            </div>

            {/* Slideshow settings — only show when >1 media */}
            {data.media.length > 1 && (
              <div className="flex flex-wrap items-center gap-3 border-t border-brand-dark-gold/10 pt-2.5">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-brand-grey">transition</label>
                  <select
                    value={data.transition}
                    onChange={(e) => updateTransition(e.target.value as SlotData["transition"])}
                    className="rounded border border-brand-dark-gold/20 bg-brand-dark px-2 py-1 text-xs text-white focus:border-brand-gold focus:outline-none"
                  >
                    {TRANSITIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-brand-grey">interval</label>
                  <select
                    value={data.interval}
                    onChange={(e) => updateInterval(Number(e.target.value))}
                    className="rounded border border-brand-dark-gold/20 bg-brand-dark px-2 py-1 text-xs text-white focus:border-brand-gold focus:outline-none"
                  >
                    {INTERVALS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Reset */}
          <div className="mt-3 flex justify-end">
            <button type="button" onClick={resetSlot} className="text-xs text-brand-grey hover:text-red-400">
              reset to default
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminImagesPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [slots, setSlots] = useState<Record<string, SlotData>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => {
        if (d?.user?.isAdmin) {
          setAuthorized(true);
          fetch("/api/admin/images")
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => { if (d?.images) setSlots(d.images); })
            .catch(() => {})
            .finally(() => setLoading(false));
        } else {
          router.replace("/");
        }
      })
      .catch(() => router.replace("/"));
  }, [router]);

  const handleUpdate = useCallback((key: string, data: SlotData) => {
    setSlots((prev) => ({ ...prev, [key]: data }));
  }, []);

  if (!authorized) {
    return <div className="flex min-h-[60vh] items-center justify-center"><p className="text-sm text-brand-grey">checking access...</p></div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-6">
        <a href="/admin" className="text-xs text-brand-grey hover:text-brand-gold">← back to dashboard</a>
        <h1 className="mt-2 font-heading text-2xl text-brand-gold">site images</h1>
        <p className="mt-1 text-sm text-brand-grey">
          add multiple images or videos per slot to create automatic slideshows with transitions.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-brand-grey">loading...</p>
      ) : (
        <div className="space-y-3">
          {IMAGE_SLOTS.map((slot) => (
            <SlotEditor
              key={slot.key}
              slotKey={slot.key}
              slotDef={slot}
              data={slots[slot.key] || { media: [], transition: "crossfade", interval: 6000, grayscale: true, opacity: 50 }}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

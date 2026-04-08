"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

type SlotData = {
  media: string[];
  transition: "crossfade" | "slide" | "fade";
  interval: number;
  grayscale: boolean;
  opacity: number;
  focusX: number; // 0–100 (object-position x%)
  focusY: number; // 0–100 (object-position y%)
};

const IMAGE_SLOTS = [
  { key: "hero_bg", label: "homepage background", description: "the large background image behind the hero section", aspect: "aspect-[21/9]", overlay: "bg-gradient-to-b from-brand-dark/76 via-brand-dark/70 to-brand-dark/90" },
  { key: "hero_left", label: "homepage left panel", description: "left statue/image on desktop hero (hidden on mobile)", aspect: "aspect-[3/5]", overlay: "bg-gradient-to-t from-brand-dark/60 via-transparent to-brand-dark/30" },
  { key: "hero_right", label: "homepage right panel", description: "right statue/image on desktop hero (hidden on mobile)", aspect: "aspect-[3/5]", overlay: "bg-gradient-to-t from-brand-dark/60 via-transparent to-brand-dark/30" },
  { key: "store_header", label: "store page header", description: "background image for collection/store page headers", aspect: "aspect-[21/6]", overlay: "bg-gradient-to-b from-brand-dark/30 via-brand-dark/60 to-brand-dark" },
  { key: "newsletter", label: "newsletter section", description: "background behind 'join the club' section", aspect: "aspect-[21/7]", overlay: "bg-gradient-to-b from-brand-dark/60 via-transparent to-brand-dark/60" },
  { key: "brand_story", label: "brand story image", description: "image in the brand story section on homepage", aspect: "aspect-video", overlay: "bg-brand-dark/30" },
  { key: "interstitial", label: "quote section", description: "background behind the rotating quotes section", aspect: "aspect-[21/5]", overlay: "" },
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

function getYouTubeThumb(url: string) {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]+)/);
  return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null;
}

function MediaThumb({ src, className = "", style }: { src: string; className?: string; style?: React.CSSProperties }) {
  const ytThumb = getYouTubeThumb(src);
  if (ytThumb) {
    return (
      <div className={`relative ${className}`} style={style}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ytThumb} alt="" className="h-full w-full object-cover" style={style} />
        <div className="absolute inset-0 flex items-center justify-center bg-black/40"><span className="text-lg text-white">▶</span></div>
      </div>
    );
  }
  if (isVideoUrl(src)) {
    return (
      <div className={`flex items-center justify-center bg-brand-medium-grey/20 text-brand-grey ${className}`} style={style}>
        <span className="text-lg">▶</span>
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" className={`object-cover ${className}`} style={style} />;
}

const DEFAULT_SLOT: SlotData = { media: [], transition: "crossfade", interval: 6000, grayscale: true, opacity: 50, focusX: 50, focusY: 50 };

const DEFAULT_IMAGES: Record<string, string> = {
  hero_bg: "/statues/greek-god-hero.png",
  hero_left: "/statues/augustus-primaporta.jpg",
  hero_right: "/statues/trajan-louvre.jpg",
  store_header: "/statues/greek-god-hero.png",
  newsletter: "/statues/roman-emperor-pergamon.jpg",
  brand_story: "/statues/roman-emperor-pergamon.jpg",
  interstitial: "/statues/hadrian-cuirassed.jpg",
};

/* ── Realistic site preview (shows how it'll look on the actual site) ── */
function SitePreview({ slot, slotDef }: { slot: SlotData; slotDef: (typeof IMAGE_SLOTS)[number] }) {
  const fallbackSrc = DEFAULT_IMAGES[slotDef.key] || "";
  const firstSrc = slot.media[0] || fallbackSrc;

  const [activeLayer, setActiveLayer] = useState<0 | 1>(0);
  const [layers, setLayers] = useState<[string, string]>([firstSrc, firstSrc]);
  const idxRef = useRef(0);

  useEffect(() => {
    if (slot.media.length <= 1) return;
    const timer = setInterval(() => {
      idxRef.current = (idxRef.current + 1) % slot.media.length;
      const nextSrc = slot.media[idxRef.current] || "";
      setActiveLayer((al) => {
        const newActive: 0 | 1 = al === 0 ? 1 : 0;
        setLayers((ls) => { const c: [string, string] = [...ls]; c[newActive] = nextSrc; return c; });
        return newActive;
      });
    }, Math.max(slot.interval, 2000));
    return () => clearInterval(timer);
  }, [slot.media.length, slot.interval, slot.media]);

  if (!firstSrc) {
    return <div className={`flex w-full items-center justify-center bg-brand-dark text-xs text-brand-grey ${slotDef.aspect}`}>no media</div>;
  }

  const objPos = `${slot.focusX}% ${slot.focusY}%`;

  return (
    <div className={`relative w-full overflow-hidden bg-brand-dark ${slotDef.aspect}`}>
      {/* Image layers */}
      {[0, 1].map((i) => (
        <div
          key={i}
          className="absolute inset-0"
          style={{
            opacity: activeLayer === i ? slot.opacity / 100 : 0,
            filter: slot.grayscale ? "grayscale(1)" : "none",
            zIndex: activeLayer === i ? 1 : 0,
            transition: "opacity 1.5s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={layers[i as 0 | 1]!} alt="" className="h-full w-full object-cover" style={{ objectPosition: objPos }} />
        </div>
      ))}
      {/* Site overlay (gradients matching the real site) */}
      {slotDef.overlay && <div className={`absolute inset-0 z-[2] ${slotDef.overlay}`} />}
      {/* Label */}
      <div className="absolute bottom-2 left-2 z-[3] rounded bg-black/50 px-2 py-0.5 text-[10px] text-white/70 backdrop-blur-sm">
        {slot.media.length === 0 ? "default image" : "site preview"}
        {slot.media.length > 1 && ` · ${idxRef.current + 1}/${slot.media.length}`}
      </div>
    </div>
  );
}

/* ── Focal point picker — click on image to set focus ── */
function FocalPointPicker({ slot, onChange }: { slot: SlotData; onChange: (x: number, y: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const src = slot.media[0];
  if (!src || isVideoUrl(src)) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    onChange(Math.max(0, Math.min(100, x)), Math.max(0, Math.min(100, y)));
  };

  return (
    <div className="mb-3">
      <p className="mb-1.5 text-xs font-medium text-brand-grey">focal point <span className="font-normal text-brand-grey/60">(click to set — controls how the image is cropped)</span></p>
      <div ref={ref} onClick={handleClick} className="relative cursor-crosshair overflow-hidden rounded-lg border border-brand-dark-gold/20" style={{ maxHeight: 220 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="w-full object-contain" />
        {/* Crosshair at focal point */}
        <div
          className="pointer-events-none absolute z-10"
          style={{ left: `${slot.focusX}%`, top: `${slot.focusY}%`, transform: "translate(-50%, -50%)" }}
        >
          <div className="h-6 w-6 rounded-full border-2 border-brand-gold bg-brand-gold/20 shadow-lg" />
          <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-brand-gold/50" style={{ height: 40, top: -7 }} />
          <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-brand-gold/50" style={{ width: 40, left: -7 }} />
        </div>
        {/* Dim area outside focus */}
        <div className="pointer-events-none absolute inset-0 bg-black/20" />
      </div>
      <p className="mt-1 text-[10px] text-brand-grey/50">position: {slot.focusX}% x, {slot.focusY}% y</p>
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
  const [uploadError, setUploadError] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  // Ref tracks latest opacity so commitOpacity doesn't capture a stale closure
  const pendingOpacity = useRef(data.opacity);
  // Sync when external reset changes data.opacity (but not during a drag)
  useEffect(() => { pendingOpacity.current = data.opacity; }, [data.opacity]);

  const flash = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  // Compress images client-side to stay well under Vercel's 4.5MB body limit.
  // Max 1200px + JPEG 0.82 keeps output under ~500KB for typical photos.
  const compressImage = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const MAX = 1200;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
          else { width = Math.round(width * MAX / height); height = MAX; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("image format not supported by browser — please convert to JPEG or PNG first")); };
      img.src = url;
    });

  const uploadFile = async (file: File) => {
    const isVideo = file.type.startsWith("video/");
    if (isVideo && file.size > 50 * 1024 * 1024) { alert("video too large (max 50mb)"); return; }
    // HEIC/HEIF (common iPhone format) can't be decoded by browser canvas
    if (file.type === "image/heic" || file.type === "image/heif" || file.name.toLowerCase().endsWith(".heic") || file.name.toLowerCase().endsWith(".heif")) {
      setUploadError("HEIC photos from iPhone are not supported — share the photo to convert it to JPEG first, or paste an image URL below");
      return;
    }
    setUploading(true);
    setUploadError("");
    try {
      let dataUrl: string;
      if (isVideo) {
        const reader = new FileReader();
        dataUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      } else {
        dataUrl = await compressImage(file);
      }
      const res = await fetch("/api/admin/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: slotKey, file: dataUrl }),
      });
      // Server may return 413 "Request Entity Too Large" as plain text, not JSON
      let d: Record<string, unknown> = {};
      try { d = await res.json(); } catch {
        setUploadError(res.status === 413 ? "image still too large after compression — try a smaller image or paste a URL instead" : "server error — try pasting an image URL instead");
        setUploading(false);
        return;
      }
      if (d.slotData) { onUpdate(slotKey, d.slotData as SlotData); flash(); }
      else {
        const msg = String(d.error || "upload failed");
        setUploadError(msg.includes("blob storage")
          ? "file uploads require Vercel Blob — add BLOB_READ_WRITE_TOKEN in Vercel settings, or paste an image URL below"
          : msg);
      }
    } catch (err) { setUploadError(err instanceof Error ? err.message : "upload failed — try pasting an image URL instead"); }
    setUploading(false);
  };

  const addUrl = async (url: string) => {
    if (!url) return;
    setUploading(true);
    setUploadError("");
    try {
      const res = await fetch("/api/admin/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: slotKey, file: url }),
      });
      const d = await res.json();
      if (d.slotData) { onUpdate(slotKey, d.slotData); flash(); }
      else setUploadError(d.error || "failed to add url");
    } catch { setUploadError("failed to add url"); }
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

  const updateTransition = (t: SlotData["transition"]) => { const n = { ...data, transition: t }; onUpdate(slotKey, n); saveSlot(n); };
  const updateInterval = (v: number) => { const n = { ...data, interval: v }; onUpdate(slotKey, n); saveSlot(n); };
  const toggleGrayscale = () => { const n = { ...data, grayscale: !data.grayscale }; onUpdate(slotKey, n); saveSlot(n); };
  const updateOpacity = (opacity: number) => { pendingOpacity.current = opacity; onUpdate(slotKey, { ...data, opacity }); };
  const commitOpacity = () => { saveSlot({ ...data, opacity: pendingOpacity.current }); };

  const updateFocus = (focusX: number, focusY: number) => {
    const next = { ...data, focusX, focusY };
    onUpdate(slotKey, next);
    saveSlot(next);
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
        onUpdate(slotKey, { ...DEFAULT_SLOT, media: [d.url] });
        flash();
      }
    } catch {}
  };

  const saveSlot = async (slotData: SlotData) => {
    try {
      const res = await fetch("/api/admin/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot: slotKey, slotData }),
      });
      const d = await res.json();
      if (d.success) flash();
      else setUploadError(d.error || "save failed");
    } catch { setUploadError("save failed"); }
  };

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx !== null && dragIdx !== idx) { moveMedia(dragIdx, idx); setDragIdx(idx); }
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
          <div className="h-10 w-16 flex-shrink-0 overflow-hidden rounded bg-brand-medium-grey/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.media[0] || DEFAULT_IMAGES[slotKey] || ""}
              alt=""
              className="h-full w-full object-cover"
              style={{
                objectPosition: `${data.focusX}% ${data.focusY}%`,
                filter: data.grayscale ? "grayscale(1)" : "none",
                opacity: data.media[0] ? data.opacity / 100 : 0.3,
              }}
            />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-white">{slotDef.label}</p>
            <p className="text-xs text-brand-grey">
              {data.media.length} {data.media.length === 1 ? "item" : "items"}
              {` · ${data.opacity}%`}
              {!data.grayscale && " · color"}
              {(data.focusX !== 50 || data.focusY !== 50) && ` · focus ${data.focusX}/${data.focusY}`}
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
          {/* Realistic site preview — shows exactly how it looks on the page */}
          <div className="mb-4 overflow-hidden rounded-lg border border-brand-dark-gold/10">
            <SitePreview slot={data} slotDef={slotDef} />
          </div>

          {/* Focal point picker */}
          <FocalPointPicker slot={data} onChange={updateFocus} />

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
                  <MediaThumb src={src} className="h-full w-full" style={{ objectPosition: `${data.focusX}% ${data.focusY}%` }} />
                  <div className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[9px] text-white">{i + 1}</div>
                  <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/0 opacity-0 transition-all group-hover:bg-black/50 group-hover:opacity-100">
                    {i > 0 && <button type="button" onClick={() => moveMedia(i, i - 1)} className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] text-white hover:bg-white/40">←</button>}
                    <button type="button" onClick={() => removeMedia(i)} className="rounded bg-red-500/70 px-1.5 py-0.5 text-[10px] text-white hover:bg-red-500">✕</button>
                    {i < data.media.length - 1 && <button type="button" onClick={() => moveMedia(i, i + 1)} className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] text-white hover:bg-white/40">→</button>}
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex aspect-video items-center justify-center rounded border border-dashed border-brand-dark-gold/30 text-brand-grey transition-colors hover:border-brand-gold hover:text-brand-gold"
              >
                {uploading ? <span className="text-xs">...</span> : <span className="text-xl leading-none">+</span>}
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,video/mp4,video/webm" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = ""; }} />
          </div>
          {uploadError && <p className="mb-2 text-xs text-red-400">{uploadError}</p>}

          {/* URL input */}
          <input
            type="text"
            placeholder="paste a video/image/youtube url and press enter..."
            className="mb-3 w-full rounded border border-brand-dark-gold/20 bg-transparent px-3 py-1.5 text-xs text-white placeholder:text-brand-grey/40 focus:border-brand-gold focus:outline-none"
            onKeyDown={(e) => { if (e.key === "Enter") { const val = (e.target as HTMLInputElement).value.trim(); if (val) { addUrl(val); (e.target as HTMLInputElement).value = ""; } } }}
          />

          {/* Settings */}
          <div className="space-y-2.5 rounded-lg border border-brand-dark-gold/15 bg-brand-dark-gold/5 px-3 py-2.5">
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={toggleGrayscale} className="flex items-center gap-2.5 rounded-md border border-brand-dark-gold/20 bg-brand-dark px-3 py-1.5 text-xs transition-colors hover:border-brand-gold/40">
                <div className={`relative h-[18px] w-9 rounded-full transition-colors ${data.grayscale ? "bg-brand-medium-grey/50" : "bg-brand-gold"}`}>
                  <div className={`absolute top-[3px] h-3 w-3 rounded-full bg-white shadow transition-all ${data.grayscale ? "left-[3px]" : "left-[21px]"}`} />
                </div>
                <span className={`font-medium ${data.grayscale ? "text-brand-grey" : "text-brand-gold"}`}>
                  {data.grayscale ? "black & white" : "full color"}
                </span>
              </button>
              <div className="h-5 w-px bg-brand-dark-gold/20" />
              <div className="flex items-center gap-2">
                <label className="text-xs text-brand-grey">opacity</label>
                <input type="range" min={5} max={100} step={5} value={data.opacity} onChange={(e) => updateOpacity(Number(e.target.value))} onMouseUp={commitOpacity} onTouchEnd={commitOpacity} className="h-1.5 w-20 cursor-pointer appearance-none rounded-full bg-brand-medium-grey/30 accent-brand-gold sm:w-28" />
                <span className="min-w-[2ch] text-xs text-brand-grey">{data.opacity}%</span>
              </div>
            </div>
            {data.media.length > 1 && (
              <div className="flex flex-wrap items-center gap-3 border-t border-brand-dark-gold/10 pt-2.5">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-brand-grey">transition</label>
                  <select value={data.transition} onChange={(e) => updateTransition(e.target.value as SlotData["transition"])} className="rounded border border-brand-dark-gold/20 bg-brand-dark px-2 py-1 text-xs text-white focus:border-brand-gold focus:outline-none">
                    {TRANSITIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-brand-grey">interval</label>
                  <select value={data.interval} onChange={(e) => updateInterval(Number(e.target.value))} className="rounded border border-brand-dark-gold/20 bg-brand-dark px-2 py-1 text-xs text-white focus:border-brand-gold focus:outline-none">
                    {INTERVALS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 flex justify-end">
            <button type="button" onClick={resetSlot} className="text-xs text-brand-grey hover:text-red-400">reset to default</button>
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
        } else { router.replace("/"); }
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
          manage images with slideshows, focal point positioning, and display settings.
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
              data={slots[slot.key] || DEFAULT_SLOT}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

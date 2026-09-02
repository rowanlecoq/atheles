"use client";

import { upload } from "@vercel/blob/client";
import { useEffect, useState, useCallback, useRef } from "react";
import { ChevronDownIcon, XMarkIcon, PlusIcon, ArrowUpIcon, ArrowDownIcon } from "@heroicons/react/24/outline";
import ImageCropModal from "components/image-crop-modal";

type SlotData = {
  media: string[];
  transition: "crossfade" | "slide" | "fade";
  interval: number;
  grayscale: boolean;
  opacity: number;
  focusX: number;
  focusY: number;
};

const IMAGE_SLOTS = [
  { key: "hero_bg", label: "homepage background", description: "large background image behind the hero section", aspect: "aspect-[21/9]", overlay: "bg-gradient-to-b from-brand-dark/76 via-brand-dark/70 to-brand-dark/90" },
  { key: "hero_left", label: "homepage left panel", description: "left statue/image on desktop hero", aspect: "aspect-[3/5]", overlay: "bg-gradient-to-t from-brand-dark/60 via-transparent to-brand-dark/30" },
  { key: "hero_right", label: "homepage right panel", description: "right statue/image on desktop hero", aspect: "aspect-[3/5]", overlay: "bg-gradient-to-t from-brand-dark/60 via-transparent to-brand-dark/30" },
  { key: "store_header", label: "store page header", description: "background for collection/store page headers", aspect: "aspect-[21/6]", overlay: "bg-gradient-to-b from-brand-dark/30 via-brand-dark/60 to-brand-dark" },
  { key: "newsletter", label: "newsletter section", description: "background behind 'join the club' section", aspect: "aspect-[21/7]", overlay: "bg-gradient-to-b from-brand-dark/60 via-transparent to-brand-dark/60" },
  { key: "brand_story", label: "brand story image", description: "image in the brand story section on homepage", aspect: "aspect-video", overlay: "bg-brand-dark/30" },
  { key: "interstitial", label: "quote section", description: "background behind the rotating quotes", aspect: "aspect-[21/5]", overlay: "" },
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

function isVideoUrl(url: string) {
  return url.endsWith(".mp4") || url.endsWith(".webm");
}

function getYouTubeThumb(url: string) {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)(\w-]+)/);
  return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null;
}

function MediaThumb({ src, style, className = "" }: { src: string; style?: React.CSSProperties; className?: string }) {
  const ytThumb = getYouTubeThumb(src);
  if (ytThumb) {
    return (
      <div className={`relative ${className}`} style={style}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ytThumb} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <span className="text-2xl text-white">▶</span>
        </div>
      </div>
    );
  }
  if (isVideoUrl(src)) {
    return (
      <div className={`flex items-center justify-center bg-brand-medium-grey/20 text-brand-grey ${className}`} style={style}>
        <span className="text-2xl">▶</span>
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" className={`object-cover ${className}`} style={style} />;
}

/* ── Live site preview ── */
function SitePreview({ slot, slotDef }: { slot: SlotData; slotDef: (typeof IMAGE_SLOTS)[number] }) {
  const fallbackSrc = DEFAULT_IMAGES[slotDef.key] || "";
  const effectiveMedia = slot.media.length > 0 ? slot.media : (fallbackSrc ? [fallbackSrc] : []);
  const isUsingDefault = slot.media.length === 0;

  const [activeLayer, setActiveLayer] = useState<0 | 1>(0);
  const [layers, setLayers] = useState<[string, string]>([effectiveMedia[0] || "", effectiveMedia[0] || ""]);
  const idxRef = useRef(0);

  useEffect(() => {
    if (effectiveMedia.length <= 1) return;
    const timer = setInterval(() => {
      idxRef.current = (idxRef.current + 1) % effectiveMedia.length;
      const nextSrc = effectiveMedia[idxRef.current] || "";
      setActiveLayer((al) => {
        const newActive: 0 | 1 = al === 0 ? 1 : 0;
        setLayers((ls) => { const c: [string, string] = [...ls]; c[newActive] = nextSrc; return c; });
        return newActive;
      });
    }, Math.max(slot.interval, 2000));
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveMedia.length, slot.interval]);

  if (!effectiveMedia[0]) {
    return (
      <div className={`flex w-full items-center justify-center bg-[#111] text-xs text-brand-grey/50 ${slotDef.aspect}`}>
        no media set
      </div>
    );
  }

  const objPos = `${slot.focusX}% ${slot.focusY}%`;

  return (
    <div className={`relative w-full overflow-hidden bg-brand-dark ${slotDef.aspect}`}>
      {[0, 1].map((i) => (
        <div
          key={i}
          className="absolute inset-0"
          style={{
            opacity: activeLayer === i ? (isUsingDefault ? 0.25 : slot.opacity / 100) : 0,
            filter: slot.grayscale ? "grayscale(1)" : "none",
            zIndex: activeLayer === i ? 1 : 0,
            transition: "opacity 1.2s cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={layers[i as 0 | 1]!} alt="" className="h-full w-full object-cover" style={{ objectPosition: objPos }} />
        </div>
      ))}
      {slotDef.overlay && <div className={`absolute inset-0 z-[2] ${slotDef.overlay}`} />}
      <div className="absolute bottom-2 left-2 z-[3] rounded-full bg-black/60 px-2.5 py-1 text-[10px] text-white/70 backdrop-blur-sm">
        {isUsingDefault ? "default image" : "site preview"}
        {!isUsingDefault && slot.media.length > 1 && ` · ${idxRef.current + 1}/${slot.media.length}`}
      </div>
    </div>
  );
}

/* ── Touch-friendly focal point picker ── */
function FocalPointPicker({ slot, onChange, slotKey }: { slot: SlotData; onChange: (x: number, y: number) => void; slotKey: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const src = slot.media[0];
  if (!src || isVideoUrl(src) || getYouTubeThumb(src)) return null;

  const getPos = (clientX: number, clientY: number) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return null;
    const x = Math.round(Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)));
    const y = Math.round(Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100)));
    return { x, y };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const pos = getPos(e.clientX, e.clientY);
    if (pos) onChange(pos.x, pos.y);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (e.buttons === 0 && e.pressure === 0) return;
    const pos = getPos(e.clientX, e.clientY);
    if (pos) onChange(pos.x, pos.y);
  };

  return (
    <div className="mb-4">
      <p className="mb-2 text-xs font-medium text-brand-grey">
        focal point
        <span className="ml-1 font-normal text-brand-grey/50">— drag to set where the image focuses</span>
      </p>
      <div
        ref={ref}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        className="relative cursor-crosshair overflow-hidden rounded-xl border border-brand-dark-gold/20 bg-brand-dark"
        style={{ touchAction: "none", minHeight: 120, maxHeight: 240 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="block w-full" style={{ maxHeight: 240, objectFit: "contain" }} />
        <div
          className="pointer-events-none absolute z-10"
          style={{ left: `${slot.focusX}%`, top: `${slot.focusY}%`, transform: "translate(-50%,-50%)" }}
        >
          <div className="h-7 w-7 rounded-full border-2 border-brand-gold bg-brand-gold/20 shadow-lg shadow-black/40" />
          <div className="absolute left-1/2 top-1/2 h-8 w-px -translate-x-1/2 -translate-y-4 bg-brand-gold/60" />
          <div className="absolute left-1/2 top-1/2 h-px w-8 -translate-x-4 -translate-y-1/2 bg-brand-gold/60" />
        </div>
      </div>
      <p className="mt-1.5 text-[10px] text-brand-grey/40">{slot.focusX}% x · {slot.focusY}% y</p>
    </div>
  );
}

/* ── Per-slot editor ── */
function SlotEditor({
  slotKey, slotDef, data, onUpdate,
}: {
  slotKey: string;
  slotDef: (typeof IMAGE_SLOTS)[number];
  data: SlotData;
  onUpdate: (key: string, data: SlotData) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const opacityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestData = useRef(data);
  latestData.current = data;

  const flash = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const doUpload = async (file: File) => {
    setUploading(true);
    setUploadError("");
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/admin/images/upload",
        addRandomSuffix: true,
      });
      const res = await fetch("/api/admin/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: slotKey, file: blob.url }),
      });
      let d: Record<string, unknown> = {};
      try { d = await res.json(); } catch {}
      if (d.slotData) { onUpdate(slotKey, d.slotData as SlotData); flash(); }
      else setUploadError(String(d.error || "uploaded but failed to save — try again"));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setUploadError(msg);
    }
    setUploading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.name.toLowerCase().match(/\.heic?$/)) {
      setUploadError("HEIC photos aren't supported — open the photo in your camera roll, tap Share → Save Image, then try again.");
      return;
    }
    if (file.type.startsWith("video/")) {
      if (file.size > 50 * 1024 * 1024) { setUploadError("video too large (max 50MB)"); return; }
      doUpload(file);
      return;
    }
    const url = URL.createObjectURL(file);
    setPendingFile(file);
    setCropSrc(url);
  };

  const handleCropSave = async (croppedDataUrl: string) => {
    setCropSrc(null);
    const res = await fetch(croppedDataUrl);
    const blob = await res.blob();
    const filename = pendingFile?.name?.replace(/\.[^.]+$/, ".jpg") || "image.jpg";
    const file = new File([blob], filename, { type: "image/jpeg" });
    setPendingFile(null);
    doUpload(file);
  };

  const handleCropCancel = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    setPendingFile(null);
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
      if (d.slotData) { onUpdate(slotKey, d.slotData as SlotData); flash(); }
      else setUploadError(d.error || "failed to add url");
    } catch { setUploadError("failed to add url"); }
    setUploading(false);
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

  const toggleGrayscale = () => {
    const n = { ...data, grayscale: !data.grayscale };
    onUpdate(slotKey, n);
    saveSlot(n);
  };

  const updateOpacity = (opacity: number) => {
    const n = { ...latestData.current, opacity };
    latestData.current = n;
    onUpdate(slotKey, n);
    if (opacityTimer.current) clearTimeout(opacityTimer.current);
    opacityTimer.current = setTimeout(() => saveSlot(latestData.current), 500);
  };

  const updateTransition = (t: SlotData["transition"]) => {
    const n = { ...data, transition: t }; onUpdate(slotKey, n); saveSlot(n);
  };

  const updateInterval = (v: number) => {
    const n = { ...data, interval: v }; onUpdate(slotKey, n); saveSlot(n);
  };

  const updateFocus = (focusX: number, focusY: number) => {
    const next = { ...data, focusX, focusY };
    onUpdate(slotKey, next);
    saveSlot(next);
  };

  const resetSlot = async () => {
    setConfirmReset(false);
    try {
      const res = await fetch("/api/admin/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: slotKey, file: null }),
      });
      const d = await res.json();
      if (d.url) {
        onUpdate(slotKey, { ...DEFAULT_SLOT, media: [] });
        flash();
      }
    } catch {}
  };

  const hasMedia = data.media.length > 0;
  const thumbSrc = hasMedia ? data.media[0] : null;

  return (
    <>
      {cropSrc && (
        <ImageCropModal
          imageSrc={cropSrc}
          onSave={handleCropSave}
          onCancel={handleCropCancel}
        />
      )}

      <div className="overflow-hidden rounded-2xl border border-brand-dark-gold/20 bg-[#111]">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center gap-4 p-4 text-left active:bg-white/5"
        >
          <div className="relative h-12 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-[#1a1a1a]">
            {thumbSrc ? (
              <MediaThumb
                src={thumbSrc}
                className="h-full w-full"
                style={{
                  objectPosition: `${data.focusX}% ${data.focusY}%`,
                  filter: data.grayscale ? "grayscale(1)" : "none",
                  opacity: data.opacity / 100,
                }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <PlusIcon className="h-4 w-4 text-brand-grey/30" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{slotDef.label}</p>
            <p className="mt-0.5 text-xs text-brand-grey/70">
              {hasMedia
                ? `${data.media.length} ${data.media.length === 1 ? "item" : "items"} · ${data.opacity}%${!data.grayscale ? " · color" : ""}`
                : "no image set"}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {saved && <span className="text-xs text-green-400">saved</span>}
            <ChevronDownIcon className={`h-5 w-5 text-brand-grey/50 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
          </div>
        </button>

        {expanded && (
          <div className="border-t border-brand-dark-gold/15 px-4 pb-6 pt-4 space-y-5">

            <div className="overflow-hidden rounded-xl border border-brand-dark-gold/10">
              <SitePreview slot={data} slotDef={slotDef} />
            </div>

            <FocalPointPicker slot={data} onChange={updateFocus} slotKey={slotKey} />

            <div>
              <p className="mb-3 text-xs font-medium text-brand-grey/70">
                photos & videos {hasMedia ? `(${data.media.length})` : ""}
              </p>

              <div className="space-y-2">
                {data.media.map((src, i) => (
                  <div key={`${src}-${i}`} className="flex items-center gap-3 rounded-xl border border-brand-dark-gold/15 bg-[#1a1a1a] p-2">
                    <div className="h-14 w-20 flex-shrink-0 overflow-hidden rounded-lg">
                      <MediaThumb src={src} className="h-full w-full" style={{ objectPosition: `${data.focusX}% ${data.focusY}%` }} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] text-brand-grey/50">
                        {src.startsWith("blob:") ? "uploading…" : src.split("/").pop() || src}
                      </p>
                      <p className="mt-0.5 text-[10px] text-brand-grey/30">item {i + 1}</p>
                    </div>

                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => moveMedia(i, i - 1)}
                        disabled={i === 0}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-grey/50 transition-colors active:bg-white/10 disabled:opacity-20"
                        aria-label="move up"
                      >
                        <ArrowUpIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveMedia(i, i + 1)}
                        disabled={i === data.media.length - 1}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-grey/50 transition-colors active:bg-white/10 disabled:opacity-20"
                        aria-label="move down"
                      >
                        <ArrowDownIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMedia(i)}
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-brand-grey/40 transition-colors active:bg-red-500/20 active:text-red-400"
                      aria-label="remove"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-brand-dark-gold/30 py-3.5 text-sm text-brand-grey/60 transition-colors active:border-brand-gold active:text-brand-gold"
              >
                {uploading
                  ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-gold border-t-transparent" /><span>uploading…</span></>
                  : <><PlusIcon className="h-4 w-4" /><span>add photo or video</span></>
                }
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm"
                className="hidden"
                onChange={handleFileChange}
              />
              {uploadError && (
                <p className="mt-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{uploadError}</p>
              )}
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-brand-grey/70">or paste a url</p>
              <input
                type="url"
                inputMode="url"
                placeholder="image or youtube url…"
                className="w-full rounded-xl border border-brand-dark-gold/20 bg-[#1a1a1a] px-4 py-3 text-sm text-white placeholder:text-brand-grey/30 focus:border-brand-gold/60 focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const val = (e.target as HTMLInputElement).value.trim();
                    if (val) { addUrl(val); (e.target as HTMLInputElement).value = ""; }
                  }
                }}
              />
            </div>

            <div className="rounded-xl border border-brand-dark-gold/15 bg-[#151515] p-4 space-y-4">
              <button
                type="button"
                onClick={toggleGrayscale}
                className="flex w-full items-center justify-between"
              >
                <span className="text-sm text-white">black & white</span>
                <div className={`relative h-6 w-11 rounded-full transition-colors ${data.grayscale ? "bg-white/20" : "bg-brand-gold"}`}>
                  <div className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${data.grayscale ? "left-1" : "left-6"}`} />
                </div>
              </button>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white">opacity</span>
                  <span className="text-sm text-brand-grey">{data.opacity}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={100}
                  step={5}
                  value={data.opacity}
                  onChange={(e) => updateOpacity(Number(e.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-brand-gold [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-gold"
                />
              </div>

              {data.media.length > 1 && (
                <div className="space-y-3 border-t border-brand-dark-gold/10 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white">transition</span>
                    <select
                      value={data.transition}
                      onChange={(e) => updateTransition(e.target.value as SlotData["transition"])}
                      className="rounded-lg border border-brand-dark-gold/20 bg-[#1a1a1a] px-3 py-1.5 text-sm text-white focus:border-brand-gold focus:outline-none"
                    >
                      {TRANSITIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white">interval</span>
                    <select
                      value={data.interval}
                      onChange={(e) => updateInterval(Number(e.target.value))}
                      className="rounded-lg border border-brand-dark-gold/20 bg-[#1a1a1a] px-3 py-1.5 text-sm text-white focus:border-brand-gold focus:outline-none"
                    >
                      {INTERVALS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-1">
              {!confirmReset ? (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="w-full rounded-xl border border-red-500/20 py-3 text-sm text-red-400/70 transition-colors active:bg-red-500/10"
                >
                  reset to default image
                </button>
              ) : (
                <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
                  <p className="mb-3 text-center text-sm text-red-300">remove your custom image and restore the default?</p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setConfirmReset(false)}
                      className="flex-1 rounded-lg border border-brand-dark-gold/20 py-2.5 text-sm text-brand-grey"
                    >
                      cancel
                    </button>
                    <button
                      type="button"
                      onClick={resetSlot}
                      className="flex-1 rounded-lg bg-red-500 py-2.5 text-sm font-medium text-white"
                    >
                      reset
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </>
  );
}

export default function AdminImagesPage() {
  const [slots, setSlots] = useState<Record<string, SlotData>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/images")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.images) {
          const cleaned: Record<string, SlotData> = {};
          for (const [key, slot] of Object.entries(d.images as Record<string, SlotData>)) {
            const defaultSrc = DEFAULT_IMAGES[key];
            const realMedia = slot.media.filter((url) => !defaultSrc || url !== defaultSrc);
            cleaned[key] = { ...slot, media: realMedia };
          }
          setSlots(cleaned);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleUpdate = useCallback((key: string, data: SlotData) => {
    setSlots((prev) => ({ ...prev, [key]: data }));
  }, []);

  return (
    <div className="mx-auto max-w-xl px-4 pb-16 pt-10">
      <div className="mb-8">
        <a href="/admin" className="text-xs text-brand-grey active:text-brand-gold">← back</a>
        <h1 className="mt-4 font-heading text-3xl text-brand-gold">site images</h1>
        <p className="mt-1.5 text-sm text-brand-grey/70">
          manage photos, slideshows, focal points, and display settings.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
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

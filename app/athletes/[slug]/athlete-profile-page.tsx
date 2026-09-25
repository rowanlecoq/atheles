"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import Link from "next/link";
import { FadeIn } from "components/animations";
import { type AthleteData } from "lib/athletes";

type Social = { platform: string; url: string };

function socialUrl(s: Social): string {
  if (s.platform === "email" || (s.url.includes("@") && !s.url.startsWith("http"))) return `mailto:${s.url}`;
  if (s.platform === "snapchat" && !s.url.startsWith("http")) return `https://www.snapchat.com/add/${s.url}`;
  if (s.url.startsWith("http")) return s.url;
  return `https://${s.url}`;
}

function SocialIcon({ platform }: { platform: string }) {
  const cls = "h-5 w-5";
  switch (platform.toLowerCase()) {
    case "tiktok":
      return <svg viewBox="0 0 24 24" fill="currentColor" className={cls}><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V9.12a8.16 8.16 0 0 0 4.83 1.55V7.22a4.85 4.85 0 0 1-1.06-.53z" /></svg>;
    case "instagram":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={cls}><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="5" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>;
    case "youtube":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={cls}><rect x="2" y="4" width="20" height="16" rx="4" /><polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none" /></svg>;
    case "linkedin":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={cls}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg>;
    case "snapchat":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={cls}><path d="M12 2C8 2 5.5 4.5 5.5 8v2.5c0 .5-.5 1-1.5 1.2-.5.1-1 .5-1 1s.5.9 1 1c1 .2 1.5.5 1.5 1 0 .3-.2.6-.5.9-.8.8-1 1.3-1 1.8 0 .8.8 1.2 1.5 1.4 1 .3 1.5.5 1.5 1.2 0 1 2 2 5 2s5-1 5-2c0-.7.5-.9 1.5-1.2.7-.2 1.5-.6 1.5-1.4 0-.5-.2-1-1-1.8-.3-.3-.5-.6-.5-.9 0-.5.5-.8 1.5-1 .5-.1 1-.5 1-1s-.5-.9-1-1c-1-.2-1.5-.7-1.5-1.2V8c0-3.5-2.5-6-6.5-6z" /></svg>;
    case "email":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={cls}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 4L12 13 2 4" /></svg>;
    case "twitter":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={cls}><path d="M4 4l11.7 16h4.3L8.3 4H4z" /><path d="M4 20l6.8-8" /><path d="M20 4l-6.8 8" /></svg>;
    default:
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={cls}><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg>;
  }
}

function getYoutubeThumbnail(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]+)/);
  return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null;
}

function isMediaUrl(url: string) {
  return url.includes("youtube.com") || url.includes("youtu.be") || url.includes("instagram.com") || url.includes("tiktok.com") || url.endsWith(".mp4") || url.endsWith(".webm");
}

function getEmbedUrl(url: string): { type: "youtube" | "instagram" | "tiktok" | "video" | "image"; embedUrl: string } {
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]+)/);
  if (ytMatch) return { type: "youtube", embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}` };
  const igMatch = url.match(/instagram\.com\/(?:p|reel)\/([\w-]+)/);
  if (igMatch) return { type: "instagram", embedUrl: `https://www.instagram.com/p/${igMatch[1]}/embed` };
  const ttMatch = url.match(/tiktok\.com\/@[\w.]+\/video\/(\d+)/);
  if (ttMatch) return { type: "tiktok", embedUrl: `https://www.tiktok.com/embed/v2/${ttMatch[1]}` };
  if (url.endsWith(".mp4") || url.endsWith(".webm")) return { type: "video", embedUrl: url };
  return { type: "image", embedUrl: url };
}

type AthleteWithSocials = Omit<AthleteData, "socials"> & { socials: Social[] };

export default function AthleteProfilePage({ athlete }: { athlete: AthleteWithSocials }) {
  const allImages = [athlete.image, ...(athlete.images || [])].filter(Boolean) as string[];
  const [imageIndex, setImageIndex] = useState(0);
  const [lightbox, setLightbox] = useState<{ items: string[]; index: number } | null>(null);
  const [embedLoading, setEmbedLoading] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const scrollRef = useRef<HTMLDivElement>(null);
  const isProgScrollRef = useRef(false);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToIndex = useCallback((idx: number) => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const child = el.children[idx] as HTMLElement;
    if (child) {
      isProgScrollRef.current = true;
      el.scrollTo({ left: child.offsetLeft, behavior: "smooth" });
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = setTimeout(() => { isProgScrollRef.current = false; }, 400);
    }
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let debounce: ReturnType<typeof setTimeout> | null = null;
    const onScroll = () => {
      if (isProgScrollRef.current) return;
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => {
        if (!scrollRef.current || isProgScrollRef.current) return;
        const scrollEl = scrollRef.current;
        const childWidth = (scrollEl.children[0] as HTMLElement)?.offsetWidth || 1;
        const newIdx = Math.round(scrollEl.scrollLeft / childWidth);
        if (newIdx >= 0 && newIdx < allImages.length) setImageIndex(newIdx);
      }, 60);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => { el.removeEventListener("scroll", onScroll); if (debounce) clearTimeout(debounce); };
  }, [allImages.length]);

  useEffect(() => {
    if (!lightbox) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setLightbox(null); setEmbedLoading(false); setZoom(false); }
      if (e.key === "ArrowLeft" && lightbox.items.length > 1) { setEmbedLoading(true); setZoom(false); setLightbox(l => l ? { ...l, index: (l.index - 1 + l.items.length) % l.items.length } : null); }
      if (e.key === "ArrowRight" && lightbox.items.length > 1) { setEmbedLoading(true); setZoom(false); setLightbox(l => l ? { ...l, index: (l.index + 1) % l.items.length } : null); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightbox]);

  useEffect(() => {
    if (!lightbox) return;
    document.documentElement.style.overflow = "hidden";
    return () => { document.documentElement.style.overflow = ""; };
  }, [lightbox]);

  useEffect(() => { setZoom(false); }, [lightbox?.index]);

  const openLightbox = (idx: number) => {
    if (allImages.length === 0) return;
    setEmbedLoading(isMediaUrl(allImages[idx] || ""));
    setLightbox({ items: allImages, index: idx });
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <FadeIn direction="up">
          <Link href="/athletes" className="mb-6 inline-flex items-center gap-1.5 text-xs text-brand-grey hover:text-brand-gold transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
            all athletes
          </Link>
        </FadeIn>

        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          {/* Left: images */}
          <FadeIn direction="up" delay={0.06}>
            <div>
              {/* Mobile swipe gallery */}
              <div
                ref={scrollRef}
                className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide rounded-xl lg:hidden"
                style={{ scrollbarWidth: "none" }}
              >
                {allImages.length > 0 ? allImages.map((item, idx) => (
                  <div
                    key={item}
                    className="relative aspect-[4/5] w-full flex-none snap-center cursor-pointer bg-brand-medium-grey/10 rounded-xl overflow-hidden"
                    onClick={() => openLightbox(idx)}
                  >
                    {getYoutubeThumbnail(item)
                      ? <div className="relative h-full w-full">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={getYoutubeThumbnail(item)!} alt={athlete.name} className="h-full w-full object-cover" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60"><span className="ml-1 text-xl text-white">▶</span></div>
                          </div>
                        </div>
                      : isMediaUrl(item)
                        ? <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-brand-medium-grey/20"><span className="ml-1 text-3xl text-brand-grey">▶</span></div>
                        // eslint-disable-next-line @next/next/no-img-element
                        : <img src={item} alt={athlete.name} className="h-full w-full object-cover" />
                    }
                  </div>
                )) : (
                  <div className="aspect-[4/5] w-full flex-none snap-center rounded-xl bg-brand-medium-grey/10 flex items-center justify-center flex-col gap-2">
                    <span className="text-3xl">🔱</span>
                    <span className="text-xs uppercase tracking-wider text-brand-dark-gold">photo coming soon</span>
                  </div>
                )}
              </div>

              {/* Desktop static image */}
              <div
                className="hidden relative aspect-[4/5] w-full cursor-pointer overflow-hidden rounded-xl bg-brand-medium-grey/10 lg:block"
                onClick={() => { if (allImages.length > 0) openLightbox(imageIndex); }}
              >
                {allImages[imageIndex]
                  ? getYoutubeThumbnail(allImages[imageIndex]!)
                    ? <div className="relative h-full w-full">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={getYoutubeThumbnail(allImages[imageIndex]!)!} alt={athlete.name} className="h-full w-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60"><span className="ml-1 text-xl text-white">▶</span></div>
                        </div>
                      </div>
                    : isMediaUrl(allImages[imageIndex]!)
                      ? <div className="flex h-full w-full items-center justify-center bg-brand-medium-grey/20"><span className="text-3xl text-brand-grey">▶</span></div>
                      // eslint-disable-next-line @next/next/no-img-element
                      : <img src={allImages[imageIndex]!} alt={athlete.name} className="h-full w-full object-cover" />
                  : <div className="flex h-full w-full flex-col items-center justify-center gap-2">
                      <span className="text-3xl">🔱</span>
                      <span className="text-xs uppercase tracking-wider text-brand-dark-gold">photo coming soon</span>
                    </div>
                }
              </div>

              {/* Thumbnail strip */}
              {allImages.length > 1 && (
                <div className="mt-2 flex gap-1.5 overflow-x-auto scrollbar-hide">
                  {allImages.map((item, idx) => {
                    const ytThumb = getYoutubeThumbnail(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => { setImageIndex(idx); scrollToIndex(idx); }}
                        aria-label={`View image ${idx + 1}`}
                        className={`group relative h-16 w-16 flex-none overflow-hidden rounded transition-[border-color] duration-200 ${
                          idx === imageIndex ? "border-2 border-brand-gold" : "border border-brand-dark-gold/20 hover:border-brand-gold/60"
                        }`}
                      >
                        {ytThumb
                          ? <div className="relative h-full w-full">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={ytThumb} alt="" className="h-full w-full object-cover" />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30"><span className="text-white">▶</span></div>
                            </div>
                          : isMediaUrl(item)
                            ? <div className="flex h-full w-full items-center justify-center bg-brand-medium-grey/20 text-brand-grey">▶</div>
                            // eslint-disable-next-line @next/next/no-img-element
                            : <img src={item} alt="" className="h-full w-full object-cover object-top transition duration-300 group-hover:scale-105" />
                        }
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </FadeIn>

          {/* Right: info */}
          <FadeIn direction="up" delay={0.12}>
            <div className="flex flex-col">
              <div className="mb-1 flex items-baseline gap-3">
                <h1 className="font-heading text-3xl text-brand-gold sm:text-4xl">{athlete.name}</h1>
                <span className="text-sm text-brand-grey">age {athlete.age}</span>
              </div>
              <p className="mb-5 text-xs uppercase tracking-wider text-brand-dark-gold">{athlete.role}</p>

              {athlete.description && (
                <p className="mb-6 text-sm leading-relaxed text-brand-grey">{athlete.description}</p>
              )}

              {athlete.socials.length > 0 && (
                <div className="mb-6 flex flex-wrap gap-1">
                  {athlete.socials.map((s) => (
                    <a
                      key={s.platform + s.url}
                      href={socialUrl(s)}
                      target={socialUrl(s).startsWith("mailto:") ? undefined : "_blank"}
                      rel="noopener noreferrer"
                      className="flex h-10 w-10 items-center justify-center rounded-lg text-brand-grey transition-colors hover:text-brand-gold"
                      aria-label={s.platform}
                      title={s.platform}
                    >
                      <SocialIcon platform={s.platform} />
                    </a>
                  ))}
                </div>
              )}

              {(athlete.hobbies || []).length > 0 && (
                <div>
                  <p className="mb-2.5 text-[10px] uppercase tracking-wider text-brand-grey">interests</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(athlete.hobbies || []).map((hobby) => (
                      <span key={hobby} className="rounded-full border border-brand-dark-gold/20 px-3 py-1 text-xs text-brand-grey">{hobby}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </FadeIn>
        </div>
      {/* Lightbox */}
      {lightbox && typeof document !== "undefined" && createPortal(
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50"
          onClick={() => { setLightbox(null); setEmbedLoading(false); setZoom(false); }}
        >
          <button type="button" onClick={() => { setLightbox(null); setEmbedLoading(false); setZoom(false); }} className="absolute right-4 top-4 z-10 text-white/70 hover:text-white transition-colors" aria-label="close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-8 w-8"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
          {lightbox.items.length > 1 && (
            <button type="button" onClick={(e) => { e.stopPropagation(); setEmbedLoading(true); setZoom(false); setLightbox({ ...lightbox, index: (lightbox.index - 1 + lightbox.items.length) % lightbox.items.length }); }} className="absolute left-3 top-1/2 z-10 flex h-16 w-11 -translate-y-1/2 items-center justify-center text-white/70 hover:text-white" aria-label="previous">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-6 w-6 sm:h-8 sm:w-8"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
          )}
          <motion.div key={lightbox.index} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }} onClick={(e) => e.stopPropagation()} className="relative flex items-center justify-center">
            {embedLoading && <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-black/80"><div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-gold/30 border-t-brand-gold" /></div>}
            {(() => {
              const item = lightbox.items[lightbox.index] || "";
              const embed = getEmbedUrl(item);
              if (embed.type === "youtube") return <iframe src={`${embed.embedUrl}?autoplay=1&mute=0&rel=0`} className="aspect-video w-[88vw] max-w-3xl rounded-lg" allowFullScreen allow="autoplay" onLoad={() => setEmbedLoading(false)} />;
              if (embed.type === "instagram" || embed.type === "tiktok") return <iframe src={embed.embedUrl} className="h-[80vh] w-[88vw] max-w-md rounded-lg" allowFullScreen onLoad={() => setEmbedLoading(false)} />;
              if (embed.type === "video") return <video src={embed.embedUrl} controls autoPlay className="max-h-[80vh] rounded-lg" onCanPlay={() => setEmbedLoading(false)} />;
              return (
                <div className={`relative inline-block overflow-hidden rounded-lg ${zoom ? "cursor-zoom-out" : "cursor-zoom-in"}`} onPointerDown={(e) => { if (e.pointerType === "touch") return; if (!zoom) { const r = e.currentTarget.getBoundingClientRect(); setZoomOrigin({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }); } setZoom(z => !z); }} onPointerMove={(e) => { if (e.pointerType === "touch" || !zoom) return; const r = e.currentTarget.getBoundingClientRect(); setZoomOrigin({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }); }} onPointerLeave={(e) => { if (e.pointerType !== "touch" && zoom) setZoom(false); }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item} alt="" className="block max-h-[80vh] max-w-[88vw] object-contain transition-transform duration-200" style={zoom ? { transform: "scale(2.5)", transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%` } : undefined} onLoad={() => setEmbedLoading(false)} />
                </div>
              );
            })()}
          </motion.div>
          {lightbox.items.length > 1 && (
            <button type="button" onClick={(e) => { e.stopPropagation(); setEmbedLoading(true); setZoom(false); setLightbox({ ...lightbox, index: (lightbox.index + 1) % lightbox.items.length }); }} className="absolute right-3 top-1/2 z-10 flex h-16 w-11 -translate-y-1/2 items-center justify-center text-white/70 hover:text-white" aria-label="next">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-6 w-6 sm:h-8 sm:w-8"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          )}
          {lightbox.items.length > 1 && (
            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white/60 backdrop-blur-sm">{lightbox.index + 1} / {lightbox.items.length}</p>
          )}
        </motion.div>,
        document.body,
      )}
    </div>
  );
}

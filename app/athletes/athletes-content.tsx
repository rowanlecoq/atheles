"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { useReducedMotion } from "lib/hooks/use-reduced-motion";
import { FadeIn } from "components/animations";

type Social = { platform: string; url: string };

type Athlete = {
  name: string;
  age: number;
  role: string;
  description?: string;
  image: string | null;
  images?: string[];
  socials: Social[] | Record<string, string>;
  hobbies: string[];
};

const defaultAthletes: Athlete[] = [
  {
    name: "rowan le coq",
    age: 18,
    role: "founder & athlete",
    description: "",
    image: null,
    socials: [
      { platform: "tiktok", url: "https://www.tiktok.com/@rowanlecoq" },
      { platform: "instagram", url: "https://www.instagram.com/rowanlecoq" },
      { platform: "linkedin", url: "https://www.linkedin.com/in/rowanlecoq" },
      { platform: "youtube", url: "https://www.youtube.com/@rowanlecoq" },
    ],
    hobbies: ["baking brownies or chocolate chip banana bread", "working out on the daily", "playing hockey"],
  },
];

const requirements = [
  "post consistently on socials.",
  "stay true to your aesthetic.",
  "focus on your journey.",
  "highlight what makes you unique.",
  "tag @atheles.co in your posts and hashtags like #atheles #athelesathlete to promote engagement.",
  "have an active platform.",
];

function normalizeSocials(socials: Social[] | Record<string, string>): Social[] {
  if (Array.isArray(socials)) return socials.filter((s) => s.url);
  return Object.entries(socials).filter(([, v]) => v).map(([k, v]) => ({ platform: k, url: v }));
}

function socialUrl(s: Social): string {
  if (s.platform === "email" || (s.url.includes("@") && !s.url.startsWith("http"))) return `mailto:${s.url}`;
  if (s.platform === "snapchat" && !s.url.startsWith("http")) return `https://www.snapchat.com/add/${s.url}`;
  if (s.url.startsWith("http")) return s.url;
  return `https://${s.url}`;
}

function SocialIcon({ platform }: { platform: string }) {
  const cls = "h-4 w-4";
  switch (platform.toLowerCase()) {
    case "tiktok":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={cls}><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" /></svg>;
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
    case "facebook":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={cls}><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" /></svg>;
    default:
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={cls}><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg>;
  }
}

function isMediaUrl(url: string) {
  return url.includes("youtube.com") || url.includes("youtu.be") || url.includes("instagram.com") || url.includes("tiktok.com") || url.endsWith(".mp4") || url.endsWith(".webm");
}

function getYoutubeThumbnail(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]+)/);
  return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null;
}

function getEmbedUrl(url: string): { type: "youtube" | "instagram" | "tiktok" | "video" | "image"; embedUrl: string } {
  // YouTube (watch, shorts, youtu.be)
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]+)/);
  if (ytMatch) return { type: "youtube", embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}` };

  // Instagram post/reel
  const igMatch = url.match(/instagram\.com\/(?:p|reel)\/([\w-]+)/);
  if (igMatch) return { type: "instagram", embedUrl: `https://www.instagram.com/p/${igMatch[1]}/embed` };

  // TikTok
  const ttMatch = url.match(/tiktok\.com\/@[\w.]+\/video\/(\d+)/);
  if (ttMatch) return { type: "tiktok", embedUrl: `https://www.tiktok.com/embed/v2/${ttMatch[1]}` };

  // Direct video
  if (url.endsWith(".mp4") || url.endsWith(".webm")) return { type: "video", embedUrl: url };

  return { type: "image", embedUrl: url };
}

function renderMediaItem(item: string, altText: string, imgClassName: string) {
  const ytThumb = getYoutubeThumbnail(item);
  const isMed = isMediaUrl(item);
  if (ytThumb) {
    return (
      <div className="relative h-full w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ytThumb} alt={altText} className={imgClassName} />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm">
            <span className="ml-1 text-xl text-white">▶</span>
          </div>
        </div>
      </div>
    );
  }
  if (isMed) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-brand-medium-grey/20">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60">
          <span className="ml-1 text-xl text-brand-grey">▶</span>
        </div>
        <span className="text-xs text-brand-grey">tap to view</span>
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={item} alt={altText} className={imgClassName} />;
}

function AthleteCard({
  athlete,
  index,
  onOpenLightbox,
  blurInitial,
  blurFinal,
}: {
  athlete: Athlete;
  index: number;
  onOpenLightbox: (items: string[], index: number) => void;
  blurInitial?: string;
  blurFinal?: string;
}) {
  const allImages = [athlete.image, ...(athlete.images || [])].filter(Boolean) as string[];
  const [imageIndex, setImageIndex] = useState(0);
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

  const goToImage = useCallback((idx: number) => {
    setImageIndex(idx);
    scrollToIndex(idx);
  }, [scrollToIndex]);

  // Track swipe index on mobile scroll
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
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (debounce) clearTimeout(debounce);
    };
  }, [allImages.length]);

  const placeholder = (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2">
      <span className="text-3xl">🔱</span>
      <span className="text-xs uppercase tracking-wider text-brand-dark-gold">photo coming soon</span>
    </div>
  );

  return (
    <motion.div
      className="overflow-hidden rounded-lg border border-brand-dark-gold/20 bg-brand-dark"
      initial={{ opacity: 0, y: 16, ...(blurInitial ? { filter: blurInitial } : {}) }}
      whileInView={{ opacity: 1, y: 0, ...(blurFinal ? { filter: blurFinal } : {}) }}
      viewport={{ once: true, margin: "0px" }}
      transition={{ duration: 0.28, delay: Math.min(index, 3) * 0.07, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Mobile: horizontal scroll snap gallery — swipe to navigate, tap to open lightbox */}
      <div
        ref={scrollRef}
        className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide lg:hidden"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {allImages.length > 0 ? allImages.map((item, idx) => (
          <div
            key={item}
            className="relative aspect-[4/5] w-full flex-none snap-center cursor-pointer bg-brand-medium-grey/10"
            onClick={() => onOpenLightbox(allImages, idx)}
          >
            {renderMediaItem(item, athlete.name, "h-full w-full object-cover")}
          </div>
        )) : (
          <div className="aspect-[4/5] w-full flex-none snap-center bg-brand-medium-grey/10">
            {placeholder}
          </div>
        )}
      </div>

      {/* Desktop: static main image — click opens lightbox */}
      <div
        className="relative hidden aspect-[4/5] w-full cursor-pointer bg-brand-medium-grey/10 lg:block"
        onClick={() => { if (allImages.length > 0) onOpenLightbox(allImages, imageIndex); }}
      >
        {allImages[imageIndex]
          ? renderMediaItem(allImages[imageIndex]!, athlete.name, "h-full w-full object-cover")
          : placeholder}
      </div>

      {/* Dot indicators */}
      {allImages.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-2">
          {allImages.map((item, idx) => (
            <button
              key={item}
              type="button"
              onClick={() => goToImage(idx)}
              aria-label={`View image ${idx + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === imageIndex
                  ? "w-6 bg-brand-gold"
                  : "w-2 bg-brand-dark-gold/40 hover:bg-brand-dark-gold/60"
              }`}
            />
          ))}
        </div>
      )}

      {/* Thumbnail strip */}
      {allImages.length > 1 && (
        <div className="mt-2 flex gap-1.5 overflow-x-auto px-2 pb-2 scrollbar-hide">
          {allImages.map((item, idx) => {
            const ytThumb = getYoutubeThumbnail(item);
            const isMed = isMediaUrl(item);
            return (
              <button
                key={item}
                type="button"
                onClick={() => goToImage(idx)}
                aria-label={`View image ${idx + 1}`}
                className={`relative h-16 w-16 flex-none overflow-hidden rounded transition-all duration-200 ${
                  idx === imageIndex ? "opacity-100 ring-1 ring-brand-gold" : "opacity-50 hover:opacity-80"
                }`}
              >
                {ytThumb ? (
                  <div className="relative h-full w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ytThumb} alt="" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <span className="text-white">▶</span>
                    </div>
                  </div>
                ) : isMed ? (
                  <div className="flex h-full w-full items-center justify-center bg-brand-medium-grey/20 text-brand-grey">▶</div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item} alt={`${athlete.name} ${idx + 1}`} className="h-full w-full object-cover" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Info */}
      <div className="p-5">
        <div className="mb-1 flex items-baseline justify-between">
          <h2 className="font-heading text-lg text-brand-gold">{athlete.name}</h2>
          <span className="text-xs text-brand-grey">age {athlete.age}</span>
        </div>
        <p className="mb-3 text-xs uppercase tracking-wider text-brand-dark-gold">{athlete.role}</p>

        {athlete.description && (
          <p className="mb-4 text-xs leading-relaxed text-brand-grey">{athlete.description}</p>
        )}

        {athlete.hobbies.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-[10px] uppercase tracking-wider text-brand-grey">interests</p>
            <div className="flex flex-wrap gap-1.5">
              {athlete.hobbies.map((hobby) => (
                <span key={hobby} className="rounded-full border border-brand-dark-gold/20 px-2.5 py-1 text-[11px] text-brand-grey">{hobby}</span>
              ))}
            </div>
          </div>
        )}

        {normalizeSocials(athlete.socials).length > 0 && (
          <div className="flex flex-wrap gap-3">
            {normalizeSocials(athlete.socials).map((s) => (
              <a
                key={s.platform + s.url}
                href={socialUrl(s)}
                target={socialUrl(s).startsWith("mailto:") ? undefined : "_blank"}
                rel="noopener noreferrer"
                className="text-brand-grey transition-colors hover:text-brand-gold"
                aria-label={s.platform}
                title={s.platform}
              >
                <SocialIcon platform={s.platform} />
              </a>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function AthletesContent() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [lightbox, setLightbox] = useState<{ items: string[]; index: number } | null>(null);
  const [embedLoading, setEmbedLoading] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const prefersReducedMotion = useReducedMotion();
  const blurInitial = prefersReducedMotion ? undefined : "blur(8px)";
  const blurFinal = prefersReducedMotion ? undefined : "blur(0px)";

  // Keyboard navigation
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

  // Reset zoom on slide change
  useEffect(() => { setZoom(false); }, [lightbox?.index]);

  useEffect(() => {
    fetch("/api/admin/athletes")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setAthletes(d?.athletes?.length > 0 ? d.athletes : defaultAthletes);
        setLoaded(true);
      })
      .catch(() => { setAthletes(defaultAthletes); setLoaded(true); });
  }, []);

  return (
    <div className="mx-auto min-h-[calc(100vh-200px)] max-w-4xl px-4 py-16 sm:px-6">
      {/* Structured data for search engines — invisible to users */}
      {athletes.map((athlete) => {
        const socials = normalizeSocials(athlete.socials);
        const jsonLd = {
          "@context": "https://schema.org",
          "@type": "Person",
          name: athlete.name,
          jobTitle: athlete.role,
          description: athlete.description || undefined,
          image: athlete.image || undefined,
          url: "https://atheles.co/athletes",
          affiliation: {
            "@type": "Organization",
            name: "Atheles",
            url: "https://atheles.co",
          },
          sameAs: socials
            .filter((s) => s.url.startsWith("http"))
            .map((s) => s.url),
        };
        return (
          <script
            key={athlete.name}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        );
      })}

      <FadeIn direction="up">
      <h1 className="mb-2 text-center font-heading text-3xl tracking-wider text-brand-gold sm:text-4xl">
        our athletes
      </h1>
      <p className="mb-10 text-center text-sm text-brand-grey">
        atheles athletes are on the way. stay tuned.
      </p>
      </FadeIn>

      {!loaded ? (
        <div className="mb-14 grid gap-6 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="overflow-hidden rounded-lg border border-brand-dark-gold/20 bg-brand-dark">
              <div className="aspect-[4/5] w-full bg-white/[0.04]" />
              <div className="p-5 space-y-3">
                <div className="h-4 w-32 rounded bg-white/[0.06]" />
                <div className="h-3 w-20 rounded bg-white/[0.04]" />
                <div className="h-3 w-full rounded bg-white/[0.04]" />
                <div className="h-3 w-3/4 rounded bg-white/[0.04]" />
              </div>
            </div>
          ))}
        </div>
      ) : (
      <>
      <div className="mb-14 grid gap-6 sm:grid-cols-2">
        {athletes.map((athlete, index) => (
          <AthleteCard
            key={athlete.name}
            athlete={athlete}
            index={index}
            onOpenLightbox={(items, idx) => {
              setEmbedLoading(isMediaUrl(items[idx] || ""));
              setLightbox({ items, index: idx });
            }}
            blurInitial={blurInitial}
            blurFinal={blurFinal}
          />
        ))}
      </div>
      </>
      )}

      <div className="mb-12 rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-6 sm:p-8">
        <h2 className="mb-1 font-heading text-xl text-brand-gold">want to become an atheles athlete?</h2>
        <p className="mb-6 text-sm text-brand-grey">
          we&apos;re building a team of driven individuals who represent the new era. here&apos;s what we look for:
        </p>
        <h3 className="mb-3 text-xs uppercase tracking-wider text-brand-pale-gold">requirements</h3>
        <ul className="space-y-2.5">
          {requirements.map((req) => (
            <li key={req} className="flex items-start gap-2.5 text-sm text-brand-grey">
              <span className="mt-0.5 text-xs text-brand-gold">🔱</span>
              {req}
            </li>
          ))}
        </ul>
      </div>

      {/* Lightbox modal — portaled to cover navbar */}
      {lightbox && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95"
          onClick={() => { setLightbox(null); setEmbedLoading(false); setZoom(false); }}
        >
          {/* Close button — matches pfp preview style */}
          <button
            type="button"
            onClick={() => { setLightbox(null); setEmbedLoading(false); setZoom(false); }}
            className="absolute right-4 top-4 z-10 text-white/70 transition-colors hover:text-white"
            aria-label="close"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-8 w-8"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>

          {/* Prev button — tall panel on left edge */}
          {lightbox.items.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setEmbedLoading(true); setZoom(false); setLightbox({ ...lightbox, index: (lightbox.index - 1 + lightbox.items.length) % lightbox.items.length }); }}
              className="absolute left-3 top-1/2 z-10 flex h-16 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white/80 backdrop-blur-sm transition-colors hover:bg-black/80 hover:text-white sm:h-24 sm:w-14"
              aria-label="previous"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-6 w-6 sm:h-8 sm:w-8"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
          )}

          {/* Content — swipe to navigate on mobile */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex items-center justify-center"
            onTouchStart={(e) => {
              // Ignore pinch (multi-touch) — only track single-finger swipes
              if (e.touches.length > 1) {
                delete (e.currentTarget as HTMLElement).dataset.touchX;
                return;
              }
              const touch = e.touches[0];
              if (touch) (e.currentTarget as HTMLElement).dataset.touchX = String(touch.clientX);
            }}
            onTouchEnd={(e) => {
              const stored = (e.currentTarget as HTMLElement).dataset.touchX;
              if (!stored) return; // cleared by multi-touch, skip
              const startX = Number(stored);
              const endX = e.changedTouches[0]?.clientX || 0;
              const diff = startX - endX;
              if (Math.abs(diff) > 50 && lightbox.items.length > 1) {
                if (diff > 0) { setEmbedLoading(true); setZoom(false); setLightbox({ ...lightbox, index: (lightbox.index + 1) % lightbox.items.length }); }
                else { setEmbedLoading(true); setZoom(false); setLightbox({ ...lightbox, index: (lightbox.index - 1 + lightbox.items.length) % lightbox.items.length }); }
              }
            }}
          >
            {/* Loading overlay while embed initialises */}
            {embedLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-black/80">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-gold/30 border-t-brand-gold" />
              </div>
            )}
            {(() => {
              const item = lightbox.items[lightbox.index] || "";
              const embed = getEmbedUrl(item);
              if (embed.type === "youtube") {
                return <iframe src={`${embed.embedUrl}?autoplay=1&mute=0&rel=0`} className="aspect-video w-[88vw] max-w-3xl rounded-lg" allowFullScreen allow="autoplay" onLoad={() => setEmbedLoading(false)} />;
              }
              if (embed.type === "instagram" || embed.type === "tiktok") {
                return <iframe src={embed.embedUrl} className="h-[80vh] w-[88vw] max-w-md rounded-lg" allowFullScreen onLoad={() => setEmbedLoading(false)} />;
              }
              if (embed.type === "video") {
                return <video src={embed.embedUrl} controls autoPlay className="max-h-[80vh] rounded-lg" onCanPlay={() => setEmbedLoading(false)} />;
              }
              // Image with zoom — matches product gallery (transform-scale with mouse tracking)
              return (
                <div
                  className={`relative inline-block overflow-hidden rounded-lg sm:${zoom ? "cursor-zoom-out" : "cursor-zoom-in"}`}
                  onPointerDown={(e) => {
                    if (e.pointerType === "touch") return; // touch devices: no zoom
                    if (!zoom) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setZoomOrigin({
                        x: ((e.clientX - rect.left) / rect.width) * 100,
                        y: ((e.clientY - rect.top) / rect.height) * 100,
                      });
                    }
                    setZoom(z => !z);
                  }}
                  onPointerMove={(e) => {
                    if (e.pointerType === "touch" || !zoom) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    setZoomOrigin({
                      x: ((e.clientX - rect.left) / rect.width) * 100,
                      y: ((e.clientY - rect.top) / rect.height) * 100,
                    });
                  }}
                  onPointerLeave={(e) => { if (e.pointerType !== "touch" && zoom) setZoom(false); }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item}
                    alt=""
                    className="block max-h-[80vh] max-w-[88vw] object-contain transition-transform duration-200"
                    style={zoom ? {
                      transform: "scale(2.5)",
                      transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
                    } : undefined}
                    onLoad={() => setEmbedLoading(false)}
                  />
                  {/* Zoom hint — desktop only (mobile uses native pinch-zoom) */}
                  {!zoom && (
                    <div className="pointer-events-none absolute bottom-3 right-3 hidden items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[11px] text-white/70 backdrop-blur-sm sm:flex">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /><path d="M11 8v6M8 11h6" /></svg>
                      click to zoom
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Next button — tall panel on right edge */}
          {lightbox.items.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setEmbedLoading(true); setZoom(false); setLightbox({ ...lightbox, index: (lightbox.index + 1) % lightbox.items.length }); }}
              className="absolute right-3 top-1/2 z-10 flex h-16 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white/80 backdrop-blur-sm transition-colors hover:bg-black/80 hover:text-white sm:h-24 sm:w-14"
              aria-label="next"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-6 w-6 sm:h-8 sm:w-8"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          )}

          {/* Counter */}
          {lightbox.items.length > 1 && (
            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white/60 backdrop-blur-sm">{lightbox.index + 1} / {lightbox.items.length}</p>
          )}
        </div>,
        document.body,
      )}
    </div>
  );
}

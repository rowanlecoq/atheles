"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { PublicReply, PublicSiteReview } from "lib/site-reviews";

// ---- Avatar ----

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function Avatar({ src, name }: { src?: string | null; name?: string | null }) {
  const [imgError, setImgError] = useState(false);
  const showInitials = !src || imgError;
  const hasRealName = name && name !== "atheles member" && name.trim().length > 0;

  if (!showInitials) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src!}
        alt=""
        aria-hidden="true"
        onError={() => setImgError(true)}
        className="h-9 w-9 shrink-0 rounded-full border border-brand-dark-gold/30 object-cover"
      />
    );
  }
  if (hasRealName) {
    return (
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-dark-gold/20 text-xs font-bold text-brand-gold"
        aria-hidden="true"
      >
        {getInitials(name)}
      </span>
    );
  }
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brand-dark-gold/30 bg-brand-dark text-sm"
      aria-hidden="true"
    >
      🔱
    </div>
  );
}

// ---- Stars ----

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          width={size}
          height={size}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
          className={n <= rating ? "text-brand-gold" : "text-white/15"}
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

// ---- StarInput ----

function StarInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <span className="inline-flex gap-1" role="group" aria-label="star rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n} star${n !== 1 ? "s" : ""}`}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110 focus:outline-none"
        >
          <svg
            width={28}
            height={28}
            viewBox="0 0 24 24"
            fill={n <= (hovered || value) ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
            className={n <= (hovered || value) ? "text-brand-gold" : "text-white/30"}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
        </button>
      ))}
    </span>
  );
}

// ---- ReviewForm ----

type Session = { firstName?: string; name?: string; isAdmin?: boolean; email?: string };

function ReviewForm({
  session,
  existingReview,
  onSuccess,
  onUpdate,
}: {
  session: Session | null;
  existingReview?: PublicSiteReview | null;
  onSuccess: (review: PublicSiteReview) => void;
  onUpdate?: (id: string, updated: Pick<PublicSiteReview, "rating" | "title" | "body">) => void;
}) {
  const isEditing = !!existingReview;
  const profileName = session?.firstName || session?.name || "";
  const [displayName, setDisplayName] = useState(existingReview?.authorName || profileName);
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [title, setTitle] = useState(existingReview?.title ?? "");
  const [body, setBody] = useState(existingReview?.body ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [savedMsg, setSavedMsg] = useState("");

  // Sync form when existingReview loads after fetch
  useEffect(() => {
    if (existingReview) {
      setDisplayName(existingReview.authorName);
      setRating(existingReview.rating);
      setTitle(existingReview.title);
      setBody(existingReview.body);
    }
  }, [existingReview?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) { setError("please select a rating."); return; }
    if (!title.trim()) { setError("please add a title."); return; }
    if (!body.trim()) { setError("please write your review."); return; }

    setSubmitting(true);
    setError("");
    try {
      if (isEditing && existingReview) {
        const res = await fetch("/api/site-reviews", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reviewId: existingReview.id, rating, title: title.trim(), body: body.trim() }),
        });
        const data = await res.json() as { review?: PublicSiteReview; error?: string };
        if (!res.ok) { setError(data.error || "failed to save."); return; }
        if (data.review && onUpdate) {
          onUpdate(existingReview.id, { rating: data.review.rating, title: data.review.title, body: data.review.body });
          setSavedMsg("saved!");
          setTimeout(() => setSavedMsg(""), 2000);
        }
      } else {
        const res = await fetch("/api/site-reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating, title: title.trim(), body: body.trim(), displayName: displayName.trim() || undefined }),
        });
        const data = await res.json() as { review?: PublicSiteReview; error?: string };
        if (!res.ok) { setError(data.error || "failed to submit."); return; }
        if (data.review) onSuccess(data.review);
      }
    } catch {
      setError("network error. please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
      {!isEditing && (
        <div>
          <label className="mb-1.5 block text-xs text-white/40">your name</label>
          <input
            type="text"
            maxLength={60}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="atheles member"
            className="w-full rounded-sm border border-white/10 bg-white/3 px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-brand-gold/40 focus:outline-none"
          />
        </div>
      )}
      <div>
        <label className="mb-1.5 block text-xs text-white/40">rating</label>
        <StarInput value={rating} onChange={setRating} />
      </div>
      <div>
        <label htmlFor="sr-title" className="mb-1.5 block text-xs text-white/40">title</label>
        <input
          id="sr-title"
          type="text"
          maxLength={100}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="sum it up in a few words"
          className="w-full rounded-sm border border-white/10 bg-white/3 px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-brand-gold/40 focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="sr-body" className="mb-1.5 block text-xs text-white/40">review</label>
        <textarea
          id="sr-body"
          rows={3}
          maxLength={1000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="tell the community about your experience with atheles"
          className="w-full resize-none rounded-sm border border-white/10 bg-white/3 px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-brand-gold/40 focus:outline-none"
        />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {savedMsg && <p className="text-sm text-brand-gold">{savedMsg}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="group relative flex w-full items-center justify-center overflow-hidden rounded-full bg-brand-gold p-4 font-heading text-sm uppercase text-brand-dark transition-all duration-300 disabled:opacity-60"
      >
        {!submitting && (
          <div
            className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            style={{ background: "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.15) 48%, rgba(255,255,255,0.22) 50%, rgba(255,255,255,0.15) 52%, transparent 70%)", animation: "cartShimmer 2s ease-in-out infinite" }}
          />
        )}
        <span className="relative z-10 tracking-wider transition-all duration-300 group-hover:tracking-[0.2em]">
          {submitting ? "saving…" : isEditing ? "update review" : "submit review"}
        </span>
      </button>
    </form>
  );
}

// ---- Context bottom sheet ----

function ContextBottomSheet({
  isOwn,
  isReview,
  text,
  loggedIn,
  onClose,
  onReport,
  onDelete,
  onEdit,
}: {
  isOwn: boolean;
  isReview: boolean;
  text: string;
  loggedIn: boolean;
  onClose: () => void;
  onReport: () => void;
  onDelete: () => void;
  onEdit?: () => void;
}) {
  const [vis, setVis] = useState(false);
  useEffect(() => { requestAnimationFrame(() => requestAnimationFrame(() => setVis(true))); }, []);

  function dismiss() { setVis(false); setTimeout(onClose, 250); }

  type Option = { label: string; icon: React.ReactNode; action: () => void; danger?: boolean };
  const groups: Option[][] = [];

  const mainGroup: Option[] = [];
  if (!isOwn && loggedIn) mainGroup.push({
    label: "report",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
      </svg>
    ),
    action: () => { onReport(); dismiss(); },
    danger: true,
  });
  mainGroup.push({
    label: "copy",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
      </svg>
    ),
    action: () => { navigator.clipboard?.writeText(text).catch(() => {}); dismiss(); },
  });
  mainGroup.push({
    label: "translate",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
      </svg>
    ),
    action: () => { window.open(`https://translate.google.com/?sl=auto&tl=en&text=${encodeURIComponent(text)}&op=translate`, "_blank"); dismiss(); },
  });
  groups.push(mainGroup);

  if (isOwn) {
    const ownGroup: Option[] = [];
    if (isReview && onEdit) ownGroup.push({
      label: "edit",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
        </svg>
      ),
      action: () => { onEdit(); dismiss(); },
    });
    ownGroup.push({
      label: "delete",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
        </svg>
      ),
      action: () => { onDelete(); dismiss(); },
      danger: true,
    });
    groups.push(ownGroup);
  }

  return createPortal(
    <>
      <div className="fixed inset-0 z-[80] bg-black/50" onClick={dismiss} />
      <div
        className={`fixed inset-x-0 bottom-0 z-[85] px-3 pb-8 transition-transform duration-[250ms] ease-out ${vis ? "translate-y-0" : "translate-y-full"}`}
        style={{ willChange: "transform" }}
      >
        {groups.map((group, gi) => (
          <div key={gi} className="mb-3 overflow-hidden rounded-2xl bg-[#2c2c2e]">
            {group.map((item, ii) => (
              <button
                key={item.label}
                onClick={item.action}
                className={`flex w-full items-center gap-4 px-5 py-[15px] text-left text-[15px] ${item.danger ? "text-red-400" : "text-white"} ${ii > 0 ? "border-t border-white/[0.08]" : ""} active:bg-white/10 transition-colors`}
              >
                <span className={item.danger ? "text-red-400/70" : "text-white/40"}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        ))}
        <div className="overflow-hidden rounded-2xl bg-[#2c2c2e]">
          <button
            onClick={dismiss}
            className="w-full px-5 py-[15px] text-center text-[15px] font-semibold text-white active:bg-white/10 transition-colors"
          >
            cancel
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
}

// ---- ReviewCard ----

function ThumbIcon({ dir, className }: { dir: "up" | "down"; className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className ?? "h-5 w-5"} aria-hidden="true">
      {dir === "up" ? (
        <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
      ) : (
        <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.105-1.79l-.05-.025A4 4 0 0011.055 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
      )}
    </svg>
  );
}

function ReviewCard({
  review,
  avatarSrc,
  isAdmin,
  isOwn,
  loggedIn,
  onModerate,
  onDelete,
  onEditRequest,
}: {
  review: PublicSiteReview;
  avatarSrc?: string | null;
  isAdmin: boolean;
  isOwn: boolean;
  loggedIn: boolean;
  onModerate: (id: string, hidden: boolean) => void;
  onDelete: (id: string) => void;
  onEditRequest?: (review: PublicSiteReview) => void;
}) {
  const [upCount, setUpCount] = useState(review.upCount);
  const [downCount, setDownCount] = useState(review.downCount);
  const [myReaction, setMyReaction] = useState<"up" | "down" | null>(review.myReaction);
  const [replies, setReplies] = useState<PublicReply[]>(review.replies);
  const [showReplies, setShowReplies] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [reactingTo, setReactingTo] = useState<"up" | "down" | null>(null);
  const [moderating, setModerating] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ isOwn: boolean; isReview: boolean; text: string; replyId?: string } | null>(null);
  const replyInputRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const d = new Date(review.createdAt);
  const date = `${d.getMonth() + 1}-${d.getDate()}`;

  async function handleReact(type: "up" | "down") {
    if (!loggedIn || reactingTo) return;
    const removing = myReaction === type;
    const switching = myReaction !== null && myReaction !== type;
    setUpCount((c) => {
      if (type === "up") return removing ? c - 1 : c + 1;
      return switching && myReaction === "up" ? c - 1 : c;
    });
    setDownCount((c) => {
      if (type === "down") return removing ? c - 1 : c + 1;
      return switching && myReaction === "down" ? c - 1 : c;
    });
    setMyReaction(removing ? null : type);
    setReactingTo(type);
    try {
      const res = await fetch("/api/site-reviews/react", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId: review.id, type }),
      });
      if (res.ok) {
        const data = await res.json() as { upCount: number; downCount: number; myReaction: "up" | "down" | null };
        setUpCount(data.upCount);
        setDownCount(data.downCount);
        setMyReaction(data.myReaction);
      }
    } catch { /* keep optimistic */ }
    finally { setReactingTo(null); }
  }

  function openReply() {
    setShowReplyInput(true);
    setShowReplies(true);
    setTimeout(() => replyInputRef.current?.focus(), 50);
  }

  async function handleReplySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!replyBody.trim() || submittingReply) return;
    setSubmittingReply(true);
    try {
      const res = await fetch("/api/site-reviews/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId: review.id, body: replyBody.trim() }),
      });
      const data = await res.json() as { reply?: PublicReply };
      if (res.ok && data.reply) {
        setReplies((prev) => [...prev, data.reply!]);
        setReplyBody("");
        setShowReplyInput(false);
      }
    } finally { setSubmittingReply(false); }
  }

  async function handleDeleteReply(replyId: string) {
    const res = await fetch("/api/site-reviews/reply", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewId: review.id, replyId }),
    });
    if (res.ok) setReplies((prev) => prev.filter((r) => r.id !== replyId));
  }

  async function handleReport() {
    await fetch("/api/site-reviews/flag", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewId: review.id }),
    }).catch(() => {});
  }

  function makeLongPress(target: { isOwn: boolean; isReview: boolean; text: string; replyId?: string }) {
    return {
      onTouchStart: () => {
        longPressTimer.current = setTimeout(() => {
          if (navigator.vibrate) navigator.vibrate(40);
          setContextMenu(target);
        }, 500);
      },
      onTouchEnd: () => { if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; } },
      onTouchMove: () => { if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; } },
      onContextMenu: (e: React.MouseEvent) => { e.preventDefault(); setContextMenu(target); },
    };
  }

  async function handleModerate() {
    setModerating(true);
    try {
      const res = await fetch("/api/site-reviews/moderate", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId: review.id, hidden: !review.hidden }),
      });
      if (res.ok) onModerate(review.id, !review.hidden);
    } finally { setModerating(false); }
  }

  const reviewLongPress = makeLongPress({
    isOwn,
    isReview: true,
    text: `${review.title}\n${review.body}`,
  });

  return (
    <div className={["border-b border-white/5 px-4 py-4 select-none", review.flagged && isAdmin ? "bg-amber-500/5" : "", review.hidden ? "opacity-50" : ""].filter(Boolean).join(" ")}>
      {/* Context bottom sheet */}
      {contextMenu && (
        <ContextBottomSheet
          isOwn={contextMenu.isOwn}
          isReview={contextMenu.isReview}
          text={contextMenu.text}
          loggedIn={loggedIn}
          onClose={() => setContextMenu(null)}
          onReport={handleReport}
          onDelete={contextMenu.replyId
            ? () => handleDeleteReply(contextMenu.replyId!)
            : () => { fetch("/api/site-reviews", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reviewId: review.id }) }).then((r) => { if (r.ok) onDelete(review.id); }).catch(() => {}); }
          }
          onEdit={contextMenu.isReview ? () => onEditRequest?.(review) : undefined}
        />
      )}
      {/* Main content row: avatar | body | reactions */}
      <div className="flex items-start gap-3" {...reviewLongPress}>
        {/* Avatar */}
        <div className="shrink-0 pt-0.5">
          <Avatar src={avatarSrc} name={review.authorName} />
        </div>

        {/* Centre column */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-white leading-snug">{review.authorName}</p>
            {isAdmin && review.flagged && (
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-400">
                {review.flagCount} flag{review.flagCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <Stars rating={review.rating} />
          {review.productTitle && (
            <p className="text-[10px] uppercase tracking-wider text-brand-gold/40">for {review.productTitle}</p>
          )}
          <p className="text-xs font-semibold text-brand-gold leading-snug">{review.title}</p>
          <p className="text-sm leading-relaxed text-white/70">{review.body}</p>

          {/* Bottom meta row — TikTok style */}
          <div className="flex items-center gap-4 pt-1">
            <span className="text-xs text-white/30">{date}</span>
            <button
              onClick={openReply}
              className="text-xs font-semibold text-white/40 hover:text-white/80 transition-colors active:scale-95"
            >
              reply
            </button>
            {replies.length > 0 && (
              <button
                onClick={() => setShowReplies((v) => !v)}
                className="text-xs text-white/40 hover:text-white/70 transition-colors"
              >
                {showReplies ? "hide replies" : `view ${replies.length} repl${replies.length !== 1 ? "ies" : "y"}`}
              </button>
            )}
            {/* Admin controls */}
            {isAdmin && (
              <button onClick={handleModerate} disabled={moderating} className="ml-auto text-xs text-white/30 hover:text-white transition-colors disabled:opacity-40">
                {moderating ? "…" : review.hidden ? "show" : "hide"}
              </button>
            )}
          </div>
        </div>

        {/* Right column — reactions */}
        <div className="shrink-0 flex flex-row items-center gap-3 pl-1 pt-1">
          <button
            onClick={() => handleReact("up")}
            disabled={!loggedIn || !!reactingTo}
            title={loggedIn ? undefined : "sign in to react"}
            className={["flex flex-col items-center gap-0.5 transition-all active:scale-90 disabled:opacity-30", myReaction === "up" ? "text-brand-gold" : "text-white/40 hover:text-white/80"].join(" ")}
          >
            <ThumbIcon dir="up" className="h-5 w-5" />
            <span className="text-[11px] leading-none tabular-nums">{upCount || ""}</span>
          </button>
          <button
            onClick={() => handleReact("down")}
            disabled={!loggedIn || !!reactingTo}
            title={loggedIn ? undefined : "sign in to react"}
            className={["flex flex-col items-center gap-0.5 transition-all active:scale-90 disabled:opacity-30", myReaction === "down" ? "text-red-400" : "text-white/40 hover:text-white/80"].join(" ")}
          >
            <ThumbIcon dir="down" className="h-5 w-5" />
            <span className="text-[11px] leading-none tabular-nums">{downCount || ""}</span>
          </button>
        </div>
      </div>

      {/* Replies thread */}
      {(showReplies || showReplyInput) && (
        <div className="ml-12 mt-3 space-y-3">
          {showReplies && replies.map((rp) => {
            const rd = new Date(rp.createdAt);
            const rDate = `${rd.getMonth() + 1}-${rd.getDate()}`;
            const replyLongPress = makeLongPress({ isOwn: rp.isOwn || isAdmin, isReview: false, text: rp.body, replyId: rp.id });
            return (
              <div key={rp.id} className="flex items-start gap-2.5 select-none" {...replyLongPress}>
                <Avatar src={rp.avatarUrl} name={rp.authorName} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white/90 leading-snug">{rp.authorName}</p>
                  <p className="text-sm leading-relaxed text-white/60">{rp.body}</p>
                  <span className="text-xs text-white/25">{rDate}</span>
                </div>
              </div>
            );
          })}

          {/* Reply input */}
          {showReplyInput && loggedIn && (
            <form onSubmit={handleReplySubmit} className="flex items-center gap-2 pt-1">
              <input
                ref={replyInputRef}
                type="text"
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                maxLength={500}
                placeholder="add a reply…"
                className="flex-1 border-b border-white/15 bg-transparent pb-1.5 text-sm text-white placeholder:text-white/25 focus:border-brand-gold/50 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => { setShowReplyInput(false); setReplyBody(""); }}
                className="shrink-0 text-xs text-white/30 hover:text-white transition-colors px-1"
              >
                cancel
              </button>
              <button
                type="submit"
                disabled={submittingReply || !replyBody.trim()}
                className="shrink-0 text-sm font-semibold text-brand-gold hover:text-brand-gold/80 transition-colors disabled:opacity-40"
              >
                {submittingReply ? "…" : "post"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

// ---- ReviewStrip (main export) ----

export function ReviewSideTab() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [reviews, setReviews] = useState<PublicSiteReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);

  const [myAvatar, setMyAvatar] = useState<string | null>(null);
  const [editingReviewData, setEditingReviewData] = useState<PublicSiteReview | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const scrollBodyRef = useRef<HTMLDivElement>(null);

  // Mount guard for createPortal
  useEffect(() => { setMounted(true); }, []);

  // On mount: read localStorage for instant display, then fetch reviews + avatar
  // from the server in the background so data is ready before the drawer opens
  useEffect(() => {
    let parsed: Session | null = null;
    try {
      const raw = localStorage.getItem("atheles-session");
      if (raw) parsed = JSON.parse(raw) as Session;
    } catch { /* ignore */ }
    const hasCookie = document.cookie.includes("atheles-logged-in=1");
    setLoggedIn(!!(parsed?.email || hasCookie));
    setSession(parsed);

    // Show cached avatar immediately (works on same device)
    if (parsed?.email) {
      try {
        const avatarCached = localStorage.getItem(`atheles-avatar-${parsed.email}`);
        if (avatarCached) setMyAvatar(avatarCached);
      } catch { /* ignore */ }
    }

    // Prefetch reviews so they're ready the moment the drawer opens
    setLoading(true);
    fetch(`/api/site-reviews${parsed?.isAdmin ? "?all=1" : ""}`)
      .then((r) => r.json())
      .then((data: { reviews?: PublicSiteReview[] }) => {
        if (Array.isArray(data.reviews)) setReviews(data.reviews);
        setFetched(true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Fetch avatar from server so it works across devices (not just same-device localStorage)
    fetch("/api/auth/avatar")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.avatar) {
          setMyAvatar(d.avatar);
          try {
            if (parsed?.email) localStorage.setItem(`atheles-avatar-${parsed.email}`, d.avatar);
          } catch { /* ignore */ }
        }
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Slide open/close + scroll lock
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
      setTimeout(() => closeRef.current?.focus(), 50);

      document.documentElement.classList.add("drawer-open");
      const prevent = (e: WheelEvent | TouchEvent) => {
        const panel = document.querySelector("[data-reviews-panel]");
        if (panel && panel.contains(e.target as Node)) return;
        e.preventDefault();
      };
      document.addEventListener("wheel", prevent, { passive: false });
      document.addEventListener("touchmove", prevent, { passive: false });
      return () => {
        document.documentElement.classList.remove("drawer-open");
        document.removeEventListener("wheel", prevent);
        document.removeEventListener("touchmove", prevent);
      };
    } else {
      setVisible(false);
    }
  }, [open]);


  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  function handleReviewAdded(review: PublicSiteReview) {
    setReviews((prev) => [{ ...review, isOwn: true }, ...prev]);
  }

  function handleModerate(id: string, hidden: boolean) {
    setReviews((prev) => prev.map((r) => r.id === id ? { ...r, hidden } : r));
  }

  function handleDelete(id: string) {
    setReviews((prev) => prev.filter((r) => r.id !== id));
  }

  function handleEdit(id: string, updated: Pick<PublicSiteReview, "rating" | "title" | "body">) {
    setReviews((prev) => prev.map((r) => r.id === id ? { ...r, ...updated } : r));
  }

  const visibleReviews = session?.isAdmin ? reviews : reviews.filter((r) => !r.hidden);

  const modal = (
    <>
      {/* Backdrop — z-[65] dims navbar */}
      <div
        className={`fixed inset-0 z-[65] bg-black/50 transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        aria-hidden="true"
        onClick={() => setOpen(false)}
      />

      {/* Drawer — identical structure to cart modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="community reviews"
        className={`fixed inset-y-0 right-0 z-[70] flex h-full w-full flex-col bg-brand-dark text-white md:w-[400px] border-l border-brand-dark-gold/20 transition-transform duration-300 ease-out will-change-transform ${visible ? "translate-x-0" : "translate-x-full pointer-events-none"}`}
        style={{ overscrollBehavior: "contain" }}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/5 px-5 py-4">
          <div className="group flex items-center gap-2 cursor-default">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5 text-brand-gold transition-all duration-200 group-hover:fill-current" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
            <span className="font-heading font-semibold tracking-wide text-brand-gold">
              community reviews
            </span>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={() => setOpen(false)}
            aria-label="close reviews"
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/40 hover:bg-white/10 hover:text-white transition-all outline-none"
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div ref={scrollBodyRef} data-reviews-panel className="flex-1 overflow-y-auto">
          {/* Form — always shown for logged-in users */}
          {loggedIn && (
            <>
              <p className="px-5 pt-5 text-xs uppercase tracking-[0.15em] text-white/30">
                {editingReviewData ? "edit your review" : "share your experience"}
              </p>
              <ReviewForm
                session={session}
                existingReview={editingReviewData}
                onSuccess={(review) => { handleReviewAdded(review); setEditingReviewData(null); }}
                onUpdate={(id, updated) => { handleEdit(id, updated); setEditingReviewData(null); }}
              />
              {editingReviewData && (
                <div className="px-5 pb-3">
                  <button onClick={() => setEditingReviewData(null)} className="text-xs text-white/30 hover:text-white transition-colors">cancel</button>
                </div>
              )}
              <div className="border-t border-white/5" />
            </>
          )}

          {!loggedIn && (
            <p className="px-5 py-5 text-sm text-white/40">
              <a href="/account/login" className="text-brand-gold underline underline-offset-2">sign in</a>{" "}
              to leave a review.
            </p>
          )}


          {/* Reviews list */}
          {loading ? (
            <div className="space-y-px">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-28 animate-pulse border-b border-white/5 bg-white/[0.02]" />
              ))}
            </div>
          ) : visibleReviews.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-white/30">
              no reviews yet — be the first!
            </p>
          ) : (
            <div>
              {visibleReviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  avatarSrc={review.isOwn ? (myAvatar ?? review.avatarUrl ?? null) : (review.avatarUrl ?? null)}
                  isAdmin={!!session?.isAdmin}
                  isOwn={review.isOwn}
                  loggedIn={loggedIn}
                  onModerate={handleModerate}
                  onDelete={handleDelete}
                  onEditRequest={(r) => { setEditingReviewData(r); setTimeout(() => scrollBodyRef.current?.scrollTo({ top: 0, behavior: "smooth" }), 50); }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Full-width outlined strip — sits between hero and carousel */}
      <button
        onClick={() => setOpen(true)}
        aria-label="open community reviews"
        className="group flex w-full items-center justify-center gap-3 border-t border-brand-dark-gold/20 bg-transparent py-5 text-[11px] uppercase tracking-[0.22em] text-brand-gold transition-colors duration-200 hover:bg-brand-gold/[0.04]"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0 transition-all duration-200 group-hover:fill-current" aria-hidden="true">
          <path strokeLinecap="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
        <span>community reviews</span>
        <span className="text-brand-gold/30">·</span>
        <span className="text-brand-gold/55 transition-colors duration-200 group-hover:text-brand-gold">write yours</span>
      </button>

      {/* Modal portaled to document.body so it renders above all stacking contexts */}
      {mounted && createPortal(modal, document.body)}
    </>
  );
}

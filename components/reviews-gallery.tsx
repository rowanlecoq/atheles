"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { PublicSiteReview } from "lib/site-reviews";

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
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
            className={n <= (hovered || value) ? "text-brand-gold" : "text-white/20"}
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
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
  onSuccess,
}: {
  session: Session | null;
  onSuccess: (review: PublicSiteReview) => void;
}) {
  const profileName = session?.firstName || session?.name || "";
  const [displayName, setDisplayName] = useState(profileName);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (profileName && !displayName) setDisplayName(profileName);
  }, [profileName]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) { setError("please select a rating."); return; }
    if (!title.trim()) { setError("please add a title."); return; }
    if (!body.trim()) { setError("please write your review."); return; }

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/site-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          title: title.trim(),
          body: body.trim(),
          displayName: displayName.trim() || undefined,
        }),
      });
      const data = await res.json() as { review?: PublicSiteReview; error?: string };
      if (!res.ok) { setError(data.error || "failed to submit."); return; }
      if (data.review) { onSuccess(data.review); setDone(true); }
    } catch {
      setError("network error. please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-sm border border-brand-gold/20 bg-brand-gold/5 px-5 py-6 text-center">
        <p className="font-heading text-lg text-brand-gold">thanks for sharing 🔱</p>
        <p className="mt-1 text-sm text-white/50">your review is now live.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
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
          {submitting ? "submitting…" : "submit review"}
        </span>
      </button>
    </form>
  );
}

// ---- ReviewCard ----

function ReviewCard({
  review,
  avatarSrc,
  isAdmin,
  isOwn,
  onFlag,
  onModerate,
  onDelete,
  onEdit,
}: {
  review: PublicSiteReview;
  avatarSrc?: string | null;
  isAdmin: boolean;
  isOwn: boolean;
  onFlag: (id: string) => void;
  onModerate: (id: string, hidden: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, updated: Pick<PublicSiteReview, "rating" | "title" | "body">) => void;
}) {
  const [flagging, setFlagging] = useState(false);
  const [moderating, setModerating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editRating, setEditRating] = useState(review.rating);
  const [editTitle, setEditTitle] = useState(review.title);
  const [editBody, setEditBody] = useState(review.body);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const date = new Date(review.createdAt).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });

  async function handleFlag() {
    setFlagging(true);
    try {
      await fetch("/api/site-reviews/flag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId: review.id }),
      });
      onFlag(review.id);
    } finally { setFlagging(false); }
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

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch("/api/site-reviews", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId: review.id }),
      });
      if (res.ok) onDelete(review.id);
    } finally { setDeleting(false); setConfirmDelete(false); }
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (editRating === 0) { setEditError("please select a rating."); return; }
    if (!editTitle.trim()) { setEditError("please add a title."); return; }
    if (!editBody.trim()) { setEditError("please write your review."); return; }
    setSaving(true);
    setEditError("");
    try {
      const res = await fetch("/api/site-reviews", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId: review.id, rating: editRating, title: editTitle.trim(), body: editBody.trim() }),
      });
      const data = await res.json() as { review?: PublicSiteReview; error?: string };
      if (!res.ok) { setEditError(data.error || "failed to save."); return; }
      if (data.review) {
        onEdit(review.id, { rating: data.review.rating, title: data.review.title, body: data.review.body });
        setEditing(false);
      }
    } catch { setEditError("network error."); }
    finally { setSaving(false); }
  }

  if (editing) {
    return (
      <form
        onSubmit={handleSaveEdit}
        className="border-b border-white/5 px-5 py-4 space-y-3"
      >
        <p className="text-xs text-white/40">editing your review</p>
        <StarInput value={editRating} onChange={setEditRating} />
        <input
          type="text"
          maxLength={100}
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="w-full rounded-sm border border-white/10 bg-white/3 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:border-brand-gold/40 focus:outline-none"
        />
        <textarea
          rows={3}
          maxLength={1000}
          value={editBody}
          onChange={(e) => setEditBody(e.target.value)}
          className="w-full resize-none rounded-sm border border-white/10 bg-white/3 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:border-brand-gold/40 focus:outline-none"
        />
        {editError && <p className="text-sm text-red-400">{editError}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-brand-gold px-4 py-1.5 text-xs font-heading uppercase tracking-wider text-brand-dark disabled:opacity-60"
          >
            {saving ? "saving…" : "save"}
          </button>
          <button
            type="button"
            onClick={() => { setEditing(false); setEditError(""); }}
            className="rounded-full border border-white/10 px-4 py-1.5 text-xs text-white/50 hover:text-white"
          >
            cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div
      className={[
        "border-b border-white/5 px-5 py-4 space-y-2",
        review.flagged && isAdmin ? "bg-amber-500/5" : "",
        review.hidden ? "opacity-50" : "",
      ].filter(Boolean).join(" ")}
    >
      <div className="flex items-center gap-2.5">
        <Avatar src={avatarSrc} name={review.authorName} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{review.authorName}</p>
          <p className="text-xs text-white/30">{date}</p>
        </div>
        {isAdmin && review.flagged && (
          <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-400 shrink-0">
            {review.flagCount} flag{review.flagCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>
      <Stars rating={review.rating} />
      <p className="text-xs font-semibold text-brand-gold">{review.title}</p>
      <p className="text-sm leading-relaxed text-white/70">{review.body}</p>
      <div className="flex items-center justify-end gap-3 pt-1">
        {isOwn && !isAdmin && (
          <>
            <button
              onClick={() => setEditing(true)}
              className="text-[11px] text-white/30 hover:text-brand-gold transition-colors"
            >
              edit
            </button>
            {confirmDelete ? (
              <>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-[11px] text-red-400 hover:text-red-300 transition-colors disabled:opacity-40"
                >
                  {deleting ? "…" : "confirm delete"}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-[11px] text-white/30 hover:text-white transition-colors"
                >
                  cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-[11px] text-white/20 hover:text-red-400 transition-colors"
              >
                delete
              </button>
            )}
          </>
        )}
        {isAdmin ? (
          <button onClick={handleModerate} disabled={moderating} className="text-[11px] text-white/30 hover:text-white transition-colors disabled:opacity-40">
            {moderating ? "…" : review.hidden ? "show" : "hide"}
          </button>
        ) : !isOwn ? (
          <button onClick={handleFlag} disabled={flagging} aria-label="report this review" className="text-[11px] text-white/20 hover:text-amber-400 transition-colors disabled:opacity-40">
            {flagging ? "…" : "report"}
          </button>
        ) : null}
      </div>
    </div>
  );
}

// ---- ReviewSideTab (main export) ----

export function ReviewSideTab() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [reviews, setReviews] = useState<PublicSiteReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [myAvatar, setMyAvatar] = useState<string | null>(null);
  const [myReviewId, setMyReviewId] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Mount guard for createPortal
  useEffect(() => { setMounted(true); }, []);

  // Read session + avatar + persisted review ID from localStorage
  useEffect(() => {
    let parsed: Session | null = null;
    try {
      const raw = localStorage.getItem("atheles-session");
      if (raw) parsed = JSON.parse(raw) as Session;
    } catch { /* ignore */ }
    const hasCookie = document.cookie.includes("atheles-logged-in=1");
    setLoggedIn(!!(parsed?.email || hasCookie));
    setSession(parsed);

    if (parsed?.email) {
      try {
        const avatarCached = localStorage.getItem(`atheles-avatar-${parsed.email}`);
        if (avatarCached) setMyAvatar(avatarCached);
      } catch { /* ignore */ }
      try {
        const storedReviewId = localStorage.getItem(`atheles-my-site-review-${parsed.email}`);
        if (storedReviewId) setMyReviewId(storedReviewId);
      } catch { /* ignore */ }
    }
  }, []);

  // Slide open/close
  useEffect(() => {
    if (open) {
      document.body.classList.add("overflow-hidden");
      requestAnimationFrame(() => setVisible(true));
      setTimeout(() => closeRef.current?.focus(), 50);
    } else {
      setVisible(false);
      document.body.classList.remove("overflow-hidden");
    }
    return () => document.body.classList.remove("overflow-hidden");
  }, [open]);

  // Fetch reviews on first open
  useEffect(() => {
    if (!open || fetched) return;
    setLoading(true);
    setFetched(true);
    fetch(`/api/site-reviews${session?.isAdmin ? "?all=1" : ""}`)
      .then((r) => r.json())
      .then((data: { reviews?: PublicSiteReview[] }) => {
        if (Array.isArray(data.reviews)) setReviews(data.reviews);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, fetched, session?.isAdmin]);

  // Detect if current admin user already reviewed
  useEffect(() => {
    if (session?.email && reviews.length > 0) {
      const email = session.email.toLowerCase();
      const found = reviews.some(
        (r) =>
          "authorEmail" in r &&
          typeof (r as { authorEmail?: string }).authorEmail === "string" &&
          (r as { authorEmail: string }).authorEmail.toLowerCase() === email,
      );
      setAlreadyReviewed(found);
    }
  }, [reviews, session?.email]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  function handleReviewAdded(review: PublicSiteReview) {
    setReviews((prev) => [review, ...prev]);
    setAlreadyReviewed(true);
    setMyReviewId(review.id);
    try {
      if (session?.email) localStorage.setItem(`atheles-my-site-review-${session.email}`, review.id);
    } catch { /* ignore */ }
  }

  function handleFlag(id: string) {
    setReviews((prev) =>
      prev.map((r) => r.id === id ? { ...r, flagCount: (r.flagCount || 0) + 1, flagged: (r.flagCount || 0) + 1 >= 3 } : r),
    );
  }

  function handleModerate(id: string, hidden: boolean) {
    setReviews((prev) => prev.map((r) => r.id === id ? { ...r, hidden } : r));
  }

  function handleDelete(id: string) {
    setReviews((prev) => prev.filter((r) => r.id !== id));
    setMyReviewId(null);
    setAlreadyReviewed(false);
    try {
      if (session?.email) localStorage.removeItem(`atheles-my-site-review-${session.email}`);
    } catch { /* ignore */ }
  }

  function handleEdit(id: string, updated: Pick<PublicSiteReview, "rating" | "title" | "body">) {
    setReviews((prev) => prev.map((r) => r.id === id ? { ...r, ...updated } : r));
  }

  const visibleReviews = session?.isAdmin ? reviews : reviews.filter((r) => !r.hidden);
  const canReview = loggedIn && !alreadyReviewed;

  const modal = (
    <>
      {/* Backdrop — z-[65] dims navbar */}
      <div
        className={`fixed inset-0 z-[65] bg-black/50 transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
        aria-hidden="true"
        onClick={() => setOpen(false)}
      />

      {/* Drawer — identical structure to cart modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="community reviews"
        className={`fixed inset-y-0 right-0 z-[70] flex h-full w-full flex-col bg-brand-dark text-white md:w-[400px] border-l border-brand-dark-gold/20 transition-transform duration-300 ease-out will-change-transform ${visible ? "translate-x-0" : "translate-x-full"}`}
        style={{ overscrollBehavior: "contain" }}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/5 px-5 py-4">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-brand-gold" aria-hidden="true">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
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
            className="flex h-9 w-9 items-center justify-center text-white/40 hover:text-white transition-colors outline-none"
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {/* Write a review form */}
          {canReview && (
            <>
              <p className="px-5 pt-5 text-xs uppercase tracking-[0.15em] text-white/30">share your experience</p>
              <ReviewForm session={session} onSuccess={handleReviewAdded} />
              <div className="border-t border-white/5" />
            </>
          )}

          {!loggedIn && (
            <p className="px-5 py-5 text-sm text-white/40">
              <a href="/account/login" className="text-brand-gold underline underline-offset-2">sign in</a>{" "}
              to leave a review.
            </p>
          )}

          {alreadyReviewed && !session?.isAdmin && (
            <p className="px-5 py-4 text-sm text-white/40">you&apos;ve already reviewed — thanks 🔱</p>
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
                  avatarSrc={review.id === myReviewId ? myAvatar : null}
                  isAdmin={!!session?.isAdmin}
                  isOwn={review.id === myReviewId}
                  onFlag={handleFlag}
                  onModerate={handleModerate}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
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
      {/* Side tab — matches enter store button */}
      <div className="fixed right-0 top-1/2 z-40 -translate-y-1/2">
        <button
          onClick={() => setOpen(true)}
          aria-label="open community reviews"
          className="flex items-center justify-center border border-brand-gold bg-brand-dark px-2 py-6 text-[10px] uppercase tracking-[0.18em] text-brand-gold transition-colors hover:bg-brand-gold hover:text-brand-dark"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", minHeight: "8rem" }}
        >
          write your review
        </button>
      </div>

      {/* Portal — renders at document.body, above all stacking contexts */}
      {mounted && open && createPortal(modal, document.body)}
    </>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import type { PublicSiteReview } from "lib/site-reviews";

// ---- Stars ----

function Stars({ rating, size = 16 }: { rating: number; size?: number }) {
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
    <span className="inline-flex gap-1" role="group" aria-label="Star rating">
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
            width={30}
            height={30}
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

// ---- ReviewCard ----

function ReviewCard({
  review,
  isAdmin,
  onFlag,
  onModerate,
}: {
  review: PublicSiteReview;
  isAdmin: boolean;
  onFlag: (id: string) => void;
  onModerate: (id: string, hidden: boolean) => void;
}) {
  const [flagging, setFlagging] = useState(false);
  const [moderating, setModerating] = useState(false);

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
    } finally {
      setFlagging(false);
    }
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
    } finally {
      setModerating(false);
    }
  }

  return (
    <div
      className={[
        "break-inside-avoid rounded-xl border p-5 space-y-3 transition-colors",
        review.flagged && isAdmin
          ? "border-amber-500/30 bg-amber-500/5"
          : "border-brand-dark-gold/20 bg-white/[0.03]",
        review.hidden ? "opacity-50" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Quote mark */}
      <span className="block font-heading text-4xl leading-none text-brand-gold/30 select-none" aria-hidden="true">
        &ldquo;
      </span>

      <Stars rating={review.rating} size={14} />

      <p className="text-sm leading-relaxed text-white/80">{review.body}</p>

      <p className="text-xs font-semibold text-brand-gold">{review.title}</p>

      <div className="flex items-center justify-between pt-1 border-t border-white/5">
        <p className="text-xs text-white/35">
          {review.authorName} · {date}
        </p>
        <div className="flex items-center gap-3">
          {isAdmin && review.flagged && (
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-400">
              {review.flagCount} flag{review.flagCount !== 1 ? "s" : ""}
            </span>
          )}
          {isAdmin ? (
            <button
              onClick={handleModerate}
              disabled={moderating}
              className="text-[11px] text-white/30 hover:text-white transition-colors disabled:opacity-40"
            >
              {moderating ? "…" : review.hidden ? "show" : "hide"}
            </button>
          ) : (
            <button
              onClick={handleFlag}
              disabled={flagging}
              aria-label="Report this review"
              className="text-[11px] text-white/20 hover:text-amber-400 transition-colors disabled:opacity-40"
            >
              {flagging ? "…" : "report"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- ReviewForm ----

function ReviewForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: (review: PublicSiteReview) => void;
  onCancel: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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
        body: JSON.stringify({ rating, title: title.trim(), body: body.trim() }),
      });
      const data = await res.json() as { review?: PublicSiteReview; error?: string };
      if (!res.ok) { setError(data.error || "failed to submit."); return; }
      if (data.review) onSuccess(data.review);
    } catch {
      setError("network error. please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-brand-dark-gold/30 bg-white/[0.03] p-6 space-y-4"
    >
      <h3 className="font-heading text-lg font-bold text-brand-gold">share your experience</h3>

      <div>
        <label className="mb-1.5 block text-xs text-white/40">rating</label>
        <StarInput value={rating} onChange={setRating} />
      </div>

      <div>
        <label htmlFor="sr-title" className="mb-1.5 block text-xs text-white/40">
          title
        </label>
        <input
          id="sr-title"
          type="text"
          maxLength={100}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="sum it up in a few words"
          className="w-full rounded-lg border border-brand-dark-gold/20 bg-brand-dark px-4 py-2.5 text-sm text-white placeholder-white/25 focus:border-brand-gold/50 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="sr-body" className="mb-1.5 block text-xs text-white/40">
          review
        </label>
        <textarea
          id="sr-body"
          rows={4}
          maxLength={1000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="tell the community about your experience with atheles"
          className="w-full resize-none rounded-lg border border-brand-dark-gold/20 bg-brand-dark px-4 py-2.5 text-sm text-white placeholder-white/25 focus:border-brand-gold/50 focus:outline-none"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-brand-gold px-6 py-2.5 text-sm font-bold text-brand-dark transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "submitting…" : "submit review"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-brand-dark-gold/20 px-6 py-2.5 text-sm text-white/50 transition-colors hover:border-brand-gold/30 hover:text-white"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ---- ReviewsGallery (main export) ----

type Session = { isAdmin?: boolean; email?: string };

export function ReviewsGallery() {
  const [reviews, setReviews] = useState<PublicSiteReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let parsed: Session | null = null;
    try {
      const raw = localStorage.getItem("atheles-session");
      if (raw) parsed = JSON.parse(raw) as Session;
    } catch {
      // ignore
    }
    const hasCookie = document.cookie.includes("atheles-logged-in=1");
    setLoggedIn(!!(parsed?.email || hasCookie));
    setSession(parsed);
  }, []);

  useEffect(() => {
    const url = `/api/site-reviews${session?.isAdmin ? "?all=1" : ""}`;
    fetch(url)
      .then((r) => r.json())
      .then((data: { reviews?: PublicSiteReview[] }) => {
        if (Array.isArray(data.reviews)) setReviews(data.reviews);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session?.isAdmin]);

  useEffect(() => {
    if (session?.email && reviews.length > 0) {
      // admins have email in session — use it; regular users rely on 409 from API
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

  function handleReviewAdded(review: PublicSiteReview) {
    setReviews((prev) => [review, ...prev]);
    setShowForm(false);
    setAlreadyReviewed(true);
  }

  function handleFlag(id: string) {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, flagCount: (r.flagCount || 0) + 1, flagged: (r.flagCount || 0) + 1 >= 3 }
          : r,
      ),
    );
  }

  function handleModerate(id: string, hidden: boolean) {
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, hidden } : r)));
  }

  function openForm() {
    setShowForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 50);
  }

  const visibleReviews = session?.isAdmin ? reviews : reviews.filter((r) => !r.hidden);
  const avgRating =
    visibleReviews.length > 0
      ? visibleReviews.reduce((s, r) => s + r.rating, 0) / visibleReviews.length
      : 0;

  const canReview = loggedIn && !alreadyReviewed;

  return (
    <section className="w-full px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 text-xs tracking-[0.2em] text-brand-gold/60">community</p>
            <h2 className="font-heading text-3xl font-bold text-brand-gold sm:text-4xl">
              what athletes say
            </h2>
            {visibleReviews.length > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <Stars rating={Math.round(avgRating)} size={14} />
                <span className="text-sm text-white/40">
                  {avgRating.toFixed(1)} · {visibleReviews.length} review{visibleReviews.length !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>

          {canReview && !showForm && (
            <button
              onClick={openForm}
              className="shrink-0 self-start rounded-lg border border-brand-gold/40 px-5 py-2.5 text-sm font-semibold text-brand-gold transition-colors hover:bg-brand-gold hover:text-brand-dark sm:self-auto"
            >
              Write a Review
            </button>
          )}
          {!loggedIn && (
            <a
              href="/account/login"
              className="shrink-0 self-start text-sm text-white/40 underline underline-offset-4 transition-colors hover:text-brand-gold sm:self-auto"
            >
              Sign in to review
            </a>
          )}
        </div>

        {/* Form */}
        {showForm && (
          <div ref={formRef} className="mb-10 max-w-lg">
            <ReviewForm onSuccess={handleReviewAdded} onCancel={() => setShowForm(false)} />
          </div>
        )}

        {/* Gallery */}
        {loading ? (
          <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="mb-4 break-inside-avoid h-40 animate-pulse rounded-xl bg-white/[0.03]" />
            ))}
          </div>
        ) : visibleReviews.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="font-heading text-xl text-white/30">no reviews yet.</p>
            {canReview && (
              <p className="text-sm text-white/30">
                be the first to share your experience with the community.
              </p>
            )}
          </div>
        ) : (
          <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
            {visibleReviews.map((review) => (
              <div key={review.id} className="mb-4">
                <ReviewCard
                  review={review}
                  isAdmin={!!session?.isAdmin}
                  onFlag={handleFlag}
                  onModerate={handleModerate}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

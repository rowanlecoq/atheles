"use client";

import { useEffect, useState } from "react";
import type { PublicReview } from "lib/reviews";

// ---- Stars (display only) ----

function Stars({ rating, size = 20 }: { rating: number; size?: number }) {
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
          className={n <= rating ? "text-brand-gold" : "text-white/20"}
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

// ---- StarInput (interactive) ----

function StarInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
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

function ReviewForm({
  productHandle,
  onSuccess,
  onCancel,
}: {
  productHandle: string;
  onSuccess: (review: PublicReview) => void;
  onCancel: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a star rating.");
      return;
    }
    if (!title.trim()) {
      setError("Please add a title.");
      return;
    }
    if (!body.trim()) {
      setError("Please write your review.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: productHandle, rating, title: title.trim(), body: body.trim() }),
      });
      const data = await res.json() as { review?: PublicReview; error?: string };
      if (!res.ok) {
        setError(data.error || "Failed to submit review.");
        return;
      }
      if (data.review) onSuccess(data.review);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-brand-dark-gold/20 bg-brand-dark/50 p-5 space-y-4"
    >
      <h3 className="font-heading text-lg font-bold text-brand-gold">Write a Review</h3>

      <div>
        <label className="mb-1 block text-sm text-brand-grey">Rating</label>
        <StarInput value={rating} onChange={setRating} />
      </div>

      <div>
        <label htmlFor="review-title" className="mb-1 block text-sm text-brand-grey">
          Title
        </label>
        <input
          id="review-title"
          type="text"
          maxLength={100}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarise your experience"
          className="w-full rounded border border-brand-dark-gold/20 bg-brand-dark px-3 py-2 text-sm text-white placeholder-white/30 focus:border-brand-gold/50 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="review-body" className="mb-1 block text-sm text-brand-grey">
          Review
        </label>
        <textarea
          id="review-body"
          rows={4}
          maxLength={1000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Tell others about your experience with this product"
          className="w-full rounded border border-brand-dark-gold/20 bg-brand-dark px-3 py-2 text-sm text-white placeholder-white/30 focus:border-brand-gold/50 focus:outline-none resize-none"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-brand-gold px-5 py-2 text-sm font-semibold text-brand-dark transition-opacity disabled:opacity-60"
        >
          {submitting ? "Submitting…" : "Submit Review"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-brand-dark-gold/20 px-5 py-2 text-sm text-brand-grey transition-colors hover:border-brand-gold/40 hover:text-white"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ---- ReviewCard ----

function ReviewCard({
  review,
  isAdmin,
  productHandle,
  onModerate,
  onFlag,
}: {
  review: PublicReview;
  isAdmin: boolean;
  productHandle: string;
  onModerate: (id: string, hidden: boolean) => void;
  onFlag: (id: string) => void;
}) {
  const [flagging, setFlagging] = useState(false);
  const [moderating, setModerating] = useState(false);

  const date = new Date(review.createdAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  async function handleFlag() {
    setFlagging(true);
    try {
      await fetch("/api/reviews/flag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: productHandle, reviewId: review.id }),
      });
      onFlag(review.id);
    } finally {
      setFlagging(false);
    }
  }

  async function handleModerate() {
    setModerating(true);
    try {
      const res = await fetch("/api/reviews/moderate", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: productHandle, reviewId: review.id, hidden: !review.hidden }),
      });
      if (res.ok) onModerate(review.id, !review.hidden);
    } finally {
      setModerating(false);
    }
  }

  const cardClass = [
    "rounded-lg border p-4 space-y-2 transition-colors",
    review.flagged && isAdmin
      ? "border-amber-500/30 bg-amber-500/5"
      : "border-brand-dark-gold/20 bg-brand-dark/50",
    review.hidden ? "opacity-60" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cardClass}>
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <Stars rating={review.rating} size={16} />
          <p className="font-medium text-white">{review.title}</p>
        </div>
        {isAdmin && review.flagged && (
          <span className="shrink-0 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">
            {review.flagCount} flag{review.flagCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>
      <p className="text-sm text-brand-grey leading-relaxed">{review.body}</p>
      <div className="flex items-center justify-between gap-2 pt-1">
        <p className="text-xs text-white/40">
          {review.authorName} · {date}
        </p>
        <div className="flex items-center gap-2">
          {isAdmin ? (
            <button
              onClick={handleModerate}
              disabled={moderating}
              className="text-xs text-brand-grey transition-colors hover:text-white disabled:opacity-50"
            >
              {moderating ? "…" : review.hidden ? "Show review" : "Hide review"}
            </button>
          ) : (
            <button
              onClick={handleFlag}
              disabled={flagging}
              aria-label="Report this review"
              className="text-xs text-white/30 transition-colors hover:text-amber-400 disabled:opacity-50"
            >
              {flagging ? "Reporting…" : "Report"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- ReviewSection (main export) ----

type Session = {
  firstName?: string;
  name?: string;
  isAdmin?: boolean;
  email?: string;
};

export function ReviewSection({ productHandle }: { productHandle: string }) {
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  useEffect(() => {
    let parsed: Session | null = null;
    try {
      const raw = localStorage.getItem("atheles-session");
      if (raw) parsed = JSON.parse(raw) as Session;
    } catch {
      // ignore
    }

    const hasCookie = document.cookie.includes("atheles-logged-in=1");
    const isLoggedIn = !!(parsed?.email || hasCookie);
    setLoggedIn(isLoggedIn);
    setSession(parsed);
  }, []);

  useEffect(() => {
    const url = `/api/reviews?product=${encodeURIComponent(productHandle)}${session?.isAdmin ? "&all=1" : ""}`;

    fetch(url)
      .then((r) => r.json())
      .then((data: { reviews?: PublicReview[] }) => {
        if (Array.isArray(data.reviews)) setReviews(data.reviews);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productHandle, session?.isAdmin]);

  useEffect(() => {
    if (session?.email && reviews.length > 0) {
      // For regular users emails are stripped; rely on API 409 instead.
      // For admins, emails are present.
      const email = session.email.toLowerCase();
      const found = reviews.some(
        (r) => "authorEmail" in r && typeof (r as { authorEmail?: string }).authorEmail === "string"
          && (r as { authorEmail: string }).authorEmail.toLowerCase() === email,
      );
      setAlreadyReviewed(found);
    }
  }, [reviews, session?.email]);

  function handleReviewAdded(review: PublicReview) {
    setReviews((prev) => [...prev, review]);
    setShowForm(false);
    setAlreadyReviewed(true);
  }

  function handleModerate(id: string, hidden: boolean) {
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, hidden } : r)),
    );
  }

  function handleFlag(id: string) {
    setReviews((prev) =>
      prev.map((r) => r.id === id ? { ...r, flagCount: (r.flagCount || 0) + 1, flagged: (r.flagCount || 0) + 1 >= 3 } : r),
    );
  }

  const visibleReviews = session?.isAdmin
    ? reviews
    : reviews.filter((r) => !r.hidden);

  const avgRating =
    visibleReviews.length > 0
      ? visibleReviews.reduce((sum, r) => sum + r.rating, 0) / visibleReviews.length
      : 0;

  const canWriteReview = loggedIn && !alreadyReviewed;

  return (
    <section className="py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="font-heading text-xl font-bold text-brand-gold sm:text-2xl">
          Customer Reviews
        </h2>
        {canWriteReview && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded bg-brand-gold px-4 py-2 text-sm font-semibold text-brand-dark transition-opacity hover:opacity-90"
          >
            Write a Review
          </button>
        )}
      </div>

      {visibleReviews.length > 0 && (
        <div className="mb-6 flex items-center gap-3">
          <Stars rating={Math.round(avgRating)} size={20} />
          <span className="text-sm text-brand-grey">
            {avgRating.toFixed(1)} out of 5 ({visibleReviews.length} review{visibleReviews.length !== 1 ? "s" : ""})
          </span>
        </div>
      )}

      {showForm && (
        <div className="mb-6">
          <ReviewForm
            productHandle={productHandle}
            onSuccess={handleReviewAdded}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {!loggedIn && !loading && (
        <p className="mb-4 text-sm text-brand-grey">
          <a href="/account/login" className="text-brand-gold underline underline-offset-2">
            Sign in
          </a>{" "}
          to leave a review.
        </p>
      )}

      {loading ? (
        <div className="space-y-3">
          <div className="h-28 animate-pulse rounded-lg bg-brand-dark/50" />
          <div className="h-28 animate-pulse rounded-lg bg-brand-dark/50" />
        </div>
      ) : visibleReviews.length === 0 ? (
        <p className="text-sm text-brand-grey">
          No reviews yet. {canWriteReview ? "Be the first to review this product!" : ""}
        </p>
      ) : (
        <ul className="space-y-4">
          {visibleReviews.map((review) => (
            <li key={review.id}>
              <ReviewCard
                review={review}
                isAdmin={!!session?.isAdmin}
                productHandle={productHandle}
                onModerate={handleModerate}
                onFlag={handleFlag}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

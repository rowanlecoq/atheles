"use client";

import { useCallback, useEffect, useState } from "react";
import type { Review } from "lib/reviews";
import { getReviewStats } from "lib/reviews";
import ReviewCard from "./review-card";
import ReviewForm from "./review-form";
import StarRating from "./star-rating";

export default function ReviewsSection({
  productHandle,
}: {
  productHandle?: string;
}) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchReviews = useCallback(() => {
    const url = productHandle
      ? `/api/reviews?product=${productHandle}`
      : "/api/reviews";

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setReviews(data.reviews || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [productHandle]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const stats = getReviewStats(reviews);

  return (
    <section className="py-12 sm:py-16">
      {/* Header */}
      <div className="mb-8 text-center">
        <h2 className="mb-3 font-heading text-2xl tracking-[0.06em] text-brand-gold sm:text-3xl">
          reviews
        </h2>
        <div className="mx-auto mb-4 h-px w-16 bg-brand-dark-gold/40" />

        {stats.total > 0 && (
          <div className="mb-4 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-3xl font-light text-brand-gold">
                {stats.average}
              </span>
              <StarRating rating={Math.round(stats.average)} size="md" />
            </div>
            <p className="text-xs text-brand-grey">
              {stats.total.toLocaleString()} {stats.total === 1 ? "review" : "reviews"}
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-block rounded border border-brand-gold px-6 py-2.5 text-xs uppercase tracking-[0.2em] text-brand-gold transition-colors hover:bg-brand-gold hover:text-brand-dark"
        >
          write a review
        </button>
      </div>

      {/* Review Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div
            className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-6 sm:p-8"
          >
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="absolute right-4 top-4 text-brand-grey transition-colors hover:text-white"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <h3 className="mb-6 text-center font-heading text-xl text-brand-gold">
              write a review
            </h3>
            <ReviewForm
              productHandle={productHandle}
              onClose={() => setShowForm(false)}
              onSubmitted={fetchReviews}
            />
          </div>
        </div>
      )}

      {/* Reviews Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <p className="text-sm text-brand-grey">loading reviews...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <p className="text-sm text-brand-grey">
            no reviews yet. be the first to share your experience!
          </p>
        </div>
      ) : (
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </section>
  );
}

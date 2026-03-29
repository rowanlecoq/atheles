"use client";

import { useEffect, useState } from "react";
import type { Review } from "lib/reviews";
import StarRating from "components/reviews/star-rating";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPending = () => {
    fetch("/api/reviews/admin")
      .then((res) => {
        if (res.status === 403) throw new Error("unauthorized");
        return res.json();
      })
      .then((data) => {
        setReviews(data.reviews || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message === "unauthorized" ? "you are not authorized to view this page." : "failed to load reviews.");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    const res = await fetch("/api/reviews/admin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });

    if (res.ok) {
      setReviews((prev) => prev.filter((r) => r.id !== id));
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-brand-grey">loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-8 text-center font-heading text-2xl text-brand-gold">
        review moderation
      </h1>

      {reviews.length === 0 ? (
        <p className="text-center text-sm text-brand-grey">
          no pending reviews.
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-5"
            >
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-brand-pale-gold">
                    {review.user_name}
                  </p>
                  <p className="text-[10px] text-brand-grey">
                    {review.user_email} &middot;{" "}
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </div>
                <StarRating rating={review.rating} size="sm" />
              </div>

              {review.title && (
                <p className="mb-1 text-sm font-medium text-white">
                  {review.title}
                </p>
              )}
              <p className="mb-3 text-sm text-brand-grey">{review.body}</p>

              {review.images.length > 0 && (
                <div className="mb-3 flex gap-2">
                  {review.images.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-16 w-16 overflow-hidden rounded-md border border-brand-dark-gold/20"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Review image ${i + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </a>
                  ))}
                </div>
              )}

              {review.product_handle && (
                <p className="mb-3 text-[10px] text-brand-grey">
                  product: {review.product_handle}
                </p>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleAction(review.id, "approve")}
                  className="rounded bg-green-700/80 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-600"
                >
                  approve
                </button>
                <button
                  type="button"
                  onClick={() => handleAction(review.id, "reject")}
                  className="rounded bg-red-800/80 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700"
                >
                  reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

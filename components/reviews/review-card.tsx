"use client";

import { useState } from "react";
import type { Review } from "lib/reviews";
import StarRating from "./star-rating";

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ReviewCard({ review }: { review: Review }) {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const initials = review.user_name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <div className="break-inside-avoid mb-4 rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-4">
        {/* Images */}
        {review.images.length > 0 && (
          <div className="mb-3 grid gap-1.5" style={{
            gridTemplateColumns: review.images.length === 1 ? "1fr" : review.images.length === 2 ? "1fr 1fr" : "1fr 1fr 1fr",
          }}>
            {review.images.map((url, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setLightboxImage(url)}
                className="relative aspect-square overflow-hidden rounded-md"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Review photo ${i + 1}`}
                  className="h-full w-full object-cover transition-transform hover:scale-105"
                />
              </button>
            ))}
          </div>
        )}

        {/* User info */}
        <div className="mb-2 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-dark-gold/20 text-xs font-medium text-brand-gold">
            {initials}
          </div>
          <div>
            <p className="text-sm font-medium text-brand-pale-gold">
              {review.user_name}
            </p>
            <p className="text-[10px] text-brand-grey">
              {timeAgo(review.created_at)}
            </p>
          </div>
        </div>

        {/* Rating */}
        <div className="mb-2">
          <StarRating rating={review.rating} size="sm" />
        </div>

        {/* Title */}
        {review.title && (
          <p className="mb-1 text-sm font-medium text-white">{review.title}</p>
        )}

        {/* Body */}
        <p className="text-sm leading-relaxed text-brand-grey">{review.body}</p>
      </div>

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            className="absolute right-4 top-4 text-white/70 transition-colors hover:text-white"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-8 w-8">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxImage}
            alt="Review photo"
            className="max-h-[85vh] max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

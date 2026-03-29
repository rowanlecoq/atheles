"use client";

import { useEffect, useRef, useState } from "react";
import StarRating from "./star-rating";

type User = {
  id: string;
  email: string;
  name: string;
};

export default function ReviewForm({
  productHandle,
  onClose,
  onSubmitted,
}: {
  productHandle?: string;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const total = images.length + files.length;
    if (total > 3) {
      setError("maximum 3 images allowed");
      return;
    }

    const newImages = [...images, ...files];
    setImages(newImages);

    const newPreviews = files.map((f) => URL.createObjectURL(f));
    setPreviews((prev) => [...prev, ...newPreviews]);
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(previews[index]!);
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (rating === 0) {
      setError("please select a star rating");
      return;
    }
    if (!body.trim()) {
      setError("please write a review");
      return;
    }

    setSubmitting(true);

    try {
      // Upload images first
      let imageUrls: string[] = [];
      if (images.length > 0) {
        const formData = new FormData();
        images.forEach((f) => formData.append("images", f));

        const imgRes = await fetch("/api/reviews/images", {
          method: "POST",
          body: formData,
        });
        const imgData = await imgRes.json();
        if (!imgData.success) {
          setError(imgData.error || "failed to upload images");
          setSubmitting(false);
          return;
        }
        imageUrls = imgData.urls;
      }

      // Submit review
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          title: title.trim() || undefined,
          body: body.trim(),
          images: imageUrls,
          product_handle: productHandle || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onSubmitted();
        onClose();
      } else {
        setError(data.error || "failed to submit review");
      }
    } catch {
      setError("something went wrong");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <p className="text-sm text-brand-grey">loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm text-brand-grey">
          you need to be signed in to leave a review.
        </p>
        <a
          href="/login"
          className="rounded border border-brand-gold px-6 py-2.5 text-sm uppercase tracking-wider text-brand-gold transition-colors hover:bg-brand-gold hover:text-brand-dark"
        >
          sign in
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center">
        <p className="mb-1 text-xs text-brand-grey">
          reviewing as <span className="text-brand-pale-gold">{user.name}</span>
        </p>
      </div>

      {/* Star Rating */}
      <div className="flex flex-col items-center gap-2">
        <label className="text-xs uppercase tracking-wider text-brand-grey">
          rating
        </label>
        <StarRating
          rating={rating}
          onChange={setRating}
          size="lg"
          interactive
        />
      </div>

      {/* Title */}
      <div>
        <label
          htmlFor="review-title"
          className="mb-1 flex items-baseline gap-1.5 text-xs uppercase tracking-wider text-brand-grey"
        >
          title
          <span className="normal-case tracking-normal text-brand-grey/40">
            optional
          </span>
        </label>
        <input
          id="review-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded border border-brand-dark-gold/30 bg-brand-dark px-4 py-2.5 text-sm text-white placeholder:text-brand-grey/50 focus:border-brand-gold focus:outline-none"
          placeholder="sum it up"
          maxLength={100}
        />
      </div>

      {/* Body */}
      <div>
        <label
          htmlFor="review-body"
          className="mb-1 block text-xs uppercase tracking-wider text-brand-grey"
        >
          review
        </label>
        <textarea
          id="review-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          className="w-full resize-none rounded border border-brand-dark-gold/30 bg-brand-dark px-4 py-2.5 text-sm text-white placeholder:text-brand-grey/50 focus:border-brand-gold focus:outline-none"
          placeholder="share your experience..."
          maxLength={1000}
        />
      </div>

      {/* Image Upload */}
      <div>
        <label className="mb-1 flex items-baseline gap-1.5 text-xs uppercase tracking-wider text-brand-grey">
          photos
          <span className="normal-case tracking-normal text-brand-grey/40">
            optional, up to 3
          </span>
        </label>
        <div className="flex flex-wrap gap-2">
          {previews.map((src, i) => (
            <div key={i} className="group relative h-20 w-20 overflow-hidden rounded-md border border-brand-dark-gold/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`Upload ${i + 1}`}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white/80 transition-colors hover:text-white"
                aria-label="Remove image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}
          {images.length < 3 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-20 w-20 items-center justify-center rounded-md border border-dashed border-brand-dark-gold/30 text-brand-grey transition-colors hover:border-brand-gold hover:text-brand-gold"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleImageChange}
          className="hidden"
        />
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded bg-brand-gold px-6 py-3 font-heading text-sm uppercase tracking-wider text-brand-dark transition-colors hover:bg-brand-light-gold disabled:opacity-50"
      >
        {submitting ? "submitting..." : "submit review"}
      </button>

      <p className="text-center text-[10px] text-brand-grey/50">
        your review will be visible after approval.
      </p>
    </form>
  );
}

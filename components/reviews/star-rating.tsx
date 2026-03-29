"use client";

import { useState } from "react";

function StarIcon({ filled, half }: { filled: boolean; half?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className="h-full w-full"
      fill={filled || half ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled || half ? 0 : 1.5}
    >
      {half ? (
        <>
          <defs>
            <clipPath id="halfStar">
              <rect x="0" y="0" width="12" height="24" />
            </clipPath>
          </defs>
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            clipPath="url(#halfStar)"
            fill="currentColor"
          />
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </>
      ) : (
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      )}
    </svg>
  );
}

export default function StarRating({
  rating,
  onChange,
  size = "md",
  interactive = false,
}: {
  rating: number;
  onChange?: (rating: number) => void;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
}) {
  const [hovered, setHovered] = useState(0);
  const display = interactive && hovered > 0 ? hovered : rating;

  const sizeClass = {
    sm: "h-3.5 w-3.5",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  }[size];

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => interactive && setHovered(star)}
          onMouseLeave={() => interactive && setHovered(0)}
          className={`${sizeClass} ${
            interactive
              ? "cursor-pointer transition-transform hover:scale-110"
              : "cursor-default"
          } ${star <= display ? "text-brand-gold" : "text-brand-dark-gold/30"}`}
        >
          <StarIcon filled={star <= display} />
        </button>
      ))}
    </div>
  );
}

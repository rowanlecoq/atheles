"use client";
import { useId } from "react";

export function WavyDivider({ className = "" }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`block w-full ${className}`}
      style={{ height: 6 }}
      aria-hidden="true"
    >
      <defs>
        <pattern id={uid} x="0" y="0" width="100" height="6" patternUnits="userSpaceOnUse">
          <path
            d="M0,3 C25,2 75,4 100,3"
            stroke="rgba(204,177,115,0.22)"
            strokeWidth="0.75"
            fill="none"
          />
        </pattern>
      </defs>
      <rect width="100%" height="6" fill={`url(#${uid})`} />
    </svg>
  );
}

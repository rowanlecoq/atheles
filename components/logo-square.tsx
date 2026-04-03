"use client";

import clsx from "clsx";
import Image from "next/image";
import { useState } from "react";
import tan1Logo from "../tan1.png";
import tan2Logo from "../tan2.png";

export default function LogoSquare({ size }: { size?: "sm" | undefined }) {
  const [logos] = useState(() => {
    if (typeof window === "undefined") return { d: null, h: null, s: null };
    try {
      const cached = sessionStorage.getItem("atheles-site-theme");
      if (cached) {
        const t = JSON.parse(cached);
        return { d: t.logoDefault || null, h: t.logoHover || null, s: t.logoSmall || null };
      }
    } catch {}
    return { d: null, h: null, s: null };
  });

  const customDefault = logos.d;
  const customHover = logos.h;
  const customSmall = logos.s;

  // Use small logo variant for "sm" size
  const defaultSrc = size === "sm" && customSmall ? customSmall : customDefault;
  const hoverSrc = size === "sm" && customSmall ? customSmall : (customHover || customDefault);

  return (
    <div
      className={clsx("relative", {
        "w-[95px] md:w-[110px]": !size,
        "w-[70px]": size === "sm",
      })}
      style={{ aspectRatio: `${tan2Logo.width} / ${tan2Logo.height}` }}
    >
      {defaultSrc ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={defaultSrc}
            alt="ATHELES"
            className="absolute inset-0 h-full w-full object-contain transition-opacity duration-300 group-hover:opacity-0"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={hoverSrc || defaultSrc}
            alt="ATHELES"
            className="absolute inset-0 h-full w-full object-contain opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          />
        </>
      ) : (
        <>
          <Image
            src={tan2Logo}
            alt="ATHELES"
            fill
            className="object-contain transition-opacity duration-300 group-hover:opacity-0"
            priority
          />
          <Image
            src={tan1Logo}
            alt="ATHELES"
            fill
            className="object-contain opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            priority
          />
        </>
      )}
    </div>
  );
}

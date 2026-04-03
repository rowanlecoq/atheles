"use client";

import clsx from "clsx";
import Image from "next/image";
import { useEffect, useState } from "react";
import tan1Logo from "../tan1.png";
import tan2Logo from "../tan2.png";

export default function LogoSquare({ size }: { size?: "sm" | undefined }) {
  const [customDefault, setCustomDefault] = useState<string | null>(null);
  const [customHover, setCustomHover] = useState<string | null>(null);
  const [customSmall, setCustomSmall] = useState<string | null>(null);

  useEffect(() => {
    try {
      const cached = sessionStorage.getItem("atheles-site-theme");
      if (cached) {
        const t = JSON.parse(cached);
        if (t.logoDefault) setCustomDefault(t.logoDefault);
        if (t.logoHover) setCustomHover(t.logoHover);
        if (t.logoSmall) setCustomSmall(t.logoSmall);
      }
    } catch {}
  }, []);

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

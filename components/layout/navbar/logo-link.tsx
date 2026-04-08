"use client";

import {
  ThunderOverlay,
  useThunderShake,
} from "components/easter-eggs/thunder-shake";
import LogoSquare from "components/logo-square";
import Link from "next/link";

export function LogoLink() {
  const { handleClick, active } = useThunderShake();

  return (
    <>
      <Link
        href="/"
        prefetch={true}
        onClick={handleClick}
        className="atheles-logo-link group flex items-center justify-center outline-none ring-0 [-webkit-tap-highlight-color:transparent] focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
      >
        <LogoSquare />
      </Link>
      <ThunderOverlay active={active} />
    </>
  );
}

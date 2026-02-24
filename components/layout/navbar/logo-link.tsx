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
        className="mr-2 flex items-center justify-center md:w-auto lg:mr-6"
      >
        <LogoSquare />
      </Link>
      <ThunderOverlay active={active} />
    </>
  );
}

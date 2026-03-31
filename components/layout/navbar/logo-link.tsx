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
        className="group flex items-center justify-center outline-none [-webkit-tap-highlight-color:transparent]"
      >
        <LogoSquare />
      </Link>
      <ThunderOverlay active={active} />
    </>
  );
}

import clsx from "clsx";
import Image from "next/image";
import tan1Logo from "../tan1.png";
import tan2Logo from "../tan2.png";

export default function LogoSquare({ size }: { size?: "sm" | undefined }) {
  return (
    <div
      className={clsx("relative", {
        "w-[88px]": !size,
        "w-[60px]": size === "sm",
      })}
      style={{ aspectRatio: `${tan2Logo.width} / ${tan2Logo.height}` }}
    >
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
    </div>
  );
}

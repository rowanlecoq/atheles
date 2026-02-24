import clsx from "clsx";
import Image from "next/image";

export default function LogoSquare({ size }: { size?: "sm" | undefined }) {
  return (
    <Image
      src="/logo-atheles.webp"
      alt="ATHELES"
      width={size === "sm" ? 80 : 120}
      height={size === "sm" ? 28 : 40}
      className={clsx("h-auto object-contain", {
        "w-[120px]": !size,
        "w-[80px]": size === "sm",
      })}
      priority
    />
  );
}

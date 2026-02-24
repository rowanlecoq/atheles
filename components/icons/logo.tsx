import clsx from "clsx";
import Image from "next/image";

export default function LogoIcon({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={clsx("relative", className)} {...props}>
      <Image
        src="/logo-atheles.webp"
        alt="ATHELES"
        width={120}
        height={40}
        className="h-auto w-full object-contain"
        priority
      />
    </div>
  );
}

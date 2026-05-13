import { ShoppingCartIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";

export default function OpenCart({
  className,
  quantity,
}: {
  className?: string;
  quantity?: number;
}) {
  return (
    <div className="relative flex h-11 w-11 items-center justify-center text-brand-grey transition-colors hover:text-brand-gold">
      <ShoppingCartIcon
        className={clsx(
          "h-5 w-5",
          className,
        )}
      />

      {quantity ? (
        <span className="absolute -right-1 top-0 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-brand-gold text-[9px] font-bold text-brand-dark md:h-4 md:w-4 md:text-xs">
          {quantity > 9 ? "9+" : quantity}
        </span>
      ) : null}
    </div>
  );
}

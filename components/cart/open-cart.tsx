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
        <div className="absolute right-0 top-0 -mr-2 -mt-2 h-4 w-4 rounded-sm bg-brand-gold text-[11px] font-medium text-brand-dark">
          {quantity}
        </div>
      ) : null}
    </div>
  );
}

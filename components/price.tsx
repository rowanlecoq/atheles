"use client";

import clsx from "clsx";
import { useCurrency } from "components/currency-context";

const Price = ({
  amount,
  className,
  currencyCode = "USD",
  currencyCodeClassName,
}: {
  amount: string;
  className?: string;
  currencyCode: string;
  currencyCodeClassName?: string;
} & React.ComponentProps<"p">) => {
  const { currency, convert } = useCurrency();
  const convertedAmount = convert(amount);

  return (
    <p suppressHydrationWarning={true} className={className}>
      {`${new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
        currencyDisplay: "narrowSymbol",
      }).format(parseFloat(convertedAmount))}`}
      <span
        className={clsx("ml-1 inline", currencyCodeClassName)}
      >{`${currency}`}</span>
    </p>
  );
};

export default Price;

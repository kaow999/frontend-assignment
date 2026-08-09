import { formatPrice } from "../../lib/format";
import { cn } from "../../lib/utils";

type Props = {
  price: number;
  discountedPrice: number;
  percentageDiscount: number;
  className?: string;
};

/**
 * A discounted product shows what it costs now, what it used to cost struck
 * through, and by how much. An undiscounted one shows a single price — the
 * backend sets `discountedPrice` equal to `price` when the discount is 0, so
 * the flag to branch on is the percentage.
 */
export const PriceTag = ({
  price,
  discountedPrice,
  percentageDiscount,
  className,
}: Props) => {
  const isDiscounted = percentageDiscount > 0;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className="text-2xl font-bold">{formatPrice(discountedPrice)}</span>

      {isDiscounted && (
        <>
          <span className="text-2xl font-bold text-ink-faint line-through">
            {formatPrice(price)}
          </span>
          <span className="rounded-full bg-sale-soft px-3 py-1 text-xs font-medium text-sale">
            -{percentageDiscount}%
          </span>
        </>
      )}
    </div>
  );
};

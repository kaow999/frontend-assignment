"use client";

import { Minus, Plus, Trash2 } from "lucide-react";

import { MAX_QUANTITY } from "../../features/cart/use-cart";
import { cn } from "../../lib/utils";

type Props = {
  quantity: number;
  onChange: (quantity: number) => void;
  /** Called instead of `onChange` when stepping below 1. */
  onRemove: () => void;
  disabled?: boolean;
  className?: string;
};

/**
 * Stepping below one removes the line rather than clamping at one — otherwise
 * the minus button becomes a dead control at the exact moment the shopper is
 * trying to get rid of something.
 */
export const QuantityStepper = ({
  quantity,
  onChange,
  onRemove,
  disabled,
  className,
}: Props) => {
  const isLast = quantity <= 1;
  const atCap = quantity >= MAX_QUANTITY;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-white px-1 py-1 shadow-sm ring-1 ring-line",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => (isLast ? onRemove() : onChange(quantity - 1))}
        disabled={disabled}
        aria-label={isLast ? "Remove from cart" : "Decrease quantity"}
        className="flex size-8 items-center justify-center rounded-full transition-colors hover:bg-surface disabled:opacity-40"
      >
        {isLast ? (
          <Trash2 className="size-4" aria-hidden />
        ) : (
          <Minus className="size-4" aria-hidden />
        )}
      </button>

      <span
        aria-live="polite"
        className="min-w-6 text-center text-sm font-medium tabular-nums"
      >
        {quantity}
      </span>

      <button
        type="button"
        onClick={() => onChange(quantity + 1)}
        disabled={disabled || atCap}
        aria-label={atCap ? `Maximum ${MAX_QUANTITY} reached` : "Increase quantity"}
        className="flex size-8 items-center justify-center rounded-full transition-colors hover:bg-surface disabled:opacity-40"
      >
        <Plus className="size-4" aria-hidden />
      </button>
    </div>
  );
};

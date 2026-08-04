"use client";

import { Trash2 } from "lucide-react";
import Image from "next/image";

import {
  useRemoveCartItem,
  useUpdateCartQuantity,
} from "../../features/cart/use-cart";
import type { CartLine } from "../../lib/api/cart";
import { formatPrice } from "../../lib/format";
import { QuantityStepper } from "../ui/quantity-stepper";

export const CartLineRow = ({ line }: { line: CartLine }) => {
  const updateQuantity = useUpdateCartQuantity();
  const removeItem = useRemoveCartItem();

  const remove = () => removeItem.mutate({ id: line.id });
  const { product } = line;

  // `productId` is a nullable reference on the cart table, so a line can in
  // principle outlive its product. Showing it with a way to remove it beats
  // rendering a broken row.
  if (!product) {
    return (
      <li className="flex items-center justify-between gap-4 border-b border-line py-5">
        <p className="text-sm text-ink-muted">
          This product is no longer available.
        </p>
        <button
          onClick={remove}
          aria-label="Remove unavailable item"
          className="text-sale"
        >
          <Trash2 className="size-5" aria-hidden />
        </button>
      </li>
    );
  }

  return (
    <li className="flex gap-4 border-b border-line py-5">
      <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl bg-surface sm:size-32">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          sizes="128px"
          className="object-cover"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-bold">{product.name}</h3>
            {product.percentageDiscount > 0 && (
              <p className="mt-1 text-xs text-ink-muted">
                <span className="line-through">
                  {formatPrice(product.price)}
                </span>{" "}
                <span className="text-sale">
                  -{product.percentageDiscount}%
                </span>
              </p>
            )}
          </div>

          <button
            onClick={remove}
            aria-label={`Remove ${product.name} from cart`}
            className="shrink-0 p-1 text-sale transition-opacity hover:opacity-70"
          >
            <Trash2 className="size-5" aria-hidden />
          </button>
        </div>

        <div className="mt-3 flex items-end justify-between gap-3">
          <p className="text-xl font-bold">
            {formatPrice(product.discountedPrice * line.quantity)}
          </p>

          <QuantityStepper
            quantity={line.quantity}
            onChange={(quantity) =>
              updateQuantity.mutate({ id: line.id, quantity })
            }
            onRemove={remove}
          />
        </div>
      </div>
    </li>
  );
};

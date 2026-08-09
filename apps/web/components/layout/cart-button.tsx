"use client";

import { ShoppingCart } from "lucide-react";
import Link from "next/link";

import { useCart } from "../../features/cart/use-cart";

export const CartButton = () => {
  const { data } = useCart();
  const count = data?.totalItems ?? 0;

  return (
    <Link
      href="/cart"
      aria-label={
        count > 0 ? `Cart, ${count} item${count === 1 ? "" : "s"}` : "Cart"
      }
      className="relative shrink-0 rounded-full p-1 text-ink transition-opacity hover:opacity-70"
    >
      <ShoppingCart className="size-6" aria-hidden />

      {count > 0 && (
        <span
          className="absolute -top-1 -right-1 flex size-[18px] items-center justify-center rounded-full bg-sale px-1 text-[10px] font-semibold text-white"
          aria-hidden
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
};

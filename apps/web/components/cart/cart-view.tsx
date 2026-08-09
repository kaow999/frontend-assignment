"use client";

import { ShoppingBag } from "lucide-react";
import Link from "next/link";

import { useSession } from "../../features/auth/use-session";
import { useCart } from "../../features/cart/use-cart";
import { ApiError } from "../../lib/api/http";
import { Button, buttonStyles } from "../ui/button";
import { CartLineRow } from "./cart-line-row";
import { OrderSummary } from "./order-summary";

const Panel = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-card border border-line px-6 py-16 text-center">
    {children}
  </div>
);

/**
 * A signed-out cart is the shared guest cart, which is worth saying out loud —
 * otherwise it is a surprise when it turns out not to be private.
 */
const GuestNotice = () => (
  <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-card border border-line px-5 py-4">
    <p className="text-sm text-ink-muted">
      You are browsing as a guest. Sign in to keep this cart to yourself.
    </p>
    <Link
      href="/login?next=%2Fcart"
      className={buttonStyles({ variant: "outline" })}
    >
      Sign in
    </Link>
  </div>
);

export const CartView = () => {
  const { data: session } = useSession();
  const { data: cart, status, error, refetch } = useCart();

  if (status === "pending") {
    return (
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="h-96 animate-pulse rounded-card bg-surface" />
        <div className="h-80 animate-pulse rounded-card bg-surface" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <Panel>
        <p className="text-lg font-bold">We could not load your cart</p>
        <p className="mt-2 text-sm text-ink-muted">
          {error instanceof ApiError
            ? error.message
            : "Check that the API is running, then try again."}
        </p>
        <Button className="mt-6" onClick={() => refetch()}>
          Try again
        </Button>
      </Panel>
    );
  }

  const isEmpty = cart.items.length === 0;

  return (
    <>
      {session && !session.user && <GuestNotice />}

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_400px]">
        {isEmpty ? (
          <Panel>
            <ShoppingBag className="mx-auto size-10 text-ink-faint" aria-hidden />
            <p className="mt-4 text-lg font-bold">Your cart is empty</p>
            <p className="mt-2 text-sm text-ink-muted">
              Add something from the catalogue to get started.
            </p>
            <Link
              href="/"
              className={buttonStyles({ variant: "outline", className: "mt-6" })}
            >
              Browse products
            </Link>
          </Panel>
        ) : (
          <ul className="rounded-card border border-line px-6 py-1">
            {cart.items.map((line) => (
              <CartLineRow key={line.id} line={line} />
            ))}
          </ul>
        )}

        {/*
          The summary stays on an empty cart with checkout still live. The brief
          asks that checking out an empty cart fails and surfaces the error, and
          a disabled button would make that path unreachable.
        */}
        <OrderSummary cart={cart} />
      </div>
    </>
  );
};

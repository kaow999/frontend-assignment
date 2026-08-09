"use client";

import { Lock, ShoppingBag } from "lucide-react";
import Link from "next/link";

import { useCartOwner } from "../../features/auth/use-session";
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

export const CartView = () => {
  const { isSignedIn, isReady } = useCartOwner();
  const { data: cart, status, error, refetch } = useCart();

  // Carts belong to accounts, so there is nothing to show a signed-out visitor.
  if (isReady && !isSignedIn) {
    return (
      <Panel>
        <Lock className="mx-auto size-10 text-ink-faint" aria-hidden />
        <p className="mt-4 text-lg font-bold">Sign in to see your cart</p>
        <p className="mt-2 text-sm text-ink-muted">
          Your cart is kept with your account, so it follows you between devices.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/login?next=%2Fcart" className={buttonStyles()}>
            Sign in
          </Link>
          <Link
            href="/register?next=%2Fcart"
            className={buttonStyles({ variant: "outline" })}
          >
            Create an account
          </Link>
        </div>
      </Panel>
    );
  }

  if (!isReady || status === "pending") {
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

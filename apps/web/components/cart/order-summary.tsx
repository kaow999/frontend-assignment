"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

import { useCheckout } from "../../features/cart/use-cart";
import type { CartSummary } from "../../lib/api/cart";
import { ApiError } from "../../lib/api/http";
import { formatPrice } from "../../lib/format";
import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";

const Row = ({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "sale";
}) => (
  <div className="flex items-center justify-between py-2">
    <dt className="text-ink-muted">{label}</dt>
    <dd
      className={`font-bold ${tone === "sale" ? "text-sale" : "text-ink"}`}
    >
      {value}
    </dd>
  </div>
);

/**
 * Every figure comes from the cart query, which the mutations keep in step with
 * the lines — so the summary cannot drift from what is above it.
 */
export const OrderSummary = ({ cart }: { cart: CartSummary }) => {
  const router = useRouter();
  const checkout = useCheckout();

  const placeOrder = () =>
    checkout.mutate(undefined, {
      // Navigation happens here rather than in the hook: an empty cart comes
      // back 409 and has to surface as an error instead of a redirect.
      onSuccess: ({ orderId }) =>
        router.push(`/checkout/success?orderId=${encodeURIComponent(orderId)}`),
    });

  return (
    <section
      aria-label="Order summary"
      className="rounded-card border border-line px-6 py-5"
    >
      <h2 className="text-xl font-bold">Order Summary</h2>

      <dl className="mt-4 divide-y divide-line/60">
        <Row label="Items" value={String(cart.totalItems)} />
        <Row label="Subtotal" value={formatPrice(cart.subtotal)} />
        <Row
          label="Discount"
          value={
            cart.totalDiscount > 0
              ? `-${formatPrice(cart.totalDiscount)}`
              : formatPrice(0)
          }
          tone={cart.totalDiscount > 0 ? "sale" : undefined}
        />
      </dl>

      <div className="mt-2 flex items-center justify-between border-t border-line pt-4">
        <span className="font-medium">Total</span>
        <span className="text-2xl font-bold">{formatPrice(cart.total)}</span>
      </div>

      <Button
        size="lg"
        className="mt-6 w-full"
        onClick={placeOrder}
        disabled={checkout.isPending}
      >
        {checkout.isPending ? (
          <>
            <Spinner className="size-4" />
            Placing order
          </>
        ) : (
          <>
            Go to Checkout
            <ArrowRight className="size-4" aria-hidden />
          </>
        )}
      </Button>

      {checkout.isError && (
        <p
          role="alert"
          className="mt-4 rounded-2xl bg-sale-soft px-4 py-3 text-sm text-sale"
        >
          {checkout.error instanceof ApiError
            ? checkout.error.message
            : "Checkout failed. Please try again."}
        </p>
      )}
    </section>
  );
};

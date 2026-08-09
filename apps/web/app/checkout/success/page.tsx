import { CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { buttonStyles } from "../../../components/ui/button";

export const metadata: Metadata = {
  title: "Order confirmed — SHOP.CO",
};

/**
 * A server component: the order id arrives as a search param, so there is
 * nothing to fetch and no reason to ship this as client JavaScript.
 *
 * Checkout is mocked on the backend — no order is stored — so the id cannot be
 * looked up again. Landing here without one means the page was opened directly.
 */
const CheckoutSuccessPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) => {
  const { orderId } = await searchParams;

  return (
    <div className="container-page flex flex-col items-center py-20 text-center">
      {orderId ? (
        <>
          <CheckCircle2 className="size-14 text-ink" aria-hidden />
          <h1 className="mt-6 text-2xl font-bold sm:text-[32px]">
            Thank you for your order
          </h1>
          <p className="mt-3 max-w-md text-ink-muted">
            Your order has been placed. Keep this reference in case you need to
            get in touch with us.
          </p>

          <div className="mt-8 rounded-card border border-line px-8 py-5">
            <p className="text-xs tracking-wide text-ink-muted uppercase">
              Order id
            </p>
            <p className="mt-1 font-mono text-lg font-bold break-all">
              {orderId}
            </p>
          </div>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold sm:text-[32px]">
            No order to show
          </h1>
          <p className="mt-3 max-w-md text-ink-muted">
            This page shows the reference for an order you just placed.
          </p>
        </>
      )}

      <Link href="/" className={buttonStyles({ className: "mt-10" })}>
        Continue shopping
      </Link>
    </div>
  );
};

export default CheckoutSuccessPage;

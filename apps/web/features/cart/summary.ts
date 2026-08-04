import type { CartSummary } from "../../lib/api/cart";

/**
 * Mirrors the backend's own arithmetic (`cart.biz.ts`): `subtotal` is at list
 * price, `total` is what is actually paid, and the discount is the gap.
 *
 * It exists so an optimistic quantity change can recompute the summary in the
 * same tick the line changes — otherwise the totals would lag a round trip
 * behind the items they describe, which is exactly the inconsistency the
 * assignment asks us to avoid. The server's own numbers overwrite these as soon
 * as the mutation settles.
 */
export const summarize = (items: CartSummary["items"]): CartSummary => {
  let totalItems = 0;
  let subtotal = 0;
  let total = 0;

  for (const item of items) {
    totalItems += item.quantity;
    if (!item.product) continue;

    subtotal += item.product.price * item.quantity;
    total += item.product.discountedPrice * item.quantity;
  }

  return { items, totalItems, subtotal, total, totalDiscount: subtotal - total };
};

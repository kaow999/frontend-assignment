"use client";

import { LogIn, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { useCartOwner } from "../../features/auth/use-session";
import {
  useAddToCart,
  useCartLinesByProduct,
  useRemoveCartItem,
  useUpdateCartQuantity,
} from "../../features/cart/use-cart";
import { QuantityStepper } from "../ui/quantity-stepper";
import { Spinner } from "../ui/spinner";

const ROUND_BUTTON =
  "flex size-11 items-center justify-center rounded-full bg-white text-ink shadow-sm ring-1 ring-line transition-colors hover:bg-surface disabled:opacity-60";

/**
 * One control with three faces: a signed-out visitor is sent to sign in, a
 * product not yet in the cart gets a plus button, and one already in it gets
 * its line's stepper. Reading the quantity off the cart query rather than local
 * state means two cards for the same product can never disagree.
 */
export const AddToCartControl = ({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) => {
  const { isSignedIn, isReady } = useCartOwner();
  const linesByProduct = useCartLinesByProduct();
  const line = linesByProduct.get(productId);

  const addToCart = useAddToCart();
  const updateQuantity = useUpdateCartQuantity();
  const removeItem = useRemoveCartItem();

  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (!isReady) {
    return <span className={ROUND_BUTTON} aria-hidden />;
  }

  if (!isSignedIn) {
    // Come back to the exact list they were looking at, filters and all.
    const query = searchParams.toString();
    const next = query ? `${pathname}?${query}` : pathname;

    return (
      <Link
        href={`/login?next=${encodeURIComponent(next)}`}
        aria-label={`Sign in to add ${productName} to your cart`}
        title="Sign in to add to cart"
        className={ROUND_BUTTON}
      >
        <LogIn className="size-5" aria-hidden />
      </Link>
    );
  }

  if (line) {
    return (
      <QuantityStepper
        quantity={line.quantity}
        onChange={(quantity) => updateQuantity.mutate({ id: line.id, quantity })}
        onRemove={() => removeItem.mutate({ id: line.id })}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => addToCart.mutate({ productId })}
      disabled={addToCart.isPending}
      aria-label={`Add ${productName} to cart`}
      className={ROUND_BUTTON}
    >
      {addToCart.isPending ? (
        <Spinner className="size-4" />
      ) : (
        <Plus className="size-5" aria-hidden />
      )}
    </button>
  );
};

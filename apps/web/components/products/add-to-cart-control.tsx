"use client";

import { Plus } from "lucide-react";

import {
  useAddToCart,
  useCartLinesByProduct,
  useRemoveCartItem,
  useUpdateCartQuantity,
} from "../../features/cart/use-cart";
import { QuantityStepper } from "../ui/quantity-stepper";
import { Spinner } from "../ui/spinner";

/**
 * One control with two faces, as in the design: a product not yet in the cart
 * gets a plus button, and one already in it gets its line's stepper. Reading
 * the quantity off the cart query rather than local state means the two cards
 * for the same product — or another tab — can never disagree.
 */
export const AddToCartControl = ({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) => {
  const linesByProduct = useCartLinesByProduct();
  const line = linesByProduct.get(productId);

  const addToCart = useAddToCart();
  const updateQuantity = useUpdateCartQuantity();
  const removeItem = useRemoveCartItem();

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
      className="flex size-11 items-center justify-center rounded-full bg-white text-ink shadow-sm ring-1 ring-line transition-colors hover:bg-surface disabled:opacity-60"
    >
      {addToCart.isPending ? (
        <Spinner className="size-4" />
      ) : (
        <Plus className="size-5" aria-hidden />
      )}
    </button>
  );
};

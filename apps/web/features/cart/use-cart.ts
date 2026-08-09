"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

import {
  addCartItem,
  checkout,
  clearCart,
  fetchCart,
  removeCartItem,
  updateCartItemQuantity,
  type CartSummary,
} from "../../lib/api/cart";
import { queryKeys } from "../../lib/query-keys";
import { useCartOwner } from "../auth/use-session";
import { summarize } from "./summary";

/** The backend clamps here too; the UI needs to know so it can stop at the cap. */
export const MAX_QUANTITY = 99;

/**
 * The cart lives on the server — the API picks which one from the session
 * cookie — so the server is the only sensible source of truth. Nothing about
 * the cart is mirrored into React state or storage; every view reads this query.
 *
 * There is no guest cart: signed out, `/cart` answers 401, so the query is not
 * run at all rather than fired off to fail.
 */
export const useCart = () => {
  const { owner, isSignedIn, isReady } = useCartOwner();

  return useQuery({
    queryKey: queryKeys.cart.of(owner),
    queryFn: ({ signal }) => fetchCart(signal),
    // Held back until we know who is asking, so the response is never filed
    // under the wrong owner — and skipped entirely for a signed-out visitor.
    enabled: isReady && isSignedIn,
    // Unlike the catalogue, the cart is mutable — never serve it stale.
    staleTime: 0,
  });
};

/** Lets the grid show a stepper for products already in the cart. */
export const useCartLinesByProduct = () => {
  const { data } = useCart();

  return useMemo(() => {
    const byProduct = new Map<string, CartSummary["items"][number]>();
    for (const item of data?.items ?? []) {
      if (item.productId) byProduct.set(item.productId, item);
    }

    return byProduct;
  }, [data]);
};

/**
 * Quantity and removal are optimistic: the shopper is looking straight at the
 * number they just changed, and a round trip of lag there reads as jank. Adds
 * are not — a new line has no id until the server mints one, and faking one
 * risks the row flickering as it is replaced.
 */
const useOptimisticCartMutation = <TArgs>(
  mutationFn: (args: TArgs) => Promise<unknown>,
  apply: (cart: CartSummary, args: TArgs) => CartSummary,
) => {
  const queryClient = useQueryClient();
  const { owner } = useCartOwner();
  const cartKey = queryKeys.cart.of(owner);

  return useMutation({
    mutationFn,
    onMutate: async (args: TArgs) => {
      await queryClient.cancelQueries({ queryKey: cartKey });
      const previous = queryClient.getQueryData<CartSummary>(cartKey);

      if (previous) {
        queryClient.setQueryData(cartKey, apply(previous, args));
      }

      return { previous };
    },
    onError: (_error, _args, context) => {
      if (context?.previous) {
        queryClient.setQueryData(cartKey, context.previous);
      }
    },
    // Settled rather than success: either way the server's numbers win.
    onSettled: () => queryClient.invalidateQueries({ queryKey: cartKey }),
  });
};

export const useUpdateCartQuantity = () =>
  useOptimisticCartMutation(
    ({ id, quantity }: { id: string; quantity: number }) =>
      updateCartItemQuantity(id, quantity),
    (cart, { id, quantity }) =>
      summarize(
        cart.items.map((item) =>
          item.id === id ? { ...item, quantity } : item,
        ),
      ),
  );

export const useRemoveCartItem = () =>
  useOptimisticCartMutation(
    ({ id }: { id: string }) => removeCartItem(id),
    (cart, { id }) => summarize(cart.items.filter((item) => item.id !== id)),
  );

/** Refetches whichever cart the current visitor owns. */
const useRefreshCart = () => {
  const queryClient = useQueryClient();
  const { owner } = useCartOwner();

  return () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.cart.of(owner) });
};

export const useAddToCart = () => {
  const refreshCart = useRefreshCart();

  return useMutation({
    mutationFn: (input: { productId: string; quantity?: number }) =>
      addCartItem(input),
    onSuccess: refreshCart,
  });
};

export const useClearCart = () => {
  const refreshCart = useRefreshCart();

  return useMutation({ mutationFn: clearCart, onSuccess: refreshCart });
};

/**
 * Checkout empties the cart server-side, so the cached copy has to go with it.
 * Navigation is left to the caller — an empty cart comes back 409 and must
 * surface as an error instead of a redirect.
 */
export const useCheckout = () => {
  const refreshCart = useRefreshCart();

  return useMutation({ mutationFn: checkout, onSuccess: refreshCart });
};

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
import { summarize } from "./summary";

/** The backend clamps here too; the UI needs to know so it can stop at the cap. */
export const MAX_QUANTITY = 99;

/**
 * There is no auth on the API, so the cart is one global row set on the server
 * — which makes the server the only sensible source of truth. Nothing about the
 * cart is mirrored into React state or storage; every view reads this query.
 */
export const useCart = () =>
  useQuery({
    queryKey: queryKeys.cart,
    queryFn: ({ signal }) => fetchCart(signal),
    // Unlike the catalogue, the cart is mutable and shared — never serve it stale.
    staleTime: 0,
  });

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

  return useMutation({
    mutationFn,
    onMutate: async (args: TArgs) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.cart });
      const previous = queryClient.getQueryData<CartSummary>(queryKeys.cart);

      if (previous) {
        queryClient.setQueryData(queryKeys.cart, apply(previous, args));
      }

      return { previous };
    },
    onError: (_error, _args, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.cart, context.previous);
      }
    },
    // Settled rather than success: either way the server's numbers win.
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.cart }),
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

export const useAddToCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { productId: string; quantity?: number }) =>
      addCartItem(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.cart }),
  });
};

export const useClearCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: clearCart,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.cart }),
  });
};

/**
 * Checkout empties the cart server-side, so the cached copy has to go with it.
 * Navigation is left to the caller — an empty cart comes back 409 and must
 * surface as an error instead of a redirect.
 */
export const useCheckout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: checkout,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.cart }),
  });
};

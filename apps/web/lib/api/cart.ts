import { api } from "../eden";
import { unwrap } from "./http";

export type CartSummary = NonNullable<
  Awaited<ReturnType<typeof api.cart.get>>["data"]
>;

export type CartLine = CartSummary["items"][number];

export const fetchCart = async (signal?: AbortSignal): Promise<CartSummary> =>
  unwrap(await api.cart.get({ fetch: { signal } }));

export const addCartItem = async (input: {
  productId: string;
  quantity?: number;
}) => unwrap(await api.cart.items.post(input));

export const updateCartItemQuantity = async (id: string, quantity: number) =>
  unwrap(await api.cart.items({ id }).patch({ quantity }));

export const removeCartItem = async (id: string) =>
  unwrap(await api.cart.items({ id }).delete());

export const clearCart = async () => unwrap(await api.cart.delete());

/** Mock checkout: mints an order id and empties the cart server-side. */
export const checkout = async (): Promise<{ orderId: string }> =>
  unwrap(await api.cart.checkout.post());

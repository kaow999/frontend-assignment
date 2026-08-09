import type { ProductQuery } from "./api/products";

/**
 * One place where cache keys are built, so an invalidation cannot silently miss
 * a query because the key was spelled differently at the call site.
 */
export const queryKeys = {
  products: {
    all: ["products"] as const,
    list: (filters: ProductQuery) =>
      [...queryKeys.products.all, "list", filters] as const,
  },
  colors: ["colors"] as const,
  sizes: ["sizes"] as const,
  session: ["session"] as const,
  /**
   * The cart is keyed by who owns it, so signing in or out swaps cache entries
   * instead of showing the previous occupant's basket for a frame. `all` is the
   * prefix used to evict every cart at once when the session changes.
   */
  cart: {
    all: ["cart"] as const,
    of: (owner: string) => ["cart", owner] as const,
  },
};

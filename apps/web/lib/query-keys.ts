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
  cart: ["cart"] as const,
};

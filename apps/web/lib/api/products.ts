import { api } from "../eden";
import { unwrap } from "./http";

/**
 * Types are read back off the Treaty client rather than re-declared, so they
 * track the backend's zod schemas automatically. `@repo/backend` only exposes
 * its root entry point, so deep-importing the schemas is not an option.
 */
export type ProductListResponse = NonNullable<
  Awaited<ReturnType<typeof api.products.get>>["data"]
>;

export type Product = ProductListResponse["items"][number];

export type ProductQuery = {
  q?: string;
  colorIds?: string[];
  sizeIds?: string[];
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
  offset?: number;
};

/**
 * Treaty serialises an array as repeated params (`?colorIds=a&colorIds=b`),
 * which Elysia parses back into an array — verified against the running API.
 * An empty selection is dropped rather than sent: the backend rejects an empty
 * string, and "no filter" is what we mean anyway.
 */
const facetIds = (ids: string[] | undefined): string[] | undefined =>
  ids?.length ? ids : undefined;

export const fetchProducts = async (
  query: ProductQuery,
  signal?: AbortSignal,
): Promise<ProductListResponse> =>
  unwrap(
    await api.products.get({
      query: {
        q: query.q?.trim() || undefined,
        colorIds: facetIds(query.colorIds),
        sizeIds: facetIds(query.sizeIds),
        minPrice: query.minPrice,
        maxPrice: query.maxPrice,
        limit: query.limit,
        offset: query.offset,
      },
      fetch: { signal },
    }),
  );

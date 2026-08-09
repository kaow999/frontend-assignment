"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { fetchProducts, type ProductQuery } from "../../lib/api/products";
import { queryKeys } from "../../lib/query-keys";
import {
  PRICE_CEILING,
  PRICE_FLOOR,
  type ProductFilters,
} from "./use-product-filters";

const PAGE_SIZE = 12;

/**
 * Only the facets the shopper actually narrowed are sent. A slider sitting at
 * its full range is not a filter, and leaving it out keeps the query key — and
 * therefore the cache entry — the same as an unfiltered browse.
 */
const toQuery = (filters: ProductFilters): ProductQuery => ({
  q: filters.q.trim() || undefined,
  colorIds: filters.colorIds.length ? filters.colorIds : undefined,
  sizeIds: filters.sizeIds.length ? filters.sizeIds : undefined,
  minPrice: filters.minPrice > PRICE_FLOOR ? filters.minPrice : undefined,
  maxPrice: filters.maxPrice < PRICE_CEILING ? filters.maxPrice : undefined,
});

export const useProducts = (filters: ProductFilters) => {
  const query = useMemo(() => toQuery(filters), [filters]);

  const result = useInfiniteQuery({
    queryKey: queryKeys.products.list(query),
    queryFn: ({ pageParam, signal }) =>
      fetchProducts({ ...query, limit: PAGE_SIZE, offset: pageParam }, signal),
    initialPageParam: 0,
    // `hasMore` is the server's own answer to "is the catalogue exhausted",
    // so fetching stops on its say-so rather than on a count we derive.
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.offset + lastPage.items.length : undefined,
  });

  const products = useMemo(
    () => result.data?.pages.flatMap((page) => page.items) ?? [],
    [result.data],
  );

  return {
    ...result,
    products,
    total: result.data?.pages[0]?.total ?? 0,
  };
};

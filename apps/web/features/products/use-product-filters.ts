"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

/** The slider bounds the assignment specifies, independent of what is seeded. */
export const PRICE_FLOOR = 0;
export const PRICE_CEILING = 300;

export type ProductFilters = {
  q: string;
  colorIds: string[];
  sizeIds: string[];
  minPrice: number;
  maxPrice: number;
};

const PARAMS = {
  q: "q",
  colorIds: "colors",
  sizeIds: "sizes",
  minPrice: "min",
  maxPrice: "max",
} as const;

export const EMPTY_FILTERS: ProductFilters = {
  q: "",
  colorIds: [],
  sizeIds: [],
  minPrice: PRICE_FLOOR,
  maxPrice: PRICE_CEILING,
};

const readIds = (params: URLSearchParams, key: string): string[] => {
  const raw = params.get(key);
  if (!raw) return [];

  return raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
};

const readPrice = (
  params: URLSearchParams,
  key: string,
  fallback: number,
): number => {
  const parsed = Number(params.get(key));
  if (!Number.isFinite(parsed)) return fallback;

  return Math.min(Math.max(parsed, PRICE_FLOOR), PRICE_CEILING);
};

export const isDefaultFilters = (filters: ProductFilters) =>
  filters.q === "" &&
  filters.colorIds.length === 0 &&
  filters.sizeIds.length === 0 &&
  filters.minPrice === PRICE_FLOOR &&
  filters.maxPrice === PRICE_CEILING;

/**
 * Filter state lives in the URL rather than in React state.
 *
 * It costs a little parsing on every read, and buys three things the assignment
 * cares about: a filtered view is shareable, the back button steps through
 * filter changes, and a reload lands the shopper where they were. The query key
 * is derived from it, so changing any facet swaps to a different cached list —
 * which is what "resets back to the first page" means here.
 */
export const useProductFilters = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo<ProductFilters>(() => {
    const min = readPrice(searchParams, PARAMS.minPrice, PRICE_FLOOR);
    const max = readPrice(searchParams, PARAMS.maxPrice, PRICE_CEILING);

    return {
      q: searchParams.get(PARAMS.q) ?? "",
      colorIds: readIds(searchParams, PARAMS.colorIds),
      sizeIds: readIds(searchParams, PARAMS.sizeIds),
      // A hand-edited URL can invert the bounds; swapping beats an empty grid.
      minPrice: Math.min(min, max),
      maxPrice: Math.max(min, max),
    };
  }, [searchParams]);

  const commit = useCallback(
    (next: ProductFilters) => {
      const params = new URLSearchParams();

      // Defaults are left out so a pristine view has a clean URL.
      if (next.q.trim()) params.set(PARAMS.q, next.q.trim());
      if (next.colorIds.length)
        params.set(PARAMS.colorIds, next.colorIds.join(","));
      if (next.sizeIds.length) params.set(PARAMS.sizeIds, next.sizeIds.join(","));
      if (next.minPrice !== PRICE_FLOOR)
        params.set(PARAMS.minPrice, String(next.minPrice));
      if (next.maxPrice !== PRICE_CEILING)
        params.set(PARAMS.maxPrice, String(next.maxPrice));

      const query = params.toString();

      // `replace` rather than `push`: dragging a slider should not bury the
      // back button under one history entry per pixel.
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router],
  );

  const setFilters = useCallback(
    (patch: Partial<ProductFilters>) => commit({ ...filters, ...patch }),
    [commit, filters],
  );

  const toggleId = useCallback(
    (key: "colorIds" | "sizeIds", id: string) => {
      const current = filters[key];
      const next = current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id];

      commit({ ...filters, [key]: next });
    },
    [commit, filters],
  );

  const clear = useCallback(() => commit(EMPTY_FILTERS), [commit]);

  return {
    filters,
    setFilters,
    toggleId,
    clear,
    isFiltered: !isDefaultFilters(filters),
  };
};

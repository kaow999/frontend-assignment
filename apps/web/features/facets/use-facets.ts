"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchColors, fetchSizes, type Size } from "../../lib/api/facets";
import { queryKeys } from "../../lib/query-keys";

/**
 * The swatches and pills are reference data, not content — they change only
 * when the catalogue is reseeded, so they are cached for the session rather
 * than refetched alongside the product list.
 */
const facetOptions = {
  staleTime: Infinity,
  gcTime: Infinity,
} as const;

export const useColors = () =>
  useQuery({
    queryKey: queryKeys.colors,
    queryFn: ({ signal }) => fetchColors(signal),
    ...facetOptions,
  });

/**
 * `GET /sizes` orders alphabetically, which puts 3X-Large and 4X-Large ahead of
 * Small. The pills are still whatever the API returns — this only decides the
 * order they are laid out in, smallest to largest as the design has them.
 * Anything the API adds that is not in this list keeps its server order and
 * follows on the end.
 */
const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL"];

const byGarmentSize = (a: Size, b: Size) => {
  const rankA = SIZE_ORDER.indexOf(a.value);
  const rankB = SIZE_ORDER.indexOf(b.value);

  if (rankA === -1 && rankB === -1) return 0;
  if (rankA === -1) return 1;
  if (rankB === -1) return -1;

  return rankA - rankB;
};

export const useSizes = () =>
  useQuery({
    queryKey: queryKeys.sizes,
    queryFn: ({ signal }) => fetchSizes(signal),
    select: (sizes) => [...sizes].sort(byGarmentSize),
    ...facetOptions,
  });

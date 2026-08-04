"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchColors, fetchSizes } from "../../lib/api/facets";
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

export const useSizes = () =>
  useQuery({
    queryKey: queryKeys.sizes,
    queryFn: ({ signal }) => fetchSizes(signal),
    ...facetOptions,
  });

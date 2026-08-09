"use client";

import { SlidersHorizontal } from "lucide-react";

import type { useProductFilters } from "../../features/products/use-product-filters";
import { Button } from "../ui/button";
import { ColorFilter } from "./color-filter";
import { FilterSection } from "./filter-section";
import { PriceRangeFilter } from "./price-range-filter";
import { SizeFilter } from "./size-filter";

type Props = Pick<
  ReturnType<typeof useProductFilters>,
  "filters" | "setFilters" | "toggleId" | "clear" | "isFiltered"
>;

/**
 * Facets apply the moment they are touched rather than waiting on the design's
 * "Apply Filter" button — the brief asks for a filter change to reset the list
 * to the first page, which reads as live filtering. The button is kept, doing
 * the job the panel otherwise has no control for: clearing everything.
 */
export const FilterPanelContent = ({
  filters,
  setFilters,
  toggleId,
  clear,
  isFiltered,
}: Props) => (
  <>
    <FilterSection title="Price">
      <PriceRangeFilter
        minPrice={filters.minPrice}
        maxPrice={filters.maxPrice}
        onCommit={setFilters}
      />
    </FilterSection>

    <FilterSection title="Colors">
      <ColorFilter
        selected={filters.colorIds}
        onToggle={(id) => toggleId("colorIds", id)}
      />
    </FilterSection>

    <FilterSection title="Size">
      <SizeFilter
        selected={filters.sizeIds}
        onToggle={(id) => toggleId("sizeIds", id)}
      />
    </FilterSection>

    <Button className="mt-2 w-full" onClick={clear} disabled={!isFiltered}>
      Clear Filters
    </Button>
  </>
);

export const FilterPanel = (props: Props) => (
  <aside
    aria-label="Product filters"
    className="rounded-card border border-line px-6 py-5"
  >
    <div className="flex items-center justify-between border-b border-line pb-5">
      <h2 className="text-xl font-bold">Filters</h2>
      <SlidersHorizontal className="size-5 text-ink-faint" aria-hidden />
    </div>

    <FilterPanelContent {...props} />
  </aside>
);

"use client";

import { useProductFilters } from "../../features/products/use-product-filters";
import { useProducts } from "../../features/products/use-products";
import { FilterDrawer } from "../filters/filter-drawer";
import { FilterPanel } from "../filters/filter-panel";
import { ProductGrid } from "../products/product-grid";

export const CategoryView = () => {
  const { filters, setFilters, toggleId, clear, isFiltered } =
    useProductFilters();
  const query = useProducts(filters);

  const panel = { filters, setFilters, toggleId, clear, isFiltered };

  return (
    <div className="container-page py-6">
      <div className="grid items-start gap-6 lg:grid-cols-[295px_minmax(0,1fr)]">
        <div className="hidden lg:block">
          <FilterPanel {...panel} />
        </div>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-2xl font-bold sm:text-[32px]">Clothes</h1>

            <div className="flex items-center gap-3">
              {query.status === "success" && (
                <p className="text-sm text-ink-muted">
                  Showing {query.products.length} of {query.total}
                </p>
              )}
              <FilterDrawer {...panel} resultCount={query.total} />
            </div>
          </div>

          <div className="mt-6">
            <ProductGrid {...query} onClearFilters={clear} />
          </div>
        </div>
      </div>
    </div>
  );
};

"use client";

import { useInfiniteScroll } from "../../features/products/use-infinite-scroll";
import type { useProducts } from "../../features/products/use-products";
import { ApiError } from "../../lib/api/http";
import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";
import { ProductCard } from "./product-card";
import { ProductCardSkeleton } from "./product-card-skeleton";

const SKELETON_COUNT = 6;
const GRID = "grid grid-cols-1 gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3";

type Props = ReturnType<typeof useProducts> & { onClearFilters: () => void };

export const ProductGrid = ({
  products,
  status,
  error,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  refetch,
  onClearFilters,
}: Props) => {
  const sentinelRef = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  });

  if (status === "pending") {
    return (
      <div className={GRID}>
        {Array.from({ length: SKELETON_COUNT }, (_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="rounded-card border border-line px-6 py-16 text-center">
        <p className="text-lg font-bold">We could not load the catalogue</p>
        <p className="mt-2 text-sm text-ink-muted">
          {error instanceof ApiError
            ? error.message
            : "Check that the API is running, then try again."}
        </p>
        <Button className="mt-6" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-card border border-line px-6 py-16 text-center">
        <p className="text-lg font-bold">No products match these filters</p>
        <p className="mt-2 text-sm text-ink-muted">
          Try widening the price range or clearing a facet.
        </p>
        <Button variant="outline" className="mt-6" onClick={onClearFilters}>
          Clear filters
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className={GRID}>
        {products.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            priority={index < 3}
          />
        ))}
      </div>

      {/* Sits below the last card; crossing it pulls the next page in. */}
      <div ref={sentinelRef} aria-hidden className="h-px" />

      <div
        className="flex justify-center py-10 text-sm text-ink-muted"
        aria-live="polite"
      >
        {isFetchingNextPage && (
          <span className="flex items-center gap-2">
            <Spinner className="size-4" />
            Loading more products
          </span>
        )}
        {!hasNextPage && !isFetchingNextPage && (
          <span>You have reached the end of the catalogue.</span>
        )}
      </div>
    </>
  );
};

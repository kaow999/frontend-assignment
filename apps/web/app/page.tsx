import { Suspense } from "react";

import { CategoryView } from "../components/category/category-view";
import { ProductCardSkeleton } from "../components/products/product-card-skeleton";

/**
 * The category view reads its filters from the URL, so it needs a Suspense
 * boundary to prerender behind.
 */
const CategoryFallback = () => (
  <div className="container-page py-6">
    <div className="grid items-start gap-6 lg:grid-cols-[295px_minmax(0,1fr)]">
      <div className="hidden h-[520px] rounded-card border border-line lg:block" />
      <div>
        <h1 className="text-2xl font-bold sm:text-[32px]">Clothes</h1>
        <div className="mt-6 grid grid-cols-1 gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  </div>
);

const HomePage = () => (
  <Suspense fallback={<CategoryFallback />}>
    <CategoryView />
  </Suspense>
);

export default HomePage;

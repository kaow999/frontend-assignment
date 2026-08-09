export const ProductCardSkeleton = () => (
  <div className="flex animate-pulse flex-col" aria-hidden>
    <div className="aspect-square rounded-card bg-surface" />
    <div className="mt-4 h-5 w-3/4 rounded bg-surface" />
    <div className="mt-3 h-4 w-1/2 rounded bg-surface" />
    <div className="mt-3 h-7 w-1/3 rounded bg-surface" />
  </div>
);

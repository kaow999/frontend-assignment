"use client";

import { useSizes } from "../../features/facets/use-facets";
import { cn } from "../../lib/utils";

/** Pills come from `GET /sizes`, in the order the API returns them. */
export const SizeFilter = ({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (id: string) => void;
}) => {
  const { data: sizes, status } = useSizes();

  if (status === "pending") {
    return (
      <div className="flex flex-wrap gap-2" aria-hidden>
        {Array.from({ length: 9 }, (_, index) => (
          <div
            key={index}
            className="h-10 w-24 animate-pulse rounded-full bg-surface"
          />
        ))}
      </div>
    );
  }

  if (status === "error") {
    return <p className="text-sm text-ink-muted">Sizes are unavailable.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {sizes.map((size) => {
        const isSelected = selected.includes(size.id);

        return (
          <button
            key={size.id}
            type="button"
            onClick={() => onToggle(size.id)}
            aria-pressed={isSelected}
            className={cn(
              "rounded-full px-5 py-2.5 text-sm transition-colors",
              isSelected
                ? "bg-ink text-white"
                : "bg-surface text-ink-muted hover:bg-surface-strong",
            )}
          >
            {size.name}
          </button>
        );
      })}
    </div>
  );
};

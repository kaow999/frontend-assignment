"use client";

import { Check } from "lucide-react";

import { useColors } from "../../features/facets/use-facets";
import { cn } from "../../lib/utils";

/**
 * Swatches come from `GET /colors` rather than a hardcoded list, so reseeding
 * the catalogue with a different palette needs no frontend change.
 */
export const ColorFilter = ({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (id: string) => void;
}) => {
  const { data: colors, status } = useColors();

  if (status === "pending") {
    return (
      <div className="flex flex-wrap gap-3" aria-hidden>
        {Array.from({ length: 10 }, (_, index) => (
          <div
            key={index}
            className="size-9 animate-pulse rounded-full bg-surface"
          />
        ))}
      </div>
    );
  }

  if (status === "error") {
    return <p className="text-sm text-ink-muted">Colours are unavailable.</p>;
  }

  return (
    <div className="flex flex-wrap gap-3">
      {colors.map((color) => {
        const isSelected = selected.includes(color.id);

        return (
          <button
            key={color.id}
            type="button"
            onClick={() => onToggle(color.id)}
            aria-pressed={isSelected}
            title={color.name}
            className={cn(
              "flex size-9 items-center justify-center rounded-full transition-transform hover:scale-105",
              // A white swatch would otherwise vanish against the panel.
              "ring-1 ring-line ring-inset",
            )}
            style={{ backgroundColor: color.hex }}
          >
            {isSelected && (
              <Check
                className={cn(
                  "size-4",
                  // Pick the tick colour off the swatch so it stays readable.
                  isLight(color.hex) ? "text-ink" : "text-white",
                )}
                aria-hidden
              />
            )}
            <span className="sr-only">{color.name}</span>
          </button>
        );
      })}
    </div>
  );
};

/** Relative luminance, so a tick on yellow is dark and one on navy is light. */
const isLight = (hex: string): boolean => {
  const normalized = hex.replace("#", "");
  const full =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;

  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);

  if ([r, g, b].some(Number.isNaN)) return false;

  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
};

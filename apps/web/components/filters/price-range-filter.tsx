"use client";

import * as Slider from "@radix-ui/react-slider";
import { useEffect, useState } from "react";

import {
  PRICE_CEILING,
  PRICE_FLOOR,
} from "../../features/products/use-product-filters";
import { formatPrice } from "../../lib/format";

const STEP = 5;

type Props = {
  minPrice: number;
  maxPrice: number;
  onCommit: (range: { minPrice: number; maxPrice: number }) => void;
};

/**
 * Radix supplies the two-thumb keyboard and pointer behaviour; hand-rolling an
 * accessible range slider is not a good use of the budget here.
 *
 * The thumbs track local state while dragging and only write to the URL on
 * release — a commit per pixel would refetch the catalogue dozens of times for
 * one gesture.
 */
export const PriceRangeFilter = ({ minPrice, maxPrice, onCommit }: Props) => {
  const [draft, setDraft] = useState<number[]>([minPrice, maxPrice]);

  // Follow the URL when it changes elsewhere, e.g. "Clear filters".
  useEffect(() => setDraft([minPrice, maxPrice]), [minPrice, maxPrice]);

  const [low = PRICE_FLOOR, high = PRICE_CEILING] = draft;

  return (
    <div>
      <Slider.Root
        value={draft}
        onValueChange={setDraft}
        onValueCommit={([nextMin, nextMax]) =>
          onCommit({
            minPrice: nextMin ?? PRICE_FLOOR,
            maxPrice: nextMax ?? PRICE_CEILING,
          })
        }
        min={PRICE_FLOOR}
        max={PRICE_CEILING}
        step={STEP}
        minStepsBetweenThumbs={1}
        className="relative flex h-5 w-full touch-none items-center select-none"
      >
        <Slider.Track className="relative h-1.5 grow rounded-full bg-surface">
          <Slider.Range className="absolute h-full rounded-full bg-ink" />
        </Slider.Track>

        <Slider.Thumb
          aria-label="Minimum price"
          className="block size-4 rounded-full bg-ink transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        />
        <Slider.Thumb
          aria-label="Maximum price"
          className="block size-4 rounded-full bg-ink transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        />
      </Slider.Root>

      <div className="mt-3 flex justify-between text-sm font-medium">
        <span>{formatPrice(low)}</span>
        <span>{formatPrice(high)}</span>
      </div>
    </div>
  );
};

"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { SlidersHorizontal, X } from "lucide-react";

import type { useProductFilters } from "../../features/products/use-product-filters";
import { Button } from "../ui/button";
import { FilterPanelContent } from "./filter-panel";

type Props = Pick<
  ReturnType<typeof useProductFilters>,
  "filters" | "setFilters" | "toggleId" | "clear" | "isFiltered"
> & { resultCount: number };

/**
 * Below `lg` the sidebar would eat the grid, so the same panel moves into a
 * drawer. Radix handles the focus trap, scroll lock and escape key.
 *
 * Filters still apply live while the drawer is open — the footer button only
 * dismisses it, and says how many products are waiting behind it.
 */
export const FilterDrawer = ({ resultCount, ...panel }: Props) => (
  <Dialog.Root>
    <Dialog.Trigger asChild>
      <Button variant="outline" className="lg:hidden">
        <SlidersHorizontal className="size-4" aria-hidden />
        Filters
        {panel.isFiltered && (
          <span className="ml-1 rounded-full bg-ink px-2 py-0.5 text-xs text-white">
            On
          </span>
        )}
      </Button>
    </Dialog.Trigger>

    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
      <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col rounded-t-3xl bg-white">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <Dialog.Title className="text-xl font-bold">Filters</Dialog.Title>
          <Dialog.Close aria-label="Close filters" className="p-1">
            <X className="size-5" aria-hidden />
          </Dialog.Close>
        </div>

        <Dialog.Description className="sr-only">
          Filter products by price, colour and size.
        </Dialog.Description>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
          <FilterPanelContent {...panel} />
        </div>

        <div className="border-t border-line px-6 py-4">
          <Dialog.Close asChild>
            <Button className="w-full">
              Show {resultCount} {resultCount === 1 ? "product" : "products"}
            </Button>
          </Dialog.Close>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
);

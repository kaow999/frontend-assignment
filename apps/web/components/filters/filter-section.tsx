"use client";

import { ChevronUp } from "lucide-react";
import { useId, useState } from "react";

import { cn } from "../../lib/utils";

export const FilterSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const contentId = useId();

  return (
    <section className="border-t border-line py-5">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-controls={contentId}
        className="flex w-full items-center justify-between"
      >
        <span className="text-xl font-bold">{title}</span>
        <ChevronUp
          className={cn(
            "size-4 transition-transform",
            !isOpen && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      <div id={contentId} hidden={!isOpen} className="pt-5">
        {children}
      </div>
    </section>
  );
};

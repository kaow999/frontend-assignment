"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useDebouncedValue } from "../../lib/use-debounced-value";

/**
 * The design puts search in the header rather than in the filter panel, so this
 * is the assignment's search facet. It reads and writes the same `q` param the
 * panel's other facets use, which keeps one source of truth and means a search
 * combines with colour, size and price instead of replacing them.
 *
 * Typing anywhere in the site lands the shopper on the category page.
 */
export const HeaderSearch = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";

  const [draft, setDraft] = useState(urlQuery);
  const debounced = useDebouncedValue(draft);

  // Follow the URL when it changes from somewhere else — clearing the filters,
  // or the back button stepping through earlier searches.
  const lastUrlQuery = useRef(urlQuery);
  useEffect(() => {
    if (lastUrlQuery.current === urlQuery) return;

    lastUrlQuery.current = urlQuery;
    setDraft(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    const next = debounced.trim();
    if (next === urlQuery) return;

    const params = new URLSearchParams(searchParams.toString());
    if (next) params.set("q", next);
    else params.delete("q");

    lastUrlQuery.current = next;

    const query = params.toString();
    router.replace(query ? `/?${query}` : "/", { scroll: false });
  }, [debounced, urlQuery, searchParams, router]);

  return (
    <form
      role="search"
      onSubmit={(event) => event.preventDefault()}
      className="flex min-w-0 flex-1 items-center gap-3 rounded-full bg-surface px-4 py-3"
    >
      <Search className="size-5 shrink-0 text-ink-faint" aria-hidden />
      <input
        type="search"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Search for products..."
        aria-label="Search for products"
        className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-faint"
      />
    </form>
  );
};
